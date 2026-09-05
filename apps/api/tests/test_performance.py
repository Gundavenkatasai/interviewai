import pytest
from src.models.models import User, UserWeakArea
from tests.conftest import TestingSessionLocal


def test_performance_analytics_endpoints(client):
    # 1. Register a new user
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": "performance_tester@example.com",
            "password": "Password123!",
            "full_name": "Performance Tester",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Query empty performance summary
    summary_res = client.get("/api/performance/summary", headers=headers)
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["overall_avg"] == 0.0
    assert summary_data["topics_tracked"] == 0
    assert summary_data["strong_count"] == 0
    assert summary_data["weak_count"] == 0

    # 3. Query empty full performance analytics
    perf_res = client.get("/api/performance", headers=headers)
    assert perf_res.status_code == 200
    perf_data = perf_res.json()
    assert perf_data["total_topics_tracked"] == 0
    assert perf_data["all_topics"] == []
    assert perf_data["strong_areas"] == []
    assert perf_data["weak_areas"] == []
    assert perf_data["recommendations"] == []

    # 4. Populate test weak areas in database directly to verify classification logic
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == "performance_tester@example.com").first()
        assert user is not None

        # Strong topic: score 8.5
        wa_strong = UserWeakArea(
            user_id=user.id,
            topic="FastAPI Architecture",
            category="Backend",
            avg_score=8.5,
            attempts=3,
            total_score=25.5,
        )
        # Needs work topic: score 6.0
        wa_needs_work = UserWeakArea(
            user_id=user.id,
            topic="Database Indexing",
            category="Databases",
            avg_score=6.0,
            attempts=2,
            total_score=12.0,
        )
        # Weak area: score 4.0
        wa_weak = UserWeakArea(
            user_id=user.id,
            topic="Distributed Systems Consensus",
            category="System Design",
            avg_score=4.0,
            attempts=1,
            total_score=4.0,
        )
        db.add_all([wa_strong, wa_needs_work, wa_weak])
        db.commit()
    finally:
        db.close()

    # 5. Verify performance analytics reflects the updated data
    perf_updated = client.get("/api/performance", headers=headers)
    assert perf_updated.status_code == 200
    data = perf_updated.json()
    assert data["total_topics_tracked"] == 3
    assert len(data["strong_areas"]) == 1
    assert data["strong_areas"][0]["topic"] == "FastAPI Architecture"
    assert data["strong_areas"][0]["status"] == "Strong"

    assert len(data["needs_work_areas"]) == 1
    assert data["needs_work_areas"][0]["topic"] == "Database Indexing"
    assert data["needs_work_areas"][0]["status"] == "Needs Work"

    assert len(data["weak_areas"]) == 1
    assert data["weak_areas"][0]["topic"] == "Distributed Systems Consensus"
    assert data["weak_areas"][0]["status"] == "Weak Area"

    # Verify recommendations includes the weak area (< 6.0)
    rec_topics = [r["topic"] for r in data["recommendations"]]
    assert "Distributed Systems Consensus" in rec_topics

    # 6. Verify summary endpoint aggregation
    summary_updated = client.get("/api/performance/summary", headers=headers)
    assert summary_updated.status_code == 200
    s_data = summary_updated.json()
    assert s_data["topics_tracked"] == 3
    assert s_data["strong_count"] == 1
    assert s_data["needs_work_count"] == 1
    assert s_data["weak_count"] == 1
    assert round(s_data["overall_avg"], 1) == round((8.5 + 6.0 + 4.0) / 3, 1)

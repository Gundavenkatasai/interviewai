def test_interview_lifecycle(client):
    # Register user
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": "lifecycle@example.com",
            "password": "Password123!",
            "full_name": "Lifecycle Candidate"
        }
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create interview session
    create_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "role": "Full Stack Engineer",
            "company": "Stripe",
            "experience_level": "Mid-level",
            "interview_type": "Technical",
            "difficulty": "Medium",
            "technologies": ["React", "Python", "PostgreSQL"],
            "coach_mode": "interview",
            "duration_minutes": 30
        }
    )
    assert create_res.status_code == 201, create_res.text
    session_data = create_res.json()
    assert session_data["role"] == "Full Stack Engineer"
    assert len(session_data["questions"]) > 0
    session_id = session_data["id"]
    question_id = session_data["questions"][0]["id"]

    # Submit candidate answer
    ans_res = client.post(
        f"/api/interviews/{session_id}/answers",
        headers=headers,
        json={
            "question_id": question_id,
            "answer_text": "I design applications using modular layers with React on frontend and FastAPI backend, using PostgreSQL for relational transactions.",
            "duration_seconds": 25.0
        }
    )
    assert ans_res.status_code == 200, ans_res.text
    ans_data = ans_res.json()
    assert "evaluation" in ans_data
    assert ans_data["evaluation"]["score"] >= 0

    # Add transcript
    t_res = client.post(
        f"/api/interviews/{session_id}/transcript",
        headers=headers,
        json={
            "speaker": "candidate",
            "content": "I design applications using modular layers."
        }
    )
    assert t_res.status_code == 200

    # Complete interview and generate report
    comp_res = client.post(
        f"/api/interviews/{session_id}/complete",
        headers=headers
    )
    assert comp_res.status_code == 200
    report_data = comp_res.json()
    assert "overall_score" in report_data
    assert report_data["final_recommendation"] in ["Ready", "Needs Practice", "Needs Significant Improvement"]

    # Dashboard stats
    dash_res = client.get("/api/dashboard/stats", headers=headers)
    assert dash_res.status_code == 200
    stats = dash_res.json()
    assert stats["total_interviews"] >= 1
    assert stats["completed_interviews"] >= 1

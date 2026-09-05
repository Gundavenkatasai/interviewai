"""
test_resume_interview.py
────────────────────────
Acceptance test suite for Resume-First AI Question Generation.

Implements all mandatory tests:
  TEST A: Resume A (E-commerce app with React, Node.js, MongoDB, Stripe) -> questions reference project/tech.
  TEST B: Resume B (AI chatbot with Python, FastAPI, PostgreSQL, OpenAI API) -> questions distinct from Resume A.
  TEST C: Same Resume A in new session -> questions evolve, no duplicates from session 1.
  TEST D: Interview without resume -> generated from role / skills / JD.
  TEST E: Metadata inspection -> every resume question contains valid resume_reference.
  TEST F: 10 questions -> diverse topic coverage across multiple dimensions without over-repetition.
"""

import io
import pytest
from src.services.question_normalizer import normalize

def get_auth_headers(client, email="resume_tester@example.com"):
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": "Resume Candidate"
        }
    )
    if reg_res.status_code == 201:
        token = reg_res.json()["access_token"]
    else:
        login_res = client.post(
            "/api/auth/login",
            json={"email": email, "password": "Password123!"}
        )
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def upload_text_resume(client, headers, filename, text_content):
    file_tuple = (filename, io.BytesIO(text_content.encode("utf-8")), "text/plain")
    res = client.post(
        "/api/resume/analyze",
        headers=headers,
        files={"file": file_tuple}
    )
    assert res.status_code == 200, res.text
    return res.json()


# ─────────────────────────────────────────────────────────────────────────────
# TEST A: Resume A questions must reference its project/technologies
# ─────────────────────────────────────────────────────────────────────────────
def test_a_resume_a_project_grounding(client):
    headers = get_auth_headers(client, "test_a@example.com")
    resume_a_text = (
        "John Doe\n"
        "Full Stack Developer\n"
        "Skills: React, Node.js, MongoDB, Stripe, Express, JavaScript\n"
        "Projects:\n"
        "Developed an E-commerce application using React, Node.js, Express and MongoDB. "
        "Integrated Stripe payment processing and designed product catalog.\n"
    )
    upload_res = upload_text_resume(client, headers, "resume_a.txt", resume_a_text)
    resume_id = upload_res["resume_id"]

    # Start interview with Resume A
    create_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "role": "Full Stack Developer",
            "experience_level": "Mid-level",
            "interview_type": "Technical",
            "difficulty": "Medium",
            "technologies": ["React", "Node.js", "MongoDB"],
            "resume_id": resume_id,
        }
    )
    assert create_res.status_code == 201, create_res.text
    session = create_res.json()
    assert len(session["questions"]) == 1

    q1 = session["questions"][0]
    # Verify source is resume_ai
    assert q1["source"] == "resume_ai"
    # Verify question text or topic references project or technologies
    q_text_lower = q1["question_text"].lower()
    tech_keywords = ["e-commerce", "react", "node", "mongodb", "stripe", "architecture", "payment"]
    matched = any(kw in q_text_lower for kw in tech_keywords)
    assert matched, f"Question '{q1['question_text']}' did not reference Resume A content."
    # Verify resume reference exists
    assert q1["resume_reference"] is not None
    assert len(q1["resume_reference"]) > 0


# ─────────────────────────────────────────────────────────────────────────────
# TEST B: Resume B questions must be substantially different from Resume A
# ─────────────────────────────────────────────────────────────────────────────
def test_b_resume_b_distinct_from_resume_a(client):
    headers = get_auth_headers(client, "test_b@example.com")
    resume_b_text = (
        "Alice Smith\n"
        "AI Engineer\n"
        "Skills: Python, FastAPI, PostgreSQL, OpenAI API, PyTorch\n"
        "Projects:\n"
        "Built an AI chatbot using Python, FastAPI, PostgreSQL and OpenAI API. "
        "Implemented conversation memory and semantic search.\n"
    )
    upload_res = upload_text_resume(client, headers, "resume_b.txt", resume_b_text)
    resume_id = upload_res["resume_id"]

    create_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "role": "AI Engineer",
            "experience_level": "Senior",
            "interview_type": "Technical",
            "difficulty": "Hard",
            "technologies": ["Python", "FastAPI", "PostgreSQL"],
            "resume_id": resume_id,
        }
    )
    assert create_res.status_code == 201
    session_b = create_res.json()
    q_b = session_b["questions"][0]

    assert q_b["source"] == "resume_ai"
    q_b_text = q_b["question_text"].lower()
    b_keywords = ["chatbot", "fastapi", "python", "postgresql", "openai", "architecture", "memory"]
    matched = any(kw in q_b_text for kw in b_keywords)
    assert matched, f"Question '{q_b['question_text']}' did not reference Resume B content."

    # Must NOT reference Resume A's exclusive technologies (Stripe, E-commerce, MongoDB)
    assert "stripe" not in q_b_text
    assert "e-commerce" not in q_b_text


# ─────────────────────────────────────────────────────────────────────────────
# TEST C: Same Resume, New Interview -> Questions must evolve, not repeat
# ─────────────────────────────────────────────────────────────────────────────
def test_c_same_resume_new_interview_evolution(client):
    headers = get_auth_headers(client, "test_c@example.com")
    resume_text = (
        "Bob Builder\n"
        "Software Engineer\n"
        "Skills: React, Node.js, MongoDB, Stripe, Express\n"
        "Projects:\n"
        "Developed a Food Delivery Application using React, Node.js, Express and MongoDB. "
        "Implemented JWT authentication and Stripe payments.\n"
    )
    upload_res = upload_text_resume(client, headers, "resume_c.txt", resume_text)
    resume_id = upload_res["resume_id"]

    # Session 1
    s1_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "role": "Software Engineer",
            "experience_level": "Mid-level",
            "interview_type": "Technical",
            "difficulty": "Medium",
            "resume_id": resume_id,
        }
    )
    assert s1_res.status_code == 201
    s1_data = s1_res.json()
    s1_q1 = s1_data["questions"][0]["question_text"]

    # Complete session 1 so session 2 is an independent new interview
    comp_res = client.post(
        f"/api/interviews/{s1_data['id']}/complete",
        headers=headers
    )
    assert comp_res.status_code == 200

    # Session 2 with the same resume
    s2_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "role": "Software Engineer",
            "experience_level": "Mid-level",
            "interview_type": "Technical",
            "difficulty": "Medium",
            "resume_id": resume_id,
        }
    )
    assert s2_res.status_code == 201
    s2_q1 = s2_res.json()["questions"][0]["question_text"]

    # Both questions must be grounded in resume
    assert s1_res.json()["questions"][0]["source"] == "resume_ai"
    assert s2_res.json()["questions"][0]["source"] == "resume_ai"

    # Must NOT repeat identical question across sessions
    assert normalize(s1_q1) != normalize(s2_q1), f"Duplicate question across sessions: '{s1_q1}'"


# ─────────────────────────────────────────────────────────────────────────────
# TEST D: Start without resume -> Questions generated from role / JD / skills
# ─────────────────────────────────────────────────────────────────────────────
def test_d_no_resume_fallback_pipeline(client):
    headers = get_auth_headers(client, "test_d@example.com")

    create_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "role": "Data Engineer",
            "experience_level": "Senior",
            "interview_type": "Technical",
            "difficulty": "Medium",
            "technologies": ["Apache Spark", "Snowflake", "SQL"],
            "resume_id": None,
            "job_description_text": "Looking for a Data Engineer to design high-throughput ETL pipelines with Spark."
        }
    )
    assert create_res.status_code == 201
    session = create_res.json()
    q = session["questions"][0]

    # Source should reflect non-resume AI or bank
    assert q["source"] in ["role_ai", "jd_ai", "ai", "bank"]
    # Does not claim to reference a resume
    assert q.get("resume_reference") is None


# ─────────────────────────────────────────────────────────────────────────────
# TEST E: Inspect question metadata -> Every resume question has resume_reference
# ─────────────────────────────────────────────────────────────────────────────
def test_e_resume_reference_metadata_validation(client):
    headers = get_auth_headers(client, "test_e@example.com")
    resume_text = (
        "Dev Candidate\n"
        "Projects:\n"
        "Engineered a Real-Time Collaboration Platform using WebSockets, React, and Redis. "
        "Implemented JWT authentication.\n"
    )
    upload_res = upload_text_resume(client, headers, "collab_resume.txt", resume_text)
    resume_id = upload_res["resume_id"]

    create_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "role": "Frontend Engineer",
            "experience_level": "Mid-level",
            "interview_type": "Technical",
            "difficulty": "Medium",
            "resume_id": resume_id,
        }
    )
    assert create_res.status_code == 201
    q = create_res.json()["questions"][0]

    # Verify resume reference exists and actually belongs to the resume
    ref = q.get("resume_reference")
    assert ref is not None and len(ref) > 0, "Question metadata missing resume_reference"
    assert any(term in ref.lower() for term in ["collaboration", "platform", "react", "websockets", "redis", "jwt"]), \
        f"resume_reference '{ref}' does not match resume content."


# ─────────────────────────────────────────────────────────────────────────────
# TEST F: Ask 10 questions -> Covers multiple resume topics without repetition
# ─────────────────────────────────────────────────────────────────────────────
def test_f_multiple_topic_coverage_ten_questions(client):
    headers = get_auth_headers(client, "test_f@example.com")
    resume_text = (
        "Multi-stack Candidate\n"
        "Skills: React, Node.js, Express, MongoDB, Redis, JWT, Stripe, Docker\n"
        "Projects:\n"
        "Developed an E-commerce Marketplace using React, Node.js, Express and MongoDB. "
        "Implemented JWT authentication, Redis caching, and Stripe payment integration.\n"
    )
    upload_res = upload_text_resume(client, headers, "marketplace.txt", resume_text)
    resume_id = upload_res["resume_id"]

    # Start session
    create_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "role": "Full Stack Engineer",
            "experience_level": "Mid-level",
            "interview_type": "Technical",
            "difficulty": "Medium",
            "resume_id": resume_id,
        }
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    asked_questions = [create_res.json()["questions"][0]["question_text"]]
    asked_topics = [create_res.json()["questions"][0].get("topic")]

    # Generate 9 more questions (total 10)
    for _ in range(9):
        next_res = client.post(
            f"/api/interviews/{session_id}/next-question",
            headers=headers
        )
        assert next_res.status_code == 200, next_res.text
        q_data = next_res.json()["question"]
        asked_questions.append(q_data["question_text"])
        if q_data.get("topic"):
            asked_topics.append(q_data["topic"])

    assert len(asked_questions) == 10

    # 1. No exact duplicate questions among all 10
    normalized_set = set(normalize(q) for q in asked_questions)
    assert len(normalized_set) == 10, f"Found duplicates in 10 questions: {len(normalized_set)} unique of 10"

    # 2. System covers multiple distinct topics rather than repeating one technology
    distinct_topics = set(t.lower() for t in asked_topics if t)
    assert len(distinct_topics) >= 3, f"Insufficient topic diversity: only {distinct_topics} covered."

def test_code_execution(client):
    # Register user
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": "coder@example.com",
            "password": "Password123!",
            "full_name": "Coder Candidate"
        }
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Execute Python code
    exec_res = client.post(
        "/api/code/execute",
        headers=headers,
        json={
            "language": "python",
            "code": "print('Hello from InterviewAI sandbox')"
        }
    )
    assert exec_res.status_code == 200
    res_data = exec_res.json()
    assert "Hello from InterviewAI sandbox" in res_data["output"]
    assert res_data["exit_code"] == 0

    # Test execution error handling / safe timeout
    loop_res = client.post(
        "/api/code/execute",
        headers=headers,
        json={
            "language": "python",
            "code": "import time; time.sleep(6)"
        }
    )
    assert loop_res.status_code == 200
    assert loop_res.json()["exit_code"] == 124 or "timed out" in (loop_res.json()["error"] or "")

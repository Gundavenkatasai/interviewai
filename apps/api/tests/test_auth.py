def test_register_and_login(client):
    # Register
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": "testcandidate@example.com",
            "password": "Password123!",
            "full_name": "Test Candidate"
        }
    )
    assert reg_res.status_code == 201, reg_res.text
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "testcandidate@example.com"
    token = reg_data["access_token"]

    # Login
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "testcandidate@example.com",
            "password": "Password123!"
        }
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data

    # Protected me endpoint
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testcandidate@example.com"

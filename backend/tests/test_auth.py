def test_register_login_me(client):
    register_response = client.post(
        "/api/auth/register",
        json={"email": "lawyer@example.com", "password": "password123", "full_name": "Lawyer One"},
    )
    assert register_response.status_code == 201
    assert "hashed_password" not in register_response.text

    login_response = client.post(
        "/api/auth/login",
        json={"email": "lawyer@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "lawyer@example.com"


def test_bad_credentials(client):
    client.post(
        "/api/auth/register",
        json={"email": "lawyer@example.com", "password": "password123", "full_name": "Lawyer One"},
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "lawyer@example.com", "password": "wrongpass123"},
    )
    assert response.status_code == 401

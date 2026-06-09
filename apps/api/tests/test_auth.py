from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_register_login_and_me():
    email = "auth-test@example.com"
    password = "password123"
    client.post("/auth/register", json={"email": email, "password": password})

    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


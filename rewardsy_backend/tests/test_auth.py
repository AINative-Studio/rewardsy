import pytest
from fastapi.testclient import TestClient
from rewardsy_backend.main import app

client = TestClient(app)

# --- BDD: User Signup ---
def describe_user_signup():
    def it_should_fail_with_missing_fields():
        response = client.post("/signup", json={"email": ""})
        assert response.status_code == 422

    def it_should_create_user_with_valid_data():
        response = client.post("/signup", json={"email": "test@example.com", "password": "strongpassword"})
        assert response.status_code == 201
        assert response.json()["email"] == "test@example.com"

    def it_should_not_allow_duplicate_emails():
        client.post("/signup", json={"email": "dupe@example.com", "password": "pw123"})
        response = client.post("/signup", json={"email": "dupe@example.com", "password": "pw456"})
        assert response.status_code == 400
        assert "already exists" in response.text

# --- BDD: User Login ---
def describe_user_login():
    def it_should_fail_with_invalid_credentials():
        response = client.post("/login", json={"email": "fake@example.com", "password": "wrong"})
        assert response.status_code == 401

    def it_should_login_with_valid_credentials():
        # First, signup
        client.post("/signup", json={"email": "loginuser@example.com", "password": "pw123"})
        response = client.post("/login", json={"email": "loginuser@example.com", "password": "pw123"})
        assert response.status_code == 200
        assert "access_token" in response.json()

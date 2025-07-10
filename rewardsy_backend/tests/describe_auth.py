import pytest
from fastapi.testclient import TestClient
from rewardsy_backend.main import app

client = TestClient(app)

class TestAuth:
    # --- User Signup ---
    def test_signup_missing_fields(self):
        """It should fail with missing fields"""
        response = client.post("/signup", json={"email": ""})
        assert response.status_code == 422

    def test_signup_valid(self):
        """It should create user with valid data"""
        response = client.post("/signup", json={"email": "test@example.com", "password": "strongpassword"})
        assert response.status_code == 201
        assert response.json()["email"] == "test@example.com"

    def test_signup_duplicate_email(self):
        """It should not allow duplicate emails"""
        client.post("/signup", json={"email": "dupe@example.com", "password": "pw123"})
        response = client.post("/signup", json={"email": "dupe@example.com", "password": "pw456"})
        assert response.status_code == 400
        assert "already exists" in response.text

    # --- User Login ---
    def test_login_invalid_credentials(self):
        """It should fail with invalid credentials"""
        response = client.post("/login", json={"email": "fake@example.com", "password": "wrong"})
        assert response.status_code == 401

    def test_login_valid_credentials(self):
        """It should login with valid credentials"""
        # First, signup
        client.post("/signup", json={"email": "loginuser@example.com", "password": "pw123"})
        response = client.post("/login", json={"email": "loginuser@example.com", "password": "pw123"})
        assert response.status_code == 200
        assert "access_token" in response.json()

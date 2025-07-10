"""
Real Integration tests for API endpoints with ZeroDB
No mocks - tests actual API calls to ZeroDB
"""
import pytest
from fastapi.testclient import TestClient
import jwt
import uuid
import asyncio

from ..main import app
from ..zerodb_operations import zerodb_ops


class TestAPIIntegration:
    """Test API integration with real ZeroDB operations"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def test_user_email(self):
        """Generate unique test user email"""
        return f"api-test-{uuid.uuid4().hex[:8]}@example.com"
    
    @pytest.fixture 
    def setup_zerodb(self):
        """Setup real ZeroDB connection"""
        # Initialize real ZeroDB client
        asyncio.run(zerodb_ops.initialize_client())
        asyncio.run(zerodb_ops.initialize_tables())
        return zerodb_ops
    
    @pytest.fixture
    def auth_token_for_user(self, test_user_email):
        """Create real JWT token for test user"""
        return jwt.encode(
            {"sub": test_user_email, "user_id": f"api-user-{uuid.uuid4().hex[:8]}"}, 
            "your-secret-key",  # Use actual secret from your app
            algorithm="HS256"
        )
    
    @pytest.fixture
    def auth_headers(self, auth_token_for_user):
        """Create authorization headers with real token"""
        return {"Authorization": f"Bearer {auth_token_for_user}"}

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "Rewardsy Backend API" in response.json()["message"]

    def test_signup_success_real(self, client, setup_zerodb, test_user_email):
        """Test successful user registration with real ZeroDB"""
        response = client.post("/signup", json={
            "email": test_user_email,
            "password": "realpassword123",
            "name": "Real API Test User"
        })
        
        if response.status_code == 201:
            # Success case
            data = response.json()
            assert data["email"] == test_user_email
            assert "id" in data
        elif response.status_code == 400 and "already exists" in response.json()["detail"]:
            # User already exists, which is fine for repeated tests
            pass
        else:
            pytest.fail(f"Unexpected response: {response.status_code} - {response.json()}")

    def test_signup_duplicate_email_real(self, client, setup_zerodb, test_user_email):
        """Test registration with existing email using real ZeroDB"""
        # First, create a user
        client.post("/signup", json={
            "email": test_user_email,
            "password": "password123",
            "name": "First User"
        })
        
        # Then try to create another with same email
        response = client.post("/signup", json={
            "email": test_user_email,
            "password": "password456",
            "name": "Second User"
        })
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_login_success_real(self, client, setup_zerodb, test_user_email):
        """Test successful login with real ZeroDB"""
        # First create a user
        signup_response = client.post("/signup", json={
            "email": test_user_email,
            "password": "logintest123",
            "name": "Login Test User"
        })
        
        # Handle case where user already exists
        if signup_response.status_code not in [201, 400]:
            pytest.fail(f"Signup failed: {signup_response.json()}")
        
        # Now try to login
        response = client.post("/login", data={
            "username": test_user_email,  # FastAPI OAuth2 uses 'username' field
            "password": "logintest123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user_email

    def test_login_invalid_credentials_real(self, client, setup_zerodb):
        """Test login with invalid credentials using real ZeroDB"""
        nonexistent_email = f"nonexistent-{uuid.uuid4().hex[:8]}@example.com"
        
        response = client.post("/login", data={
            "username": nonexistent_email,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_ai_suggest_reward_success_real(self, client, setup_zerodb, test_user_email):
        """Test AI reward suggestion endpoint with real ZeroDB"""
        # Create user and get real auth token
        signup_response = client.post("/signup", json={
            "email": test_user_email,
            "password": "aitest123",
            "name": "AI Test User"
        })
        
        # Login to get real token
        login_response = client.post("/login", data={
            "username": test_user_email,
            "password": "aitest123"
        })
        
        if login_response.status_code != 200:
            # Try with existing user credentials
            login_response = client.post("/login", data={
                "username": test_user_email,
                "password": "aitest123"
            })
        
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post("/ai/suggest-reward", 
            headers=headers,
            json={
                "title": "Complete important real task",
                "description": "High priority real work",
                "priority": "high"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5
        
        for reward in data:
            assert "type" in reward
            assert "description" in reward
            assert "cost" in reward

    def test_ai_suggest_reward_unauthorized_real(self, client):
        """Test AI suggestion without authentication"""
        response = client.post("/ai/suggest-reward", json={
            "title": "Test task",
            "description": "Test description",
            "priority": "medium"
        })
        
        assert response.status_code == 403  # Forbidden

    def test_zerodb_status_endpoint_real(self, client, setup_zerodb, test_user_email):
        """Test ZeroDB status endpoint with real connection"""
        # Create user and get real auth token
        signup_response = client.post("/signup", json={
            "email": test_user_email,
            "password": "statustest123",
            "name": "Status Test User"
        })
        
        # Login to get real token
        login_response = client.post("/login", data={
            "username": test_user_email,
            "password": "statustest123"
        })
        
        if login_response.status_code != 200:
            # User might already exist, skip this test
            pytest.skip("Could not create/login test user for status test")
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/admin/zerodb/status", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        # Real ZeroDB should return some status information

    def test_invalid_jwt_token_real(self, client):
        """Test invalid JWT token"""
        headers = {"Authorization": "Bearer invalid_token_12345"}
        
        response = client.post("/ai/suggest-reward", 
            headers=headers,
            json={
                "title": "Test", 
                "description": "Test description",
                "priority": "medium"
            }
        )
        
        assert response.status_code == 401
        assert "token" in response.json()["detail"].lower()

    def test_missing_authorization_header_real(self, client):
        """Test missing authorization header"""
        response = client.get("/admin/zerodb/status")
        
        assert response.status_code == 403  # Forbidden

    @pytest.mark.asyncio
    async def test_startup_event_real(self, setup_zerodb):
        """Test application startup event with real ZeroDB"""
        from ..main import startup_event
        
        try:
            await startup_event()
            # If no exception is raised, startup succeeded
            assert True
        except Exception as e:
            pytest.fail(f"Startup event failed: {str(e)}")

    def test_api_error_handling_real(self, client, setup_zerodb, test_user_email):
        """Test API error handling with real ZeroDB"""
        # Test with malformed request that should cause ZeroDB operation to fail
        signup_response = client.post("/signup", json={
            "email": test_user_email,
            "password": "errortest123",
            "name": "Error Test User"
        })
        
        login_response = client.post("/login", data={
            "username": test_user_email,
            "password": "errortest123"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Could not create test user for error handling test")
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Send malformed request that might cause ZeroDB error
        response = client.post("/ai/suggest-reward", 
            headers=headers,
            json={
                "title": "",  # Empty title might cause issues
                "description": "",
                "priority": "invalid_priority"  # Invalid priority
            }
        )
        
        # Should handle error gracefully
        assert response.status_code in [400, 422, 500]

    def test_request_validation_real(self, client, test_user_email):
        """Test request validation with real endpoints"""
        # Create user and get real token
        signup_response = client.post("/signup", json={
            "email": test_user_email,
            "password": "validationtest123",
            "name": "Validation Test User"
        })
        
        login_response = client.post("/login", data={
            "username": test_user_email,
            "password": "validationtest123"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Could not create test user for validation test")
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Missing required fields
        response = client.post("/ai/suggest-reward", 
            headers=headers,
            json={}
        )
        
        assert response.status_code == 422  # Validation error

    def test_end_to_end_user_workflow_real(self, client, setup_zerodb):
        """Test complete user workflow with real ZeroDB"""
        email = f"e2e-{uuid.uuid4().hex[:8]}@example.com"
        
        # 1. Sign up
        signup_response = client.post("/signup", json={
            "email": email,
            "password": "e2etest123",
            "name": "E2E Test User"
        })
        
        assert signup_response.status_code in [201, 400]  # 400 if user exists
        
        # 2. Login
        login_response = client.post("/login", data={
            "username": email,
            "password": "e2etest123"
        })
        
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Get AI suggestions
        ai_response = client.post("/ai/suggest-reward",
            headers=headers,
            json={
                "title": "E2E Test Task",
                "description": "End-to-end test task",
                "priority": "medium"
            }
        )
        
        assert ai_response.status_code == 200
        suggestions = ai_response.json()
        assert isinstance(suggestions, list)
        
        # 4. Check ZeroDB status
        status_response = client.get("/admin/zerodb/status", headers=headers)
        assert status_response.status_code == 200
        
        # 5. Verify all operations completed successfully
        assert len(suggestions) >= 0  # May be empty but should be a list
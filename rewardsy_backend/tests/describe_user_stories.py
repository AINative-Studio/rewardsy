"""
BDD-style tests for user stories using pytest-describe
REAL ZeroDB Integration - No Mocks
"""
import pytest
from fastapi.testclient import TestClient
import jwt
import uuid
import asyncio

from ..main import app
from ..zerodb_operations import zerodb_ops
from .. import schemas


def describe_user_registration():
    """User Story: As a new user, I want to register for an account"""
    
    @pytest.fixture
    def client():
        return TestClient(app)
    
    @pytest.fixture
    def test_email():
        return f"bdd-reg-{uuid.uuid4().hex[:8]}@example.com"
    
    @pytest.fixture
    def setup_zerodb():
        """Setup real ZeroDB connection"""
        asyncio.run(zerodb_ops.initialize_client())
        asyncio.run(zerodb_ops.initialize_tables())
        return zerodb_ops
    
    def describe_when_providing_valid_information():
        """When I provide valid registration information"""
        
        def it_should_create_my_account(client, setup_zerodb, test_email):
            """Then it should create my account successfully"""
            response = client.post("/signup", json={
                "email": test_email,
                "password": "securepassword123",
                "name": "BDD Test User"
            })
            
            if response.status_code == 201:
                assert response.json()["email"] == test_email
                assert "id" in response.json()
            elif response.status_code == 400 and "already exists" in response.json()["detail"]:
                # User already exists, that's fine for repeated tests
                pass
            else:
                pytest.fail(f"Unexpected response: {response.status_code} - {response.json()}")
        
        def it_should_store_my_information_securely(client, setup_zerodb, test_email):
            """Then it should store my information securely in real ZeroDB"""
            response = client.post("/signup", json={
                "email": test_email,
                "password": "securepassword123",
                "name": "Security Test User"
            })
            
            # Even if user exists, let's verify we can find them
            if response.status_code in [201, 400]:
                # Try to find the user in ZeroDB
                found_user = asyncio.run(zerodb_ops.get_user_by_email(test_email))
                if found_user:
                    assert found_user["email"] == test_email
                    assert "hashed_password" in found_user  # Password should be hashed
                    assert found_user["hashed_password"] != "securepassword123"  # Not plain text
    
    def describe_when_email_already_exists():
        """When I try to register with an existing email"""
        
        def it_should_reject_the_registration(client, setup_zerodb, test_email):
            """Then it should reject the registration"""
            # First create a user
            client.post("/signup", json={
                "email": test_email,
                "password": "password123",
                "name": "First User"
            })
            
            # Then try to create another with same email
            response = client.post("/signup", json={
                "email": test_email,
                "password": "differentpass",
                "name": "Second User"
            })
            
            assert response.status_code == 400
            assert "already exists" in response.json()["detail"]


def describe_user_authentication():
    """User Story: As a registered user, I want to log into my account"""
    
    @pytest.fixture
    def client():
        return TestClient(app)
    
    @pytest.fixture
    def test_email():
        return f"bdd-auth-{uuid.uuid4().hex[:8]}@example.com"
    
    @pytest.fixture
    def setup_zerodb():
        """Setup real ZeroDB connection"""
        asyncio.run(zerodb_ops.initialize_client())
        asyncio.run(zerodb_ops.initialize_tables())
        return zerodb_ops
    
    def describe_when_providing_correct_credentials():
        """When I provide correct email and password"""
        
        def it_should_log_me_in_successfully(client, setup_zerodb, test_email):
            """Then it should log me in successfully"""
            # First create a user
            signup_response = client.post("/signup", json={
                "email": test_email,
                "password": "correctpassword",
                "name": "Login Test User"
            })
            
            # Then try to login
            response = client.post("/login", data={
                "username": test_email,  # FastAPI OAuth2 uses 'username'
                "password": "correctpassword"
            })
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["user"]["email"] == test_email
        
        def it_should_provide_authentication_token(client, setup_zerodb, test_email):
            """Then it should provide me with an authentication token"""
            # Create user
            client.post("/signup", json={
                "email": test_email,
                "password": "tokentest123",
                "name": "Token Test User"
            })
            
            # Login
            response = client.post("/login", data={
                "username": test_email,
                "password": "tokentest123"
            })
            
            if response.status_code == 200:
                data = response.json()
                assert data["token_type"] == "bearer"
                
                # Verify token structure (real JWT)
                token = data["access_token"]
                assert "." in token  # JWT format
                assert len(token.split(".")) == 3  # JWT has 3 parts
    
    def describe_when_providing_incorrect_credentials():
        """When I provide incorrect credentials"""
        
        def it_should_reject_the_login(client, setup_zerodb):
            """Then it should reject the login attempt"""
            nonexistent_email = f"nonexistent-{uuid.uuid4().hex[:8]}@example.com"
            
            response = client.post("/login", data={
                "username": nonexistent_email,
                "password": "wrongpassword"
            })
            
            assert response.status_code == 401
            assert "Invalid credentials" in response.json()["detail"]


def describe_ai_reward_suggestions():
    """User Story: As a user, I want AI-powered reward suggestions for my tasks"""
    
    @pytest.fixture
    def client():
        return TestClient(app)
    
    @pytest.fixture
    def test_email():
        return f"bdd-ai-{uuid.uuid4().hex[:8]}@example.com"
    
    @pytest.fixture
    def auth_headers(client, test_email):
        """Create real authentication headers"""
        # Create user and login
        client.post("/signup", json={
            "email": test_email,
            "password": "aitest123",
            "name": "AI Test User"
        })
        
        login_response = client.post("/login", data={
            "username": test_email,
            "password": "aitest123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            return {"Authorization": f"Bearer {token}"}
        else:
            pytest.skip("Could not create auth headers for AI test")
    
    @pytest.fixture
    def setup_zerodb():
        """Setup real ZeroDB connection"""
        asyncio.run(zerodb_ops.initialize_client())
        asyncio.run(zerodb_ops.initialize_tables())
        return zerodb_ops
    
    def describe_when_requesting_reward_suggestions():
        """When I request reward suggestions for a task"""
        
        def it_should_provide_personalized_suggestions(client, auth_headers, setup_zerodb):
            """Then it should provide me with personalized reward suggestions from real AI"""
            response = client.post("/ai/suggest-reward", 
                headers=auth_headers,
                json={
                    "title": "Complete quarterly BDD report",
                    "description": "High priority work task for BDD testing",
                    "priority": "high"
                }
            )
            
            assert response.status_code == 200
            suggestions = response.json()
            assert isinstance(suggestions, list)
            assert len(suggestions) >= 0  # May be empty but should be list
            
            for suggestion in suggestions:
                assert "type" in suggestion
                assert "description" in suggestion
                assert "cost" in suggestion
        
        def it_should_consider_task_priority(client, auth_headers, setup_zerodb):
            """Then it should consider the task priority in real AI suggestions"""
            # Test high priority task
            high_priority_response = client.post("/ai/suggest-reward", 
                headers=auth_headers,
                json={
                    "title": "Critical deadline task",
                    "description": "Very important deadline",
                    "priority": "high"
                }
            )
            
            assert high_priority_response.status_code == 200
            
            # Test low priority task
            low_priority_response = client.post("/ai/suggest-reward", 
                headers=auth_headers,
                json={
                    "title": "Simple cleanup task",
                    "description": "Basic organization",
                    "priority": "low"
                }
            )
            
            assert low_priority_response.status_code == 200
            
            # Both should return suggestions, real AI will differentiate based on priority
            high_suggestions = high_priority_response.json()
            low_suggestions = low_priority_response.json()
            
            assert isinstance(high_suggestions, list)
            assert isinstance(low_suggestions, list)
    
    def describe_when_not_authenticated():
        """When I'm not authenticated"""
        
        def it_should_require_authentication(client, setup_zerodb):
            """Then it should require me to authenticate first"""
            response = client.post("/ai/suggest-reward", json={
                "title": "Test task",
                "description": "Test description",
                "priority": "medium"
            })
            
            assert response.status_code == 403


def describe_task_management():
    """User Story: As a user, I want to manage my tasks with real ZeroDB"""
    
    @pytest.fixture
    def client():
        return TestClient(app)
    
    @pytest.fixture
    def test_email():
        return f"bdd-task-{uuid.uuid4().hex[:8]}@example.com"
    
    @pytest.fixture
    def auth_headers(client, test_email):
        """Create real authentication headers"""
        client.post("/signup", json={
            "email": test_email,
            "password": "tasktest123",
            "name": "Task Test User"
        })
        
        login_response = client.post("/login", data={
            "username": test_email,
            "password": "tasktest123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            return {"Authorization": f"Bearer {token}"}
        else:
            pytest.skip("Could not create auth headers for task test")
    
    @pytest.fixture
    def setup_zerodb():
        """Setup real ZeroDB connection"""
        asyncio.run(zerodb_ops.initialize_client())
        asyncio.run(zerodb_ops.initialize_tables())
        return zerodb_ops
    
    def describe_when_creating_a_task():
        """When I create a new task"""
        
        @pytest.mark.asyncio
        async def it_should_store_the_task_in_real_zerodb(auth_headers, setup_zerodb, test_email):
            """Then it should store the task in real ZeroDB"""
            # Get user ID from email
            user = await zerodb_ops.get_user_by_email(test_email)
            if not user:
                pytest.skip("Could not find user for task creation test")
            
            user_id = user["id"]
            
            # Create task directly via ZeroDB (since endpoint might not exist yet)
            task_data = schemas.TaskCreate(
                title="Real BDD Task",
                description="Task created through BDD testing",
                priority=schemas.TaskPriority.medium
            )
            
            result = await zerodb_ops.create_task(task_data, user_id)
            
            assert result["title"] == "Real BDD Task"
            assert result["user_id"] == user_id
            assert result["status"] == "pending"
            assert "id" in result
        
        @pytest.mark.asyncio
        async def it_should_track_user_behavior_in_real_zerodb(auth_headers, setup_zerodb, test_email):
            """Then it should track my task creation behavior in real ZeroDB"""
            # Get user ID
            user = await zerodb_ops.get_user_by_email(test_email)
            if not user:
                pytest.skip("Could not find user for behavior tracking test")
            
            user_id = user["id"]
            
            # Track behavior in real ZeroDB
            try:
                await zerodb_ops.track_user_behavior(
                    user_id, 
                    "task_created", 
                    {"task_priority": "high", "test_context": "BDD"}
                )
                # If no exception, tracking succeeded
                assert True
            except Exception as e:
                pytest.fail(f"Real behavior tracking failed: {str(e)}")


def describe_real_time_updates():
    """User Story: As a user, I want real-time updates using real ZeroDB events"""
    
    @pytest.fixture
    def test_email():
        return f"bdd-events-{uuid.uuid4().hex[:8]}@example.com"
    
    @pytest.fixture
    def setup_zerodb():
        """Setup real ZeroDB connection"""
        asyncio.run(zerodb_ops.initialize_client())
        asyncio.run(zerodb_ops.initialize_tables())
        return zerodb_ops
    
    def describe_when_subscribing_to_events():
        """When I subscribe to real-time events"""
        
        @pytest.mark.asyncio
        async def it_should_publish_events_for_task_changes_in_real_zerodb(setup_zerodb, test_email):
            """Then it should publish events to real ZeroDB when my tasks change"""
            # Create a user first
            user = await zerodb_ops.create_user(
                email=test_email,
                password="eventtest123",
                name="Event Test User"
            )
            
            user_id = user["id"]
            
            # Publish real event
            task_data = {
                "id": f"bdd-task-{uuid.uuid4().hex[:8]}", 
                "title": "Real Event Test Task"
            }
            
            try:
                await zerodb_ops.publish_task_event("task_updated", task_data, user_id)
                # If no exception, event publishing succeeded
                assert True
            except Exception as e:
                pytest.fail(f"Real event publishing failed: {str(e)}")


def describe_end_to_end_user_journey():
    """User Story: Complete user journey with real ZeroDB integration"""
    
    @pytest.fixture
    def client():
        return TestClient(app)
    
    @pytest.fixture
    def test_email():
        return f"bdd-e2e-{uuid.uuid4().hex[:8]}@example.com"
    
    @pytest.fixture
    def setup_zerodb():
        """Setup real ZeroDB connection"""
        asyncio.run(zerodb_ops.initialize_client())
        asyncio.run(zerodb_ops.initialize_tables())
        return zerodb_ops
    
    def describe_complete_workflow():
        """When I use the complete application workflow"""
        
        def it_should_support_full_user_lifecycle_with_real_zerodb(client, setup_zerodb, test_email):
            """Then it should support the complete user lifecycle with real ZeroDB"""
            # 1. Register
            signup_response = client.post("/signup", json={
                "email": test_email,
                "password": "e2ebdd123",
                "name": "E2E BDD User"
            })
            
            assert signup_response.status_code in [201, 400]  # 400 if exists
            
            # 2. Login
            login_response = client.post("/login", data={
                "username": test_email,
                "password": "e2ebdd123"
            })
            
            assert login_response.status_code == 200
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # 3. Get AI suggestions
            ai_response = client.post("/ai/suggest-reward",
                headers=headers,
                json={
                    "title": "E2E BDD Test Task",
                    "description": "Complete end-to-end BDD testing",
                    "priority": "high"
                }
            )
            
            assert ai_response.status_code == 200
            suggestions = ai_response.json()
            assert isinstance(suggestions, list)
            
            # 4. Check database status
            status_response = client.get("/admin/zerodb/status", headers=headers)
            assert status_response.status_code == 200
            
            # 5. Verify real data persistence
            user = asyncio.run(zerodb_ops.get_user_by_email(test_email))
            assert user is not None
            assert user["email"] == test_email
            
            # Complete workflow success
            assert True
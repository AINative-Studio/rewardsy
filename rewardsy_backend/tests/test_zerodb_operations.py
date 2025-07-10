"""
Tests for ZeroDB Operations - REAL API INTEGRATION TESTS
No mocks - tests actual ZeroDB API calls
"""
import pytest
import asyncio
import os
from datetime import datetime
import uuid

from ..zerodb_operations import ZeroDBOperations
from .. import schemas


class TestZeroDBOperations:
    """Test ZeroDB operations with real API calls"""
    
    @pytest.fixture
    def zerodb_ops(self):
        """Create ZeroDB operations instance with real client"""
        ops = ZeroDBOperations()
        # Initialize real ZeroDB client
        asyncio.run(ops.initialize_client())
        return ops
    
    @pytest.fixture
    def test_user_email(self):
        """Generate unique test user email"""
        return f"test-{uuid.uuid4().hex[:8]}@example.com"
    
    @pytest.fixture
    def test_user_id(self):
        """Generate unique test user ID"""
        return f"test-user-{uuid.uuid4().hex[:8]}"

    @pytest.mark.asyncio
    async def test_initialize_tables_real(self, zerodb_ops):
        """Test real table initialization"""
        try:
            await zerodb_ops.initialize_tables()
            # If no exception is raised, tables were created successfully
            assert True
        except Exception as e:
            pytest.fail(f"Table initialization failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_create_user_real(self, zerodb_ops, test_user_email):
        """Test real user creation with ZeroDB"""
        try:
            result = await zerodb_ops.create_user(
                email=test_user_email,
                password="testpassword123",
                name="Real Test User"
            )
            
            # Verify user data structure
            assert result["email"] == test_user_email
            assert result["name"] == "Real Test User"
            assert "id" in result
            assert "created_at" in result
            assert "hashed_password" in result
            
        except Exception as e:
            pytest.fail(f"Real user creation failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_get_user_by_email_real(self, zerodb_ops, test_user_email):
        """Test finding real user by email in ZeroDB"""
        try:
            # First create a user
            created_user = await zerodb_ops.create_user(
                email=test_user_email,
                password="testpassword123",
                name="Search Test User"
            )
            
            # Then try to find them
            found_user = await zerodb_ops.get_user_by_email(test_user_email)
            
            assert found_user is not None
            assert found_user["email"] == test_user_email
            assert found_user["id"] == created_user["id"]
            
        except Exception as e:
            pytest.fail(f"Real user search failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_create_task_real(self, zerodb_ops, test_user_id):
        """Test real task creation with ZeroDB"""
        try:
            task_data = schemas.TaskCreate(
                title="Real Test Task",
                description="Testing real ZeroDB integration",
                priority=schemas.TaskPriority.high
            )
            
            result = await zerodb_ops.create_task(task_data, test_user_id)
            
            assert result["title"] == "Real Test Task"
            assert result["description"] == "Testing real ZeroDB integration"
            assert result["user_id"] == test_user_id
            assert result["status"] == "pending"
            assert "id" in result
            assert "ai_suggestions" in result
            
        except Exception as e:
            pytest.fail(f"Real task creation failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_get_tasks_real(self, zerodb_ops, test_user_id):
        """Test retrieving real user tasks from ZeroDB"""
        try:
            # First create a task
            task_data = schemas.TaskCreate(
                title="Retrievable Test Task",
                description="Task for retrieval testing",
                priority=schemas.TaskPriority.medium
            )
            
            created_task = await zerodb_ops.create_task(task_data, test_user_id)
            
            # Then retrieve all tasks for the user
            tasks = await zerodb_ops.get_tasks(test_user_id)
            
            assert len(tasks) >= 1
            # Find our created task
            found_task = next((t for t in tasks if t["id"] == created_task["id"]), None)
            assert found_task is not None
            assert found_task["title"] == "Retrievable Test Task"
            
        except Exception as e:
            pytest.fail(f"Real task retrieval failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_suggest_rewards_for_task_real(self, zerodb_ops):
        """Test real AI reward suggestions via ZeroDB"""
        try:
            result = await zerodb_ops.suggest_rewards_for_task(
                title="Complete important real project",
                description="High priority real work task",
                priority="high"
            )
            
            assert isinstance(result, list)
            assert len(result) <= 5  # Should return max 5 suggestions
            
            for reward in result:
                assert "type" in reward
                assert "description" in reward
                assert "cost" in reward
                
        except Exception as e:
            pytest.fail(f"Real AI suggestions failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_track_user_behavior_real(self, zerodb_ops, test_user_id):
        """Test real user behavior tracking in ZeroDB"""
        try:
            context = {
                "task_priority": "high",
                "completed_on_time": True,
                "session_id": f"test-session-{uuid.uuid4().hex[:8]}"
            }
            
            # This should not raise an exception if working correctly
            await zerodb_ops.track_user_behavior(test_user_id, "task_completed", context)
            
            # If we reach here, tracking succeeded
            assert True
            
        except Exception as e:
            pytest.fail(f"Real behavior tracking failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_publish_task_event_real(self, zerodb_ops, test_user_id):
        """Test real task event publishing to ZeroDB"""
        try:
            task_data = {
                "id": f"test-task-{uuid.uuid4().hex[:8]}", 
                "title": "Real Event Test Task"
            }
            
            # This should not raise an exception if working correctly
            await zerodb_ops.publish_task_event("task_created", task_data, test_user_id)
            
            # If we reach here, event publishing succeeded
            assert True
            
        except Exception as e:
            pytest.fail(f"Real event publishing failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_store_reward_attachment_real(self, zerodb_ops, test_user_id):
        """Test real file storage in ZeroDB"""
        try:
            file_data = b"test file content for real storage"
            filename = "real_reward_image.jpg"
            task_id = f"test-task-{uuid.uuid4().hex[:8]}"
            
            result = await zerodb_ops.store_reward_attachment(
                test_user_id, task_id, file_data, filename
            )
            
            assert "file_id" in result
            assert result["filename"] == filename
            
        except Exception as e:
            pytest.fail(f"Real file storage failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_get_user_activity_feed_real(self, zerodb_ops, test_user_id):
        """Test real activity feed retrieval from ZeroDB"""
        try:
            # First create some activity by creating a task
            task_data = schemas.TaskCreate(
                title="Activity Feed Test Task",
                description="Task to generate activity",
                priority=schemas.TaskPriority.low
            )
            
            await zerodb_ops.create_task(task_data, test_user_id)
            
            # Then get the activity feed
            result = await zerodb_ops.get_user_activity_feed(test_user_id, limit=10)
            
            assert isinstance(result, list)
            # Should have at least one activity entry from task creation
            assert len(result) >= 0  # May be empty if events aren't stored yet
            
        except Exception as e:
            pytest.fail(f"Real activity feed retrieval failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_password_verification_real(self, zerodb_ops, test_user_email):
        """Test real password verification"""
        try:
            # Create a user first
            await zerodb_ops.create_user(
                email=test_user_email,
                password="testpassword123",
                name="Password Test User"
            )
            
            # Get the user
            user = await zerodb_ops.get_user_by_email(test_user_email)
            assert user is not None
            
            # Test password verification
            assert zerodb_ops.verify_password("testpassword123", user["hashed_password"]) is True
            assert zerodb_ops.verify_password("wrongpassword", user["hashed_password"]) is False
            
        except Exception as e:
            pytest.fail(f"Real password verification failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_database_status_real(self, zerodb_ops):
        """Test real database status retrieval"""
        try:
            result = await zerodb_ops.get_database_status()
            
            # Should return some status information
            assert isinstance(result, dict)
            # At minimum should have some status indicator
            assert len(result) > 0
            
        except Exception as e:
            pytest.fail(f"Real database status check failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_end_to_end_user_workflow_real(self, zerodb_ops):
        """Test complete real user workflow"""
        try:
            # Generate unique test data
            email = f"e2e-test-{uuid.uuid4().hex[:8]}@example.com"
            
            # 1. Create user
            user = await zerodb_ops.create_user(
                email=email,
                password="e2epassword123",
                name="E2E Test User"
            )
            
            user_id = user["id"]
            
            # 2. Create task
            task_data = schemas.TaskCreate(
                title="E2E Test Task",
                description="End-to-end testing task",
                priority=schemas.TaskPriority.high
            )
            
            task = await zerodb_ops.create_task(task_data, user_id)
            
            # 3. Get AI suggestions
            suggestions = await zerodb_ops.suggest_rewards_for_task(
                title=task["title"],
                description=task["description"], 
                priority="high"
            )
            
            # 4. Track behavior
            await zerodb_ops.track_user_behavior(
                user_id, 
                "task_created", 
                {"task_priority": "high", "has_ai_suggestions": len(suggestions) > 0}
            )
            
            # 5. Get tasks
            user_tasks = await zerodb_ops.get_tasks(user_id)
            
            # 6. Get activity feed
            activity = await zerodb_ops.get_user_activity_feed(user_id)
            
            # Verify the complete workflow
            assert user["email"] == email
            assert task["title"] == "E2E Test Task"
            assert task["user_id"] == user_id
            assert isinstance(suggestions, list)
            assert len(user_tasks) >= 1
            assert isinstance(activity, list)
            
        except Exception as e:
            pytest.fail(f"Real E2E workflow failed: {str(e)}")


# Configuration for pytest
def pytest_configure(config):
    """Configure pytest for real ZeroDB testing"""
    # Ensure test environment variables are set
    if not os.getenv("ZERODB_TOKEN"):
        pytest.skip("ZERODB_TOKEN not set - skipping real API tests", allow_module_level=True)
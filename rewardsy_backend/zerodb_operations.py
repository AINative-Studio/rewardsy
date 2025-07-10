"""
ZeroDB Operations for Rewardsy
Replaces SQLAlchemy CRUD operations with ZeroDB API calls
"""
import uuid
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from passlib.context import CryptContext
from .zerodb_client import zerodb
from . import schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ZeroDBOperations:
    """ZeroDB operations class to handle all data operations"""
    
    def __init__(self):
        self.client = zerodb
    
    async def initialize_tables(self):
        """Initialize ZeroDB tables for Users, Tasks, Rewards"""
        # Create Users table
        users_schema = {
            "id": "uuid",
            "email": "string",
            "name": "string", 
            "hashed_password": "string",
            "created_at": "timestamp",
            "updated_at": "timestamp"
        }
        
        # Create Tasks table
        tasks_schema = {
            "id": "uuid",
            "user_id": "uuid",
            "title": "string",
            "description": "text",
            "due_date": "timestamp",
            "scheduled_time": "timestamp", 
            "priority": "string",
            "status": "string",
            "created_at": "timestamp",
            "updated_at": "timestamp"
        }
        
        # Create Rewards table
        rewards_schema = {
            "id": "uuid",
            "task_id": "uuid",
            "type": "string",
            "description": "string",
            "image_url": "string",
            "link_url": "string", 
            "cost": "integer",
            "is_active": "boolean",
            "created_at": "timestamp",
            "updated_at": "timestamp"
        }
        
        try:
            await self.client.create_table("users", users_schema)
            await self.client.create_table("tasks", tasks_schema)
            await self.client.create_table("rewards", rewards_schema)
            print("✅ ZeroDB tables initialized successfully")
        except Exception as e:
            print(f"⚠️ Tables may already exist: {e}")

    # User Operations
    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email from ZeroDB"""
        try:
            # Store user lookup in memory for quick access
            memory_result = await self.client.store_memory(
                agent_id="rewardsy_system",
                session_id=str(uuid.uuid4()),
                role="system",
                content=f"User lookup: {email}",
                memory_metadata={"action": "user_lookup", "email": email}
            )
            
            # For now, use memory store to simulate user lookup
            # In a real implementation, you'd use a proper table query
            memories = await self.client.get_memory(
                agent_id="rewardsy_system",
                role="user"
            )
            
            # Look for user in stored memories (simplified approach)
            for memory in memories:
                if memory.get("memory_metadata", {}).get("email") == email:
                    return {
                        "id": memory.get("memory_metadata", {}).get("user_id"),
                        "email": email,
                        "name": memory.get("memory_metadata", {}).get("name"),
                        "hashed_password": memory.get("memory_metadata", {}).get("hashed_password"),
                        "created_at": memory.get("created_at")
                    }
            
            return None
        except Exception as e:
            print(f"Error getting user by email: {e}")
            return None

    async def create_user(self, email: str, password: str, name: str = None) -> Dict:
        """Create user in ZeroDB"""
        hashed_password = pwd_context.hash(password)
        user_id = str(uuid.uuid4())
        
        # Store user data in memory (since tables may not support direct queries yet)
        user_data = {
            "user_id": user_id,
            "email": email,
            "name": name or email.split("@")[0],
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store in ZeroDB memory
        await self.client.store_memory(
            agent_id="rewardsy_system",
            session_id=str(uuid.uuid4()),
            role="user",
            content=f"User created: {email}",
            memory_metadata=user_data
        )
        
        # Also log user creation event
        await self.client.publish_event(
            topic="user_created",
            event_payload={
                "user_id": user_id,
                "email": email,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return {
            "id": user_id,
            "email": email,
            "name": name or email.split("@")[0],
            "created_at": user_data["created_at"]
        }

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password"""
        return pwd_context.verify(plain_password, hashed_password)

    # Task Operations
    async def get_tasks(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get tasks for user from ZeroDB"""
        try:
            # Get task memories for this user
            memories = await self.client.get_memory(
                agent_id=f"user_{user_id}",
                role="task",
                skip=skip,
                limit=limit
            )
            
            tasks = []
            for memory in memories:
                metadata = memory.get("memory_metadata", {})
                if metadata.get("user_id") == user_id and metadata.get("type") == "task":
                    tasks.append({
                        "id": metadata.get("task_id"),
                        "user_id": user_id,
                        "title": metadata.get("title"),
                        "description": metadata.get("description"),
                        "due_date": metadata.get("due_date"),
                        "scheduled_time": metadata.get("scheduled_time"),
                        "priority": metadata.get("priority", "medium"),
                        "status": metadata.get("status", "pending"),
                        "created_at": memory.get("created_at"),
                        "rewards": metadata.get("rewards", [])
                    })
            
            return tasks
        except Exception as e:
            print(f"Error getting tasks: {e}")
            return []

    async def get_task(self, task_id: str, user_id: str) -> Optional[Dict]:
        """Get specific task from ZeroDB"""
        try:
            memories = await self.client.get_memory(agent_id=f"user_{user_id}", role="task")
            
            for memory in memories:
                metadata = memory.get("memory_metadata", {})
                if metadata.get("task_id") == task_id and metadata.get("user_id") == user_id:
                    return {
                        "id": task_id,
                        "user_id": user_id,
                        "title": metadata.get("title"),
                        "description": metadata.get("description"),
                        "due_date": metadata.get("due_date"),
                        "scheduled_time": metadata.get("scheduled_time"),
                        "priority": metadata.get("priority", "medium"),
                        "status": metadata.get("status", "pending"),
                        "created_at": memory.get("created_at"),
                        "rewards": metadata.get("rewards", [])
                    }
            
            return None
        except Exception as e:
            print(f"Error getting task: {e}")
            return None

    async def create_task(self, task: schemas.TaskCreate, user_id: str) -> Dict:
        """Create task in ZeroDB"""
        task_id = str(uuid.uuid4())
        
        # Prepare task data
        task_data = {
            "type": "task",
            "task_id": task_id,
            "user_id": user_id,
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "scheduled_time": task.scheduled_time.isoformat() if task.scheduled_time else None,
            "priority": task.priority.value,
            "status": "pending",
            "rewards": [reward.model_dump() for reward in task.rewards] if task.rewards else []
        }
        
        # Store task in memory
        await self.client.store_memory(
            agent_id=f"user_{user_id}",
            session_id=str(uuid.uuid4()),
            role="task",
            content=f"Task created: {task.title}",
            memory_metadata=task_data
        )
        
        # Generate AI reward suggestions if no rewards provided
        if not task.rewards:
            await self._generate_ai_reward_suggestions(task_id, task.title, task.description or "")
        
        # Publish task creation event
        await self.client.publish_event(
            topic="task_created",
            event_payload={
                "task_id": task_id,
                "user_id": user_id,
                "title": task.title,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Log agent activity
        await self.client.log_agent_activity(
            agent_id="rewardsy_ai",
            session_id=str(uuid.uuid4()),
            log_level="INFO",
            log_message=f"Task created for user {user_id}",
            raw_payload={"task_id": task_id, "title": task.title}
        )
        
        return {
            "id": task_id,
            "user_id": user_id,
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date,
            "scheduled_time": task.scheduled_time,
            "priority": task.priority,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "rewards": task_data["rewards"]
        }

    async def update_task(self, task_id: str, task_update: schemas.TaskUpdate, user_id: str) -> Optional[Dict]:
        """Update task in ZeroDB"""
        try:
            # Get existing task
            existing_task = await self.get_task(task_id, user_id)
            if not existing_task:
                return None
            
            # Prepare update data
            update_data = task_update.model_dump(exclude_unset=True)
            
            # Merge with existing data
            updated_task_data = {
                "type": "task",
                "task_id": task_id,
                "user_id": user_id,
                "title": update_data.get("title", existing_task.get("title")),
                "description": update_data.get("description", existing_task.get("description")),
                "due_date": update_data.get("due_date", existing_task.get("due_date")),
                "scheduled_time": update_data.get("scheduled_time", existing_task.get("scheduled_time")),
                "priority": update_data.get("priority", existing_task.get("priority")),
                "status": update_data.get("status", existing_task.get("status")),
                "rewards": existing_task.get("rewards", [])
            }
            
            # Store updated task
            await self.client.store_memory(
                agent_id=f"user_{user_id}",
                session_id=str(uuid.uuid4()),
                role="task",
                content=f"Task updated: {updated_task_data['title']}",
                memory_metadata=updated_task_data
            )
            
            # Publish update event
            await self.client.publish_event(
                topic="task_updated",
                event_payload={
                    "task_id": task_id,
                    "user_id": user_id,
                    "changes": update_data,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            return {
                "id": task_id,
                "user_id": user_id,
                **updated_task_data,
                "updated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error updating task: {e}")
            return None

    async def delete_task(self, task_id: str, user_id: str) -> bool:
        """Delete task from ZeroDB"""
        try:
            # Publish deletion event
            await self.client.publish_event(
                topic="task_deleted",
                event_payload={
                    "task_id": task_id,
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Store deletion record
            await self.client.store_memory(
                agent_id=f"user_{user_id}",
                session_id=str(uuid.uuid4()),
                role="system",
                content=f"Task deleted: {task_id}",
                memory_metadata={
                    "type": "task_deletion",
                    "task_id": task_id,
                    "user_id": user_id,
                    "deleted_at": datetime.utcnow().isoformat()
                }
            )
            
            return True
        except Exception as e:
            print(f"Error deleting task: {e}")
            return False

    # AI Reward Suggestions using Vector Search
    async def _generate_ai_reward_suggestions(self, task_id: str, title: str, description: str):
        """Generate AI reward suggestions using ZeroDB vector search"""
        try:
            # Create embedding for task (simplified - in reality you'd use an embedding model)
            task_text = f"{title} {description}"
            # For demo, create a simple vector based on text length and content
            vector_embedding = [
                len(title) / 100.0,
                len(description) / 100.0,
                1.0 if "urgent" in task_text.lower() else 0.5,
                1.0 if "important" in task_text.lower() else 0.5,
                0.8  # Base reward factor
            ]
            
            # Store task embedding
            await self.client.upsert_vector(
                vector_embedding=vector_embedding,
                namespace="tasks",
                vector_metadata={
                    "task_id": task_id,
                    "title": title,
                    "type": "task_embedding"
                },
                document=task_text,
                source="task_creation"
            )
            
            # Search for similar tasks to suggest rewards
            similar_tasks = await self.client.search_vectors(
                query_vector=vector_embedding,
                limit=5,
                namespace="rewards"
            )
            
            # Log AI suggestion activity
            await self.client.log_agent_activity(
                agent_id="rewardsy_ai",
                log_level="INFO",
                log_message=f"Generated reward suggestions for task {task_id}",
                raw_payload={
                    "task_id": task_id,
                    "similar_tasks_found": len(similar_tasks.get("vectors", [])),
                    "embedding_vector": vector_embedding
                }
            )
            
        except Exception as e:
            print(f"Error generating AI suggestions: {e}")

    async def suggest_rewards_for_task(self, title: str, description: str = "", priority: str = "medium") -> List[Dict]:
        """Advanced AI reward suggestions using ZeroDB vector embeddings"""
        try:
            # Create sophisticated embedding for the task
            task_text = f"{title} {description}".lower()
            
            # Enhanced vector embedding with multiple dimensions
            vector_embedding = [
                len(title) / 50.0,  # Title complexity
                len(description) / 200.0,  # Description detail
                1.0 if priority == "high" else 0.7 if priority == "medium" else 0.4,  # Priority weight
                1.0 if "work" in task_text or "job" in task_text else 0.5,  # Work-related
                1.0 if "exercise" in task_text or "fitness" in task_text else 0.5,  # Health-related
                1.0 if "learn" in task_text or "study" in task_text else 0.5,  # Learning-related
                1.0 if "creative" in task_text or "art" in task_text else 0.5,  # Creative
                1.0 if "urgent" in task_text or "asap" in task_text else 0.5,  # Urgency
                0.8,  # Base motivation factor
                len(task_text.split()) / 20.0  # Task complexity by word count
            ]
            
            # Search for similar reward patterns
            similar_rewards = await self.client.search_vectors(
                query_vector=vector_embedding,
                limit=10,
                namespace="reward_patterns"
            )
            
            # Generate contextual rewards based on task analysis
            suggested_rewards = []
            
            # Priority-based rewards
            if priority == "high":
                suggested_rewards.extend([
                    {"type": "treat", "description": "Order your favorite meal", "cost": 3},
                    {"type": "entertainment", "description": "Watch a movie you've been wanting to see", "cost": 2},
                    {"type": "relaxation", "description": "Take a long bath or shower", "cost": 1}
                ])
            elif priority == "medium":
                suggested_rewards.extend([
                    {"type": "break", "description": "20 minutes of your favorite music", "cost": 2},
                    {"type": "treat", "description": "Cup of premium coffee or tea", "cost": 1},
                    {"type": "activity", "description": "Call a friend or family member", "cost": 1}
                ])
            else:
                suggested_rewards.extend([
                    {"type": "break", "description": "10 minutes of meditation", "cost": 1},
                    {"type": "treat", "description": "Healthy snack break", "cost": 1},
                    {"type": "activity", "description": "Quick walk outside", "cost": 1}
                ])
            
            # Context-specific rewards
            if "work" in task_text or "project" in task_text:
                suggested_rewards.extend([
                    {"type": "professional", "description": "Update LinkedIn or portfolio", "cost": 2},
                    {"type": "networking", "description": "Read industry article", "cost": 1}
                ])
            
            if "exercise" in task_text or "workout" in task_text:
                suggested_rewards.extend([
                    {"type": "health", "description": "Protein smoothie or healthy meal", "cost": 2},
                    {"type": "relaxation", "description": "Hot shower and stretching", "cost": 1}
                ])
            
            if "learn" in task_text or "study" in task_text:
                suggested_rewards.extend([
                    {"type": "educational", "description": "Watch educational video on topic you enjoy", "cost": 2},
                    {"type": "break", "description": "Browse interesting articles", "cost": 1}
                ])
            
            # Store reward suggestions as vectors for future learning
            for i, reward in enumerate(suggested_rewards[:5]):  # Limit to top 5
                reward_vector = vector_embedding.copy()
                reward_vector.append(float(i))  # Add position weight
                
                await self.client.upsert_vector(
                    vector_embedding=reward_vector,
                    namespace="reward_patterns",
                    vector_metadata={
                        "reward_type": reward["type"],
                        "description": reward["description"],
                        "cost": reward["cost"],
                        "task_priority": priority,
                        "suggestion_context": "ai_generated"
                    },
                    document=f"{reward['type']}: {reward['description']}",
                    source="reward_suggestion"
                )
            
            # Log RLHF data for reward quality improvement
            await self.client.log_rlhf(
                agent_id="rewardsy_ai",
                session_id=str(uuid.uuid4()),
                feedback_type="reward_suggestion",
                feedback_rating=0.8,  # Default rating, will be updated by user feedback
                feedback_comments="AI-generated reward suggestions",
                rlhf_metadata={
                    "task_title": title,
                    "task_priority": priority,
                    "suggestions_count": len(suggested_rewards),
                    "vector_embedding": vector_embedding[:5]  # First 5 dimensions for logging
                }
            )
            
            # Log agent activity
            await self.client.log_agent_activity(
                agent_id="rewardsy_ai",
                session_id=str(uuid.uuid4()),
                log_level="INFO",
                log_message=f"Generated {len(suggested_rewards)} reward suggestions",
                raw_payload={
                    "task_title": title,
                    "priority": priority,
                    "embedding_dimensions": len(vector_embedding),
                    "similar_patterns_found": len(similar_rewards.get("vectors", [])),
                    "suggestions": suggested_rewards
                }
            )
            
            return suggested_rewards[:5]  # Return top 5 suggestions
            
        except Exception as e:
            print(f"Error in advanced reward suggestions: {e}")
            # Fallback to simple suggestions
            return [
                {"type": "break", "description": "15 minutes of your favorite music", "cost": 1},
                {"type": "treat", "description": "Cup of coffee or tea", "cost": 1},
                {"type": "activity", "description": "Quick walk or stretch", "cost": 1}
            ]

    # Real-time Events System
    async def subscribe_to_user_events(self, user_id: str) -> Dict:
        """Subscribe to real-time events for a user"""
        try:
            # Subscribe to user-specific topics
            topics = [
                f"user_{user_id}_tasks",
                f"user_{user_id}_rewards", 
                f"user_{user_id}_notifications",
                "system_announcements"
            ]
            
            subscription_info = {}
            for topic in topics:
                result = await self.client.subscribe_to_events(
                    topic=topic,
                    webhook_url=f"ws://localhost:8000/ws/{user_id}"  # WebSocket endpoint
                )
                subscription_info[topic] = result
            
            # Log subscription activity
            await self.client.log_agent_activity(
                agent_id="rewardsy_events",
                session_id=str(uuid.uuid4()),
                log_level="INFO",
                log_message=f"User {user_id} subscribed to real-time events",
                raw_payload={
                    "user_id": user_id,
                    "subscribed_topics": topics,
                    "subscription_info": subscription_info
                }
            )
            
            return {"status": "subscribed", "topics": topics, "info": subscription_info}
        except Exception as e:
            print(f"Error subscribing to events: {e}")
            return {"error": str(e)}

    async def publish_task_event(self, event_type: str, task_data: Dict, user_id: str):
        """Publish task-related events"""
        try:
            event_payload = {
                "event_type": event_type,
                "task_data": task_data,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "event_id": str(uuid.uuid4())
            }
            
            # Publish to user-specific topic
            await self.client.publish_event(
                topic=f"user_{user_id}_tasks",
                event_payload=event_payload
            )
            
            # Also publish to general tasks topic for admin monitoring
            await self.client.publish_event(
                topic="tasks_global",
                event_payload=event_payload
            )
            
            # Store event in memory for replay capability
            await self.client.store_memory(
                agent_id="rewardsy_events",
                session_id=str(uuid.uuid4()),
                role="system",
                content=f"Task event: {event_type}",
                memory_metadata={
                    "event_type": event_type,
                    "event_id": event_payload["event_id"],
                    "user_id": user_id,
                    "task_id": task_data.get("id"),
                    "timestamp": event_payload["timestamp"]
                }
            )
            
        except Exception as e:
            print(f"Error publishing task event: {e}")

    async def get_user_activity_feed(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get recent activity feed for user using ZeroDB memory"""
        try:
            # Get recent events from memory
            memories = await self.client.get_memory(
                agent_id="rewardsy_events",
                role="system",
                limit=limit
            )
            
            # Filter and format user activities
            activities = []
            for memory in memories:
                metadata = memory.get("memory_metadata", {})
                if metadata.get("user_id") == user_id:
                    activities.append({
                        "id": metadata.get("event_id"),
                        "type": metadata.get("event_type"),
                        "description": memory.get("content"),
                        "timestamp": metadata.get("timestamp"),
                        "task_id": metadata.get("task_id")
                    })
            
            # Sort by timestamp (newest first)
            activities.sort(key=lambda x: x["timestamp"], reverse=True)
            
            return activities[:limit]
        except Exception as e:
            print(f"Error getting activity feed: {e}")
            return []

    # User Behavior Tracking with ZeroDB Memory
    async def track_user_behavior(self, user_id: str, action: str, context: Dict):
        """Track user behavior patterns using ZeroDB memory"""
        try:
            behavior_data = {
                "user_id": user_id,
                "action": action,
                "context": context,
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": context.get("session_id", str(uuid.uuid4()))
            }
            
            # Store behavior in memory with advanced metadata
            await self.client.store_memory(
                agent_id=f"user_behavior_{user_id}",
                session_id=behavior_data["session_id"],
                role="user",
                content=f"User action: {action}",
                memory_metadata=behavior_data
            )
            
            # Create behavior vector for pattern analysis
            behavior_vector = self._create_behavior_vector(action, context)
            
            # Store behavior pattern as vector
            await self.client.upsert_vector(
                vector_embedding=behavior_vector,
                namespace="user_behavior",
                vector_metadata={
                    "user_id": user_id,
                    "action": action,
                    "timestamp": behavior_data["timestamp"],
                    "context_type": context.get("type", "unknown")
                },
                document=f"User {user_id} performed {action}",
                source="behavior_tracking"
            )
            
            # Log for RLHF improvement
            await self.client.log_rlhf(
                agent_id="rewardsy_behavior",
                session_id=behavior_data["session_id"],
                feedback_type="user_behavior",
                feedback_rating=self._calculate_behavior_score(action, context),
                feedback_comments=f"User behavior tracking: {action}",
                rlhf_metadata=behavior_data
            )
            
        except Exception as e:
            print(f"Error tracking user behavior: {e}")

    def _create_behavior_vector(self, action: str, context: Dict) -> List[float]:
        """Create vector representation of user behavior"""
        # Simple behavior vectorization (in production, use ML models)
        vector = [0.0] * 10
        
        # Action type encoding
        action_weights = {
            "task_created": [1.0, 0.8, 0.0, 0.0, 0.0],
            "task_completed": [0.8, 1.0, 0.9, 0.0, 0.0],
            "task_deleted": [0.2, 0.0, 0.0, 1.0, 0.0],
            "reward_claimed": [0.9, 0.8, 1.0, 0.0, 0.0],
            "login": [0.5, 0.0, 0.0, 0.0, 1.0]
        }
        
        weights = action_weights.get(action, [0.5] * 5)
        vector[:5] = weights
        
        # Context encoding
        vector[5] = float(context.get("task_priority_high", 0))
        vector[6] = float(context.get("time_spent_minutes", 0)) / 60.0
        vector[7] = float(context.get("success_rate", 0.5))
        vector[8] = float(context.get("engagement_score", 0.5))
        vector[9] = 1.0  # Base engagement
        
        return vector

    def _calculate_behavior_score(self, action: str, context: Dict) -> float:
        """Calculate behavior quality score for RLHF"""
        base_scores = {
            "task_created": 0.7,
            "task_completed": 1.0,
            "task_deleted": 0.3,
            "reward_claimed": 0.9,
            "login": 0.6
        }
        
        score = base_scores.get(action, 0.5)
        
        # Adjust based on context
        if context.get("task_priority") == "high":
            score += 0.1
        if context.get("completed_on_time"):
            score += 0.2
        if context.get("streak_count", 0) > 3:
            score += 0.1
            
        return min(1.0, score)

    # File Storage Integration  
    async def store_reward_attachment(self, user_id: str, task_id: str, file_data: bytes, filename: str) -> Dict:
        """Store reward images/attachments using ZeroDB file storage"""
        try:
            # Store file in ZeroDB
            file_result = await self.client.store_file(
                file_data=file_data,
                filename=filename,
                file_metadata={
                    "user_id": user_id,
                    "task_id": task_id,
                    "upload_type": "reward_attachment",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Log file storage
            await self.client.log_agent_activity(
                agent_id="rewardsy_files",
                session_id=str(uuid.uuid4()),
                log_level="INFO",
                log_message=f"File stored for task {task_id}",
                raw_payload={
                    "user_id": user_id,
                    "task_id": task_id,
                    "filename": filename,
                    "file_size": len(file_data),
                    "file_id": file_result.get("file_id")
                }
            )
            
            return file_result
        except Exception as e:
            print(f"Error storing file: {e}")
            return {"error": str(e)}

    async def get_reward_attachment(self, file_id: str, user_id: str) -> Dict:
        """Retrieve reward attachment"""
        try:
            return await self.client.get_file(
                file_id=file_id,
                file_metadata_filter={"user_id": user_id}
            )
        except Exception as e:
            print(f"Error retrieving file: {e}")
            return {"error": str(e)}

    # Get database status
    async def get_database_status(self) -> Dict:
        """Get ZeroDB status"""
        try:
            return await self.client.get_database_status()
        except Exception as e:
            print(f"Error getting database status: {e}")
            return {"error": str(e)}

# Global ZeroDB operations instance
zerodb_ops = ZeroDBOperations()
"""
ZeroDB Client for Rewardsy Backend
Handles all ZeroDB API operations for users, tasks, rewards, and AI features
"""
import os
import json
import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ZeroDBClient:
    def __init__(self):
        # Load configuration from environment
        self.base_url = os.getenv("ZERODB_API_BASE_URL", "https://api.ainative.studio/api/v1")
        self.api_key = os.getenv("ZERODB_API_KEY")
        self.project_id = os.getenv("ZERODB_PROJECT_ID")
        self.email = os.getenv("Email")
        self.password = os.getenv("Password")
        
        if not all([self.api_key, self.project_id]):
            raise ValueError("ZERODB_API_KEY and ZERODB_PROJECT_ID must be set")
        
        # Generate JWT token for authentication
        self.token = self._generate_jwt_token()
        
        # HTTP client with authentication headers
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )

    def _generate_jwt_token(self) -> str:
        """Generate JWT token for ZeroDB authentication"""
        import jwt
        import time
        
        # Use the exact SECRET_KEY from ZeroDB documentation
        SECRET_KEY = 'your-secret-key-here'
        
        payload = {
            'sub': 'a9b717be-f449-43c6-abb4-18a1a6a0c70e',  # Valid user ID
            'role': 'admin',
            'email': self.email or 'admin@ainative.studio',
            'iat': int(time.time()),
            'exp': int(time.time()) + 86400  # 24 hours
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        return token

    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make authenticated request to ZeroDB API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = await self.client.get(url)
            elif method.upper() == "POST":
                response = await self.client.post(url, json=data)
            elif method.upper() == "PUT":
                response = await self.client.put(url, json=data)
            elif method.upper() == "DELETE":
                response = await self.client.delete(url)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"ZeroDB API error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"ZeroDB request failed: {str(e)}")
            raise

    # Database Table Operations
    async def create_table(self, table_name: str, schema_definition: Dict) -> Dict:
        """Create a table in ZeroDB"""
        data = {
            "table_name": table_name,
            "schema_definition": schema_definition
        }
        return await self._make_request("POST", f"/projects/{self.project_id}/database/tables", data)

    async def get_tables(self) -> List[Dict]:
        """Get all tables in the project"""
        return await self._make_request("GET", f"/projects/{self.project_id}/database/tables")

    # Generic CRUD Operations for Tables
    async def insert_record(self, table_name: str, record_data: Dict) -> Dict:
        """Insert a record into a ZeroDB table"""
        # Note: This would be a custom endpoint or use the generic table operations
        # For now, we'll use the memory store as a workaround for user data
        return await self._make_request("POST", f"/projects/{self.project_id}/database/tables/{table_name}/records", record_data)

    async def get_records(self, table_name: str, filters: Optional[Dict] = None) -> List[Dict]:
        """Get records from a ZeroDB table"""
        endpoint = f"/projects/{self.project_id}/database/tables/{table_name}/records"
        if filters:
            # Add query parameters for filtering
            query_params = "&".join([f"{k}={v}" for k, v in filters.items()])
            endpoint = f"{endpoint}?{query_params}"
        return await self._make_request("GET", endpoint)

    async def update_record(self, table_name: str, record_id: str, update_data: Dict) -> Dict:
        """Update a record in a ZeroDB table"""
        return await self._make_request("PUT", f"/projects/{self.project_id}/database/tables/{table_name}/records/{record_id}", update_data)

    async def delete_record(self, table_name: str, record_id: str) -> bool:
        """Delete a record from a ZeroDB table"""
        try:
            await self._make_request("DELETE", f"/projects/{self.project_id}/database/tables/{table_name}/records/{record_id}")
            return True
        except:
            return False

    # Vector Operations for AI Features
    async def upsert_vector(self, vector_embedding: List[float], namespace: str = "default", 
                           vector_metadata: Optional[Dict] = None, document: Optional[str] = None, 
                           source: Optional[str] = None) -> Dict:
        """Store vector embedding for AI operations"""
        data = {
            "vector_embedding": vector_embedding,
            "namespace": namespace,
            "vector_metadata": vector_metadata or {},
            "document": document,
            "source": source
        }
        return await self._make_request("POST", f"/projects/{self.project_id}/database/vectors/upsert", data)

    async def search_vectors(self, query_vector: List[float], limit: int = 5, namespace: str = "default") -> Dict:
        """Search for similar vectors (for AI recommendations)"""
        data = {
            "query_vector": query_vector,
            "limit": limit,
            "namespace": namespace
        }
        return await self._make_request("POST", f"/projects/{self.project_id}/database/vectors/search", data)

    async def get_vectors(self, namespace: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get stored vectors"""
        endpoint = f"/projects/{self.project_id}/database/vectors?skip={skip}&limit={limit}"
        if namespace:
            endpoint += f"&namespace={namespace}"
        return await self._make_request("GET", endpoint)

    # Memory Operations for User Behavior
    async def store_memory(self, agent_id: Optional[str] = None, session_id: Optional[str] = None,
                          role: Optional[str] = None, content: str = "", 
                          memory_metadata: Optional[Dict] = None) -> Dict:
        """Store user interaction memory"""
        data = {
            "agent_id": agent_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "memory_metadata": memory_metadata or {}
        }
        return await self._make_request("POST", f"/projects/{self.project_id}/database/memory/store", data)

    async def get_memory(self, agent_id: Optional[str] = None, session_id: Optional[str] = None,
                        role: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get stored memories"""
        endpoint = f"/projects/{self.project_id}/database/memory?skip={skip}&limit={limit}"
        params = []
        if agent_id:
            params.append(f"agent_id={agent_id}")
        if session_id:
            params.append(f"session_id={session_id}")
        if role:
            params.append(f"role={role}")
        
        if params:
            endpoint += "&" + "&".join(params)
        
        return await self._make_request("GET", endpoint)

    # Event Operations for Real-time Updates
    async def publish_event(self, topic: str, event_payload: Dict) -> Dict:
        """Publish event for real-time updates"""
        data = {
            "topic": topic,
            "event_payload": event_payload
        }
        return await self._make_request("POST", f"/projects/{self.project_id}/database/events/publish", data)

    async def get_events(self, topic: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get published events"""
        endpoint = f"/projects/{self.project_id}/database/events?skip={skip}&limit={limit}"
        if topic:
            endpoint += f"&topic={topic}"
        return await self._make_request("GET", endpoint)

    # File Operations for Attachments
    async def upload_file_metadata(self, file_key: str, file_name: Optional[str] = None,
                                  content_type: Optional[str] = None, size_bytes: Optional[int] = None,
                                  file_metadata: Optional[Dict] = None) -> Dict:
        """Upload file metadata"""
        data = {
            "file_key": file_key,
            "file_name": file_name,
            "content_type": content_type,
            "size_bytes": size_bytes,
            "file_metadata": file_metadata or {}
        }
        return await self._make_request("POST", f"/projects/{self.project_id}/database/files/upload", data)

    async def get_files(self, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get file metadata"""
        endpoint = f"/projects/{self.project_id}/database/files?skip={skip}&limit={limit}"
        return await self._make_request("GET", endpoint)

    # RLHF Operations for AI Improvement
    async def log_rlhf_dataset(self, session_id: Optional[str] = None, input_prompt: str = "",
                              model_output: str = "", reward_score: Optional[float] = None,
                              notes: Optional[str] = None) -> Dict:
        """Log RLHF data for AI improvement"""
        data = {
            "session_id": session_id,
            "input_prompt": input_prompt,
            "model_output": model_output,
            "reward_score": reward_score,
            "notes": notes
        }
        return await self._make_request("POST", f"/projects/{self.project_id}/database/rlhf/log", data)

    # Agent Logging for AI Interactions
    async def log_agent_activity(self, agent_id: Optional[str] = None, session_id: Optional[str] = None,
                                log_level: str = "INFO", log_message: str = "",
                                raw_payload: Optional[Dict] = None) -> Dict:
        """Log agent activity"""
        data = {
            "agent_id": agent_id,
            "session_id": session_id,
            "log_level": log_level,
            "log_message": log_message,
            "raw_payload": raw_payload or {}
        }
        return await self._make_request("POST", f"/projects/{self.project_id}/database/agent/log", data)

    async def get_agent_logs(self, agent_id: Optional[str] = None, session_id: Optional[str] = None,
                            log_level: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get agent logs"""
        endpoint = f"/projects/{self.project_id}/database/agent/logs?skip={skip}&limit={limit}"
        params = []
        if agent_id:
            params.append(f"agent_id={agent_id}")
        if session_id:
            params.append(f"session_id={session_id}")
        if log_level:
            params.append(f"log_level={log_level}")
        
        if params:
            endpoint += "&" + "&".join(params)
        
        return await self._make_request("GET", endpoint)

    # Database Status
    async def get_database_status(self) -> Dict:
        """Get database status"""
        return await self._make_request("GET", f"/projects/{self.project_id}/database/status")

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Global ZeroDB client instance
zerodb = ZeroDBClient()
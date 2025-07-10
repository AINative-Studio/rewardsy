from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import jwt
import asyncio
from . import schemas
from .zerodb_operations import zerodb_ops

app = FastAPI(title="Rewardsy API", description="AI-Powered Rewarded To-Do List API with ZeroDB", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Initialize ZeroDB tables on startup
@app.on_event("startup")
async def startup_event():
    """Initialize ZeroDB tables and connections"""
    try:
        await zerodb_ops.initialize_client()
        await zerodb_ops.initialize_tables()
        print("🚀 ZeroDB initialized successfully")
    except Exception as e:
        print(f"❌ ZeroDB initialization failed: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up ZeroDB connections"""
    try:
        if hasattr(zerodb_ops, 'client') and zerodb_ops.client:
            await zerodb_ops.client.close()
        print("🔒 ZeroDB connections closed")
    except Exception as e:
        print(f"Error closing ZeroDB connections: {e}")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, "your-secret-key", algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await zerodb_ops.get_user_by_email(email)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/")
def root():
    return {"message": "Rewardsy Backend API", "version": "1.0.0"}

# Auth endpoints
@app.post("/signup", response_model=schemas.UserOut, status_code=201)
async def signup(user: schemas.UserCreate):
    existing = await zerodb_ops.get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    db_user = await zerodb_ops.create_user(user.email, user.password, user.name)
    return db_user

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await zerodb_ops.get_user_by_email(form_data.username)  # OAuth2 uses 'username' field
    if not user or not zerodb_ops.verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"sub": user["email"], "user_id": user["id"]}, "your-secret-key", algorithm="HS256")
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": {
            "id": user["id"], 
            "email": user["email"], 
            "name": user.get("name")
        }
    }

# Task endpoints - ZeroDB async operations
@app.get("/tasks", response_model=List[dict])
async def get_tasks(
    skip: int = 0, 
    limit: int = 100, 
    current_user: dict = Depends(get_current_user)
):
    """Get all tasks for the current user from ZeroDB"""
    try:
        tasks = await zerodb_ops.get_tasks(current_user["id"])
        # Apply pagination
        return tasks[skip:skip + limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tasks: {str(e)}")

@app.post("/tasks", response_model=dict, status_code=201)
async def create_task(
    task: schemas.TaskCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Create a new task using ZeroDB"""
    try:
        db_task = await zerodb_ops.create_task(task, current_user["id"])
        # Track user behavior
        await zerodb_ops.track_user_behavior(
            current_user["id"], 
            "task_created", 
            {"task_priority": task.priority.value, "has_description": bool(task.description)}
        )
        return db_task
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@app.get("/tasks/{task_id}", response_model=dict)
async def get_task(
    task_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get a specific task from ZeroDB"""
    try:
        tasks = await zerodb_ops.get_tasks(current_user["id"])
        task = next((t for t in tasks if t["id"] == task_id), None)
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

@app.put("/tasks/{task_id}", response_model=dict)
async def update_task(
    task_id: str, 
    task_update: schemas.TaskUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update a task in ZeroDB"""
    try:
        # Get existing task
        tasks = await zerodb_ops.get_tasks(current_user["id"])
        task = next((t for t in tasks if t["id"] == task_id), None)
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update fields
        update_data = task_update.dict(exclude_unset=True)
        task.update(update_data)
        
        # Store updated task (this would need to be implemented in zerodb_ops)
        await zerodb_ops.update_task(task_id, task_update, current_user["id"])
        
        # Track completion if status changed
        if task_update.completed is not None:
            await zerodb_ops.track_user_behavior(
                current_user["id"], 
                "task_completed" if task_update.completed else "task_uncompleted",
                {"task_id": task_id, "task_priority": task.get("priority")}
            )
        
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@app.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Delete a task from ZeroDB"""
    try:
        success = await zerodb_ops.delete_task(task_id, current_user["id"])
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Track deletion
        await zerodb_ops.track_user_behavior(
            current_user["id"], 
            "task_deleted", 
            {"task_id": task_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

# User activity and events endpoints
@app.get("/user/activity", response_model=List[dict])
async def get_user_activity(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user activity feed from ZeroDB"""
    try:
        activity = await zerodb_ops.get_user_activity_feed(current_user["id"], limit=limit)
        return activity
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get activity: {str(e)}")

# File storage endpoints for reward attachments
@app.post("/tasks/{task_id}/attachments")
async def upload_reward_attachment(
    task_id: str,
    file_data: bytes,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Upload reward attachment to ZeroDB file storage"""
    try:
        result = await zerodb_ops.store_reward_attachment(
            current_user["id"], task_id, file_data, filename
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload attachment: {str(e)}")

# AI-powered reward suggestion endpoints
@app.post("/ai/suggest-reward", response_model=List[schemas.RewardSuggestion])
async def suggest_rewards(
    task_request: schemas.RewardSuggestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI-powered reward suggestions using ZeroDB vector embeddings"""
    try:
        suggestions = await zerodb_ops.suggest_rewards_for_task(
            title=task_request.title,
            description=task_request.description or "",
            priority=task_request.priority
        )
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

# ZeroDB management endpoints
@app.get("/admin/zerodb/status")
async def get_zerodb_status(current_user: dict = Depends(get_current_user)):
    """Get ZeroDB database status"""
    return await zerodb_ops.get_database_status()

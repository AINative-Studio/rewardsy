from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from models import TaskStatus, TaskPriority, RewardType

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    created_at: datetime
    class Config:
        orm_mode = True

# Reward Schemas
class RewardBase(BaseModel):
    type: RewardType
    description: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    cost: int = 0

class RewardCreate(RewardBase):
    pass

class RewardUpdate(BaseModel):
    type: Optional[RewardType] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    cost: Optional[int] = None
    is_active: Optional[bool] = None

class RewardOut(RewardBase):
    id: int
    task_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    class Config:
        orm_mode = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    scheduled_time: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.medium

class TaskCreate(TaskBase):
    rewards: Optional[List[RewardCreate]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    scheduled_time: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None

class TaskOut(TaskBase):
    id: int
    user_id: int
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    rewards: List[RewardOut] = []
    class Config:
        orm_mode = True

# AI Reward Suggestion Schemas
class RewardSuggestionRequest(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"

class RewardSuggestion(BaseModel):
    type: str
    description: str
    cost: int

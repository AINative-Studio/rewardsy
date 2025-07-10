from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext
from typing import List, Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User CRUD operations
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, email: str, password: str):
    hashed_password = pwd_context.hash(password)
    db_user = models.User(email=email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Task CRUD operations
def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Task).filter(models.Task.user_id == user_id).offset(skip).limit(limit).all()

def get_task(db: Session, task_id: int, user_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id).first()

def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    db_task = models.Task(**task.dict(exclude={'rewards'}), user_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Create associated rewards
    for reward_data in task.rewards:
        db_reward = models.Reward(**reward_data.dict(), task_id=db_task.id)
        db.add(db_reward)
    
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate, user_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id).first()
    if db_task:
        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_task, field, value)
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False

# Reward CRUD operations
def get_rewards(db: Session, task_id: int, user_id: int):
    # Verify task belongs to user first
    task = get_task(db, task_id, user_id)
    if not task:
        return []
    return db.query(models.Reward).filter(models.Reward.task_id == task_id).all()

def get_reward(db: Session, reward_id: int, user_id: int):
    return db.query(models.Reward).join(models.Task).filter(
        models.Reward.id == reward_id, 
        models.Task.user_id == user_id
    ).first()

def create_reward(db: Session, reward: schemas.RewardCreate, task_id: int, user_id: int):
    # Verify task belongs to user
    task = get_task(db, task_id, user_id)
    if not task:
        return None
    
    db_reward = models.Reward(**reward.dict(), task_id=task_id)
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward

def update_reward(db: Session, reward_id: int, reward_update: schemas.RewardUpdate, user_id: int):
    db_reward = get_reward(db, reward_id, user_id)
    if db_reward:
        update_data = reward_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_reward, field, value)
        db.commit()
        db.refresh(db_reward)
    return db_reward

def delete_reward(db: Session, reward_id: int, user_id: int):
    db_reward = get_reward(db, reward_id, user_id)
    if db_reward:
        db.delete(db_reward)
        db.commit()
        return True
    return False

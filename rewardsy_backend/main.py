from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import EmailStr
import jwt
from . import models, schemas, crud, auth, database

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Rewardsy Backend API"}

@app.post("/signup", response_model=schemas.UserOut, status_code=201)
def signup(user: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    db_user = crud.create_user(db, user.email, user.password)
    return db_user

@app.post("/login")
def login(form_data: schemas.UserLogin, db: Session = Depends(auth.get_db)):
    user = auth.authenticate_user(db, form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # For demo, use a simple JWT. In production, use a secret and set expiry.
    token = jwt.encode({"sub": user.email}, "secret", algorithm="HS256")
    return {"access_token": token, "token_type": "bearer"}

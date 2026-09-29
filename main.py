from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from jose import jwt

from database import engine, Base, SessionLocal
import models


# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


password_hash = PasswordHash.recommended()


# JWT settings
SECRET_KEY = "my-secret-key"
ALGORITHM = "HS256"

security = HTTPBearer()


# -------------------------
# Database connection
# -------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# -------------------------
# Request models
# -------------------------

class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TodoRequest(BaseModel):
    title: str
    completed: bool = False


# -------------------------
# Get current user
# -------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


# -------------------------
# Home
# -------------------------

@app.get("/")
def home():
    return {"message": "Todo API is running"}


# -------------------------
# Register
# -------------------------

@app.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        models.User.email == data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = password_hash.hash(data.password)

    user = models.User(
        email=data.email,
        password_hash=hashed_password
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully"
    }


# -------------------------
# Login
# -------------------------

@app.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    user = db.query(models.User).filter(
        models.User.email == data.email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_correct = password_hash.verify(
        data.password,
        user.password_hash
    )

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = jwt.encode(
        {
            "user_id": user.id
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# -------------------------
# Get todos
# -------------------------

@app.get("/todos")
def get_todos(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    todos = db.query(models.Todo).filter(
        models.Todo.user_id == current_user.id
    ).all()

    return todos


# -------------------------
# Create todo
# -------------------------

@app.post("/todos")
def create_todo(
    todo: TodoRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    new_todo = models.Todo(
        title=todo.title,
        completed=todo.completed,
        user_id=current_user.id
    )

    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)

    return new_todo


# -------------------------
# Update todo
# -------------------------

@app.put("/todos/{todo_id}")
def update_todo(
    todo_id: int,
    todo: TodoRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    existing_todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id
    ).first()

    if existing_todo is None:
        raise HTTPException(
            status_code=404,
            detail="Todo not found"
        )

    existing_todo.title = todo.title
    existing_todo.completed = todo.completed

    db.commit()
    db.refresh(existing_todo)

    return existing_todo


# -------------------------
# Delete todo
# -------------------------

@app.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id
    ).first()

    if todo is None:
        raise HTTPException(
            status_code=404,
            detail="Todo not found"
        )

    db.delete(todo)
    db.commit()

    return {
        "message": "Todo deleted successfully"
    }

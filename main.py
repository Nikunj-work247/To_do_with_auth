from fastapi import FastAPI
from pydantic import BaseModel as Base
app = FastAPI()

todos = []

class Todo(Base):
    id:int  
    title:str
    completed: bool = False

@app.get("/")
def home():
    return {"message":"Todo API is running"}

@app.get("/todos") #read
def get_todos():
    return todos

@app.post("/todos") #create 
def create_todos(todo: Todo):
    todos.append(todo)
    return todo

@app.put("/todos/{todo_id}") #update
def update_todo(todo_id: int, updated_todo: Todo):
    for todo in todos:
        if todo.id == todo_id:
            todo.title = updated_todo.title
            todo.completed = updated_todo.completed
            return todo

    return {"message": "Todo not found"}

@app.delete("/todos/{todo_id}") #Delete
def delete_todo(todo_id: int):
    for todo in todos:
        if todo.id == todo_id:
            todos.remove(todo)
            return {"message": "Todo deleted successfully"}
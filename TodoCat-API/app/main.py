from fastapi import FastAPI

from app.database import Base, engine
from app.routers import task

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TodoCat API")
app.include_router(task.router)

@app.get("/")
def root():
    return {"message": "TodoCat is running"}
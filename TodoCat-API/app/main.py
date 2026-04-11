from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import task

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TodoCat API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(task.router)

@app.get("/")
def root():
    return {"message": "TodoCat is running"}
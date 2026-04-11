from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field

class CreateTaskReqeust(BaseModel):
    content: Annotated[str, Field(max_length=500)]
    done: bool = False

class UpdateTaskReqeust(BaseModel):
    content: str | None = None
    done: bool

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    done: bool
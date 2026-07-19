from pydantic import BaseModel, EmailStr


class HODCreate(BaseModel):
    username: str
    password: str
    name: str
    email: str
    department_id: int


class HODUpdate(BaseModel):
    username: str | None = None
    password: str | None = None
    name: str | None = None
    email: str | None = None
    department_id: int | None = None


class HODOut(BaseModel):
    id: int
    username: str
    name: str
    email: str
    department_id: int
    department_name: str | None = None

    model_config = {"from_attributes": True}

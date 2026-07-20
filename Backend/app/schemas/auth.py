from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str
    department: str | None = None


class UserOut(BaseModel):
    name: str
    email: str
    role: str
    department: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

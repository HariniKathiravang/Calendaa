from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.services import auth_service
from app.auth.dependencies import require_auth

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    result = auth_service.login(body.username, body.password, body.department, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return result


@router.get("/me", response_model=UserOut)
def me(payload: dict = Depends(require_auth)):
    return UserOut(
        name=payload.get("name", ""),
        email=payload.get("email", ""),
        role=payload.get("role", "guest"),
        department=payload.get("department"),
    )

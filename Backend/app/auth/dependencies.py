from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.jwt_handler import decode_token
from app.models.admin import Admin
from app.models.hod import HOD

bearer_scheme = HTTPBearer(auto_error=False)


def _get_current_user_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    return payload


def get_optional_user(payload: dict | None = Depends(_get_current_user_payload)):
    """Returns payload dict or None for public endpoints."""
    return payload


def require_auth(payload: dict | None = Depends(_get_current_user_payload)):
    """Raises 401 if not authenticated."""
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return payload


def require_admin(payload: dict = Depends(require_auth)):
    """Raises 403 if not an admin."""
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return payload


def require_admin_or_hod(payload: dict = Depends(require_auth)):
    """Raises 403 if not admin or HOD."""
    if payload.get("role") not in ("admin", "hod"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return payload

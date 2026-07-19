from sqlalchemy.orm import Session
from app.models.admin import Admin
from app.models.hod import HOD
from app.utils.password import verify_password
from app.auth.jwt_handler import create_access_token
from app.schemas.auth import TokenResponse, UserOut


def login(username: str, password: str, db: Session) -> TokenResponse | None:
    # Try admin first
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin and verify_password(password, admin.hashed_password):
        token = create_access_token({
            "sub": str(admin.id),
            "role": "admin",
            "name": admin.name,
            "email": admin.email,
        })
        return TokenResponse(
            access_token=token,
            user=UserOut(name=admin.name, email=admin.email, role="admin"),
        )

    # Try HOD
    hod = db.query(HOD).filter(HOD.username == username).first()
    if hod and verify_password(password, hod.hashed_password):
        dept_name = hod.department.name if hod.department else ""
        token = create_access_token({
            "sub": str(hod.id),
            "role": "hod",
            "name": hod.name,
            "email": hod.email,
            "department": dept_name,
        })
        return TokenResponse(
            access_token=token,
            user=UserOut(name=hod.name, email=hod.email, role="hod", department=dept_name),
        )

    return None

from sqlalchemy.orm import Session
from app.models.admin import Admin
from app.models.hod import HOD
from app.utils.password import verify_password
from app.auth.jwt_handler import create_access_token
from app.schemas.auth import TokenResponse, UserOut


def login(username: str, password: str, department: str | None, db: Session) -> TokenResponse | None:
    # 1. Student Login
    if username.lower() == "student":
        if password == "eec123" and department:
            token = create_access_token({
                "sub": "student",
                "role": "student",
                "name": "Student",
                "email": "student@college.edu",
                "department": department,
            })
            return TokenResponse(
                access_token=token,
                user=UserOut(name="Student", email="student@college.edu", role="student", department=department),
            )
        return None

    # 2. Try admin first
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

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.admin import DepartmentOut, YearOut, SectionOut
from app.services import admin_service
from typing import Optional

router = APIRouter(tags=["Lookup"])


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    """Public — list all departments."""
    return admin_service.list_departments(db)


@router.get("/years", response_model=list[YearOut])
def list_years(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Public — list years, optionally filtered by department."""
    return admin_service.list_years(db, department_id)


@router.get("/sections", response_model=list[SectionOut])
def list_sections(year_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Public — list sections, optionally filtered by year."""
    return admin_service.list_sections(db, year_id)

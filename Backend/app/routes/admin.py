from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.hod import HODCreate, HODUpdate, HODOut
from app.schemas.admin import (
    DepartmentCreate, DepartmentUpdate, DepartmentOut,
    YearCreate, YearUpdate, YearOut,
    SectionCreate, SectionUpdate, SectionOut,
)
from app.services import admin_service
from app.auth.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── HODs ─────────────────────────────────────────────────────────────────────

@router.get("/hods", response_model=list[HODOut])
def list_hods(db: Session = Depends(get_db), _=Depends(require_admin)):
    return admin_service.list_hods(db)


@router.post("/hods", response_model=HODOut, status_code=status.HTTP_201_CREATED)
def create_hod(body: HODCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return admin_service.create_hod(db, body)


@router.put("/hods/{hod_id}", response_model=HODOut)
def update_hod(hod_id: int, body: HODUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    result = admin_service.update_hod(db, hod_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="HOD not found")
    return result


@router.delete("/hods/{hod_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hod(hod_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    if not admin_service.delete_hod(db, hod_id):
        raise HTTPException(status_code=404, detail="HOD not found")


# ── Departments ───────────────────────────────────────────────────────────────

@router.post("/departments", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(body: DepartmentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return admin_service.create_department(db, body)


@router.put("/departments/{dept_id}", response_model=DepartmentOut)
def update_department(dept_id: int, body: DepartmentUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    result = admin_service.update_department(db, dept_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Department not found")
    return result


@router.delete("/departments/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(dept_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    if not admin_service.delete_department(db, dept_id):
        raise HTTPException(status_code=404, detail="Department not found")


# ── Years ─────────────────────────────────────────────────────────────────────

@router.post("/years", response_model=YearOut, status_code=status.HTTP_201_CREATED)
def create_year(body: YearCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return admin_service.create_year(db, body)


@router.put("/years/{year_id}", response_model=YearOut)
def update_year(year_id: int, body: YearUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    result = admin_service.update_year(db, year_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Year not found")
    return result


@router.delete("/years/{year_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_year(year_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    if not admin_service.delete_year(db, year_id):
        raise HTTPException(status_code=404, detail="Year not found")


# ── Sections ──────────────────────────────────────────────────────────────────

@router.post("/sections", response_model=SectionOut, status_code=status.HTTP_201_CREATED)
def create_section(body: SectionCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return admin_service.create_section(db, body)


@router.put("/sections/{section_id}", response_model=SectionOut)
def update_section(section_id: int, body: SectionUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    result = admin_service.update_section(db, section_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Section not found")
    return result


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(section_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    if not admin_service.delete_section(db, section_id):
        raise HTTPException(status_code=404, detail="Section not found")

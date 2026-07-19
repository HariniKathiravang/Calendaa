from sqlalchemy.orm import Session
from app.models.hod import HOD
from app.models.department import Department
from app.models.year import Year
from app.models.section import Section
from app.schemas.hod import HODCreate, HODUpdate, HODOut
from app.schemas.admin import (
    DepartmentCreate, DepartmentUpdate, DepartmentOut,
    YearCreate, YearUpdate, YearOut,
    SectionCreate, SectionUpdate, SectionOut,
)
from app.utils.password import hash_password


# ── HODs ─────────────────────────────────────────────────────────────────────

def list_hods(db: Session) -> list[HODOut]:
    hods = db.query(HOD).all()
    return [
        HODOut(
            id=h.id,
            username=h.username,
            name=h.name,
            email=h.email,
            department_id=h.department_id,
            department_name=h.department.name if h.department else None,
        )
        for h in hods
    ]


def create_hod(db: Session, data: HODCreate) -> HODOut:
    hod = HOD(
        username=data.username,
        hashed_password=hash_password(data.password),
        name=data.name,
        email=data.email,
        department_id=data.department_id,
    )
    db.add(hod)
    db.commit()
    db.refresh(hod)
    return HODOut(
        id=hod.id,
        username=hod.username,
        name=hod.name,
        email=hod.email,
        department_id=hod.department_id,
        department_name=hod.department.name if hod.department else None,
    )


def update_hod(db: Session, hod_id: int, data: HODUpdate) -> HODOut | None:
    hod = db.query(HOD).filter(HOD.id == hod_id).first()
    if not hod:
        return None
    if data.username is not None:
        hod.username = data.username
    if data.password is not None:
        hod.hashed_password = hash_password(data.password)
    if data.name is not None:
        hod.name = data.name
    if data.email is not None:
        hod.email = data.email
    if data.department_id is not None:
        hod.department_id = data.department_id
    db.commit()
    db.refresh(hod)
    return HODOut(
        id=hod.id,
        username=hod.username,
        name=hod.name,
        email=hod.email,
        department_id=hod.department_id,
        department_name=hod.department.name if hod.department else None,
    )


def delete_hod(db: Session, hod_id: int) -> bool:
    hod = db.query(HOD).filter(HOD.id == hod_id).first()
    if not hod:
        return False
    db.delete(hod)
    db.commit()
    return True


# ── Departments ───────────────────────────────────────────────────────────────

def list_departments(db: Session) -> list[DepartmentOut]:
    return [DepartmentOut.model_validate(d) for d in db.query(Department).all()]


def create_department(db: Session, data: DepartmentCreate) -> DepartmentOut:
    dept = Department(name=data.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentOut.model_validate(dept)


def update_department(db: Session, dept_id: int, data: DepartmentUpdate) -> DepartmentOut | None:
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        return None
    dept.name = data.name
    db.commit()
    db.refresh(dept)
    return DepartmentOut.model_validate(dept)


def delete_department(db: Session, dept_id: int) -> bool:
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        return False
    db.delete(dept)
    db.commit()
    return True


# ── Years ─────────────────────────────────────────────────────────────────────

def list_years(db: Session, department_id: int | None = None) -> list[YearOut]:
    q = db.query(Year)
    if department_id:
        q = q.filter(Year.department_id == department_id)
    return [YearOut.model_validate(y) for y in q.all()]


def create_year(db: Session, data: YearCreate) -> YearOut:
    yr = Year(name=data.name, department_id=data.department_id)
    db.add(yr)
    db.commit()
    db.refresh(yr)
    return YearOut.model_validate(yr)


def update_year(db: Session, year_id: int, data: YearUpdate) -> YearOut | None:
    yr = db.query(Year).filter(Year.id == year_id).first()
    if not yr:
        return None
    if data.name is not None:
        yr.name = data.name
    if data.department_id is not None:
        yr.department_id = data.department_id
    db.commit()
    db.refresh(yr)
    return YearOut.model_validate(yr)


def delete_year(db: Session, year_id: int) -> bool:
    yr = db.query(Year).filter(Year.id == year_id).first()
    if not yr:
        return False
    db.delete(yr)
    db.commit()
    return True


# ── Sections ──────────────────────────────────────────────────────────────────

def list_sections(db: Session, year_id: int | None = None) -> list[SectionOut]:
    q = db.query(Section)
    if year_id:
        q = q.filter(Section.year_id == year_id)
    return [SectionOut.model_validate(s) for s in q.all()]


def create_section(db: Session, data: SectionCreate) -> SectionOut:
    sec = Section(name=data.name, year_id=data.year_id)
    db.add(sec)
    db.commit()
    db.refresh(sec)
    return SectionOut.model_validate(sec)


def update_section(db: Session, section_id: int, data: SectionUpdate) -> SectionOut | None:
    sec = db.query(Section).filter(Section.id == section_id).first()
    if not sec:
        return None
    if data.name is not None:
        sec.name = data.name
    if data.year_id is not None:
        sec.year_id = data.year_id
    db.commit()
    db.refresh(sec)
    return SectionOut.model_validate(sec)


def delete_section(db: Session, section_id: int) -> bool:
    sec = db.query(Section).filter(Section.id == section_id).first()
    if not sec:
        return False
    db.delete(sec)
    db.commit()
    return True

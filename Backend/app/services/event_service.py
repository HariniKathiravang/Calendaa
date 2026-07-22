from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate, EventOut
from app.models.section import Section
from app.models.year import Year
from app.models.department import Department


def _row_to_out(e: Event) -> EventOut:
    return EventOut(
        id=str(e.id),
        title=e.title,
        description=e.description,
        startDate=e.start_date,
        endDate=e.end_date,
        startTime=e.start_time,
        endTime=e.end_time,
        venue=e.venue,
        department=e.department,
        year=e.year,
        semester=e.semester,
        section=e.section_name,
        isLlm=bool(e.is_llm),
        category=e.category,
    )


def _resolve_section_id(db: Session, department: str, year: str, section: str) -> int | None:
    """Find or return None for the section FK."""
    dept = db.query(Department).filter(Department.name == department).first()
    if not dept:
        return None
    yr = db.query(Year).filter(Year.department_id == dept.id, Year.name == year).first()
    if not yr:
        return None
    sec = db.query(Section).filter(Section.year_id == yr.id, Section.name == section).first()
    if not sec:
        return None
    return sec.id


def list_events(
    db: Session,
    department: str | None = None,
    year: str | None = None,
    section: str | None = None,
    search: str | None = None,
    month: str | None = None,  # "YYYY-MM"
) -> list[EventOut]:
    q = db.query(Event)
    if department and department != "all":
        q = q.filter(or_(Event.department == department, Event.department == "all", Event.department == "All"))
    if year and year != "all":
        q = q.filter(or_(Event.year == year, Event.year == "all", Event.year == "All"))
    if section and section != "all":
        q = q.filter(or_(Event.section_name == section, Event.section_name == "all", Event.section_name == "All"))
    if month:
        q = q.filter(Event.start_date.startswith(month))
    if search:
        term = f"%{search.lower()}%"
        q = q.filter(
            or_(
                Event.title.ilike(term),
                Event.description.ilike(term),
                Event.venue.ilike(term),
            )
        )
    return [_row_to_out(e) for e in q.order_by(Event.start_date).all()]


def create_event(db: Session, data: EventCreate, user_payload: dict) -> EventOut:
    # HODs can only create events for their own department
    if user_payload.get("role") == "hod":
        if data.department != user_payload.get("department"):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs can only create events for their own department",
            )

    section_id = None
    if data.department.lower() != "all" and data.year.lower() != "all" and data.section.lower() != "all":
        section_id = _resolve_section_id(db, data.department, data.year, data.section)
        if section_id is None:
            # Create department/year/section on the fly if they don't exist
            # (fallback: use section_id=1 if none found — shouldn't happen after seeding)
            section_id = _get_or_create_section(db, data.department, data.year, data.section)

    event = Event(
        title=data.title,
        description=data.description,
        start_date=data.startDate,
        end_date=data.endDate,
        start_time=data.startTime,
        end_time=data.endTime,
        venue=data.venue,
        category=data.category,
        department=data.department,
        year=data.year,
        semester=data.semester,
        section_name=data.section,
        section_id=section_id,
        is_llm=1 if data.isLlm else 0,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _row_to_out(event)


def _get_or_create_section(db: Session, dept_name: str, year_name: str, section_name: str) -> int:
    """Lazily create the dept → year → section hierarchy if missing."""
    dept = db.query(Department).filter(Department.name == dept_name).first()
    if not dept:
        dept = Department(name=dept_name)
        db.add(dept)
        db.flush()

    yr = db.query(Year).filter(Year.department_id == dept.id, Year.name == year_name).first()
    if not yr:
        yr = Year(name=year_name, department_id=dept.id)
        db.add(yr)
        db.flush()

    sec = db.query(Section).filter(Section.year_id == yr.id, Section.name == section_name).first()
    if not sec:
        sec = Section(name=section_name, year_id=yr.id)
        db.add(sec)
        db.flush()

    return sec.id


def update_event(db: Session, event_id: int, data: EventUpdate, user_payload: dict) -> EventOut | None:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None

    # HODs can only edit events in their department
    if user_payload.get("role") == "hod":
        if event.department != user_payload.get("department"):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs can only edit events in their own department",
            )

    # If dept/year/section changed, update section_id
    if (data.department != event.department or data.year != event.year or data.section != event.section_name):
        section_id = _get_or_create_section(db, data.department, data.year, data.section)
        event.section_id = section_id

    event.title = data.title
    event.description = data.description
    event.start_date = data.startDate
    event.end_date = data.endDate
    event.start_time = data.startTime
    event.end_time = data.endTime
    event.venue = data.venue
    event.category = data.category
    event.department = data.department
    event.year = data.year
    event.semester = data.semester
    event.section_name = data.section
    event.is_llm = 1 if data.isLlm else 0

    db.commit()
    db.refresh(event)
    return _row_to_out(event)


def delete_event(db: Session, event_id: int, user_payload: dict) -> bool:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return False

    # HODs can only delete events in their department
    if user_payload.get("role") == "hod":
        if event.department != user_payload.get("department"):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs can only delete events in their own department",
            )

    db.delete(event)
    db.commit()
    return True


def bulk_create_events(db: Session, data_list: list[EventCreate], user_payload: dict) -> list[EventOut]:
    """Create multiple events in a single transaction. Admin only (enforced at route level)."""
    created = []
    for data in data_list:
        section_id = _resolve_section_id(db, data.department, data.year, data.section)
        if section_id is None:
            section_id = _get_or_create_section(db, data.department, data.year, data.section)

        event = Event(
            title=data.title,
            description=data.description,
            start_date=data.startDate,
            end_date=data.endDate,
            start_time=data.startTime,
            end_time=data.endTime,
            venue=data.venue,
            category=data.category,
            department=data.department,
            year=data.year,
            semester=data.semester,
            section_name=data.section,
            section_id=section_id,
            is_llm=1 if data.isLlm else 0,
        )
        db.add(event)
        created.append(event)

    db.commit()
    for ev in created:
        db.refresh(ev)
    return [_row_to_out(ev) for ev in created]

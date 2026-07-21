from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.event import EventCreate, EventUpdate, EventOut
from app.services import event_service
from app.auth.dependencies import require_admin_or_hod, require_admin, get_optional_user
from typing import Optional

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=list[EventOut])
def list_events(
    department: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    month: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Public — no auth required. Returns filtered list of events."""
    return event_service.list_events(db, department, year, section, search, month)


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    body: EventCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin_or_hod),
):
    return event_service.create_event(db, body, payload)


@router.post("/bulk", response_model=list[EventOut], status_code=status.HTTP_201_CREATED)
def bulk_create_events(
    body: list[EventCreate],
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    """Admin only — bulk import events from LLM JSON output."""
    if not body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event list is empty")
    return event_service.bulk_create_events(db, body, payload)


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    body: EventUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin_or_hod),
):
    result = event_service.update_event(db, event_id, body, payload)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return result


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin_or_hod),
):
    deleted = event_service.delete_event(db, event_id, payload)
    if not deleted:
        raise HTTPException(status_code=404, detail="Event not found")


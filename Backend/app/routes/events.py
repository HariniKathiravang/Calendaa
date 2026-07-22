from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
import json
import ollama
from app.services.pdf_service import extract_text_from_pdf_bytes
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

@router.post("/extract-from-pdf", response_model=list[EventCreate])
async def extract_events_from_pdf(
    file: UploadFile = File(...),
    payload: dict = Depends(require_admin),
):
    """Admin only — extract text from PDF and generate events using LLM. Does NOT save to DB."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    pdf_bytes = await file.read()
    try:
        raw_text = extract_text_from_pdf_bytes(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text from PDF: {str(e)}")
        
    prompt = f"""
You are an AI document parser.

Your task is to convert OCR extracted text from an academic circular or schedule
into a clean structured JSON array of events.

IMPORTANT RULES:
1. Return ONLY valid JSON array containing event objects.
2. Do not add explanations.
3. Do not add markdown or ```json wrappers.
4. If a field is missing or unknown, provide a sensible default (e.g. empty string or "all" for department).
5. The output MUST be a JSON array `[...]` where each item matches the EXPECTED FORMAT exactly.
6. If the text mentions 'UG' (Undergraduate) or 'PG' (Postgraduate), put that in the `department` field if a specific department isn't mentioned.
7. Leave `startTime` and `endTime` empty (as `""`) if a specific time is not mentioned. Do not invent times.
8. Set `isLlm` to `true` for all extracted events.

EXPECTED EVENT FORMAT (JSON Object):
{{
    "title": "String (concise name of the event)",
    "description": "String (brief summary, prerequisites, or key details)",
    "startDate": "String (YYYY-MM-DD)",
    "endDate": "String (YYYY-MM-DD, or null if it's a single day)",
    "startTime": "String (HH:mm, 24-hour format, or empty string '' if unknown)",
    "endTime": "String (HH:mm, 24-hour format, or empty string '' if unknown)",
    "venue": "String (Location, room, or link)",
    "department": "String (The department it applies to, e.g. CSE, IT, UG, PG, or 'all')",
    "year": "String (e.g. '1', '2', '3', '4', or 'all')",
    "semester": "String (e.g. '1', '2', '3', etc., or null if unknown)",
    "section": "String (e.g. 'A', 'B', or 'all')",
    "category": "String (Must be one of: lecture, exam, event, holiday, meeting, workshop)",
    "isLlm": true
}}

OCR TEXT:
{raw_text}
"""
    try:
        response = ollama.chat(
            model="gpt-oss:120b-cloud",
            messages=[{"role": "user", "content": prompt}]
        )
        
        result = response["message"]["content"]
        result = result.replace("```json", "").replace("```", "").strip()
        
        parsed_events = json.loads(result)
        if not isinstance(parsed_events, list):
            parsed_events = [parsed_events]
            
        return parsed_events
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON returned by LLM.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {str(e)}")

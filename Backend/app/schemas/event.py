from pydantic import BaseModel
from typing import Literal

EventCategory = Literal["lecture", "exam", "event", "holiday", "meeting", "workshop"]


class EventCreate(BaseModel):
    title: str
    description: str = ""
    date: str            # "YYYY-MM-DD"
    startTime: str       # "HH:mm"  — camelCase to match frontend
    endTime: str         # "HH:mm"
    venue: str = ""
    department: str
    year: str
    section: str
    category: EventCategory = "event"


class EventUpdate(EventCreate):
    pass


class EventOut(BaseModel):
    id: str              # returned as string to match frontend ("e1", "e2" → now just "1", "2" as str)
    title: str
    description: str
    date: str
    startTime: str
    endTime: str
    venue: str
    department: str
    year: str
    section: str
    category: str

    model_config = {"from_attributes": True}

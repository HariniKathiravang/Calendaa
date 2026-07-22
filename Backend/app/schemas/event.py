from pydantic import BaseModel
from typing import Literal

EventCategory = Literal["lecture", "exam", "event", "holiday", "meeting", "workshop"]


class EventCreate(BaseModel):
    title: str
    description: str = ""
    startDate: str       # "YYYY-MM-DD"
    endDate: str | None = None
    startTime: str = ""  # "HH:mm"
    endTime: str = ""    # "HH:mm"
    venue: str = ""
    department: str
    year: str
    semester: str | None = None
    section: str
    isLlm: bool = False
    category: EventCategory = "event"


class EventUpdate(EventCreate):
    pass


class EventOut(BaseModel):
    id: str              # returned as string to match frontend ("e1", "e2" → now just "1", "2" as str)
    title: str
    description: str
    startDate: str
    endDate: str | None = None
    startTime: str
    endTime: str
    venue: str
    department: str
    year: str
    semester: str | None = None
    section: str
    isLlm: bool
    category: str

    model_config = {"from_attributes": True}

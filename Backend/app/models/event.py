from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False, default="")
    date = Column(String(10), nullable=False)        # "YYYY-MM-DD"
    start_time = Column(String(5), nullable=False)   # "HH:mm"
    end_time = Column(String(5), nullable=False)     # "HH:mm"
    venue = Column(String(200), nullable=False, default="")
    category = Column(String(30), nullable=False, default="event")

    # Denormalized string fields for fast API response (matches frontend shape)
    department = Column(String(100), nullable=False)
    year = Column(String(10), nullable=False)
    section_name = Column(String(10), nullable=False)

    # FK to Section for structural integrity
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)

    # Relationship
    section = relationship("Section", back_populates="events")

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(10), nullable=False)  # "A", "B", "C"
    year_id = Column(Integer, ForeignKey("years.id"), nullable=False)

    # Relationships
    year = relationship("Year", back_populates="sections")
    events = relationship("Event", back_populates="section", cascade="all, delete-orphan")

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Year(Base):
    __tablename__ = "years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(10), nullable=False)  # "I", "II", "III", "IV"
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    # Relationships
    department = relationship("Department", back_populates="years")
    sections = relationship("Section", back_populates="year", cascade="all, delete-orphan")

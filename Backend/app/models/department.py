from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)

    # Relationships
    hod = relationship("HOD", back_populates="department", uselist=False)
    years = relationship("Year", back_populates="department", cascade="all, delete-orphan")

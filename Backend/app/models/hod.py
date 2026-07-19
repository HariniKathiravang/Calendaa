from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class HOD(Base):
    __tablename__ = "hods"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    # Relationship
    department = relationship("Department", back_populates="hod")

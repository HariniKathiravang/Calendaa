from sqlalchemy import Column, Integer, String
from app.database.base import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)

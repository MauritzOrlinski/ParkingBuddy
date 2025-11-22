from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    saved_time = Column(Float, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Parking(Base):
    __tablename__ = "parking"

    id = Column(String, primary_key=True)
    address = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    parking_type = Column(String, nullable=False)

class HistoryEvent(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    parking_id = Column(String, nullable=False)
    saved_time = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

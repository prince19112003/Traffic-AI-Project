# ============================================================
# database.py
# ------------------------------------------------------------
# SQLite Layer for Persistence
# ============================================================

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

DB_URL = "sqlite:///./traffic_guard.db"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Violation(Base):
    __tablename__ = "violations"
    id = Column(Integer, primary_key=True, index=True)
    direction = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    snapshot_base64 = Column(Text, nullable=True) # Full frame for proof
    fine_amount = Column(Integer, default=500)

class AnalyticsRecord(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    north_count = Column(Integer)
    east_count = Column(Integer)
    south_count = Column(Integer)
    west_count = Column(Integer)
    total_vehicles = Column(Integer)
    weather_mode = Column(String)

class SystemConfig(Base):
    __tablename__ = "system_config"
    key = Column(String, primary_key=True)
    value = Column(JSON)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def log_violation(db_session, direction, snapshot=None):
    v = Violation(direction=direction, snapshot_base64=snapshot)
    db_session.add(v)
    db_session.commit()
    return v

def save_analytics(db_session, counts, weather):
    record = AnalyticsRecord(
        north_count=counts.get('north', 0),
        east_count=counts.get('east', 0),
        south_count=counts.get('south', 0),
        west_count=counts.get('west', 0),
        total_vehicles=sum([v for k,v in counts.items() if k in ['north','east','south','west']]),
        weather_mode=weather
    )
    db_session.add(record)
    db_session.commit()

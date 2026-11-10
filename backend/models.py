import json
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class TeacherModel(Base):
    __tablename__ = "teachers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    rank = Column(Integer, nullable=False) # 1 = Prof, 2 = Assoc, 3 = Asst, 4 = Lecturer, 5 = Ext
    department = Column(String, nullable=False)
    initials = Column(String, nullable=False)
    email = Column(String, nullable=True)
    is_external = Column(Boolean, default=False)

class RoomModel(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)
    building = Column(String, nullable=False)
    floor = Column(String, nullable=False)
    room_type = Column(String, nullable=False) # classroom, inhouse_lab, external_lab
    capacity = Column(Integer, default=60)

class CourseModel(Base):
    __tablename__ = "courses"

    code = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    credit = Column(Float, nullable=False)
    type = Column(String, nullable=False) # theory, sessional
    contact_hours = Column(Float, nullable=False)
    default_lab_id = Column(String, nullable=True)

class BatchModel(Base):
    __tablename__ = "batches"

    id = Column(String, primary_key=True, index=True) # e.g. "2025", "2024"
    level = Column(Integer, nullable=False)
    term = Column(String, nullable=False) # "Term-I", "Term-II"
    academic_year = Column(String, nullable=False)
    coordinator_name = Column(String, nullable=False)
    default_room_a = Column(String, nullable=False)
    default_room_b = Column(String, nullable=False)
    commencement_date = Column(String, nullable=False)
    mid_break_start = Column(String, nullable=False)
    mid_break_end = Column(String, nullable=False)
    end_of_classes = Column(String, nullable=False)
    
    # PL / DL Archival Fields
    is_archived = Column(Boolean, default=False) # True when PL / DL started
    pl_dl_date = Column(String, nullable=True) # The date PL / DL was initiated

class RoutineSlotModel(Base):
    __tablename__ = "routine_slots"

    id = Column(String, primary_key=True, index=True)
    batch_id = Column(String, ForeignKey("batches.id", ondelete="CASCADE"), index=True)
    section = Column(String, nullable=False) # 'A', 'B'
    sub_group = Column(String, default="ALL") # 'ALL', 'A1', 'A2', 'B1', 'B2'
    day = Column(String, nullable=False) # 'SUN', 'MON', 'TUE', 'WED', 'THU'
    period_start = Column(Integer, nullable=False) # 1..9
    period_span = Column(Integer, default=1) # 1 for theory, 3 for labs
    course_code = Column(String, nullable=False)
    teacher_ids_json = Column(Text, default="[]") # JSON list of string teacher IDs
    room_id = Column(String, nullable=False)
    is_ct = Column(Boolean, default=False)
    note = Column(String, nullable=True)

class FacultyPreferenceModel(Base):
    __tablename__ = "faculty_preferences"

    id = Column(String, primary_key=True, index=True)
    batch_id = Column(String, ForeignKey("batches.id", ondelete="CASCADE"), index=True)
    teacher_id = Column(String, ForeignKey("teachers.id", ondelete="CASCADE"), index=True)
    preferred_days_json = Column(Text, default='["SUN","MON","TUE","WED","THU"]')
    preferred_time_of_day = Column(String, default="any") # 'morning', 'midday', 'afternoon', 'any'
    max_classes_per_day = Column(Integer, default=2)
    notes = Column(String, nullable=True)

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'admin', 'coordinator'
    name = Column(String, nullable=False)
    teacher_id = Column(String, nullable=True)
    assigned_batch_id = Column(String, nullable=True)


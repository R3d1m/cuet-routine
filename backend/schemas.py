from typing import List, Optional
from pydantic import BaseModel

class TeacherSchema(BaseModel):
    id: str = ""
    name: str
    designation: str
    rank: int
    department: str
    initials: str
    email: Optional[str] = None
    is_external: Optional[bool] = False

    class Config:
        from_attributes = True

class RoomSchema(BaseModel):
    id: str
    name: str
    short_name: str
    building: str
    floor: str
    room_type: str
    capacity: int = 60

    class Config:
        from_attributes = True

class CourseSchema(BaseModel):
    code: str
    title: str
    credit: float
    type: str
    contact_hours: float
    default_lab_id: Optional[str] = None

    class Config:
        from_attributes = True

class BatchSchema(BaseModel):
    id: str
    level: int
    term: str
    academic_year: str
    coordinator_name: str
    default_room_a: str
    default_room_b: str
    commencement_date: str
    mid_break_start: str
    mid_break_end: str
    end_of_classes: str
    is_archived: bool = False
    pl_dl_date: Optional[str] = None

    class Config:
        from_attributes = True

class StartPlDlRequest(BaseModel):
    pl_dl_date: str

class AppointCoordinatorRequest(BaseModel):
    batch_id: str
    teacher_id: str
    coordinator_name: str
    username: Optional[str] = None
    password: Optional[str] = None

class RoutineSlotSchema(BaseModel):
    id: str
    batch_id: str
    section: str
    sub_group: str = "ALL"
    day: str
    period_start: int
    period_span: int = 1
    course_code: str
    teacher_ids: List[str] = []
    room_id: str
    is_ct: bool = False
    note: Optional[str] = None

class FacultyPreferenceSchema(BaseModel):
    id: Optional[str] = None
    batch_id: str
    teacher_id: str
    preferred_days: List[str] = ["SUN", "MON", "TUE", "WED", "THU"]
    preferred_time_of_day: str = "any" # 'morning', 'midday', 'afternoon', 'any'
    max_classes_per_day: int = 2
    notes: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str # 'admin', 'coordinator'
    name: str
    teacher_id: Optional[str] = None
    assigned_batch_id: Optional[str] = None

    class Config:
        from_attributes = True

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str = "coordinator"
    name: str
    teacher_id: Optional[str] = None
    assigned_batch_id: Optional[str] = None


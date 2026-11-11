import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import get_db, Base, engine
from .models import TeacherModel, RoomModel, BatchModel, RoutineSlotModel, FacultyPreferenceModel, UserModel, CourseModel
from .schemas import (
    TeacherSchema, RoomSchema, CourseSchema, BatchSchema, StartPlDlRequest, AppointCoordinatorRequest,
    RoutineSlotSchema, FacultyPreferenceSchema, LoginRequest, UserResponse, CreateUserRequest
)
from .seed import init_and_seed_db

app = FastAPI(title="CUET CSE Routine Management API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_and_seed_db()

@app.get("/")
def root():
    return {"message": "CUET CSE Routine Management API running with NeonDB/PostgreSQL support."}

# --- TEACHERS ENDPOINTS ---
@app.get("/api/teachers", response_model=List[TeacherSchema])
def list_teachers(db: Session = Depends(get_db)):
    return db.query(TeacherModel).order_by(TeacherModel.rank.asc()).all()

@app.post("/api/teachers", response_model=TeacherSchema)
def create_teacher(teacher: TeacherSchema, db: Session = Depends(get_db)):
    import uuid
    clean_initials = (teacher.initials or "").strip().upper()
    teacher_id = teacher.id
    if not teacher_id:
        base_id = f"ext-{clean_initials.lower()}" if teacher.is_external else f"t-{clean_initials.lower()}"
        existing = db.query(TeacherModel).filter(TeacherModel.id == base_id).first()
        if existing:
            teacher_id = f"{base_id}-{uuid.uuid4().hex[:4]}"
        else:
            teacher_id = base_id

    db_teacher = TeacherModel(
        id=teacher_id,
        name=teacher.name.strip(),
        designation=teacher.designation.strip(),
        rank=teacher.rank,
        department=teacher.department.strip() or "Computer Science and Engineering",
        initials=clean_initials,
        email=teacher.email.strip() if teacher.email else None,
        is_external=bool(teacher.is_external)
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@app.delete("/api/teachers/{teacher_id}")
def delete_teacher(teacher_id: str, db: Session = Depends(get_db)):
    t = db.query(TeacherModel).filter(TeacherModel.id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(t)
    db.commit()
    return {"success": True}

# --- ROOMS ENDPOINTS ---
@app.get("/api/rooms", response_model=List[RoomSchema])
def list_rooms(db: Session = Depends(get_db)):
    return db.query(RoomModel).all()

# --- COURSES ENDPOINTS ---
@app.get("/api/courses", response_model=List[CourseSchema])
def list_courses(db: Session = Depends(get_db)):
    return db.query(CourseModel).all()

# --- BATCHES ENDPOINTS ---
@app.get("/api/batches", response_model=List[BatchSchema])
def list_batches(db: Session = Depends(get_db)):
    return db.query(BatchModel).all()

@app.get("/api/batches/{batch_id}", response_model=BatchSchema)
def get_batch(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(BatchModel).filter(BatchModel.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@app.post("/api/batches", response_model=BatchSchema)
def create_or_update_batch(batch_data: BatchSchema, db: Session = Depends(get_db)):
    batch = db.query(BatchModel).filter(BatchModel.id == batch_data.id).first()
    if not batch:
        batch = BatchModel(**batch_data.dict())
        db.add(batch)
    else:
        for key, val in batch_data.dict().items():
            setattr(batch, key, val)
    db.commit()
    db.refresh(batch)
    return batch

@app.post("/api/batches/{batch_id}/appoint-coordinator")
def appoint_coordinator(batch_id: str, req: AppointCoordinatorRequest, db: Session = Depends(get_db)):
    batch = db.query(BatchModel).filter(BatchModel.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    batch.coordinator_name = req.coordinator_name

    # 1. Unassign ANY previous user accounts associated with this batch
    prev_coords = db.query(UserModel).filter(
        UserModel.assigned_batch_id == batch_id,
        UserModel.teacher_id != req.teacher_id
    ).all()
    for prev in prev_coords:
        prev.assigned_batch_id = None

    assigned_user = None
    clean_user = req.username.strip().lower() if req.username else None
    clean_pass = req.password.strip() if req.password else None

    # Check if there is already an existing user for this teacher or with this username
    existing_by_username = db.query(UserModel).filter(UserModel.username == clean_user).first() if clean_user else None
    existing_by_teacher = db.query(UserModel).filter(UserModel.teacher_id == req.teacher_id).first()

    if existing_by_username:
        existing_by_username.assigned_batch_id = batch_id
        existing_by_username.teacher_id = req.teacher_id
        existing_by_username.name = req.coordinator_name
        if clean_pass:
            existing_by_username.password = clean_pass
        assigned_user = existing_by_username
    elif existing_by_teacher:
        existing_by_teacher.assigned_batch_id = batch_id
        existing_by_teacher.name = req.coordinator_name
        if clean_user:
            existing_by_teacher.username = clean_user
        if clean_pass:
            existing_by_teacher.password = clean_pass
        assigned_user = existing_by_teacher
    elif clean_user:
        # Create new user for coordinator
        new_user = UserModel(
            id=f"u-{clean_user}",
            username=clean_user,
            password=clean_pass if clean_pass else "cuet123",
            role="coordinator",
            name=req.coordinator_name,
            teacher_id=req.teacher_id,
            assigned_batch_id=batch_id
        )
        db.add(new_user)
        assigned_user = new_user
    else:
        # Auto-create username based on teacher initials
        t = db.query(TeacherModel).filter(TeacherModel.id == req.teacher_id).first()
        auto_username = t.initials.lower() if t and t.initials else f"coord_{batch_id}"
        new_user = UserModel(
            id=f"u-{auto_username}",
            username=auto_username,
            password=clean_pass if clean_pass else "cuet123",
            role="coordinator",
            name=req.coordinator_name,
            teacher_id=req.teacher_id,
            assigned_batch_id=batch_id
        )
        db.add(new_user)
        assigned_user = new_user

    db.commit()
    if assigned_user:
        db.refresh(assigned_user)

    return {
        "success": True,
        "batch_id": batch.id,
        "coordinator_name": batch.coordinator_name,
        "username": assigned_user.username if assigned_user else None
    }

# --- SINGLE BUTTON START PL / DL (PERMANENT ARCHIVE LOCK) ---
@app.post("/api/batches/{batch_id}/start-pl-dl")
def start_pl_dl(batch_id: str, req: StartPlDlRequest, db: Session = Depends(get_db)):
    batch = db.query(BatchModel).filter(BatchModel.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # 1. Mark batch as archived and save PL / DL Date
    batch.is_archived = True
    batch.pl_dl_date = req.pl_dl_date

    # 2. Free up all regular classrooms & labs for this batch
    # We clear the regular schedule and lock it
    db.commit()
    return {
        "success": True,
        "message": f"Batch {batch_id} has commenced PL / DL on {req.pl_dl_date}. All classrooms and labs are now freed. Routine is permanently archived and locked.",
        "is_archived": True,
        "pl_dl_date": req.pl_dl_date
    }

# --- ADVANCE BATCH TO NEXT SEMESTER (DEGREE PROGRESSION) ---
@app.post("/api/batches/{batch_id}/advance-semester")
def advance_semester(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(BatchModel).filter(BatchModel.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    curr_level = batch.level
    curr_term = batch.term

    # Determine next semester in 4-year degree
    if curr_term == "Term-I":
        batch.term = "Term-II"
    else:
        if curr_level < 4:
            batch.level = curr_level + 1
            batch.term = "Term-I"
        else:
            return {
                "success": True,
                "degree_completed": True,
                "message": f"Batch {batch_id} has completed all 4 years (Level-4 Term-II) of undergraduate study."
            }

    # Reset semester routine state for upcoming semester:
    # Classrooms and labs can now be scheduled for the new term, and routine editing is ready!
    batch.is_archived = False
    batch.pl_dl_date = None

    db.commit()
    db.refresh(batch)
    return {
        "success": True,
        "degree_completed": False,
        "batch": {
            "id": batch.id,
            "level": batch.level,
            "term": batch.term,
            "coordinator_name": batch.coordinator_name,
            "is_archived": batch.is_archived,
            "pl_dl_date": batch.pl_dl_date
        }
    }

# --- RE-OPEN CURRENT SEMESTER ROUTINE (CALENDAR EXTENSION / ADJUSTMENT) ---
@app.post("/api/batches/{batch_id}/reopen-semester")
def reopen_semester(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(BatchModel).filter(BatchModel.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    batch.is_archived = False
    batch.pl_dl_date = None
    db.commit()
    return {"success": True, "is_archived": False}

# --- ROUTINE SLOTS ENDPOINTS ---
@app.post("/api/routines/clear")
def clear_all_routines(db: Session = Depends(get_db)):
    deleted = db.query(RoutineSlotModel).delete()
    db.commit()
    return {"success": True, "deleted_count": deleted}

@app.get("/api/routines")
def get_all_routine_slots(db: Session = Depends(get_db)):
    slots = db.query(RoutineSlotModel).all()
    results = []
    for s in slots:
        results.append({
            "id": s.id,
            "batch_id": s.batch_id,
            "section": s.section,
            "sub_group": s.sub_group,
            "day": s.day,
            "period_start": s.period_start,
            "period_span": s.period_span,
            "course_code": s.course_code,
            "teacher_ids": json.loads(s.teacher_ids_json or "[]"),
            "room_id": s.room_id,
            "is_ct": s.is_ct,
            "note": s.note
        })
    return results

@app.get("/api/routines/{batch_id}")
def get_routine_slots(batch_id: str, db: Session = Depends(get_db)):
    slots = db.query(RoutineSlotModel).filter(RoutineSlotModel.batch_id == batch_id).all()
    results = []
    for s in slots:
        results.append({
            "id": s.id,
            "batch_id": s.batch_id,
            "section": s.section,
            "sub_group": s.sub_group,
            "day": s.day,
            "period_start": s.period_start,
            "period_span": s.period_span,
            "course_code": s.course_code,
            "teacher_ids": json.loads(s.teacher_ids_json or "[]"),
            "room_id": s.room_id,
            "is_ct": s.is_ct,
            "note": s.note
        })
    return results

@app.post("/api/routines/slots")
def save_routine_slot(
    slot_data: RoutineSlotSchema, 
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
    x_user_batch: Optional[str] = Header(None)
):
    # Check if batch is archived
    batch = db.query(BatchModel).filter(BatchModel.id == slot_data.batch_id).first()
    if batch and batch.is_archived:
        raise HTTPException(status_code=403, detail="Routine is locked and archived. Editing is not permitted.")

    # Strict isolation: coordinator cannot modify other batch's routine
    if x_user_role == "coordinator" and x_user_batch and x_user_batch != slot_data.batch_id:
        raise HTTPException(
            status_code=403, 
            detail=f"Access Denied: You are coordinator for Batch {x_user_batch}. You cannot modify Batch {slot_data.batch_id}."
        )

    slot = db.query(RoutineSlotModel).filter(RoutineSlotModel.id == slot_data.id).first()
    if not slot:
        slot = RoutineSlotModel(
            id=slot_data.id,
            batch_id=slot_data.batch_id,
            section=slot_data.section,
            sub_group=slot_data.sub_group,
            day=slot_data.day,
            period_start=slot_data.period_start,
            period_span=slot_data.period_span,
            course_code=slot_data.course_code,
            teacher_ids_json=json.dumps(slot_data.teacher_ids),
            room_id=slot_data.room_id,
            is_ct=slot_data.is_ct,
            note=slot_data.note
        )
        db.add(slot)
    else:
        slot.section = slot_data.section
        slot.sub_group = slot_data.sub_group
        slot.day = slot_data.day
        slot.period_start = slot_data.period_start
        slot.period_span = slot_data.period_span
        slot.course_code = slot_data.course_code
        slot.teacher_ids_json = json.dumps(slot_data.teacher_ids)
        slot.room_id = slot_data.room_id
        slot.is_ct = slot_data.is_ct
        slot.note = slot_data.note

    db.commit()
    return {"success": True, "id": slot.id}

@app.delete("/api/routines/slots/{slot_id}")
def delete_routine_slot(
    slot_id: str, 
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
    x_user_batch: Optional[str] = Header(None)
):
    slot = db.query(RoutineSlotModel).filter(RoutineSlotModel.id == slot_id).first()
    if slot:
        batch = db.query(BatchModel).filter(BatchModel.id == slot.batch_id).first()
        if batch and batch.is_archived:
            raise HTTPException(status_code=403, detail="Routine is locked and archived. Cannot delete slots.")

        if x_user_role == "coordinator" and x_user_batch and x_user_batch != slot.batch_id:
            raise HTTPException(
                status_code=403, 
                detail=f"Access Denied: You are coordinator for Batch {x_user_batch}. You cannot delete slots for Batch {slot.batch_id}."
            )
        db.delete(slot)
        db.commit()
    return {"success": True}

# --- FACULTY PREFERENCES ENDPOINTS ---
@app.get("/api/faculty-preferences/{batch_id}")
def get_faculty_preferences(batch_id: str, db: Session = Depends(get_db)):
    prefs = db.query(FacultyPreferenceModel).filter(FacultyPreferenceModel.batch_id == batch_id).all()
    results = []
    for p in prefs:
        results.append({
            "id": p.id,
            "batch_id": p.batch_id,
            "teacher_id": p.teacher_id,
            "preferred_days": json.loads(p.preferred_days_json or '["SUN","MON","TUE","WED","THU"]'),
            "preferred_time_of_day": p.preferred_time_of_day,
            "max_classes_per_day": p.max_classes_per_day,
            "notes": p.notes,
            "availability_slots": json.loads(getattr(p, 'availability_slots_json', None) or '[]')
        })
    return results

@app.post("/api/faculty-preferences/{batch_id}")
def save_faculty_preference(
    batch_id: str, 
    pref: FacultyPreferenceSchema, 
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
    x_user_batch: Optional[str] = Header(None)
):
    if x_user_role == "coordinator" and x_user_batch and x_user_batch != batch_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: You are coordinator for Batch {x_user_batch}. You cannot modify preferences for Batch {batch_id}."
        )

    existing = db.query(FacultyPreferenceModel).filter(
        FacultyPreferenceModel.batch_id == batch_id,
        FacultyPreferenceModel.teacher_id == pref.teacher_id
    ).first()

    if existing:
        existing.preferred_days_json = json.dumps(pref.preferred_days)
        existing.preferred_time_of_day = pref.preferred_time_of_day
        existing.max_classes_per_day = pref.max_classes_per_day
        existing.notes = pref.notes
        existing.availability_slots_json = json.dumps(pref.availability_slots)
    else:
        new_pref = FacultyPreferenceModel(
            id=pref.id or f"pref-{batch_id}-{pref.teacher_id}",
            batch_id=batch_id,
            teacher_id=pref.teacher_id,
            preferred_days_json=json.dumps(pref.preferred_days),
            preferred_time_of_day=pref.preferred_time_of_day,
            max_classes_per_day=pref.max_classes_per_day,
            notes=pref.notes,
            availability_slots_json=json.dumps(pref.availability_slots)
        )
        db.add(new_pref)

    db.commit()
    return {"success": True}

# --- AUTHENTICATION & USER MANAGEMENT ENDPOINTS ---
@app.post("/api/auth/login", response_model=UserResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.username == req.username.strip().lower()).first()
    if not user or user.password != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return user

@app.get("/api/auth/users", response_model=List[UserResponse])
def list_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(UserModel)
    if role:
        query = query.filter(UserModel.role == role)
    return query.all()

@app.post("/api/auth/create-user", response_model=UserResponse)
def create_user(req: CreateUserRequest, db: Session = Depends(get_db)):
    clean_username = req.username.strip().lower()
    existing = db.query(UserModel).filter(UserModel.username == clean_username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = UserModel(
        id=f"u-{clean_username}",
        username=clean_username,
        password=req.password,
        role=req.role,
        name=req.name,
        teacher_id=req.teacher_id,
        assigned_batch_id=req.assigned_batch_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.delete("/api/auth/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete the master admin account")
    db.delete(user)
    db.commit()
    return {"success": True}


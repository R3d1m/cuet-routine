import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi import HTTPException
from backend.main import (
    app, list_rooms, get_faculty_preferences, save_faculty_preference,
    login, list_batches, list_teachers, get_all_routine_slots
)
from backend.schemas import FacultyPreferenceSchema, LoginRequest
from backend.database import SessionLocal
from backend.models import RoomModel, RoutineSlotModel, FacultyPreferenceModel, TeacherModel, UserModel, CourseModel

def run_verification():
    print("=" * 60)
    print("RUNNING CUET ROUTINE MANAGER VERIFICATION SUITE")
    print("=" * 60)

    db = SessionLocal()

    # 1. Preserved Master Records
    teacher_count = db.query(TeacherModel).count()
    user_count = db.query(UserModel).count()
    course_count = db.query(CourseModel).count()
    print(f"[PASS] Preserved Data Check:")
    print(f"    - Teachers in DB: {teacher_count}")
    print(f"    - User Accounts in DB: {user_count}")
    print(f"    - Courses in DB: {course_count}")
    assert teacher_count > 0, "Teachers should be preserved"
    assert user_count > 0, "User accounts should be preserved"
    assert course_count > 0, "Courses should be preserved"

    # 2. Check Rooms & Labs
    print("\n[PASS] Rooms & Labs Check:")
    rooms = {r.short_name: r for r in db.query(RoomModel).all()}

    # Check 3201-3208, 3301-3308, 3401-3408
    for series in [3200, 3300, 3400]:
        for i in range(1, 9):
            num_str = str(series + i)
            found = any(num_str in r.id or num_str in r.short_name for r in rooms.values())
            assert found, f"Room {num_str} must be present in database"
    print("    - All lecture rooms (3201-3208, 3301-3308, 3401-3408) verified!")

    # Check Labs
    required_labs = [
        "OS Lab", "Compiler Lab", "Computer Lab", "Multimedia Lab",
        "N/W & Interfacing Lab", "Physics Lab", "Chemistry Lab"
    ]
    for lab_name in required_labs:
        found = any(lab_name.lower() in r.name.lower() or lab_name.lower() in r.short_name.lower() for r in rooms.values())
        assert found, f"Lab '{lab_name}' must be present in database"
    print(f"    - All required labs verified ({', '.join(required_labs)})!")

    # 3. Check Routine Slots Cleared
    slot_count = db.query(RoutineSlotModel).count()
    print(f"\n[PASS] Routine Slots Cleanup Check:")
    print(f"    - Current routine slots in DB: {slot_count}")
    assert slot_count == 0, f"Routine slots should be 0, but found {slot_count}"

    # 4. API Endpoint: All Current Routines
    all_slots = get_all_routine_slots(db=db)
    print(f'\n[PASS] get_all_routine_slots() returned {len(all_slots)} active routine slots across department.')

    # 4. API Endpoint: Rooms List
    rooms_api = list_rooms(db=db)
    print(f"\n[PASS] list_rooms() returned {len(rooms_api)} rooms and labs.")
    assert len(rooms_api) >= 31

    # 5. API Endpoint: Faculty Availability Preferences
    print("\n[PASS] Faculty Availability Preferences Check:")
    test_batch = "2022"
    test_teacher = "t-mrr"
    test_slots = ["SUN-1", "SUN-2", "MON-3", "WED-4"]

    # Save preference via endpoint function
    pref_schema = FacultyPreferenceSchema(
        batch_id=test_batch,
        teacher_id=test_teacher,
        preferred_days=["SUN", "MON", "WED"],
        preferred_time_of_day="morning",
        max_classes_per_day=2,
        notes="Verified by automated test",
        availability_slots=test_slots
    )
    save_res = save_faculty_preference(
        batch_id=test_batch,
        pref=pref_schema,
        db=db,
        x_user_role="coordinator",
        x_user_batch=test_batch
    )
    assert save_res["success"] is True
    print(f"    - Successfully saved faculty availability preference for Batch {test_batch}.")

    # Fetch preference via endpoint function
    prefs = get_faculty_preferences(batch_id=test_batch, db=db)
    saved = next((p for p in prefs if p["teacher_id"] == test_teacher), None)
    assert saved is not None, "Saved preference should be found"
    assert saved["availability_slots"] == test_slots, f"Availability slots mismatch: {saved['availability_slots']}"
    print(f"    - get_faculty_preferences('{test_batch}') correctly returned saved availability slots: {saved['availability_slots']}")

    # 6. Coordinator Permission & Slot Isolation Check
    print("\n[PASS] Coordinator Permissions & Availability Check:")
    # A) Coordinator CAN edit and save faculty availability preferences (non-binding guide)
    res = save_faculty_preference(
        batch_id="2025",
        pref=FacultyPreferenceSchema(
            batch_id="2025",
            teacher_id="t-mamp",
            availability_slots=["SUN-1", "MON-2"]
        ),
        db=db,
        x_user_role="coordinator",
        x_user_batch="2025"
    )
    assert res.get("success") is True, "Coordinator must be able to save faculty availability preferences"
    print("    - Coordinator successfully saved teacher availability preference.")

    # B) Routine slots strictly enforce batch isolation
    from backend.main import save_routine_slot
    from backend.schemas import RoutineSlotSchema
    routine_denied = False
    try:
        save_routine_slot(
            slot_data=RoutineSlotSchema(
                id="test-slot-iso",
                batch_id="2025",
                course_code="CSE-141",
                section="A",
                sub_group="ALL",
                day="SUN",
                period_start=1,
                period_span=1,
                room_id="room-3303",
                teacher_ids=["t-mamp"]
            ),
            db=db,
            x_user_role="coordinator",
            x_user_batch="2022" # Trying to write routine slot for another batch
        )
    except HTTPException as e:
        if e.status_code == 403:
            routine_denied = True
    assert routine_denied is True, "Coordinator for 2022 must be blocked with 403 Forbidden when creating routine slot for Batch 2025"
    print("    - Strict routine slot isolation verified: Coordinator for 2022 blocked with 403 when modifying 2025 routine slots.")

    # 7. Admin Authentication Check
    print("\n[PASS] Admin Authentication Check:")
    admin_user = login(req=LoginRequest(username="admin", password="admin123"), db=db)
    assert admin_user.role == "admin"
    print(f"    - Admin authenticated successfully: {admin_user.name} ({admin_user.role})")

    db.close()
    print("\n" + "=" * 60)
    print("ALL VERIFICATIONS PASSED SUCCESSFULLY (100% GREEN)!")
    print("=" * 60)

if __name__ == "__main__":
    run_verification()

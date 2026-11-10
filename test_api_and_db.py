import os
import sys
from backend.database import engine, SessionLocal
from backend.models import UserModel, BatchModel, TeacherModel, RoomModel, RoutineSlotModel
from backend.schemas import (
    LoginRequest, CreateUserRequest, RoutineSlotSchema
)
from backend.main import (
    login, list_users, create_user, delete_user,
    list_teachers, list_rooms, list_batches,
    save_routine_slot, delete_routine_slot
)
from fastapi import HTTPException
from sqlalchemy import inspect

def run_tests():
    print("==================================================")
    print("CUET ROUTINE MANAGER: DATABASE & API VERIFICATION")
    print("==================================================")

    # 1. DATABASE SCHEMA & CONNECTION CHECK
    print("\n[TEST 1] Testing Database Connection and Schema...")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"-> Connected to Database. Driver: {engine.url.drivername}")
    print(f"-> Tables found in DB: {tables}")
    
    expected_tables = ['users', 'teachers', 'rooms', 'batches', 'routine_slots', 'faculty_preferences']
    for t in expected_tables:
        assert t in tables, f"Missing expected table: {t}"
    print("-> [PASS] All 6 tables verified in database.")

    db = SessionLocal()

    try:
        # 2. AUTHENTICATION & LOGIN
        print("\n[TEST 2] Testing Authentication & Credentials...")
        
        # Admin login
        admin_res = login(LoginRequest(username="admin", password="admin123"), db=db)
        assert admin_res.role == "admin"
        assert admin_res.username == "admin"
        print(f"-> [PASS] Admin login verified: {admin_res.name} (role: {admin_res.role})")

        # Coordinator login
        coord_res = login(LoginRequest(username="rashadur", password="cuet123"), db=db)
        assert coord_res.role == "coordinator"
        assert coord_res.assigned_batch_id == "2022"
        print(f"-> [PASS] Coordinator login verified: {coord_res.name} (batch: {coord_res.assigned_batch_id})")

        # Invalid password
        try:
            login(LoginRequest(username="admin", password="wrongpassword"), db=db)
            assert False, "Should have raised HTTPException 401"
        except HTTPException as e:
            assert e.status_code == 401
            print(f"-> [PASS] Invalid password correctly rejected with HTTP {e.status_code}: {e.detail}")

        # 3. ADMIN COORDINATOR ACCOUNT CREATION & REMOVAL
        print("\n[TEST 3] Testing Admin Coordinator Creation & Removal...")
        test_username = "test_coord_temp"
        # Remove if exists from earlier test
        old = db.query(UserModel).filter(UserModel.username == test_username).first()
        if old:
            db.delete(old)
            db.commit()

        new_user = create_user(CreateUserRequest(
            username=test_username,
            password="temp_password_123",
            role="coordinator",
            name="Dr. Test Coordinator",
            teacher_id="t-pkd",
            assigned_batch_id="2026"
        ), db=db)
        assert new_user.username == test_username
        assert new_user.assigned_batch_id == "2026"
        print(f"-> [PASS] Admin successfully created account: {new_user.username} for Batch {new_user.assigned_batch_id}")

        # Test login with newly created user
        test_user_res = login(LoginRequest(username=test_username, password="temp_password_123"), db=db)
        assert test_user_res.id == new_user.id
        print("-> [PASS] Newly created coordinator logged in successfully.")

        # Test duplicate username rejection
        try:
            create_user(CreateUserRequest(
                username=test_username,
                password="any",
                role="coordinator",
                name="Duplicate User"
            ), db=db)
            assert False, "Should have raised HTTPException 400"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"-> [PASS] Duplicate username correctly rejected with HTTP {e.status_code}: {e.detail}")

        # Delete test user
        del_res = delete_user(new_user.id, db=db)
        assert del_res["success"] is True
        print("-> [PASS] Admin successfully deleted test coordinator account.")

        # 4. MASTER DATA ENDPOINTS
        print("\n[TEST 4] Testing Master Data Retrieval...")
        teachers = list_teachers(db=db)
        assert len(teachers) >= 39
        print(f"-> [PASS] Teachers endpoint returned {len(teachers)} faculty records.")

        rooms = list_rooms(db=db)
        assert len(rooms) >= 14
        print(f"-> [PASS] Rooms endpoint returned {len(rooms)} rooms.")

        batches = list_batches(db=db)
        assert len(batches) >= 5
        print(f"-> [PASS] Batches endpoint returned {len(batches)} batches: {[b.id for b in batches]}.")

        # 5. STRICT COORDINATOR BATCH ISOLATION CHECK
        print("\n[TEST 5] Testing Strict Coordinator Modification Lockdown...")
        test_slot = RoutineSlotSchema(
            id="test-slot-auth-check",
            batch_id="2022",
            section="A",
            sub_group="ALL",
            day="SUN",
            period_start=1,
            period_span=1,
            course_code="CSE-351",
            teacher_ids=["t-mrr"],
            room_id="room-3403",
            is_ct=False,
            note="Auth check test slot"
        )
        
        # Coordinator of Batch 2022 saving slot for Batch 2022 -> PERMITTED
        res_save = save_routine_slot(
            test_slot, db=db, x_user_role="coordinator", x_user_batch="2022"
        )
        assert res_save["success"] is True
        print("-> [PASS] Coordinator modifying their OWN batch (2022) is PERMITTED.")

        # Coordinator of Batch 2022 attempting to modify Batch 2025 -> STRICTLY 403 FORBIDDEN
        alien_slot = RoutineSlotSchema(
            id="test-alien-slot",
            batch_id="2025",
            section="A",
            sub_group="ALL",
            day="SUN",
            period_start=1,
            period_span=1,
            course_code="CSE-141",
            teacher_ids=["t-mamp"],
            room_id="room-3303",
            is_ct=False,
            note="Intrusion attempt"
        )
        try:
            save_routine_slot(
                alien_slot, db=db, x_user_role="coordinator", x_user_batch="2022"
            )
            assert False, "Should have raised HTTPException 403"
        except HTTPException as e:
            assert e.status_code == 403
            print(f"-> [PASS] Coordinator modifying ANOTHER batch (2025) is REJECTED with HTTP {e.status_code}: {e.detail}")

        # Coordinator attempting to delete slot of another batch -> 403 FORBIDDEN
        try:
            delete_routine_slot(
                "test-slot-auth-check", db=db, x_user_role="coordinator", x_user_batch="2025"
            )
            assert False, "Should have raised HTTPException 403"
        except HTTPException as e:
            assert e.status_code == 403
            print(f"-> [PASS] Coordinator deleting slot of ANOTHER batch is REJECTED with HTTP {e.status_code}: {e.detail}")

        # Clean up test slot
        delete_routine_slot("test-slot-auth-check", db=db, x_user_role="coordinator", x_user_batch="2022")
        print("-> [PASS] Cleaned up temporary slot.")

        print("\n==================================================")
        print("ALL API AND DATABASE CHECKS PASSED WITH 100% SUCCESS!")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()

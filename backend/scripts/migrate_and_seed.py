import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import text, inspect
from backend.database import engine, SessionLocal, Base
from backend.models import RoomModel, RoutineSlotModel, FacultyPreferenceModel

def run_migration_and_seed():
    Base.metadata.create_all(bind=engine)
    
    # 1. Add availability_slots_json to faculty_preferences if not present
    inspector = inspect(engine)
    cols = [c['name'] for c in inspector.get_columns('faculty_preferences')]
    if 'availability_slots_json' not in cols:
        print("Adding availability_slots_json column to faculty_preferences...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE faculty_preferences ADD COLUMN availability_slots_json TEXT DEFAULT '[]';"))
            conn.commit()
        print("Column added successfully.")
    else:
        print("Column availability_slots_json already exists.")

    # 2. Clear all routine slots
    db = SessionLocal()
    try:
        deleted_count = db.query(RoutineSlotModel).delete()
        db.commit()
        print(f"Cleared all routines. Deleted {deleted_count} slots.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing routines: {e}")

    # 3. Seed Rooms: 3201-3208, 3301-3308, 3401-3408, and Labs
    try:
        existing_rooms = {r.id: r for r in db.query(RoomModel).all()}

        # Define lecture rooms
        lecture_series = [
            ("320", 1, 8, "2nd Floor"),
            ("330", 1, 8, "3rd Floor"),
            ("340", 1, 8, "4th Floor"),
        ]

        added_rooms = 0
        for prefix, start_num, end_num, floor in lecture_series:
            for num in range(start_num, end_num + 1):
                room_num = f"{prefix}{num}"
                room_id = f"room-{room_num}"
                name = f"Room {room_num}"
                short_name = f"{room_num}"

                if room_id not in existing_rooms:
                    r = RoomModel(
                        id=room_id,
                        name=name,
                        short_name=short_name,
                        building="Academic Building-3",
                        floor=floor,
                        room_type="classroom",
                        capacity=65
                    )
                    db.add(r)
                    existing_rooms[room_id] = r
                    added_rooms += 1

        # Define labs
        labs_data = [
            ("lab-os", "OS Lab", "OS Lab", "Academic Building-3", "3rd Floor", "inhouse_lab", 40),
            ("lab-compiler", "Compiler Lab", "Compiler Lab", "Academic Building-3", "5th Floor", "inhouse_lab", 40),
            ("lab-comp", "Computer Lab", "Computer Lab", "Academic Building-3", "3rd Floor", "inhouse_lab", 40),
            ("lab-multimedia", "Multimedia Lab", "Multimedia Lab", "Academic Building-3", "5th Floor", "inhouse_lab", 40),
            ("lab-network-interfacing", "N/W & Interfacing Lab", "N/W & Interfacing Lab", "Academic Building-3", "5th Floor", "inhouse_lab", 40),
            ("lab-physics", "Physics Lab", "Physics Lab", "Science Building", "Ground Floor", "external_lab", 60),
            ("lab-chem", "Chemistry Lab", "Chemistry Lab", "Science Building", "1st Floor", "external_lab", 50),
        ]

        for lab_id, name, short_name, building, floor, room_type, cap in labs_data:
            if lab_id not in existing_rooms:
                lab = RoomModel(
                    id=lab_id,
                    name=name,
                    short_name=short_name,
                    building=building,
                    floor=floor,
                    room_type=room_type,
                    capacity=cap
                )
                db.add(lab)
                existing_rooms[lab_id] = lab
                added_rooms += 1
            else:
                # Update existing lab name if needed
                existing = existing_rooms[lab_id]
                existing.name = name
                existing.short_name = short_name

        db.commit()
        print(f"Room seeding complete. Added {added_rooms} new rooms/labs. Total rooms now: {db.query(RoomModel).count()}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding rooms: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration_and_seed()

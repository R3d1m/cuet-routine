import json
from .database import engine, SessionLocal, Base
from .models import TeacherModel, RoomModel, BatchModel, RoutineSlotModel, CourseModel, UserModel

def init_and_seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 0. Seed Users (Admin + Coordinators)
        if db.query(UserModel).count() == 0:
            print("Seeding initial user accounts (Admin + Coordinators)...")
            initial_users = [
                ("u-admin", "admin", "admin123", "admin", "Head of CSE Department", None, None),
                ("u-rashadur", "rashadur", "cuet123", "coordinator", "Md. Rashadur Rahman", "t-mrr", "2022"),
                ("u-mamun", "mamun", "cuet123", "coordinator", "Md. Al-Mamun Provath", "t-mamp", "2025"),
                ("u-rizvi", "rizvi", "cuet123", "coordinator", "Md. Atiqul Islam Rizvi", "t-mair", "2024"),
                ("u-murad", "murad", "cuet123", "coordinator", "Hasan Murad", "t-hm", "2023"),
                ("u-saki", "saki", "cuet123", "coordinator", "Mir. Md. Saki Kowsar", "t-msk", "2021"),
            ]
            for u in initial_users:
                db.add(UserModel(
                    id=u[0], username=u[1], password=u[2], role=u[3],
                    name=u[4], teacher_id=u[5], assigned_batch_id=u[6]
                ))
            db.commit()
            print("User accounts seeded successfully.")

        # Check if master records already seeded
        if db.query(TeacherModel).count() > 0:
            print("Master records (teachers, rooms, batches) already seeded.")
            return

        print("Seeding database with CUET CSE Department master records...")

        # 1. Teachers (All 39 official faculty + external instructors)
        teachers_data = [
            ("t-pkd", "Dr. Pranab Kumar Dhar", "Professor", 1, "CSE", "PKD", "pkdhar@cuet.ac.bd", False),
            ("t-mik", "Dr. Md. Ibrahim Khan", "Professor", 1, "CSE", "MIK", "mik@cuet.ac.bd", False),
            ("t-kd", "Prof. Dr. Kaushik Deb", "Professor", 1, "CSE", "KD", "debkaushik@cuet.ac.bd", False),
            ("t-mmh", "Dr. Mohammed Moshiul Hoque", "Professor", 1, "CSE", "MMH", "moshiul_240@cuet.ac.bd", False),
            ("t-msa", "Prof. Dr. Mohammad Shamsul Arefin", "Professor", 1, "CSE", "MSA", "sarefin@cuet.ac.bd", False),
            ("t-az", "Dr. Asaduzzaman", "Professor", 1, "CSE", "AZ", "asad@cuet.ac.bd", False),
            ("t-mmhaq", "Dr. Md. Mokammel Haque", "Professor", 1, "CSE", "MMHQ", "mokammel@cuet.ac.bd", False),
            ("t-ahmah", "Dr. A. H. M. Ashfak Habib", "Professor", 1, "CSE", "AHMAH", "ashfak@cuet.ac.bd", False),
            ("t-mhc", "Dr. Mahfuzulhoq Chowdhury", "Professor", 1, "CSE", "MHC", "mahfuz_chow@cuet.ac.bd", False),

            ("t-mkh", "Muhammad Kamal Hossen", "Associate Professor", 2, "CSE", "MKH", "kamal@cuet.ac.bd", False),
            ("t-mor", "Mohammad Obaidur Rahman", "Associate Professor", 2, "CSE", "MOR", "obaidur@cuet.ac.bd", False),
            ("t-muh", "Md. Monjur Ul Hasan, PhD", "Associate Professor", 2, "CSE", "MUH", "monjur@cuet.ac.bd", False),

            ("t-msk", "Mir. Md. Saki Kowsar", "Assistant Professor", 3, "CSE", "MSK", None, False),
            ("t-rbmm", "Rahma Bintey Mufiz Mukta", "Assistant Professor", 3, "CSE", "RBMM", None, False),
            ("t-tk", "Tahmina Khanam", "Assistant Professor", 3, "CSE", "TK", None, False),
            ("t-ss", "Shayla Sharmin", "Assistant Professor", 3, "CSE", "SS", None, False),
            ("t-acr", "Animesh Chandra Roy", "Assistant Professor", 3, "CSE", "ACR", None, False),
            ("t-sh", "Md. Sabir Hossain", "Assistant Professor", 3, "CSE", "MSH", None, False),
            ("t-msaf", "Md. Shafiul Alam Forhad", "Assistant Professor", 3, "CSE", "MSAF", None, False),
            ("t-sct", "Sharmistha Chanda Tista", "Assistant Professor", 3, "CSE", "SCT", None, False),
            ("t-mmh-asst", "Md. Mynul Hasan", "Assistant Professor", 3, "CSE", "MMH", None, False),
            ("t-ad", "Annesha Das", "Assistant Professor", 3, "CSE", "AD", None, False),
            ("t-adey", "Ashim Dey", "Assistant Professor", 3, "CSE", "ADEY", None, False),
            ("t-os", "Omar Sharif", "Assistant Professor", 3, "CSE", "OS", None, False),
            ("t-mbh", "Md. Billal Hossain", "Assistant Professor", 3, "CSE", "MBH", None, False),
            ("t-sa", "Sabiha Anan", "Assistant Professor", 3, "CSE", "SA", None, False),
            ("t-mair", "Md. Atiqul Islam Rizvi", "Assistant Professor", 3, "CSE", "MAIR", None, False),
            ("t-mrr", "Md. Rashadur Rahman", "Assistant Professor", 3, "CSE", "MRR", None, False),
            ("t-hm", "Hasan Murad", "Assistant Professor", 3, "CSE", "HM", None, False),
            ("t-ssakib", "Saadman Sakib", "Assistant Professor", 3, "CSE", "SSK", None, False),
            ("t-ssa", "Shuhena Salam Aonty", "Assistant Professor", 3, "CSE", "SSA", None, False),
            ("t-mamp", "Md. Al - Mamun Provath", "Assistant Professor", 3, "CSE", "MAMP", None, False),

            ("t-mf", "Maisha Fahmida", "Lecturer", 4, "CSE", "MF", None, False),
            ("t-aa", "Afroza Akter", "Lecturer", 4, "CSE", "AA", None, False),
            ("t-ams", "Atiya Masuda Siddika", "Lecturer", 4, "CSE", "AMS", None, False),
            ("t-ab", "Ayesha Banu", "Lecturer", 4, "CSE", "AB", None, False),
            ("t-ah", "Abir Hassan", "Lecturer", 4, "CSE", "AH", None, False),
            ("t-mrh", "Md. Refaj Hossan", "Lecturer", 4, "CSE", "MRH", None, False),
            ("t-shs", "Symom Hossain Shohan", "Lecturer", 4, "CSE", "SHS", None, False),

            ("ext-mta", "Prof. Dr. Musammet Tahmina Akter", "Professor", 1, "Mathematics", "MTA", None, True),
            ("ext-nj", "Prof. Dr. Nusrat Jahan", "Professor", 1, "Physics", "NJ", None, True),
            ("ext-kh", "Prof. Dr. Kamrul Hassan", "Professor", 1, "Humanities", "KH", None, True),
            ("ext-ukd", "Prof. Dr. Ujjwal Kumar Deb", "Professor", 1, "Mathematics", "UKD", None, True),
            ("ext-maruf", "Prof. Dr. H. M. A. R. Maruf", "Professor", 1, "Physics", "HMARM", None, True),
            ("ext-mak", "Dr. Mohammad Abu Kauser", "Associate Professor", 2, "Mathematics", "MAK", None, True),
            ("ext-mamh", "Dr. Md. Abu Mowazzem Hossain", "Associate Professor", 2, "Mechanical", "MAMH", None, True),
            ("ext-nn", "Ms. Nurun Nahar", "Assistant Professor", 3, "Mathematics", "NN", None, True),
            ("ext-mnmn", "Mr. Md. Nadim Mahamud Nobin", "Lecturer", 4, "Physics", "MNMN", None, True),
            ("ext-rm", "Rigan Mazumder", "Assistant Professor", 3, "Humanities", "RM", None, True),
            ("ext-md", "Mrinmoy Dey", "Lecturer", 4, "EEE", "MD", None, True),
        ]

        for t in teachers_data:
            db.add(TeacherModel(
                id=t[0], name=t[1], designation=t[2], rank=t[3], department=t[4],
                initials=t[5], email=t[6], is_external=t[7]
            ))

        # 2. Rooms (Classrooms + Labs)
        rooms_data = [
            ("room-3303", "Room 3303 (Sec A)", "3303 (Sec A)", "Academic Building-3", "1st Floor", "classroom", 65),
            ("room-3307", "Room 3307 (Sec B)", "3307 (Sec B)", "Academic Building-3", "1st Floor", "classroom", 65),
            ("room-3306", "Room 3306 (Sec A)", "3306 (Sec A)", "Academic Building-3", "1st Floor", "classroom", 65),
            ("room-3308", "Room 3308 (Sec B)", "3308 (Sec B)", "Academic Building-3", "1st Floor", "classroom", 65),
            ("room-3406", "Room 3406 (Sec A)", "3406 (Sec A)", "Academic Building-3", "2nd Floor", "classroom", 65),
            ("room-3408", "Room 3408 (Sec B)", "3408 (Sec B)", "Academic Building-3", "2nd Floor", "classroom", 65),
            ("room-3403", "Room 3403 (Sec A)", "3403 (Sec A)", "Academic Building-3", "2nd Floor", "classroom", 65),
            ("room-3305", "Room 3305 (Sec B)", "3305 (Sec B)", "Academic Building-3", "1st Floor", "classroom", 65),

            ("lab-compiler", "Compiler Lab (5th Floor)", "Compiler Lab", "Academic Building-3", "5th Floor", "inhouse_lab", 40),
            ("lab-multimedia", "Multimedia Lab (5th Floor)", "Multimedia Lab", "Academic Building-3", "5th Floor", "inhouse_lab", 40),
            ("lab-network", "Network & Communication Lab (5th Floor)", "Network Lab", "Academic Building-3", "5th Floor", "inhouse_lab", 40),
            ("lab-mp", "Microprocessor & Interfacing Lab (5th Floor)", "Microprocessor Lab", "Academic Building-3", "5th Floor", "inhouse_lab", 40),
            ("lab-os", "Operating System Lab (3rd Floor)", "OS Lab", "Academic Building-3", "3rd Floor", "inhouse_lab", 40),
            ("lab-comp", "Computer Lab", "Computer Lab", "Academic Building-3", "3rd Floor", "inhouse_lab", 40),

            ("lab-physics", "Physics Lab (Dept. of Physics)", "Physics Lab", "Science Building", "Ground Floor", "external_lab", 60),
            ("lab-machine", "Machine Lab, Dept. of EEE (Ground Floor)", "EEE Machine Lab", "EEE Building", "Ground Floor", "external_lab", 50),
            ("lab-drawing", "Drawing Lab (Mechanical Dept.)", "ME Drawing Lab", "Mechanical Building", "2nd Floor", "external_lab", 60),
            ("lab-chem", "Chemistry Lab", "Chemistry Lab", "Science Building", "1st Floor", "external_lab", 50),
        ]

        for r in rooms_data:
            db.add(RoomModel(
                id=r[0], name=r[1], short_name=r[2], building=r[3], floor=r[4], room_type=r[5], capacity=r[6]
            ))

        # 3. Batches
        batches_data = [
            ("2025", 1, "Term-I", "2024-2025", "Md. Al-Mamun Provath", "room-3303", "room-3307", "2026-07-05", "2026-09-01", "2026-09-14", "2026-10-30", False, None),
            ("2024", 2, "Term-I", "2025-2026", "Md. Atiqul Islam Rizvi", "room-3306", "room-3308", "2026-08-11", "2026-10-01", "2026-10-15", "2026-11-20", False, None),
            ("2023", 2, "Term-II", "2024-2025", "Hasan Murad", "room-3406", "room-3408", "2025-04-20", "2025-06-15", "2025-06-30", "2025-08-15", False, None),
            ("2022", 3, "Term-II", "2025-2026", "Md. Rashadur Rahman", "room-3403", "room-3305", "2026-07-06", "2026-09-10", "2026-09-24", "2026-11-05", False, None),
            ("2021", 4, "Term-I", "2025-2026", "Mir. Md. Saki Kowsar", "room-3403", "room-3305", "2026-06-01", "2026-08-01", "2026-08-15", "2026-10-15", False, None)
        ]

        for b in batches_data:
            db.add(BatchModel(
                id=b[0], level=b[1], term=b[2], academic_year=b[3], coordinator_name=b[4],
                default_room_a=b[5], default_room_b=b[6], commencement_date=b[7],
                mid_break_start=b[8], mid_break_end=b[9], end_of_classes=b[10],
                is_archived=b[11], pl_dl_date=b[12]
            ))

        db.commit()
        print("Database seeded successfully with master records.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_and_seed_db()

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.database import SessionLocal
from backend.models import CourseModel

courses_data = [
    # L1T1
    ("CSE-141", "Structured Programming", 3.0, "theory", 3.0, None),
    ("EE-181", "Basic Electrical Engineering", 3.0, "theory", 3.0, None),
    ("Math-141", "Differential and Integral Calculus", 3.0, "theory", 3.0, None),
    ("Phy-141", "Physics", 3.0, "theory", 3.0, None),
    ("Hum-141", "English", 2.0, "theory", 2.0, None),
    ("CSE-100", "Computer Fundamentals and Ethics (Sessional)", 0.75, "sessional", 1.5, "lab-comp"),
    ("CSE-142", "Structured Programming (Sessional)", 1.5, "sessional", 3.0, "lab-compiler"),
    ("EE-182", "Basic Electrical Engineering (Sessional)", 1.5, "sessional", 3.0, "lab-mp"),
    ("Phy-142", "Physics (Sessional)", 1.5, "sessional", 3.0, "lab-physics"),
    # L1T2
    ("CSE-111", "Discrete Mathematics", 3.0, "theory", 3.0, None),
    ("CSE-143", "Object Oriented Programming", 3.0, "theory", 3.0, None),
    ("Math-143", "Co-ordinate Geometry and Differential Equation", 3.0, "theory", 3.0, None),
    ("EE-183", "Electronic Devices and Circuits", 4.0, "theory", 4.0, None),
    ("Chem-141", "Chemistry", 3.0, "theory", 3.0, None),
    ("CSE-144", "Object Oriented Programming (Sessional)", 1.5, "sessional", 3.0, "lab-compiler"),
    ("EE-184", "Electronic Devices and Circuits (Sessional)", 1.5, "sessional", 3.0, "lab-mp"),
    ("Chem-142", "Chemistry (Sessional)", 0.75, "sessional", 1.5, "lab-chem"),
    ("Hum-144", "English Skill Development (Sessional)", 1.5, "sessional", 3.0, "lab-comp"),
    # L2T1
    ("CSE-241", "Data Structures", 3.0, "theory", 3.0, None),
    ("CSE-221", "Digital Logic Design", 3.0, "theory", 3.0, None),
    ("CSE-231", "Applied Statistics", 3.0, "theory", 3.0, None),
    ("Math-241", "Fourier Analysis and Laplace Transformation", 3.0, "theory", 3.0, None),
    ("Hum-243", "Engineering Economics", 3.0, "theory", 3.0, None),
    ("CSE-242", "Data Structures (Sessional)", 1.5, "sessional", 3.0, "lab-compiler"),
    ("CSE-222", "Digital Logic Design (Sessional)", 1.5, "sessional", 3.0, "lab-network"),
    ("ME-246", "Engineering Drawing & CAD (Sessional)", 1.5, "sessional", 3.0, "lab-drawing"),
    ("CSE-200", "Competitive Programming (Sessional)", 0.75, "sessional", 1.5, "lab-os"),
    # L2T2
    ("CSE-223", "Digital Signal Processing", 3.0, "theory", 3.0, None),
    ("CSE-243", "Algorithms Design and Analysis", 3.0, "theory", 3.0, None),
    ("CSE-251", "Database Management Systems", 3.0, "theory", 3.0, None),
    ("EE-283", "Electrical Drives and Instrumentation", 3.0, "theory", 3.0, None),
    ("Math-243", "Vector Calculus, Linear Algebra and Complex Variables", 3.0, "theory", 3.0, None),
    ("CSE-224", "Digital Signal Processing (Sessional)", 0.75, "sessional", 1.5, "lab-compiler"),
    ("CSE-244", "Algorithms Design and Analysis (Sessional)", 1.5, "sessional", 3.0, "lab-os"),
    ("CSE-252", "Database Management Systems (Sessional)", 1.5, "sessional", 3.0, "lab-multimedia"),
    ("EE-284", "Electrical Drives and Instrumentation (Sessional)", 0.75, "sessional", 1.5, "lab-machine"),
    ("CSE-202", "Software Development with JAVA (Sessional)", 1.5, "sessional", 3.0, "room-3406"),
    # L3T1
    ("CSE-313", "Data Communication", 3.0, "theory", 3.0, None),
    ("CSE-331", "Theory of Computing", 2.0, "theory", 2.0, None),
    ("CSE-333", "Microprocessors and Interfacing", 3.0, "theory", 3.0, None),
    ("CSE-353", "System Analysis and Design", 3.0, "theory", 3.0, None),
    ("CSE-335", "Operating Systems", 3.0, "theory", 3.0, None),
    ("CSE-314", "Data Communication (Sessional)", 0.75, "sessional", 1.5, "lab-network"),
    ("CSE-334", "Microprocessors and Interfacing (Sessional)", 1.5, "sessional", 3.0, "lab-mp"),
    ("CSE-354", "System Analysis and Design (Sessional)", 0.75, "sessional", 1.5, "lab-compiler"),
    ("CSE-336", "Operating Systems (Sessional)", 1.5, "sessional", 3.0, "lab-os"),
    ("CSE-326", "Internet Programming (Sessional)", 1.5, "sessional", 3.0, "lab-multimedia"),
    # L3T2
    ("CSE-311", "Computer Networks", 3.0, "theory", 3.0, None),
    ("CSE-321", "Computer Architecture", 3.0, "theory", 3.0, None),
    ("CSE-355", "Software Engineering", 3.0, "theory", 3.0, None),
    ("CSE-345", "Artificial Intelligence", 3.0, "theory", 3.0, None),
    ("CSE-347", "Introduction to Mathematical Programming", 3.0, "theory", 3.0, None),
    ("CSE-312", "Computer Networks (Sessional)", 1.5, "sessional", 3.0, "lab-network"),
    ("CSE-356", "Software Engineering (Sessional)", 0.75, "sessional", 1.5, "lab-compiler"),
    ("CSE-346", "Artificial Intelligence with Python (Sessional)", 1.5, "sessional", 3.0, "lab-multimedia"),
    ("CSE-300", "Software Development Project (Sessional)", 0.75, "sessional", 1.5, "lab-os"),
    ("CSE-302", "Technical Writing and Presentation (Sessional)", 0.75, "sessional", 1.5, "room-3403"),
    # L4T1
    ("CSE-437", "Fundamentals of Internet of Things", 3.0, "theory", 3.0, None),
    ("CSE-435", "Information Security", 3.0, "theory", 3.0, None),
    ("CSE-445", "Machine Learning", 3.0, "theory", 3.0, None),
    ("CSE-436", "Information Security (Sessional)", 0.75, "sessional", 1.5, "lab-network"),
    ("CSE-438", "Fundamentals of Internet of Things (Sessional)", 0.75, "sessional", 1.5, "lab-mp"),
    ("CSE-446", "Machine Learning (Sessional)", 0.75, "sessional", 1.5, "lab-multimedia"),
    ("CSE-402", "Industrial Attachment (Sessional)", 1.5, "sessional", 3.0, "lab-comp"),
    # L4T2
    ("CSE-431", "Compiler Design", 3.0, "theory", 3.0, None),
    ("CSE-457", "Computer Graphics", 3.0, "theory", 3.0, None),
    ("Hum-445", "Engineering Management", 2.0, "theory", 2.0, None),
    ("Hum-447", "Financial, Cost and Managerial Accounting", 2.0, "theory", 2.0, None),
    ("CSE-432", "Compiler Design (Sessional)", 1.5, "sessional", 3.0, "lab-compiler"),
    ("CSE-458", "Computer Graphics (Sessional)", 0.75, "sessional", 1.5, "lab-multimedia"),
    ("CSE-400", "Project & Thesis", 3.0, "sessional", 6.0, "lab-os"),
]

def seed_courses():
    db = SessionLocal()
    try:
        added = 0
        for code, title, credit, ctype, chours, lab in courses_data:
            existing = db.query(CourseModel).filter(CourseModel.code == code).first()
            if not existing:
                c = CourseModel(
                    code=code,
                    title=title,
                    credit=credit,
                    type=ctype,
                    contact_hours=chours,
                    default_lab_id=lab
                )
                db.add(c)
                added += 1
        db.commit()
        print(f"Courses seeded: {added} new courses added. Total courses: {db.query(CourseModel).count()}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding courses: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_courses()

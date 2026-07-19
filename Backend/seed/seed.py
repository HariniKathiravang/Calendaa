"""
Seed script — run once to populate the database with realistic data.
Usage (from Backend/ directory, inside venv):
    python seed/seed.py
"""
import sys
import os
from datetime import date, timedelta

# Make sure we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.admin import Admin
from app.models.hod import HOD
from app.models.department import Department
from app.models.year import Year
from app.models.section import Section
from app.models.event import Event
from app.utils.password import hash_password

# Create tables if they don't exist
# Import all models so SQLAlchemy picks them up
from app.models import Admin, HOD, Department, Year, Section, Event  # noqa
Base.metadata.create_all(bind=engine)

db = SessionLocal()


def clear_existing():
    """Wipe existing data for a clean re-seed."""
    db.query(Event).delete()
    db.query(Section).delete()
    db.query(Year).delete()
    db.query(HOD).delete()
    db.query(Department).delete()
    db.query(Admin).delete()
    db.commit()
    print("[OK] Cleared existing data")


def seed_admin():
    admin = Admin(
        username="admin",
        hashed_password=hash_password("1234"),
        name="Admin User",
        email="admin@calendaa.edu",
    )
    db.add(admin)
    db.commit()
    print("[OK] Admin seeded  (username: admin | password: 1234)")
    return admin


def seed_departments():
    depts = {}
    for name in ["CSE", "AIML", "ECE"]:
        dept = Department(name=name)
        db.add(dept)
        db.flush()
        depts[name] = dept
    db.commit()
    print(f"[OK] Departments seeded: {list(depts.keys())}")
    return depts


def seed_hods(depts):
    hod_data = [
        dict(username="hod_cse",  password="hod123", name="Dr. Claudin",   email="hod.cse@calendaa.edu",  dept="CSE"),
        dict(username="hod_aiml", password="hod123", name="Dr. Justin Das Y",    email="hod.aiml@calendaa.edu", dept="AIML"),
        dict(username="hod_ece",  password="hod123", name="Dr. Kavitha Suresh", email="hod.ece@calendaa.edu",  dept="ECE"),
    ]
    hods = {}
    for h in hod_data:
        hod = HOD(
            username=h["username"],
            hashed_password=hash_password(h["password"]),
            name=h["name"],
            email=h["email"],
            department_id=depts[h["dept"]].id,
        )
        db.add(hod)
        db.flush()
        hods[h["dept"]] = hod
    db.commit()
    print("[OK] HODs seeded  (password for all: hod123)")
    return hods


def seed_years_and_sections(depts):
    """Create I–IV years and A–B sections for each department."""
    year_names = ["I", "II", "III", "IV"]
    section_names = ["A", "B"]

    sections = {}  # key: (dept_name, year_name, section_name) → Section

    for dept_name, dept in depts.items():
        for yr_name in year_names:
            yr = Year(name=yr_name, department_id=dept.id)
            db.add(yr)
            db.flush()
            for sec_name in section_names:
                sec = Section(name=sec_name, year_id=yr.id)
                db.add(sec)
                db.flush()
                sections[(dept_name, yr_name, sec_name)] = sec

    db.commit()
    print("[OK] Years (I-IV) and Sections (A, B) seeded for all departments")
    return sections


def d(offset: int) -> str:
    """Return ISO date string relative to today's month start."""
    today = date.today()
    month_start = today.replace(day=1)
    return (month_start + timedelta(days=offset)).strftime("%Y-%m-%d")


def seed_events(sections):
    """Seed 36 realistic academic events."""
    def sec(dept, year, name):
        return sections[(dept, year, name)]

    events_data = [
        # ── CSE ─────────────────────────────────────────────────────────────
        dict(title="Data Structures & Algorithms", description="Graph traversal: BFS and DFS with complexity analysis.", date=d(1), startTime="09:00", endTime="10:30", venue="Room 204, Block A", dept="CSE", year="II", section="A", category="lecture"),
        dict(title="Internal Assessment I – DBMS", description="First internal assessment covering ER diagrams, normalization and SQL.", date=d(3), startTime="10:00", endTime="13:00", venue="Central Exam Hall", dept="CSE", year="III", section="A", category="exam"),
        dict(title="Operating Systems Lab", description="Shell scripting and process synchronization lab session.", date=d(4), startTime="14:00", endTime="17:00", venue="OS Lab, Block C", dept="CSE", year="II", section="B", category="lecture"),
        dict(title="Hackathon 2026 – Ideation Round", description="24-hour hackathon kick-off. Teams pitch problem statements to mentors.", date=d(7), startTime="09:00", endTime="18:00", venue="Innovation Hub", dept="CSE", year="III", section="A", category="event"),
        dict(title="Semester End Exam – Operating Systems", description="Final exam covering scheduling, memory management and file systems.", date=d(8), startTime="09:30", endTime="12:30", venue="Central Exam Hall", dept="CSE", year="II", section="A", category="exam"),
        dict(title="Guest Lecture: Cloud Architecture", description="Industry expert from AWS on designing scalable cloud-native systems.", date=d(10), startTime="14:00", endTime="16:00", venue="Auditorium 1", dept="CSE", year="IV", section="A", category="workshop"),
        dict(title="Final Year Project Review – Phase I", description="Capstone project progress evaluation by faculty review panel.", date=d(12), startTime="10:00", endTime="16:00", venue="Seminar Hall 1", dept="CSE", year="IV", section="B", category="event"),
        dict(title="Placement Training – Aptitude", description="Quantitative aptitude and logical reasoning session by T&P cell.", date=d(14), startTime="09:00", endTime="11:00", venue="Placement Hall", dept="CSE", year="IV", section="A", category="meeting"),
        dict(title="Machine Learning Fundamentals", description="Supervised learning: linear regression and gradient descent derivation.", date=d(16), startTime="11:00", endTime="12:30", venue="Room 301, Block B", dept="CSE", year="III", section="B", category="lecture"),
        dict(title="Web Technologies Lab", description="Building RESTful APIs with Node.js and Express. Practical session.", date=d(18), startTime="14:00", endTime="17:00", venue="Web Lab, Block D", dept="CSE", year="III", section="A", category="lecture"),
        dict(title="Internal Assessment II – CN", description="Computer Networks mid-term: TCP/IP stack, routing protocols.", date=d(20), startTime="10:00", endTime="13:00", venue="Exam Hall B", dept="CSE", year="III", section="B", category="exam"),
        dict(title="TechFest – Main Event", description="Annual technology festival: paper presentations, coding contests, robotics.", date=d(22), startTime="08:00", endTime="18:00", venue="Main Campus Grounds", dept="CSE", year="III", section="A", category="event"),

        # ── AIML ─────────────────────────────────────────────────────────────
        dict(title="Deep Learning with PyTorch", description="CNN architectures: AlexNet, VGG, ResNet — hands-on session.", date=d(2), startTime="10:00", endTime="12:00", venue="AI Lab 1, Block E", dept="AIML", year="III", section="A", category="lecture"),
        dict(title="Internal Assessment I – Python", description="Programming test covering NumPy, Pandas, and Matplotlib.", date=d(5), startTime="09:00", endTime="12:00", venue="CS Lab 2", dept="AIML", year="I", section="A", category="exam"),
        dict(title="NLP Workshop", description="Hands-on workshop on tokenization, embeddings, and transformer basics.", date=d(9), startTime="10:00", endTime="15:00", venue="AI Lab 2, Block E", dept="AIML", year="III", section="B", category="workshop"),
        dict(title="Symposium – Emerging AI Trends", description="Student paper presentations on GANs, diffusion models, and LLMs.", date=d(11), startTime="09:00", endTime="17:00", venue="Seminar Hall 2", dept="AIML", year="IV", section="A", category="event"),
        dict(title="Placement Training – DSA", description="Problem-solving session: arrays, trees, dynamic programming.", date=d(13), startTime="09:00", endTime="11:00", venue="Placement Hall", dept="AIML", year="IV", section="B", category="meeting"),
        dict(title="Computer Vision Lab", description="Object detection using YOLO: dataset preparation and model training.", date=d(15), startTime="14:00", endTime="17:00", venue="AI Lab 1, Block E", dept="AIML", year="III", section="A", category="lecture"),
        dict(title="Statistics for AI – Lecture", description="Probability distributions, hypothesis testing, and Bayesian inference.", date=d(17), startTime="11:00", endTime="12:30", venue="Room 205, Block A", dept="AIML", year="II", section="A", category="lecture"),
        dict(title="Project Review – AI Capstone", description="Panel review of final-year AI project prototypes.", date=d(21), startTime="10:00", endTime="15:00", venue="Seminar Hall 1", dept="AIML", year="IV", section="A", category="event"),
        dict(title="Guest Lecture: Responsible AI", description="Ethics in AI systems — bias, fairness, and accountability in ML.", date=d(24), startTime="14:00", endTime="16:00", venue="Auditorium 2", dept="AIML", year="III", section="B", category="workshop"),
        dict(title="Internal Assessment II – DL", description="Deep Learning exam: backpropagation, optimization, regularization.", date=d(26), startTime="09:00", endTime="12:00", venue="Exam Hall C", dept="AIML", year="III", section="A", category="exam"),

        # ── ECE ──────────────────────────────────────────────────────────────
        dict(title="Signals & Systems – Lecture", description="Fourier transform properties and applications in signal processing.", date=d(2), startTime="09:00", endTime="10:30", venue="Room 108, Block B", dept="ECE", year="II", section="A", category="lecture"),
        dict(title="Digital Electronics Lab", description="Sequential circuit design: flip-flops, counters, and state machines.", date=d(4), startTime="14:00", endTime="17:00", venue="Electronics Lab 1", dept="ECE", year="II", section="B", category="lecture"),
        dict(title="Internal Assessment I – VLSI", description="VLSI design exam: CMOS logic, layout rules, timing analysis.", date=d(6), startTime="10:00", endTime="13:00", venue="Exam Hall A", dept="ECE", year="IV", section="A", category="exam"),
        dict(title="Embedded Systems Workshop", description="Arduino-based IoT project workshop — sensors, actuators, protocols.", date=d(9), startTime="09:00", endTime="14:00", venue="Embedded Lab, Block F", dept="ECE", year="III", section="A", category="workshop"),
        dict(title="Communication Systems – Lecture", description="Modulation techniques: AM, FM, PM — bandwidth calculations.", date=d(11), startTime="11:00", endTime="12:30", venue="Room 210, Block B", dept="ECE", year="III", section="B", category="lecture"),
        dict(title="Internal Assessment II – Microprocessors", description="8085/8086 architecture, interrupts, and assembly language programming.", date=d(16), startTime="09:00", endTime="12:00", venue="Exam Hall B", dept="ECE", year="III", section="A", category="exam"),
        dict(title="Sports Day", description="Annual sports and athletics event. All departments participate.", date=d(19), startTime="08:00", endTime="17:00", venue="Sports Ground", dept="ECE", year="I", section="A", category="holiday"),
        dict(title="Guest Lecture: 5G & Beyond", description="Industry talk on next-gen wireless communication and mmWave technology.", date=d(21), startTime="14:00", endTime="16:00", venue="Auditorium 1", dept="ECE", year="IV", section="B", category="workshop"),
        dict(title="Cultural Fest – Crescendo", description="Annual cultural festival: music, dance, drama and art competitions.", date=d(23), startTime="09:00", endTime="20:00", venue="Open Air Theatre", dept="ECE", year="II", section="A", category="event"),
        dict(title="Placement Training – Technical Interview", description="Mock technical interviews focused on ECE core subjects.", date=d(25), startTime="09:00", endTime="13:00", venue="Placement Hall", dept="ECE", year="IV", section="A", category="meeting"),
        dict(title="VLSI Project Demo", description="Final-year VLSI design project demonstrations to industry panel.", date=d(27), startTime="10:00", endTime="15:00", venue="Seminar Hall 3", dept="ECE", year="IV", section="B", category="event"),
        dict(title="Power Electronics Lab", description="Inverter design and simulation lab using MATLAB/Simulink.", date=d(29), startTime="14:00", endTime="17:00", venue="Power Lab, Block G", dept="ECE", year="III", section="B", category="lecture"),
    ]

    for ev in events_data:
        section_obj = sections.get((ev["dept"], ev["year"], ev["section"]))
        if not section_obj:
            print(f"  [SKIP] No section found for {ev['dept']} Y{ev['year']} S{ev['section']} -- skipping")
            continue
        event = Event(
            title=ev["title"],
            description=ev["description"],
            date=ev["date"],
            start_time=ev["startTime"],
            end_time=ev["endTime"],
            venue=ev["venue"],
            category=ev["category"],
            department=ev["dept"],
            year=ev["year"],
            section_name=ev["section"],
            section_id=section_obj.id,
        )
        db.add(event)

    db.commit()
    print(f"[OK] {len(events_data)} events seeded across CSE, AIML, ECE")


def main():
    print("\n[*] Seeding Calendaa database...\n")
    clear_existing()
    seed_admin()
    depts = seed_departments()
    seed_hods(depts)
    sections = seed_years_and_sections(depts)
    seed_events(sections)
    db.close()
    print("\n[DONE] Seed complete! You can now start the backend and frontend.\n")
    print("   Admin login  ->  username: admin  |  password: 1234")
    print("   HOD logins   ->  username: hod_cse / hod_aiml / hod_ece  |  password: hod123\n")


if __name__ == "__main__":
    main()

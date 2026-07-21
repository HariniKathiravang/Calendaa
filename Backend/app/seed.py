from datetime import date, timedelta
import traceback
import sys
import os

from app.database.session import SessionLocal
from app.models.department import Department
from app.models.admin import Admin
from app.models.hod import HOD
from app.models.year import Year
from app.models.section import Section
from app.models.event import Event
from app.utils.password import hash_password


def d(offset: int) -> str:
    today = date.today()
    month_start = today.replace(day=1)
    return (month_start + timedelta(days=offset)).strftime("%Y-%m-%d")


# Try to read an optional editable seed config at ../seed/seed.py.
EXTERNAL_SEED_CONFIG = None
try:
    project_root = os.path.join(os.path.dirname(__file__), "..")
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    import seed as external_seed  # Backend/seed/seed.py
    EXTERNAL_SEED_CONFIG = getattr(external_seed, "SEED_CONFIG", None)
except Exception:
    EXTERNAL_SEED_CONFIG = None

# Default departments (can be overridden by SEED_CONFIG in Backend/seed/seed.py)
DEPARTMENTS = (
    EXTERNAL_SEED_CONFIG.get("departments")
    if EXTERNAL_SEED_CONFIG and "departments" in EXTERNAL_SEED_CONFIG
    else [
        "CSE",
        "AIML",
        "ECE",
        "AIDS",
        "EEE",
        "RA",
        "CSD",
        "MECH",
        "CIVIL",
        "CSBS",
        "BME",
        "IT",
        "MBA",
        "MCA",
        "CYBER",
    ]
)


def upsert_department(db, name: str):
    dept = db.query(Department).filter(Department.name == name).one_or_none()
    if dept:
        return dept
    dept = Department(name=name)
    db.add(dept)
    db.flush()
    return dept


def ensure_years_and_sections(db, dept):
    year_names = ["I", "II", "III", "IV"]
    section_names = ["A", "B"]
    for yname in year_names:
        yr = (
            db.query(Year)
            .filter(Year.department_id == dept.id)
            .filter(Year.name == yname)
            .one_or_none()
        )
        if not yr:
            yr = Year(name=yname, department_id=dept.id)
            db.add(yr)
            db.flush()
        for sname in section_names:
            sec = (
                db.query(Section)
                .filter(Section.year_id == yr.id)
                .filter(Section.name == sname)
                .one_or_none()
            )
            if not sec:
                sec = Section(name=sname, year_id=yr.id)
                db.add(sec)
                db.flush()


def upsert_admin(db, username: str, password: str, name: str, email: str):
    admin = db.query(Admin).filter(Admin.username == username).one_or_none()
    hashed = hash_password(password)
    if admin:
        admin.hashed_password = hashed
        admin.name = name
        admin.email = email
        db.add(admin)
        db.flush()
        return admin
    admin = Admin(username=username, hashed_password=hashed, name=name, email=email)
    db.add(admin)
    db.flush()
    return admin


def upsert_hod(db, username: str, password: str, name: str, email: str, dept_id: int):
    hod = db.query(HOD).filter(HOD.username == username).one_or_none()
    hashed = hash_password(password)
    if hod:
        hod.hashed_password = hashed
        hod.name = name
        hod.email = email
        hod.department_id = dept_id
        db.add(hod)
        db.flush()
        return hod
    hod = HOD(username=username, hashed_password=hashed, name=name, email=email, department_id=dept_id)
    db.add(hod)
    db.flush()
    return hod


def upsert_event(db, ev, section_obj):
    # Deduplicate by title + date + section
    existing = (
        db.query(Event)
        .filter(Event.title == ev["title"]) 
        .filter(Event.date == ev["date"]) 
        .filter(Event.section_id == section_obj.id)
        .one_or_none()
    )
    if existing:
        return existing
    event = Event(
        title=ev["title"],
        description=ev.get("description", ""),
        date=ev["date"],
        start_time=ev.get("startTime", "00:00"),
        end_time=ev.get("endTime", "00:00"),
        venue=ev.get("venue", ""),
        category=ev.get("category", "event"),
        department=ev["dept"],
        year=ev["year"],
        section_name=ev["section"],
        section_id=section_obj.id,
    )
    db.add(event)
    db.flush()
    return event


def seed_all():
    db = SessionLocal()
    try:
        # Admin (from external config if present)
            admin_cfg = (EXTERNAL_SEED_CONFIG.get("admin") if EXTERNAL_SEED_CONFIG else None)
            if admin_cfg:
                upsert_admin(db, username=admin_cfg.get("username", "admin"), password=admin_cfg.get("password", "1234"), name=admin_cfg.get("name", "Admin User"), email=admin_cfg.get("email", "admin@calendaa.edu"))
            else:
                upsert_admin(db, username="admin", password="1234", name="Admin User", email="admin@calendaa.edu")

        # Departments + years + sections
        depts = {}
        for name in DEPARTMENTS:
            dept = upsert_department(db, name)
            depts[name] = dept
            ensure_years_and_sections(db, dept)

        # HODs (can be provided by external seed config)
        hod_data = (EXTERNAL_SEED_CONFIG.get("hods") if EXTERNAL_SEED_CONFIG and "hods" in EXTERNAL_SEED_CONFIG else [
            dict(username="hod_cse",  password="hod123", name="Dr. Claudin",   email="hod.cse@calendaa.edu",  dept="CSE"),
            dict(username="hod_aiml", password="hod123", name="Dr. Justin Das Y",    email="hod.aiml@calendaa.edu", dept="AIML"),
            dict(username="hod_ece",  password="hod123", name="Dr. Kavitha Suresh", email="hod.ece@calendaa.edu",  dept="ECE"),
        ])
        for h in hod_data:
            dept = depts.get(h["dept"])
            if dept:
                upsert_hod(db, username=h["username"], password=h["password"], name=h["name"], email=h["email"], dept_id=dept.id)

        # Events: can be overridden by external config
        events_data = (EXTERNAL_SEED_CONFIG.get("events") if EXTERNAL_SEED_CONFIG and "events" in EXTERNAL_SEED_CONFIG else [
            dict(title="Data Structures & Algorithms", description="Graph traversal: BFS and DFS with complexity analysis.", date=d(1), startTime="09:00", endTime="10:30", venue="Room 204, Block A", dept="CSE", year="II", section="A", category="lecture"),
            dict(title="Deep Learning with PyTorch", description="CNN architectures: AlexNet, VGG, ResNet — hands-on session.", date=d(2), startTime="10:00", endTime="12:00", venue="AI Lab 1, Block E", dept="AIML", year="III", section="A", category="lecture"),
            dict(title="Signals & Systems – Lecture", description="Fourier transform properties and applications in signal processing.", date=d(2), startTime="09:00", endTime="10:30", venue="Room 108, Block B", dept="ECE", year="II", section="A", category="lecture"),
        ])

        # Map sections for quick lookup
        sections = {}
        for name, dept in depts.items():
            yrs = db.query(Year).filter(Year.department_id == dept.id).all()
            for yr in yrs:
                secs = db.query(Section).filter(Section.year_id == yr.id).all()
                for sec in secs:
                    sections[(name, yr.name, sec.name)] = sec

        for ev in events_data:
            sec_obj = sections.get((ev["dept"], ev["year"], ev["section"]))
            if not sec_obj:
                # Skip if section not present (shouldn't happen if earlier ensured)
                continue
            upsert_event(db, ev, sec_obj)

        db.commit()
        print("[OK] Idempotent seed completed: departments/admin/hods/events ensured")
    except Exception:
        db.rollback()
        print("[ERROR] Seeding failed:\n", traceback.format_exc())
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()

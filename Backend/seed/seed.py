"""
Seed configuration and wrapper entrypoint.

Edit the `SEED_CONFIG` below to control what gets upserted on startup or
when running `python seed/seed.py`. This file is imported by
`app.seed` if present, so you can change departments, admin credentials,
HODs or default events here and those changes will be applied idempotently.
"""

# Editable seed configuration used by `app.seed` when present.
SEED_CONFIG = {
    "admin": {
        "username": "admin",
        "password": "1234",
        "name": "Admin User",
        "email": "admin@calendaa.edu",
    },
    "departments": [
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
    ],
    "hods": [
        dict(username="hod_cse",  password="hod123", name="Dr. Claudin",   email="hod.cse@calendaa.edu",  dept="CSE"),
        dict(username="hod_aiml", password="hod123", name="Dr. Justin Das Y",    email="hod.aiml@calendaa.edu", dept="AIML"),
        dict(username="hod_ece",  password="hod123", name="Dr. Kavitha Suresh", email="hod.ece@calendaa.edu",  dept="ECE"),
    ],
    # Optional: override default events; structure matches the original seed
    # keys (title, description, date, startTime, endTime, venue, dept, year, section, category)
    "events": [],
}

import sys
import os

# Make sure app package is importable when running from Backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

try:
    from app.seed import seed_all

    if __name__ == "__main__":
        seed_all()
except Exception:
    import traceback

    print("[ERROR] Failed to run idempotent seed:\n", traceback.format_exc())

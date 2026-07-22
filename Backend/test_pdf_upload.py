import requests
import sys
from fpdf import FPDF

# 1. Create a dummy PDF
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, txt="Sample Academic Schedule", ln=1, align='C')
pdf.cell(200, 10, txt="Title: Intro to Advanced Magic", ln=1)
pdf.cell(200, 10, txt="Date: 2026-08-15", ln=1)
pdf.cell(200, 10, txt="Time: 09:00 to 11:00", ln=1)
pdf.cell(200, 10, txt="Venue: Room 9 3/4", ln=1)
pdf.cell(200, 10, txt="Department: CSE", ln=1)
pdf.cell(200, 10, txt="Year: II", ln=1)
pdf.cell(200, 10, txt="Section: B", ln=1)
pdf.output("test_schedule.pdf")

# 2. Login to get token
base_url = "http://127.0.0.1:8000"
resp = requests.post(f"{base_url}/auth/login", json={"username": "admin", "password": "1234"})
if resp.status_code != 200:
    print(f"Login failed: {resp.text}")
    sys.exit(1)
token = resp.json()["access_token"]
print("Logged in successfully.")

# 3. Upload PDF to extract endpoint
headers = {"Authorization": f"Bearer {token}"}
with open("test_schedule.pdf", "rb") as f:
    files = {"file": ("test_schedule.pdf", f, "application/pdf")}
    print("Uploading PDF for extraction...")
    upload_resp = requests.post(f"{base_url}/events/extract-from-pdf", headers=headers, files=files)
    
    if upload_resp.status_code != 200:
        print(f"Extraction failed: {upload_resp.status_code} {upload_resp.text}")
    else:
        print("Extraction successful! Response:")
        print(upload_resp.json())

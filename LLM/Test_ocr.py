from pdf2image import convert_from_path
from PIL import Image
import pytesseract
import cv2
import numpy as np
import requests
import json
import os

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

# Input file (PDF or Image)
input_path = "Calendar - 2026-2027.pdf"
# Examples:
# input_path = "calendar.jpg"
# input_path = "calendar.png"

# Load pages/images
ext = os.path.splitext(input_path)[1].lower()

if ext == ".pdf":
    pages = convert_from_path(
        input_path,
        poppler_path=r"C:\Users\Devaprasath\Downloads\Release-26.02.0-0\poppler-26.02.0\Library\bin"
    )
elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"]:
    pages = [Image.open(input_path).convert("RGB")]
else:
    raise ValueError(f"Unsupported file type: {ext}")

# Store all extracted text
full_text = ""

# OCR Loop
for i, page in enumerate(pages):

    img = np.array(page)

    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    _, thresh = cv2.threshold(
        gray,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    text = pytesseract.image_to_string(thresh)

    full_text += text + "\n"

    print(f"\n===== PAGE {i+1} =====\n")
    print(text)

# Send OCR text to FastAPI
response = requests.post(
    "http://127.0.0.1:8000/generate",
    json={
        "text": full_text
    }
)

# Final structured output
print("\n===== STRUCTURED OUTPUT =====\n")
print(response.json())

structured_output = response.json()

with open("output.json", "w") as f:
    json.dump(structured_output, f, indent=4)

print("Structured output saved to output.json")
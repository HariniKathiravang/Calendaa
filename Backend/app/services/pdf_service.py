import io
from pdf2image import convert_from_bytes
import pytesseract
import cv2
import numpy as np
from app.config import settings

# Configure Tesseract path
pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Convert a PDF file (provided as bytes) into images, process them,
    and extract text using OCR.
    """
    # Convert PDF -> Images
    try:
        pages = convert_from_bytes(
            pdf_bytes,
            poppler_path=settings.POPPLER_PATH
        )
    except Exception as e:
        # Fallback: maybe it's an image disguised as a PDF (e.g. user selected 'All Files' or renamed a PNG)
        img_array = np.frombuffer(pdf_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is not None:
            pages = [img]
        else:
            raise e

    full_text = ""
    for page in pages:
        # Convert PIL Image to OpenCV format if it's not already a numpy array
        if isinstance(page, np.ndarray):
            img = page
        else:
            img = np.array(page)
        
        # Check if image has RGB channels before converting to grayscale
        if len(img.shape) == 3 and img.shape[2] == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        else:
            gray = img
            
        # Apply thresholding
        _, thresh = cv2.threshold(
            gray,
            0,
            255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
        
        # Extract text
        text = pytesseract.image_to_string(thresh)
        full_text += text + "\n\n"
        
    return full_text

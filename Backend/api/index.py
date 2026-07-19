"""
Vercel serverless entrypoint for the Calendaa FastAPI backend.
Vercel routes all requests to this file via vercel.json.
"""
import sys
import os

# Ensure the Backend root is on sys.path so `app` package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401 — Vercel picks up `app` from this module

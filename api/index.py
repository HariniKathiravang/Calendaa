"""
Root-level Vercel Python entrypoint for the combined deployment.

Vercel routes all /api/* requests here. The FastAPI app registers
all routes with /api prefix so the paths line up correctly.
"""
import sys
import os

# Add Backend/ to sys.path so `from app.xxx import ...` works
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "Backend"))

from app.main import app  # noqa: F401 — Vercel uses this `app` symbol

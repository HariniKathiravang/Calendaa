# Calendaa Backend

FastAPI backend for the Academic Calendar application.

## Quick Start

### 1. Activate the virtual environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run seed script
```bash
python seed/seed.py
```

### 4. Start the server
```bash
uvicorn app.main:app --reload --port 8000
```

The API is now live at **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

---

## Default Credentials

| Role  | Username  | Password |
|-------|-----------|----------|
| Admin | `admin`   | `1234`   |
| HOD   | `hod_cse` | `hod123` |
| HOD   | `hod_aiml`| `hod123` |
| HOD   | `hod_ece` | `hod123` |

---

## Project Structure

```
app/
├── main.py          # FastAPI app entry point
├── config.py        # Settings (loaded from .env)
├── database/        # SQLAlchemy engine & session
├── models/          # ORM models
├── schemas/         # Pydantic request/response models
├── routes/          # API route handlers
├── services/        # Business logic
├── auth/            # JWT handler & FastAPI dependencies
└── utils/           # Password hashing
seed/
└── seed.py          # Database seed script
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | — | Login |
| GET | `/auth/me` | JWT | Current user |
| GET | `/events` | — | List events (filterable) |
| POST | `/events` | Admin/HOD | Create event |
| PUT | `/events/{id}` | Admin/HOD | Update event |
| DELETE | `/events/{id}` | Admin/HOD | Delete event |
| GET | `/departments` | — | List departments |
| GET | `/years` | — | List years |
| GET | `/sections` | — | List sections |
| GET | `/admin/hods` | Admin | List HODs |
| POST | `/admin/hods` | Admin | Create HOD |
| PUT | `/admin/hods/{id}` | Admin | Update HOD |
| DELETE | `/admin/hods/{id}` | Admin | Delete HOD |
| POST | `/admin/departments` | Admin | Create department |
| PUT | `/admin/departments/{id}` | Admin | Update department |
| DELETE | `/admin/departments/{id}` | Admin | Delete department |

## Environment Variables

Copy `.env.example` to `.env` and adjust:

```env
DATABASE_URL=sqlite:///./calendaa.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

To switch to PostgreSQL later:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/calendaa
```

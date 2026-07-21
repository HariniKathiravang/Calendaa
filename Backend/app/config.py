from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./calendaa.db"
    SECRET_KEY: str = "super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Paths for PDF parsing
    TESSERACT_CMD: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    POPPLER_PATH: str = r"C:\Program Files\poppler\Library\bin"

    # Comma-separated list of allowed CORS origins.
    # Local defaults cover all common Vite/dev server ports.
    # In production (Vercel), set this to your deployed frontend URL.
    # Example: https://calendaa.vercel.app,https://calendaa-admin.vercel.app
    ALLOWED_ORIGINS: str = (
        "https://calendaafrontend.vercel.app,"
        "http://localhost:3000,"
        "http://localhost:5173,"
        "http://localhost:4173,"
        "http://localhost:8081,"
        "http://127.0.0.1:3000,"
        "http://127.0.0.1:5173"
    )

    class Config:
        env_file = ".env"


settings = Settings()


def get_allowed_origins() -> list[str]:
    """Parse comma-separated ALLOWED_ORIGINS into a list."""
    return [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SmartFare"
    ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: str = ""

    # Email (Brevo API — replaces SMTP)
    BREVO_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@smartfare.local"

    # Device authentication for Raspberry Pi sync
    DEVICE_API_KEY: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # don't crash if .env has extra keys


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
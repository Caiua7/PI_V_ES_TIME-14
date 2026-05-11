from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    DATABASE_URL: str
    JWT_SECRET_KEY: str = "dev-only-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_EMAIL_DOMAINS: str = ""

    def get_allowed_domains(self) -> list[str]:
        if not self.ALLOWED_EMAIL_DOMAINS.strip():
            return []
        return [d.strip() for d in self.ALLOWED_EMAIL_DOMAINS.split(",") if d.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

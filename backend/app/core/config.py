from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).parents[2] / ".env", extra="ignore")

    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/aarogyahub?charset=utf8mb4"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"


settings = Settings()

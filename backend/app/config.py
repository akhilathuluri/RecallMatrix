"""
Configuration management using Pydantic Settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore
from typing import Literal


class Settings(BaseSettings):
    """Application settings"""
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_WEBHOOK_URL: str = ""
    
    # Database
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # GitHub Models API
    GITHUB_TOKEN: str
    GITHUB_MODELS_ENDPOINT: str = "https://models.inference.ai.azure.com"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Application
    APP_BASE_URL: str = "http://localhost:3000"
    API_SECRET_KEY: str
    AUTH_CODE_EXPIRY_MINUTES: int = 10
    AUTH_CODE_LENGTH: int = 6
    
    # Environment
    ENVIRONMENT: Literal["development", "production", "staging"] = "development"
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Global settings instance
settings = Settings()

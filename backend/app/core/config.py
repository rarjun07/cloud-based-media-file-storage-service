from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Cloud Based Media File Storage Service"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cloud_storage"
    create_tables_on_startup: bool = False

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    access_token_cookie_name: str = "access_token"
    refresh_token_cookie_name: str = "refresh_token"
    secure_cookies: bool = False

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "media-files"
    storage_provider: str = "supabase"
    max_upload_size_bytes: int = 104_857_600
    allowed_upload_mime_types: str = (
        "image/jpeg,image/png,image/webp,image/gif,application/pdf,"
        "video/mp4,audio/mpeg,text/plain,application/zip"
    )

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8")

    @property
    def allowed_upload_mime_type_set(self) -> set[str]:
        return {
            mime_type.strip()
            for mime_type in self.allowed_upload_mime_types.split(",")
            if mime_type.strip()
        }

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import settings


class InitUploadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    mime_type: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(gt=0)
    folder_id: UUID | None = None
    checksum: str | None = Field(default=None, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("File name is required")
        if "/" in cleaned or "\\" in cleaned:
            raise ValueError("File name must not include path separators")
        return cleaned

    @field_validator("mime_type")
    @classmethod
    def validate_mime_type(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if cleaned not in settings.allowed_upload_mime_type_set:
            raise ValueError("File type is not allowed")
        return cleaned

    @field_validator("size_bytes")
    @classmethod
    def validate_size(cls, value: int) -> int:
        if value > settings.max_upload_size_bytes:
            raise ValueError("File exceeds maximum upload size")
        return value


class InitUploadResponse(BaseModel):
    file_id: UUID
    storage_provider: str
    storage_bucket: str
    storage_key: str
    upload_url: str
    upload_token: str
    expires_in_seconds: int


class CompleteUploadRequest(BaseModel):
    file_id: UUID
    checksum: str | None = Field(default=None, max_length=128)


class FileRead(BaseModel):
    id: UUID
    owner_id: UUID
    folder_id: UUID | None
    name: str
    mime_type: str
    size_bytes: int
    storage_provider: str
    storage_bucket: str
    storage_key: str
    checksum: str | None
    upload_status: str
    is_deleted: bool

    model_config = ConfigDict(from_attributes=True)

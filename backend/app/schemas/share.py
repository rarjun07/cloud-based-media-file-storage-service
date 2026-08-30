from datetime import UTC, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models import ShareRole


class ShareCreate(BaseModel):
    shared_with_email: EmailStr
    role: ShareRole = ShareRole.VIEWER
    file_id: UUID | None = None
    folder_id: UUID | None = None

    @model_validator(mode="after")
    def validate_single_target(self) -> "ShareCreate":
        if bool(self.file_id) == bool(self.folder_id):
            raise ValueError("Share must target exactly one file or folder")
        if self.role == ShareRole.OWNER:
            raise ValueError("Owner role cannot be granted through sharing")
        return self


class ShareRead(BaseModel):
    id: UUID
    owner_id: UUID
    shared_with_user_id: UUID
    shared_with_email: EmailStr | None = None
    file_id: UUID | None
    folder_id: UUID | None
    role: ShareRole
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicLinkCreate(BaseModel):
    role: ShareRole = ShareRole.VIEWER
    file_id: UUID | None = None
    folder_id: UUID | None = None
    expires_at: datetime | None = None
    password: str | None = Field(default=None, min_length=1, max_length=72)

    @model_validator(mode="after")
    def validate_link(self) -> "PublicLinkCreate":
        if bool(self.file_id) == bool(self.folder_id):
            raise ValueError("Public link must target exactly one file or folder")
        if self.role == ShareRole.OWNER:
            raise ValueError("Owner role cannot be granted through public links")
        if self.expires_at and self._as_utc(self.expires_at) <= datetime.now(UTC):
            raise ValueError("Expiry must be in the future")
        return self

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


class PublicLinkCreateResponse(BaseModel):
    id: UUID
    token: str
    public_path: str
    role: ShareRole
    file_id: UUID | None
    folder_id: UUID | None
    expires_at: datetime | None


class PublicLinkAccessRequest(BaseModel):
    password: str | None = Field(default=None, max_length=72)


class PublicLinkAccessResponse(BaseModel):
    id: UUID
    role: ShareRole
    file_id: UUID | None
    folder_id: UUID | None
    expires_at: datetime | None

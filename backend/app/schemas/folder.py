from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_id: UUID | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Folder name is required")
        if "/" in cleaned or "\\" in cleaned:
            raise ValueError("Folder name must not include path separators")
        return cleaned


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    parent_id: UUID | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Folder name is required")
        if "/" in cleaned or "\\" in cleaned:
            raise ValueError("Folder name must not include path separators")
        return cleaned


class BreadcrumbItem(BaseModel):
    id: UUID
    name: str


class FolderRead(BaseModel):
    id: UUID
    owner_id: UUID
    parent_id: UUID | None
    name: str
    is_deleted: bool
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FolderDetail(FolderRead):
    breadcrumbs: list[BreadcrumbItem]

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SearchResultItem(BaseModel):
    id: UUID
    item_type: str
    name: str
    owner_id: UUID
    folder_id: UUID | None = None
    parent_id: UUID | None = None
    mime_type: str | None = None
    size_bytes: int | None = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SearchResponse(BaseModel):
    query: str | None
    mime_type: str | None
    results: list[SearchResultItem]


class SearchFilters(BaseModel):
    query: str | None = Field(default=None, max_length=255)
    mime_type: str | None = Field(default=None, max_length=255)

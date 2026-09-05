from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.file import FileRead
from app.schemas.folder import FolderRead


class StarRead(BaseModel):
    id: UUID
    user_id: UUID
    file_id: UUID | None
    folder_id: UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StarredItemsResponse(BaseModel):
    files: list[FileRead]
    folders: list[FolderRead]

from pydantic import BaseModel

from app.schemas.file import FileRead
from app.schemas.folder import FolderRead


class TrashResponse(BaseModel):
    files: list[FileRead]
    folders: list[FolderRead]

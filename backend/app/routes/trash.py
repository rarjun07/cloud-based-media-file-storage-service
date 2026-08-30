import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.deps import get_current_user
from app.models import File, Folder, User
from app.schemas.file import FileRead
from app.schemas.folder import FolderRead
from app.schemas.trash import TrashResponse

router = APIRouter(prefix="/trash", tags=["trash"])


@router.get("", response_model=TrashResponse)
async def list_trash(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> TrashResponse:
    files_result = await session.execute(
        select(File)
        .where(File.owner_id == current_user.id, File.is_deleted.is_(True))
        .order_by(File.deleted_at.desc())
    )
    folders_result = await session.execute(
        select(Folder)
        .where(Folder.owner_id == current_user.id, Folder.is_deleted.is_(True))
        .order_by(Folder.deleted_at.desc())
    )

    return TrashResponse(
        files=list(files_result.scalars().all()),
        folders=list(folders_result.scalars().all()),
    )


@router.post("/files/{file_id}/restore", response_model=FileRead)
async def restore_file(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> File:
    file = await session.get(File, file_id)
    if not file or file.owner_id != current_user.id or not file.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deleted file not found")

    if file.folder_id:
        folder = await session.get(Folder, file.folder_id)
        if not folder or folder.is_deleted:
            file.folder_id = None

    file.is_deleted = False
    file.deleted_at = None
    file.updated_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(file)
    return file


@router.post("/folders/{folder_id}/restore", response_model=FolderRead)
async def restore_folder(
    folder_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Folder:
    folder = await session.get(Folder, folder_id)
    if not folder or folder.owner_id != current_user.id or not folder.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deleted folder not found")

    if folder.parent_id:
        parent = await session.get(Folder, folder.parent_id)
        if not parent or parent.is_deleted:
            folder.parent_id = None

    folder.is_deleted = False
    folder.deleted_at = None
    folder.updated_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(folder)
    return folder

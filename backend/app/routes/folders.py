import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.deps import get_current_user
from app.models import Folder, User
from app.schemas.folder import FolderCreate, FolderDetail, FolderRead, FolderUpdate
from app.services.folders import build_breadcrumbs, ensure_folder_is_not_descendant, get_owned_active_folder

router = APIRouter(prefix="/folders", tags=["folders"])


@router.post("", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
async def create_folder(
    payload: FolderCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Folder:
    if payload.parent_id:
        parent = await get_owned_active_folder(session, payload.parent_id, current_user.id)
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")

    folder = Folder(owner_id=current_user.id, parent_id=payload.parent_id, name=payload.name)
    session.add(folder)
    await session.commit()
    await session.refresh(folder)
    return folder


@router.get("", response_model=list[FolderRead])
async def list_folders(
    parent_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[Folder]:
    result = await session.execute(
        select(Folder)
        .where(
            Folder.owner_id == current_user.id,
            Folder.parent_id == parent_id,
            Folder.is_deleted.is_(False),
        )
        .order_by(Folder.name.asc())
    )
    return list(result.scalars().all())


@router.get("/{folder_id}", response_model=FolderDetail)
async def get_folder(
    folder_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> FolderDetail:
    folder = await get_owned_active_folder(session, folder_id, current_user.id)
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    return FolderDetail.model_validate(folder).model_copy(
        update={"breadcrumbs": await build_breadcrumbs(session, folder)}
    )


@router.patch("/{folder_id}", response_model=FolderRead)
async def update_folder(
    folder_id: uuid.UUID,
    payload: FolderUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Folder:
    folder = await get_owned_active_folder(session, folder_id, current_user.id)
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    if "parent_id" in payload.model_fields_set:
        if payload.parent_id:
            parent = await get_owned_active_folder(session, payload.parent_id, current_user.id)
            if not parent:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")
            if not await ensure_folder_is_not_descendant(session, folder.id, payload.parent_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Folder cannot be moved inside itself or its descendants",
                )
        folder.parent_id = payload.parent_id

    if payload.name is not None:
        folder.name = payload.name
    folder.updated_at = datetime.now(UTC)

    await session.commit()
    await session.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    folder = await get_owned_active_folder(session, folder_id, current_user.id)
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    folder.is_deleted = True
    folder.deleted_at = datetime.now(UTC)
    folder.updated_at = folder.deleted_at
    await session.commit()

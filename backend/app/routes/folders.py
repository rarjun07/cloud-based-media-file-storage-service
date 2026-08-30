import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.deps import get_current_user
from app.models import Folder, ShareRole, User
from app.schemas.folder import FolderCreate, FolderDetail, FolderRead, FolderUpdate
from app.services.folders import build_breadcrumbs, ensure_folder_is_not_descendant
from app.services.permissions import require_folder_permission

router = APIRouter(prefix="/folders", tags=["folders"])


@router.post("", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
async def create_folder(
    payload: FolderCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Folder:
    if payload.parent_id:
        parent = await session.get(Folder, payload.parent_id)
        if not parent or parent.is_deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")
        await require_folder_permission(session, parent, current_user.id, ShareRole.EDITOR)

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
    if parent_id:
        parent = await session.get(Folder, parent_id)
        if not parent or parent.is_deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")
        await require_folder_permission(session, parent, current_user.id, ShareRole.VIEWER)
        owner_filter = Folder.parent_id == parent_id
    else:
        owner_filter = Folder.owner_id == current_user.id

    result = await session.execute(
        select(Folder)
        .where(
            owner_filter,
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
    folder = await session.get(Folder, folder_id)
    if not folder or folder.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    await require_folder_permission(session, folder, current_user.id, ShareRole.VIEWER)

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
    folder = await session.get(Folder, folder_id)
    if not folder or folder.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    await require_folder_permission(session, folder, current_user.id, ShareRole.EDITOR)

    if "parent_id" in payload.model_fields_set:
        if payload.parent_id:
            parent = await session.get(Folder, payload.parent_id)
            if not parent or parent.is_deleted:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")
            await require_folder_permission(session, parent, current_user.id, ShareRole.EDITOR)
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
    folder = await session.get(Folder, folder_id)
    if not folder or folder.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    await require_folder_permission(session, folder, current_user.id, ShareRole.EDITOR)

    folder.is_deleted = True
    folder.deleted_at = datetime.now(UTC)
    folder.updated_at = folder.deleted_at
    await session.commit()

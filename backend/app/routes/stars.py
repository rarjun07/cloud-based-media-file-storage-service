import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.deps import get_current_user
from app.models import File, Folder, ShareRole, Star, User
from app.schemas.star import StarRead, StarredItemsResponse
from app.services.activity import add_activity
from app.services.permissions import require_file_permission, require_folder_permission

router = APIRouter(prefix="/stars", tags=["stars"])


@router.get("", response_model=StarredItemsResponse)
async def list_starred_items(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> StarredItemsResponse:
    file_ids = select(Star.file_id).where(Star.user_id == current_user.id, Star.file_id.is_not(None))
    folder_ids = select(Star.folder_id).where(Star.user_id == current_user.id, Star.folder_id.is_not(None))
    files_result = await session.execute(
        select(File).where(File.id.in_(file_ids), File.is_deleted.is_(False)).order_by(File.updated_at.desc())
    )
    folders_result = await session.execute(
        select(Folder).where(Folder.id.in_(folder_ids), Folder.is_deleted.is_(False)).order_by(Folder.updated_at.desc())
    )
    return StarredItemsResponse(files=list(files_result.scalars().all()), folders=list(folders_result.scalars().all()))


@router.post("/files/{file_id}", response_model=StarRead, status_code=status.HTTP_201_CREATED)
async def star_file(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Star:
    file = await session.get(File, file_id)
    if not file or file.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await require_file_permission(session, file, current_user.id, ShareRole.VIEWER)

    existing = await _get_star(session, current_user.id, file_id=file_id, folder_id=None)
    if existing:
        return existing

    star = Star(user_id=current_user.id, file_id=file_id)
    session.add(star)
    add_activity(session, user_id=current_user.id, action="star_file", file_id=file_id)
    await session.commit()
    await session.refresh(star)
    return star


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unstar_file(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    await session.execute(delete(Star).where(Star.user_id == current_user.id, Star.file_id == file_id))
    add_activity(session, user_id=current_user.id, action="unstar_file", file_id=file_id)
    await session.commit()


@router.post("/folders/{folder_id}", response_model=StarRead, status_code=status.HTTP_201_CREATED)
async def star_folder(
    folder_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Star:
    folder = await session.get(Folder, folder_id)
    if not folder or folder.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    await require_folder_permission(session, folder, current_user.id, ShareRole.VIEWER)

    existing = await _get_star(session, current_user.id, file_id=None, folder_id=folder_id)
    if existing:
        return existing

    star = Star(user_id=current_user.id, folder_id=folder_id)
    session.add(star)
    add_activity(session, user_id=current_user.id, action="star_folder", folder_id=folder_id)
    await session.commit()
    await session.refresh(star)
    return star


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unstar_folder(
    folder_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    await session.execute(delete(Star).where(Star.user_id == current_user.id, Star.folder_id == folder_id))
    add_activity(session, user_id=current_user.id, action="unstar_folder", folder_id=folder_id)
    await session.commit()


async def _get_star(
    session: AsyncSession,
    user_id: uuid.UUID,
    file_id: uuid.UUID | None,
    folder_id: uuid.UUID | None,
) -> Star | None:
    result = await session.execute(
        select(Star).where(Star.user_id == user_id, Star.file_id == file_id, Star.folder_id == folder_id)
    )
    return result.scalar_one_or_none()

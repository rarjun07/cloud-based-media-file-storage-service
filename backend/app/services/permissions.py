from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import File, Folder, LinkShare, Share, ShareRole

ROLE_RANK = {
    ShareRole.VIEWER: 1,
    ShareRole.EDITOR: 2,
    ShareRole.OWNER: 3,
}


async def get_file_permission(session: AsyncSession, file: File, user_id: UUID) -> ShareRole | None:
    if file.owner_id == user_id:
        return ShareRole.OWNER

    direct_role = await _get_direct_share_role(session, user_id, file_id=file.id, folder_id=None)
    folder_role = None
    if file.folder_id:
        folder = await session.get(Folder, file.folder_id)
        if folder and not folder.is_deleted:
            folder_role = await get_folder_permission(session, folder, user_id)

    return _highest_role([direct_role, folder_role])


async def get_folder_permission(session: AsyncSession, folder: Folder, user_id: UUID) -> ShareRole | None:
    current: Folder | None = folder
    while current is not None and not current.is_deleted:
        if current.owner_id == user_id:
            return ShareRole.OWNER

        direct_role = await _get_direct_share_role(session, user_id, file_id=None, folder_id=current.id)
        if direct_role:
            return direct_role

        if current.parent_id is None:
            return None
        current = await session.get(Folder, current.parent_id)

    return None


async def require_file_permission(
    session: AsyncSession,
    file: File,
    user_id: UUID,
    required_role: ShareRole,
) -> ShareRole:
    role = await get_file_permission(session, file, user_id)
    if not role or ROLE_RANK[role] < ROLE_RANK[required_role]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient file permission")
    return role


async def require_folder_permission(
    session: AsyncSession,
    folder: Folder,
    user_id: UUID,
    required_role: ShareRole,
) -> ShareRole:
    role = await get_folder_permission(session, folder, user_id)
    if not role or ROLE_RANK[role] < ROLE_RANK[required_role]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient folder permission")
    return role


def public_link_is_expired(link_share: LinkShare) -> bool:
    if link_share.expires_at is None:
        return False
    expires_at = link_share.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    return expires_at <= datetime.now(UTC)


async def _get_direct_share_role(
    session: AsyncSession,
    user_id: UUID,
    file_id: UUID | None,
    folder_id: UUID | None,
) -> ShareRole | None:
    result = await session.execute(
        select(Share).where(
            Share.shared_with_user_id == user_id,
            Share.file_id == file_id,
            Share.folder_id == folder_id,
        )
    )
    roles = [ShareRole(share.role) for share in result.scalars().all()]
    return _highest_role(roles)


def _highest_role(roles: list[ShareRole | None]) -> ShareRole | None:
    concrete_roles = [role for role in roles if role is not None]
    if not concrete_roles:
        return None
    return max(concrete_roles, key=lambda role: ROLE_RANK[role])

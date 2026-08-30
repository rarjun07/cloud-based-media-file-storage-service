from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Folder
from app.schemas.folder import BreadcrumbItem


async def get_owned_active_folder(
    session: AsyncSession,
    folder_id: UUID,
    owner_id: UUID,
) -> Folder | None:
    folder = await session.get(Folder, folder_id)
    if not folder or folder.owner_id != owner_id or folder.is_deleted:
        return None
    return folder


async def ensure_folder_is_not_descendant(
    session: AsyncSession,
    folder_id: UUID,
    possible_parent_id: UUID | None,
) -> bool:
    current_parent_id = possible_parent_id
    while current_parent_id is not None:
        if current_parent_id == folder_id:
            return False
        parent = await session.get(Folder, current_parent_id)
        current_parent_id = parent.parent_id if parent else None
    return True


async def build_breadcrumbs(session: AsyncSession, folder: Folder) -> list[BreadcrumbItem]:
    trail: list[BreadcrumbItem] = []
    current: Folder | None = folder

    while current is not None:
        trail.append(BreadcrumbItem(id=current.id, name=current.name))
        if current.parent_id is None:
            break
        current = await session.get(Folder, current.parent_id)
        if current and current.is_deleted:
            break

    return list(reversed(trail))

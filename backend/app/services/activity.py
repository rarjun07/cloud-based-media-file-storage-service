from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Activity


def add_activity(
    session: AsyncSession,
    *,
    user_id: UUID,
    action: str,
    file_id: UUID | None = None,
    folder_id: UUID | None = None,
) -> None:
    if not hasattr(session, "add"):
        return
    session.add(Activity(user_id=user_id, action=action, file_id=file_id, folder_id=folder_id))

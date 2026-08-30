from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.deps import get_current_user
from app.models import File, Folder, Share, User
from app.schemas.search import SearchResponse, SearchResultItem

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search_items(
    q: str | None = None,
    mime_type: str | None = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> SearchResponse:
    query = q.strip() if q else None
    mime_type_filter = mime_type.strip().lower() if mime_type else None
    results: list[SearchResultItem] = []

    files = await _search_files(session, current_user.id, query, mime_type_filter)
    folders = await _search_folders(session, current_user.id, query)

    for folder in folders:
        results.append(
            SearchResultItem(
                id=folder.id,
                item_type="folder",
                name=folder.name,
                owner_id=folder.owner_id,
                parent_id=folder.parent_id,
                updated_at=folder.updated_at,
            )
        )

    for file in files:
        results.append(
            SearchResultItem(
                id=file.id,
                item_type="file",
                name=file.name,
                owner_id=file.owner_id,
                folder_id=file.folder_id,
                mime_type=file.mime_type,
                size_bytes=file.size_bytes,
                updated_at=file.updated_at,
            )
        )

    results.sort(key=lambda item: item.updated_at, reverse=True)
    return SearchResponse(query=query, mime_type=mime_type_filter, results=results)


async def _search_files(
    session: AsyncSession,
    user_id,
    query: str | None,
    mime_type: str | None,
) -> list[File]:
    shared_file_ids = select(Share.file_id).where(
        Share.shared_with_user_id == user_id,
        Share.file_id.is_not(None),
    )
    conditions = [
        File.is_deleted.is_(False),
        or_(File.owner_id == user_id, File.id.in_(shared_file_ids)),
    ]
    if query:
        conditions.append(File.name.ilike(f"%{query}%"))
    if mime_type:
        conditions.append(File.mime_type == mime_type)

    result = await session.execute(select(File).where(*conditions).order_by(File.updated_at.desc()).limit(50))
    return list(result.scalars().all())


async def _search_folders(session: AsyncSession, user_id, query: str | None) -> list[Folder]:
    shared_folder_ids = select(Share.folder_id).where(
        Share.shared_with_user_id == user_id,
        Share.folder_id.is_not(None),
    )
    conditions = [
        Folder.is_deleted.is_(False),
        or_(Folder.owner_id == user_id, Folder.id.in_(shared_folder_ids)),
    ]
    if query:
        conditions.append(Folder.name.ilike(f"%{query}%"))

    result = await session.execute(select(Folder).where(*conditions).order_by(Folder.updated_at.desc()).limit(50))
    return list(result.scalars().all())

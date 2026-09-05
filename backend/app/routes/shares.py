import hashlib
import secrets
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security import hash_password, verify_password
from app.deps import get_current_user
from app.models import File, Folder, LinkShare, Share, ShareRole, User
from app.schemas.file import FileDownloadResponse
from app.schemas.share import (
    PublicLinkAccessRequest,
    PublicLinkAccessResponse,
    PublicLinkCreate,
    PublicLinkCreateResponse,
    PublicLinkFileEntry,
    ShareCreate,
    ShareRead,
    SharedItemsResponse,
)
from app.services.activity import add_activity
from app.services.permissions import public_link_is_expired
from app.services.storage import get_storage_service
from app.core.config import settings

router = APIRouter(tags=["sharing"])


@router.post("/shares", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
async def create_share(
    payload: ShareCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ShareRead:
    await _require_owned_target(session, current_user.id, payload.file_id, payload.folder_id)

    shared_user = await _get_user_by_email(session, payload.shared_with_email)
    if not shared_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User to share with not found")
    if shared_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot share with yourself")

    existing_share = await _get_existing_share(session, shared_user.id, payload.file_id, payload.folder_id)
    if existing_share:
        existing_share.role = payload.role.value
        existing_share.updated_at = datetime.now(UTC)
        await session.commit()
        await session.refresh(existing_share)
        return _serialize_share(existing_share, shared_user)

    share = Share(
        owner_id=current_user.id,
        shared_with_user_id=shared_user.id,
        file_id=payload.file_id,
        folder_id=payload.folder_id,
        role=payload.role.value,
    )
    session.add(share)
    add_activity(session, user_id=current_user.id, action="create_share", file_id=payload.file_id, folder_id=payload.folder_id)
    await session.commit()
    await session.refresh(share)
    return _serialize_share(share, shared_user)


@router.get("/shares", response_model=list[ShareRead])
async def list_shares(
    file_id: uuid.UUID | None = Query(default=None),
    folder_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[ShareRead]:
    if bool(file_id) and bool(folder_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filter by file or folder, not both")

    conditions = [Share.owner_id == current_user.id]
    if file_id:
        conditions.append(Share.file_id == file_id)
    if folder_id:
        conditions.append(Share.folder_id == folder_id)

    result = await session.execute(select(Share).where(*conditions).order_by(Share.created_at.desc()))
    shares = list(result.scalars().all())
    shared_user_ids = [share.shared_with_user_id for share in shares]
    users_by_id = await _get_users_by_id(session, shared_user_ids)
    return [_serialize_share(share, users_by_id.get(share.shared_with_user_id)) for share in shares]


@router.delete("/shares/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_share(
    share_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    share = await session.get(Share, share_id)
    if not share or share.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found")

    await session.delete(share)
    add_activity(session, user_id=current_user.id, action="delete_share", file_id=share.file_id, folder_id=share.folder_id)
    await session.commit()


@router.get("/shared-with-me", response_model=SharedItemsResponse)
async def list_shared_with_me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> SharedItemsResponse:
    shared_file_ids = select(Share.file_id).where(
        or_(Share.shared_with_user_id == current_user.id, Share.owner_id == current_user.id),
        Share.file_id.is_not(None),
    )
    shared_folder_ids = select(Share.folder_id).where(
        or_(Share.shared_with_user_id == current_user.id, Share.owner_id == current_user.id),
        Share.folder_id.is_not(None),
    )
    files_result = await session.execute(
        select(File).where(File.id.in_(shared_file_ids), File.is_deleted.is_(False)).order_by(File.updated_at.desc())
    )
    folders_result = await session.execute(
        select(Folder).where(Folder.id.in_(shared_folder_ids), Folder.is_deleted.is_(False)).order_by(Folder.updated_at.desc())
    )
    return SharedItemsResponse(files=list(files_result.scalars().all()), folders=list(folders_result.scalars().all()))


@router.post("/public-link", response_model=PublicLinkCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_public_link(
    payload: PublicLinkCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> PublicLinkCreateResponse:
    await _require_owned_target(session, current_user.id, payload.file_id, payload.folder_id)

    token = secrets.token_urlsafe(32)
    link_share = LinkShare(
        created_by=current_user.id,
        file_id=payload.file_id,
        folder_id=payload.folder_id,
        token_hash=_hash_token(token),
        password_hash=hash_password(payload.password) if payload.password else None,
        role=payload.role.value,
        expires_at=payload.expires_at,
    )
    session.add(link_share)
    add_activity(session, user_id=current_user.id, action="create_public_link", file_id=payload.file_id, folder_id=payload.folder_id)
    await session.commit()
    await session.refresh(link_share)

    return PublicLinkCreateResponse(
        id=link_share.id,
        token=token,
        public_path=f"/api/v1/public-link/{token}",
        role=ShareRole(link_share.role),
        file_id=link_share.file_id,
        folder_id=link_share.folder_id,
        expires_at=link_share.expires_at,
    )


@router.post("/public-link/{token}", response_model=PublicLinkAccessResponse)
async def access_public_link(
    token: str,
    payload: PublicLinkAccessRequest = Body(default_factory=PublicLinkAccessRequest),
    session: AsyncSession = Depends(get_db_session),
) -> PublicLinkAccessResponse:
    result = await session.execute(select(LinkShare).where(LinkShare.token_hash == _hash_token(token)))
    link_share = result.scalar_one_or_none()
    if not link_share or not link_share.is_active or public_link_is_expired(link_share):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public link not found")

    if link_share.password_hash:
        if not payload.password or not verify_password(payload.password, link_share.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid public link password")

    file = await session.get(File, link_share.file_id) if link_share.file_id else None
    folder = await session.get(Folder, link_share.folder_id) if link_share.folder_id else None
    if (file and file.is_deleted) or (folder and folder.is_deleted):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public link not found")

    download = None
    files: list[PublicLinkFileEntry] = []
    folders = []
    if file:
        signed_download = await get_storage_service().create_signed_download_url(
            file.storage_key,
            settings.signed_download_expires_in_seconds,
        )
        download = FileDownloadResponse(
            file_id=file.id,
            download_url=signed_download.download_url,
            expires_in_seconds=signed_download.expires_in_seconds,
        )
    if folder:
        child_files = await session.execute(
            select(File)
            .where(File.folder_id == folder.id, File.is_deleted.is_(False))
            .order_by(File.name.asc())
        )
        child_folders = await session.execute(
            select(Folder)
            .where(Folder.parent_id == folder.id, Folder.is_deleted.is_(False))
            .order_by(Folder.name.asc())
        )
        for child_file in child_files.scalars().all():
            child_download = await get_storage_service().create_signed_download_url(
                child_file.storage_key,
                settings.signed_download_expires_in_seconds,
            )
            files.append(
                PublicLinkFileEntry(
                    file=child_file,
                    download=FileDownloadResponse(
                        file_id=child_file.id,
                        download_url=child_download.download_url,
                        expires_in_seconds=child_download.expires_in_seconds,
                    ),
                )
            )
        folders = list(child_folders.scalars().all())

    return PublicLinkAccessResponse(
        id=link_share.id,
        role=ShareRole(link_share.role),
        file_id=link_share.file_id,
        folder_id=link_share.folder_id,
        expires_at=link_share.expires_at,
        file=file,
        folder=folder,
        files=files,
        folders=folders,
        download=download,
    )


async def _require_owned_target(
    session: AsyncSession,
    owner_id: uuid.UUID,
    file_id: uuid.UUID | None,
    folder_id: uuid.UUID | None,
) -> None:
    if file_id:
        file = await session.get(File, file_id)
        if not file or file.owner_id != owner_id or file.is_deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        return

    if folder_id:
        folder = await session.get(Folder, folder_id)
        if not folder or folder.owner_id != owner_id or folder.is_deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")


async def _get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def _get_users_by_id(session: AsyncSession, user_ids: list[uuid.UUID]) -> dict[uuid.UUID, User]:
    if not user_ids:
        return {}
    result = await session.execute(select(User).where(User.id.in_(user_ids)))
    return {user.id: user for user in result.scalars().all()}


async def _get_existing_share(
    session: AsyncSession,
    shared_with_user_id: uuid.UUID,
    file_id: uuid.UUID | None,
    folder_id: uuid.UUID | None,
) -> Share | None:
    result = await session.execute(
        select(Share).where(
            Share.shared_with_user_id == shared_with_user_id,
            Share.file_id == file_id,
            Share.folder_id == folder_id,
        )
    )
    return result.scalar_one_or_none()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _serialize_share(share: Share, shared_user: User | None) -> ShareRead:
    return ShareRead(
        id=share.id,
        owner_id=share.owner_id,
        shared_with_user_id=share.shared_with_user_id,
        shared_with_email=shared_user.email if shared_user else None,
        file_id=share.file_id,
        folder_id=share.folder_id,
        role=ShareRole(share.role),
        created_at=share.created_at,
        updated_at=share.updated_at,
    )

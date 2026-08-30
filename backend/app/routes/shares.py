import hashlib
import secrets
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.security import hash_password, verify_password
from app.deps import get_current_user
from app.models import File, Folder, LinkShare, Share, ShareRole, User
from app.schemas.share import (
    PublicLinkAccessRequest,
    PublicLinkAccessResponse,
    PublicLinkCreate,
    PublicLinkCreateResponse,
    ShareCreate,
    ShareRead,
)
from app.services.permissions import public_link_is_expired

router = APIRouter(tags=["sharing"])


@router.post("/shares", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
async def create_share(
    payload: ShareCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Share:
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
        return existing_share

    share = Share(
        owner_id=current_user.id,
        shared_with_user_id=shared_user.id,
        file_id=payload.file_id,
        folder_id=payload.folder_id,
        role=payload.role.value,
    )
    session.add(share)
    await session.commit()
    await session.refresh(share)
    return share


@router.get("/shares", response_model=list[ShareRead])
async def list_shares(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[Share]:
    result = await session.execute(
        select(Share).where(Share.owner_id == current_user.id).order_by(Share.created_at.desc())
    )
    return list(result.scalars().all())


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
    await session.commit()


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

    return PublicLinkAccessResponse(
        id=link_share.id,
        role=ShareRole(link_share.role),
        file_id=link_share.file_id,
        folder_id=link_share.folder_id,
        expires_at=link_share.expires_at,
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

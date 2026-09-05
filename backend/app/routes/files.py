import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db_session
from app.deps import get_current_user
from app.models import File, FileUploadStatus, FileVersion, Folder, ShareRole, User
from app.schemas.file import (
    CompleteUploadRequest,
    FileDownloadResponse,
    FileRead,
    FileUpdate,
    FileVersionRead,
    InitUploadRequest,
    InitUploadResponse,
)
from app.services.activity import add_activity
from app.services.permissions import require_file_permission, require_folder_permission
from app.services.storage import SIGNED_UPLOAD_EXPIRES_IN_SECONDS, build_storage_key, get_storage_service

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/init-upload", response_model=InitUploadResponse, status_code=status.HTTP_201_CREATED)
async def init_upload(
    payload: InitUploadRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> InitUploadResponse:
    if payload.folder_id:
        folder = await session.get(Folder, payload.folder_id)
        if not folder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
        await require_folder_permission(session, folder, current_user.id, ShareRole.EDITOR)

    file_id = uuid.uuid4()
    storage_key = build_storage_key(current_user.id, file_id, payload.name)
    storage_service = get_storage_service()
    signed_upload = await storage_service.create_signed_upload_url(storage_key)

    file = File(
        id=file_id,
        owner_id=current_user.id,
        folder_id=payload.folder_id,
        name=payload.name,
        mime_type=payload.mime_type,
        size_bytes=payload.size_bytes,
        storage_provider=storage_service.provider,
        storage_bucket=settings.supabase_storage_bucket,
        storage_key=signed_upload.storage_key,
        checksum=payload.checksum,
        upload_status=FileUploadStatus.PENDING.value,
    )
    session.add(file)
    await session.flush()
    add_activity(session, user_id=current_user.id, action="init_upload", file_id=file.id, folder_id=file.folder_id)
    await session.commit()

    return InitUploadResponse(
        file_id=file.id,
        storage_provider=file.storage_provider,
        storage_bucket=file.storage_bucket,
        storage_key=file.storage_key,
        upload_url=signed_upload.upload_url,
        upload_token=signed_upload.upload_token,
        expires_in_seconds=SIGNED_UPLOAD_EXPIRES_IN_SECONDS,
    )


@router.post("/complete-upload", response_model=FileRead)
async def complete_upload(
    payload: CompleteUploadRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> File:
    file = await session.get(File, payload.file_id)
    if not file or file.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await require_file_permission(session, file, current_user.id, ShareRole.EDITOR)

    file.upload_status = FileUploadStatus.COMPLETED.value
    file.checksum = payload.checksum or file.checksum
    file.updated_at = datetime.now(UTC)
    session.add(
        FileVersion(
            file_id=file.id,
            created_by=current_user.id,
            version_number=1,
            storage_key=file.storage_key,
            size_bytes=file.size_bytes,
            checksum=file.checksum,
        )
    )
    add_activity(session, user_id=current_user.id, action="complete_upload", file_id=file.id, folder_id=file.folder_id)
    await session.commit()
    await session.refresh(file)
    return file


@router.get("", response_model=list[FileRead])
async def list_files(
    folder_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[File]:
    if folder_id:
        folder = await session.get(Folder, folder_id)
        if not folder or folder.is_deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
        await require_folder_permission(session, folder, current_user.id, ShareRole.VIEWER)
        owner_filter = File.folder_id == folder_id
    else:
        owner_filter = File.owner_id == current_user.id

    result = await session.execute(
        select(File)
        .where(
            owner_filter,
            File.folder_id == folder_id,
            File.is_deleted.is_(False),
        )
        .order_by(File.name.asc())
    )
    return list(result.scalars().all())


@router.get("/{file_id}", response_model=FileRead)
async def get_file(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> File:
    file = await session.get(File, file_id)
    if not file or file.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await require_file_permission(session, file, current_user.id, ShareRole.VIEWER)
    return file


@router.get("/{file_id}/download-url", response_model=FileDownloadResponse)
async def get_file_download_url(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> FileDownloadResponse:
    file = await session.get(File, file_id)
    if not file or file.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await require_file_permission(session, file, current_user.id, ShareRole.VIEWER)

    signed_download = await get_storage_service().create_signed_download_url(
        file.storage_key,
        settings.signed_download_expires_in_seconds,
    )
    add_activity(session, user_id=current_user.id, action="download_file", file_id=file.id, folder_id=file.folder_id)
    await session.commit()
    return FileDownloadResponse(
        file_id=file.id,
        download_url=signed_download.download_url,
        expires_in_seconds=signed_download.expires_in_seconds,
    )


@router.get("/{file_id}/versions", response_model=list[FileVersionRead])
async def list_file_versions(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[FileVersion]:
    file = await session.get(File, file_id)
    if not file or file.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await require_file_permission(session, file, current_user.id, ShareRole.VIEWER)

    result = await session.execute(
        select(FileVersion).where(FileVersion.file_id == file.id).order_by(FileVersion.version_number.desc())
    )
    return list(result.scalars().all())


@router.patch("/{file_id}", response_model=FileRead)
async def update_file(
    file_id: uuid.UUID,
    payload: FileUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> File:
    file = await session.get(File, file_id)
    if not file or file.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await require_file_permission(session, file, current_user.id, ShareRole.EDITOR)

    if payload.name is not None:
        file.name = payload.name

    if "folder_id" in payload.model_fields_set:
        if payload.folder_id:
            folder = await session.get(Folder, payload.folder_id)
            if not folder:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
            await require_folder_permission(session, folder, current_user.id, ShareRole.EDITOR)
        file.folder_id = payload.folder_id

    file.updated_at = datetime.now(UTC)
    add_activity(session, user_id=current_user.id, action="update_file", file_id=file.id, folder_id=file.folder_id)
    await session.commit()
    await session.refresh(file)
    return file


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    file = await session.get(File, file_id)
    if not file or file.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await require_file_permission(session, file, current_user.id, ShareRole.EDITOR)

    file.is_deleted = True
    file.deleted_at = datetime.now(UTC)
    file.updated_at = file.deleted_at
    add_activity(session, user_id=current_user.id, action="delete_file", file_id=file.id, folder_id=file.folder_id)
    await session.commit()

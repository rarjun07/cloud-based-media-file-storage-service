from dataclasses import dataclass
import hmac
from pathlib import Path
from urllib.parse import quote
from uuid import UUID

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


SIGNED_UPLOAD_EXPIRES_IN_SECONDS = 2 * 60 * 60


@dataclass(frozen=True)
class SignedUpload:
    upload_url: str
    upload_token: str
    storage_key: str


@dataclass(frozen=True)
class SignedDownload:
    download_url: str
    expires_in_seconds: int


class SupabaseStorageService:
    provider = "supabase"

    def __init__(self, supabase_url: str, service_role_key: str, bucket: str) -> None:
        self.supabase_url = supabase_url.rstrip("/")
        self.service_role_key = service_role_key
        self.bucket = bucket

    async def create_signed_upload_url(self, storage_key: str) -> SignedUpload:
        if not self.supabase_url or not self.service_role_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase storage is not configured",
            )

        url = f"{self.supabase_url}/storage/v1/object/upload/sign/{self.bucket}/{storage_key}"
        headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
        }

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, headers=headers, json={})

        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to create signed upload URL",
            )

        data = response.json()
        signed_url = data.get("signedURL") or data.get("signedUrl") or data.get("url")
        token = data.get("token")
        if signed_url and not signed_url.startswith("http"):
            signed_url = f"{self.supabase_url}/storage/v1{signed_url}"
        if not token and signed_url and "token=" in signed_url:
            token = signed_url.split("token=", 1)[1].split("&", 1)[0]
        if not signed_url or not token:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Storage provider returned an invalid signed upload response",
            )

        return SignedUpload(upload_url=signed_url, upload_token=token, storage_key=storage_key)

    async def create_signed_download_url(self, storage_key: str, expires_in_seconds: int) -> SignedDownload:
        if not self.supabase_url or not self.service_role_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase storage is not configured",
            )

        url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket}/{storage_key}"
        headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
        }

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, headers=headers, json={"expiresIn": expires_in_seconds})

        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to create signed download URL",
            )

        data = response.json()
        signed_url = data.get("signedURL") or data.get("signedUrl") or data.get("url")
        if signed_url and not signed_url.startswith("http"):
            signed_url = f"{self.supabase_url}/storage/v1{signed_url}"
        if not signed_url:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Storage provider returned an invalid signed download response",
            )

        return SignedDownload(download_url=signed_url, expires_in_seconds=expires_in_seconds)


class LocalStorageService:
    provider = "local"

    def __init__(self, root: Path, backend_url: str) -> None:
        self.root = root
        self.backend_url = backend_url.rstrip("/")

    async def create_signed_upload_url(self, storage_key: str) -> SignedUpload:
        token = create_local_storage_token(storage_key)
        encoded_key = quote(storage_key, safe="/")
        return SignedUpload(
            upload_url=f"{self.backend_url}{settings.api_v1_prefix}/local-storage/upload/{encoded_key}?token={token}",
            upload_token=token,
            storage_key=storage_key,
        )

    async def create_signed_download_url(self, storage_key: str, expires_in_seconds: int) -> SignedDownload:
        token = create_local_storage_token(storage_key)
        encoded_key = quote(storage_key, safe="/")
        return SignedDownload(
            download_url=f"{self.backend_url}{settings.api_v1_prefix}/local-storage/download/{encoded_key}?token={token}",
            expires_in_seconds=expires_in_seconds,
        )


def build_storage_key(user_id: UUID, file_id: UUID, filename: str) -> str:
    safe_filename = _sanitize_filename(filename)
    return f"users/{user_id}/files/{file_id}/{safe_filename}"


def get_storage_service() -> SupabaseStorageService | LocalStorageService:
    if settings.storage_provider == "local" or (
        settings.app_env == "development" and (not settings.supabase_url or not settings.supabase_service_role_key)
    ):
        return LocalStorageService(settings.local_storage_root, settings.backend_url)

    return SupabaseStorageService(
        supabase_url=settings.supabase_url,
        service_role_key=settings.supabase_service_role_key,
        bucket=settings.supabase_storage_bucket,
    )


def create_local_storage_token(storage_key: str) -> str:
    return hmac.new(settings.jwt_secret_key.encode("utf-8"), storage_key.encode("utf-8"), "sha256").hexdigest()


def verify_local_storage_token(storage_key: str, token: str) -> bool:
    expected = create_local_storage_token(storage_key)
    return hmac.compare_digest(expected, token)


def local_storage_path(storage_key: str) -> Path:
    path = Path(storage_key)
    if path.is_absolute() or ".." in path.parts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid storage key")
    return settings.local_storage_root / path


def _sanitize_filename(filename: str) -> str:
    cleaned = filename.strip().replace("\\", "-").replace("/", "-")
    return "".join(character if character.isalnum() or character in "._- " else "-" for character in cleaned)

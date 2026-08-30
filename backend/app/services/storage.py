from dataclasses import dataclass
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


class SupabaseStorageService:
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


def build_storage_key(user_id: UUID, file_id: UUID, filename: str) -> str:
    safe_filename = _sanitize_filename(filename)
    return f"users/{user_id}/files/{file_id}/{safe_filename}"


def get_storage_service() -> SupabaseStorageService:
    return SupabaseStorageService(
        supabase_url=settings.supabase_url,
        service_role_key=settings.supabase_service_role_key,
        bucket=settings.supabase_storage_bucket,
    )


def _sanitize_filename(filename: str) -> str:
    cleaned = filename.strip().replace("\\", "-").replace("/", "-")
    return "".join(character if character.isalnum() or character in "._- " else "-" for character in cleaned)

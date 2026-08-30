import pytest
from pydantic import ValidationError

from app.schemas.file import InitUploadRequest
from app.services.storage import SupabaseStorageService, build_storage_key


def test_init_upload_request_rejects_path_separator() -> None:
    with pytest.raises(ValidationError):
        InitUploadRequest(name="../secret.png", mime_type="image/png", size_bytes=1024)


def test_init_upload_request_rejects_disallowed_mime_type() -> None:
    with pytest.raises(ValidationError):
        InitUploadRequest(name="script.js", mime_type="application/javascript", size_bytes=1024)


def test_storage_key_includes_user_and_file_ids(sample_uuid) -> None:
    file_id = sample_uuid("00000000-0000-0000-0000-000000000002")
    user_id = sample_uuid("00000000-0000-0000-0000-000000000001")

    storage_key = build_storage_key(user_id, file_id, "profile image.png")

    assert storage_key == (
        "users/00000000-0000-0000-0000-000000000001/"
        "files/00000000-0000-0000-0000-000000000002/profile image.png"
    )


@pytest.mark.anyio
async def test_supabase_signed_upload_response_parsing(monkeypatch) -> None:
    class FakeResponse:
        status_code = 200

        def json(self) -> dict[str, str]:
            return {
                "url": "/object/upload/sign/media-files/users/u/files/f/photo.png?token=signed-token",
            }

    class FakeAsyncClient:
        def __init__(self, timeout: int) -> None:
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            return None

        async def post(self, url: str, headers: dict[str, str], json: dict) -> FakeResponse:
            assert url == "https://project.supabase.co/storage/v1/object/upload/sign/media-files/path/file.png"
            assert headers["apikey"] == "service-role-key"
            assert headers["Authorization"] == "Bearer service-role-key"
            assert json == {}
            return FakeResponse()

    monkeypatch.setattr("app.services.storage.httpx.AsyncClient", FakeAsyncClient)
    service = SupabaseStorageService(
        supabase_url="https://project.supabase.co",
        service_role_key="service-role-key",
        bucket="media-files",
    )

    signed_upload = await service.create_signed_upload_url("path/file.png")

    assert signed_upload.upload_url == (
        "https://project.supabase.co/storage/v1/object/upload/sign/"
        "media-files/users/u/files/f/photo.png?token=signed-token"
    )
    assert signed_upload.upload_token == "signed-token"
    assert signed_upload.storage_key == "path/file.png"

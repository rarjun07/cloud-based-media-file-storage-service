from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest
from fastapi import HTTPException

from app.core.security import hash_password
from app.models import File, Folder, LinkShare, Share, ShareRole
from app.routes.shares import _hash_token, access_public_link
from app.schemas.share import PublicLinkAccessRequest
from app.services.permissions import get_file_permission, get_folder_permission, require_file_permission


class FakeScalarResult:
    def __init__(self, items: list) -> None:
        self.items = items

    def all(self) -> list:
        return self.items


class FakeExecuteResult:
    def __init__(self, items: list) -> None:
        self.items = items

    def scalar_one_or_none(self):
        return self.items[0] if self.items else None

    def scalars(self) -> FakeScalarResult:
        return FakeScalarResult(self.items)


class FakePermissionSession:
    def __init__(self, items: dict, shares: list[Share] | None = None, links: list[LinkShare] | None = None) -> None:
        self.items = items
        self.shares = shares or []
        self.links = links or []

    async def get(self, model, item_id):
        return self.items.get((model, item_id))

    async def execute(self, statement) -> FakeExecuteResult:
        statement_text = str(statement)
        filters = _extract_filters(statement)

        if "FROM shares" in statement_text:
            return FakeExecuteResult(
                [
                    share
                    for share in self.shares
                    if share.shared_with_user_id == filters.get("shared_with_user_id")
                    and share.file_id == filters.get("file_id")
                    and share.folder_id == filters.get("folder_id")
                ]
            )

        if "FROM link_shares" in statement_text:
            return FakeExecuteResult(
                [link for link in self.links if link.token_hash == filters.get("token_hash")]
            )

        return FakeExecuteResult([])


def _extract_filters(statement) -> dict[str, object]:
    filters = {}
    for criterion in statement._where_criteria:
        left = str(getattr(criterion, "left", ""))
        field_name = left.rsplit(".", maxsplit=1)[-1]
        filters[field_name] = getattr(getattr(criterion, "right", None), "value", None)
    return filters


@pytest.mark.anyio
async def test_owner_has_full_file_permission(sample_uuid) -> None:
    owner_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    file = _file(sample_uuid("00000000-0000-0000-0000-000000000002"), owner_id)
    session = FakePermissionSession({})

    assert await get_file_permission(session, file, owner_id) == ShareRole.OWNER
    assert await require_file_permission(session, file, owner_id, ShareRole.EDITOR) == ShareRole.OWNER


@pytest.mark.anyio
async def test_editor_can_write_but_viewer_cannot(sample_uuid) -> None:
    owner_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    editor_id = sample_uuid("00000000-0000-0000-0000-000000000002")
    viewer_id = sample_uuid("00000000-0000-0000-0000-000000000003")
    file_id = sample_uuid("00000000-0000-0000-0000-000000000004")
    file = _file(file_id, owner_id)
    session = FakePermissionSession(
        {},
        shares=[
            _share(owner_id, editor_id, ShareRole.EDITOR, file_id=file_id),
            _share(owner_id, viewer_id, ShareRole.VIEWER, file_id=file_id),
        ],
    )

    assert await require_file_permission(session, file, editor_id, ShareRole.EDITOR) == ShareRole.EDITOR
    assert await get_file_permission(session, file, viewer_id) == ShareRole.VIEWER

    with pytest.raises(HTTPException) as exc_info:
        await require_file_permission(session, file, viewer_id, ShareRole.EDITOR)

    assert exc_info.value.status_code == 403


@pytest.mark.anyio
async def test_folder_share_inherits_to_child_folder_and_files(sample_uuid) -> None:
    owner_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    shared_user_id = sample_uuid("00000000-0000-0000-0000-000000000002")
    root_id = sample_uuid("00000000-0000-0000-0000-000000000003")
    child_id = sample_uuid("00000000-0000-0000-0000-000000000004")
    file_id = sample_uuid("00000000-0000-0000-0000-000000000005")
    root = Folder(id=root_id, owner_id=owner_id, parent_id=None, name="Root")
    child = Folder(id=child_id, owner_id=owner_id, parent_id=root_id, name="Child")
    file = _file(file_id, owner_id, folder_id=child_id)
    session = FakePermissionSession(
        {(Folder, root_id): root, (Folder, child_id): child},
        shares=[_share(owner_id, shared_user_id, ShareRole.VIEWER, folder_id=root_id)],
    )

    assert await get_folder_permission(session, child, shared_user_id) == ShareRole.VIEWER
    assert await get_file_permission(session, file, shared_user_id) == ShareRole.VIEWER


@pytest.mark.anyio
async def test_public_link_user_can_access_with_valid_password(sample_uuid) -> None:
    token = "public-token"
    link = LinkShare(
        id=sample_uuid("00000000-0000-0000-0000-000000000001"),
        created_by=sample_uuid("00000000-0000-0000-0000-000000000002"),
        file_id=sample_uuid("00000000-0000-0000-0000-000000000003"),
        token_hash=_hash_token(token),
        password_hash=hash_password("LinkPassword123"),
        role=ShareRole.VIEWER.value,
        is_active=True,
        expires_at=datetime.now(UTC) + timedelta(minutes=10),
    )
    session = FakePermissionSession({}, links=[link])

    response = await access_public_link(
        token,
        PublicLinkAccessRequest(password="LinkPassword123"),
        session=session,
    )

    assert response.role == ShareRole.VIEWER
    assert response.file_id == link.file_id


@pytest.mark.anyio
async def test_public_link_rejects_invalid_password(sample_uuid) -> None:
    token = "public-token"
    link = LinkShare(
        id=sample_uuid("00000000-0000-0000-0000-000000000001"),
        created_by=sample_uuid("00000000-0000-0000-0000-000000000002"),
        file_id=sample_uuid("00000000-0000-0000-0000-000000000003"),
        token_hash=_hash_token(token),
        password_hash=hash_password("LinkPassword123"),
        role=ShareRole.VIEWER.value,
        is_active=True,
    )
    session = FakePermissionSession({}, links=[link])

    with pytest.raises(HTTPException) as exc_info:
        await access_public_link(token, PublicLinkAccessRequest(password="wrong"), session=session)

    assert exc_info.value.status_code == 401


def _file(file_id: UUID, owner_id: UUID, folder_id: UUID | None = None) -> File:
    return File(
        id=file_id,
        owner_id=owner_id,
        folder_id=folder_id,
        name="photo.png",
        mime_type="image/png",
        size_bytes=1024,
        storage_provider="supabase",
        storage_bucket="media-files",
        storage_key=f"users/{owner_id}/files/{file_id}/photo.png",
    )


def _share(
    owner_id: UUID,
    shared_with_user_id: UUID,
    role: ShareRole,
    file_id: UUID | None = None,
    folder_id: UUID | None = None,
) -> Share:
    return Share(
        owner_id=owner_id,
        shared_with_user_id=shared_with_user_id,
        file_id=file_id,
        folder_id=folder_id,
        role=role.value,
    )

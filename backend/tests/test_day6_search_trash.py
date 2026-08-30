from datetime import UTC, datetime

import pytest

from app.models import File, Folder
from app.routes.trash import restore_file, restore_folder


class FakeTrashSession:
    def __init__(self, items: dict) -> None:
        self.items = items
        self.committed = False
        self.refreshed = None

    async def get(self, model, item_id):
        return self.items.get((model, item_id))

    async def commit(self) -> None:
        self.committed = True

    async def refresh(self, item) -> None:
        self.refreshed = item


def test_file_indexes_cover_search_and_trash_filters() -> None:
    index_names = {index.name for index in File.__table__.indexes}

    assert "ix_files_owner_deleted_name" in index_names
    assert "ix_files_owner_deleted_mime_type" in index_names
    assert "ix_files_folder_deleted" in index_names


def test_folder_indexes_cover_hierarchy_listing() -> None:
    index_names = {index.name for index in Folder.__table__.indexes}

    assert "ix_folders_owner_parent_deleted_name" in index_names


@pytest.mark.anyio
async def test_restore_file_moves_to_root_when_parent_is_deleted(sample_uuid) -> None:
    owner_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    folder_id = sample_uuid("00000000-0000-0000-0000-000000000002")
    file_id = sample_uuid("00000000-0000-0000-0000-000000000003")
    user = _user(owner_id)
    folder = Folder(id=folder_id, owner_id=owner_id, name="Old Parent", is_deleted=True)
    file = File(
        id=file_id,
        owner_id=owner_id,
        folder_id=folder_id,
        name="photo.png",
        mime_type="image/png",
        size_bytes=1024,
        storage_provider="supabase",
        storage_bucket="media-files",
        storage_key="users/owner/files/photo.png",
        is_deleted=True,
        deleted_at=datetime.now(UTC),
    )
    session = FakeTrashSession({(File, file_id): file, (Folder, folder_id): folder})

    restored = await restore_file(file_id, current_user=user, session=session)

    assert restored.folder_id is None
    assert restored.is_deleted is False
    assert restored.deleted_at is None
    assert session.committed is True
    assert session.refreshed is file


@pytest.mark.anyio
async def test_restore_folder_moves_to_root_when_parent_is_deleted(sample_uuid) -> None:
    owner_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    parent_id = sample_uuid("00000000-0000-0000-0000-000000000002")
    folder_id = sample_uuid("00000000-0000-0000-0000-000000000003")
    user = _user(owner_id)
    parent = Folder(id=parent_id, owner_id=owner_id, name="Deleted Parent", is_deleted=True)
    folder = Folder(
        id=folder_id,
        owner_id=owner_id,
        parent_id=parent_id,
        name="Restored Folder",
        is_deleted=True,
        deleted_at=datetime.now(UTC),
    )
    session = FakeTrashSession({(Folder, folder_id): folder, (Folder, parent_id): parent})

    restored = await restore_folder(folder_id, current_user=user, session=session)

    assert restored.parent_id is None
    assert restored.is_deleted is False
    assert restored.deleted_at is None
    assert session.committed is True
    assert session.refreshed is folder


def _user(user_id):
    return type("UserStub", (), {"id": user_id})()

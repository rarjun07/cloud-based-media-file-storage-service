from uuid import UUID

import pytest
from pydantic import ValidationError

from app.models import Folder
from app.schemas.folder import FolderCreate
from app.services.folders import build_breadcrumbs, ensure_folder_is_not_descendant


class FakeFolderSession:
    def __init__(self, folders: dict[UUID, Folder]) -> None:
        self.folders = folders

    async def get(self, model, item_id: UUID):
        return self.folders.get(item_id)


def test_folder_create_rejects_path_separator() -> None:
    with pytest.raises(ValidationError):
        FolderCreate(name="bad/folder")


@pytest.mark.anyio
async def test_build_breadcrumbs_orders_root_to_leaf(sample_uuid) -> None:
    root_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    child_id = sample_uuid("00000000-0000-0000-0000-000000000002")
    leaf_id = sample_uuid("00000000-0000-0000-0000-000000000003")
    owner_id = sample_uuid("00000000-0000-0000-0000-000000000004")
    root = Folder(id=root_id, owner_id=owner_id, parent_id=None, name="Root")
    child = Folder(id=child_id, owner_id=owner_id, parent_id=root_id, name="Child")
    leaf = Folder(id=leaf_id, owner_id=owner_id, parent_id=child_id, name="Leaf")

    breadcrumbs = await build_breadcrumbs(FakeFolderSession({root_id: root, child_id: child, leaf_id: leaf}), leaf)

    assert [item.name for item in breadcrumbs] == ["Root", "Child", "Leaf"]


@pytest.mark.anyio
async def test_ensure_folder_is_not_descendant_rejects_cycle(sample_uuid) -> None:
    root_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    child_id = sample_uuid("00000000-0000-0000-0000-000000000002")
    leaf_id = sample_uuid("00000000-0000-0000-0000-000000000003")
    owner_id = sample_uuid("00000000-0000-0000-0000-000000000004")
    root = Folder(id=root_id, owner_id=owner_id, parent_id=None, name="Root")
    child = Folder(id=child_id, owner_id=owner_id, parent_id=root_id, name="Child")
    leaf = Folder(id=leaf_id, owner_id=owner_id, parent_id=child_id, name="Leaf")

    allowed = await ensure_folder_is_not_descendant(
        FakeFolderSession({root_id: root, child_id: child, leaf_id: leaf}),
        folder_id=child_id,
        possible_parent_id=leaf_id,
    )

    assert allowed is False

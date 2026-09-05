from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.models import LinkShare, Share, ShareRole, User
from app.routes.shares import _serialize_share
from app.schemas.share import PublicLinkCreate, ShareCreate
from app.services.permissions import public_link_is_expired


def test_share_create_requires_exactly_one_target(sample_uuid) -> None:
    file_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    folder_id = sample_uuid("00000000-0000-0000-0000-000000000002")

    with pytest.raises(ValidationError):
        ShareCreate(shared_with_email="user@example.com", file_id=file_id, folder_id=folder_id)

    with pytest.raises(ValidationError):
        ShareCreate(shared_with_email="user@example.com")


def test_share_create_rejects_owner_role(sample_uuid) -> None:
    with pytest.raises(ValidationError):
        ShareCreate(
            shared_with_email="user@example.com",
            role=ShareRole.OWNER,
            file_id=sample_uuid("00000000-0000-0000-0000-000000000001"),
        )


def test_public_link_create_rejects_editor_role(sample_uuid) -> None:
    with pytest.raises(ValidationError):
        PublicLinkCreate(
            role=ShareRole.EDITOR,
            file_id=sample_uuid("00000000-0000-0000-0000-000000000001"),
        )


def test_public_link_create_requires_future_expiry(sample_uuid) -> None:
    with pytest.raises(ValidationError):
        PublicLinkCreate(
            file_id=sample_uuid("00000000-0000-0000-0000-000000000001"),
            expires_at=datetime.now(UTC) - timedelta(minutes=1),
        )


def test_public_link_expiry_detection(sample_uuid) -> None:
    link_share = LinkShare(
        id=sample_uuid("00000000-0000-0000-0000-000000000001"),
        created_by=sample_uuid("00000000-0000-0000-0000-000000000002"),
        file_id=sample_uuid("00000000-0000-0000-0000-000000000003"),
        token_hash="abc123",
        role=ShareRole.VIEWER.value,
        expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )

    assert public_link_is_expired(link_share)


def test_share_serialization_includes_shared_user_email(sample_uuid) -> None:
    now = datetime.now(UTC)
    owner_id = sample_uuid("00000000-0000-0000-0000-000000000001")
    shared_user_id = sample_uuid("00000000-0000-0000-0000-000000000002")
    file_id = sample_uuid("00000000-0000-0000-0000-000000000003")
    share = Share(
        id=sample_uuid("00000000-0000-0000-0000-000000000004"),
        owner_id=owner_id,
        shared_with_user_id=shared_user_id,
        file_id=file_id,
        role=ShareRole.VIEWER.value,
        created_at=now,
        updated_at=now,
    )
    shared_user = User(
        id=shared_user_id,
        email="shared@example.com",
        password_hash="hashed",
        created_at=now,
        updated_at=now,
    )

    result = _serialize_share(share, shared_user)

    assert result.shared_with_email == "shared@example.com"
    assert result.role == ShareRole.VIEWER

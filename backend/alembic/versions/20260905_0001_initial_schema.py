"""Initial production schema.

Revision ID: 20260905_0001
Revises:
Create Date: 2026-09-05 00:00:00 UTC
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260905_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("profile_image_url", sa.Text(), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("oauth_provider", sa.String(length=50), nullable=True),
        sa.Column("oauth_provider_id", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "folders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("parent_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["parent_id"], ["folders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_folders_owner_id"), "folders", ["owner_id"], unique=False)
    op.create_index(op.f("ix_folders_parent_id"), "folders", ["parent_id"], unique=False)
    op.create_index(
        "ix_folders_owner_parent_deleted_name",
        "folders",
        ["owner_id", "parent_id", "is_deleted", "name"],
        unique=False,
    )

    op.create_table(
        "files",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("folder_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("storage_provider", sa.String(length=50), nullable=False),
        sa.Column("storage_bucket", sa.String(length=255), nullable=False),
        sa.Column("storage_key", sa.String(length=1024), nullable=False),
        sa.Column("checksum", sa.String(length=128), nullable=True),
        sa.Column("upload_status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["folder_id"], ["folders.id"]),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_files_folder_id"), "files", ["folder_id"], unique=False)
    op.create_index(op.f("ix_files_owner_id"), "files", ["owner_id"], unique=False)
    op.create_index(op.f("ix_files_storage_key"), "files", ["storage_key"], unique=True)
    op.create_index("ix_files_folder_deleted", "files", ["folder_id", "is_deleted"], unique=False)
    op.create_index("ix_files_owner_deleted_mime_type", "files", ["owner_id", "is_deleted", "mime_type"], unique=False)
    op.create_index("ix_files_owner_deleted_name", "files", ["owner_id", "is_deleted", "name"], unique=False)

    op.create_table(
        "shares",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("shared_with_user_id", sa.UUID(), nullable=False),
        sa.Column("file_id", sa.UUID(), nullable=True),
        sa.Column("folder_id", sa.UUID(), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"]),
        sa.ForeignKeyConstraint(["folder_id"], ["folders.id"]),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["shared_with_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_shares_file_id"), "shares", ["file_id"], unique=False)
    op.create_index(op.f("ix_shares_folder_id"), "shares", ["folder_id"], unique=False)
    op.create_index(op.f("ix_shares_owner_id"), "shares", ["owner_id"], unique=False)
    op.create_index(op.f("ix_shares_shared_with_user_id"), "shares", ["shared_with_user_id"], unique=False)
    op.create_index("ix_shares_owner_created", "shares", ["owner_id", "created_at"], unique=False)
    op.create_index("ix_shares_shared_user_file", "shares", ["shared_with_user_id", "file_id"], unique=False)
    op.create_index("ix_shares_shared_user_folder", "shares", ["shared_with_user_id", "folder_id"], unique=False)

    op.create_table(
        "link_shares",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("file_id", sa.UUID(), nullable=True),
        sa.Column("folder_id", sa.UUID(), nullable=True),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"]),
        sa.ForeignKeyConstraint(["folder_id"], ["folders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_link_shares_created_by"), "link_shares", ["created_by"], unique=False)
    op.create_index(op.f("ix_link_shares_file_id"), "link_shares", ["file_id"], unique=False)
    op.create_index(op.f("ix_link_shares_folder_id"), "link_shares", ["folder_id"], unique=False)
    op.create_index(op.f("ix_link_shares_token_hash"), "link_shares", ["token_hash"], unique=True)
    op.create_index("ix_link_shares_active_expires", "link_shares", ["is_active", "expires_at"], unique=False)

    op.create_table(
        "file_versions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("file_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(length=1024), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("checksum", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_file_versions_created_by"), "file_versions", ["created_by"], unique=False)
    op.create_index(op.f("ix_file_versions_file_id"), "file_versions", ["file_id"], unique=False)
    op.create_index("ix_file_versions_file_created", "file_versions", ["file_id", "created_at"], unique=False)

    op.create_table(
        "stars",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("file_id", sa.UUID(), nullable=True),
        sa.Column("folder_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"]),
        sa.ForeignKeyConstraint(["folder_id"], ["folders.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "file_id", name="uq_stars_user_file"),
        sa.UniqueConstraint("user_id", "folder_id", name="uq_stars_user_folder"),
    )
    op.create_index(op.f("ix_stars_file_id"), "stars", ["file_id"], unique=False)
    op.create_index(op.f("ix_stars_folder_id"), "stars", ["folder_id"], unique=False)
    op.create_index(op.f("ix_stars_user_id"), "stars", ["user_id"], unique=False)
    op.create_index("ix_stars_user_created", "stars", ["user_id", "created_at"], unique=False)

    op.create_table(
        "activities",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("file_id", sa.UUID(), nullable=True),
        sa.Column("folder_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"]),
        sa.ForeignKeyConstraint(["folder_id"], ["folders.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_activities_file_id"), "activities", ["file_id"], unique=False)
    op.create_index(op.f("ix_activities_folder_id"), "activities", ["folder_id"], unique=False)
    op.create_index(op.f("ix_activities_user_id"), "activities", ["user_id"], unique=False)
    op.create_index("ix_activities_file_created", "activities", ["file_id", "created_at"], unique=False)
    op.create_index("ix_activities_folder_created", "activities", ["folder_id", "created_at"], unique=False)
    op.create_index("ix_activities_user_created", "activities", ["user_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_activities_user_created", table_name="activities")
    op.drop_index("ix_activities_folder_created", table_name="activities")
    op.drop_index("ix_activities_file_created", table_name="activities")
    op.drop_index(op.f("ix_activities_user_id"), table_name="activities")
    op.drop_index(op.f("ix_activities_folder_id"), table_name="activities")
    op.drop_index(op.f("ix_activities_file_id"), table_name="activities")
    op.drop_table("activities")

    op.drop_index("ix_stars_user_created", table_name="stars")
    op.drop_index(op.f("ix_stars_user_id"), table_name="stars")
    op.drop_index(op.f("ix_stars_folder_id"), table_name="stars")
    op.drop_index(op.f("ix_stars_file_id"), table_name="stars")
    op.drop_table("stars")

    op.drop_index("ix_file_versions_file_created", table_name="file_versions")
    op.drop_index(op.f("ix_file_versions_file_id"), table_name="file_versions")
    op.drop_index(op.f("ix_file_versions_created_by"), table_name="file_versions")
    op.drop_table("file_versions")

    op.drop_index("ix_link_shares_active_expires", table_name="link_shares")
    op.drop_index(op.f("ix_link_shares_token_hash"), table_name="link_shares")
    op.drop_index(op.f("ix_link_shares_folder_id"), table_name="link_shares")
    op.drop_index(op.f("ix_link_shares_file_id"), table_name="link_shares")
    op.drop_index(op.f("ix_link_shares_created_by"), table_name="link_shares")
    op.drop_table("link_shares")

    op.drop_index("ix_shares_shared_user_folder", table_name="shares")
    op.drop_index("ix_shares_shared_user_file", table_name="shares")
    op.drop_index("ix_shares_owner_created", table_name="shares")
    op.drop_index(op.f("ix_shares_shared_with_user_id"), table_name="shares")
    op.drop_index(op.f("ix_shares_owner_id"), table_name="shares")
    op.drop_index(op.f("ix_shares_folder_id"), table_name="shares")
    op.drop_index(op.f("ix_shares_file_id"), table_name="shares")
    op.drop_table("shares")

    op.drop_index("ix_files_owner_deleted_name", table_name="files")
    op.drop_index("ix_files_owner_deleted_mime_type", table_name="files")
    op.drop_index("ix_files_folder_deleted", table_name="files")
    op.drop_index(op.f("ix_files_storage_key"), table_name="files")
    op.drop_index(op.f("ix_files_owner_id"), table_name="files")
    op.drop_index(op.f("ix_files_folder_id"), table_name="files")
    op.drop_table("files")

    op.drop_index("ix_folders_owner_parent_deleted_name", table_name="folders")
    op.drop_index(op.f("ix_folders_parent_id"), table_name="folders")
    op.drop_index(op.f("ix_folders_owner_id"), table_name="folders")
    op.drop_table("folders")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

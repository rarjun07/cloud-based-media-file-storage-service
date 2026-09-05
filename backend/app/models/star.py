import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Star(Base):
    __tablename__ = "stars"
    __table_args__ = (
        UniqueConstraint("user_id", "file_id", name="uq_stars_user_file"),
        UniqueConstraint("user_id", "folder_id", name="uq_stars_user_folder"),
        Index("ix_stars_user_created", "user_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    file_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("files.id"), index=True, nullable=True)
    folder_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("folders.id"), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

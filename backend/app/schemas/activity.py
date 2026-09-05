from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ActivityRead(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    file_id: UUID | None
    folder_id: UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

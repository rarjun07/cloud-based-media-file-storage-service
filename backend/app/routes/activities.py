from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.deps import get_current_user
from app.models import Activity, User
from app.schemas.activity import ActivityRead

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=list[ActivityRead])
async def list_activities(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[Activity]:
    result = await session.execute(
        select(Activity).where(Activity.user_id == current_user.id).order_by(Activity.created_at.desc()).limit(100)
    )
    return list(result.scalars().all())

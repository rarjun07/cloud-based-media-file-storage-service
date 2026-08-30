from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.core.database import create_database_tables
from app.routes.auth import router as auth_router
from app.routes.files import router as files_router
from app.routes.folders import router as folders_router
from app.routes.health import router as health_router
from app.routes.shares import router as shares_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    if settings.create_tables_on_startup:
        await create_database_tables()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(files_router, prefix=settings.api_v1_prefix)
app.include_router(folders_router, prefix=settings.api_v1_prefix)
app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(shares_router, prefix=settings.api_v1_prefix)

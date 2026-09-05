from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import FileResponse

from app.services.storage import local_storage_path, verify_local_storage_token

router = APIRouter(prefix="/local-storage", tags=["local-storage"])


@router.put("/upload/{storage_key:path}", status_code=status.HTTP_204_NO_CONTENT)
async def upload_local_file(storage_key: str, request: Request, token: str = Query(...)) -> None:
    if not verify_local_storage_token(storage_key, token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid upload token")

    path = local_storage_path(storage_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(await request.body())


@router.get("/download/{storage_key:path}")
async def download_local_file(storage_key: str, token: str = Query(...)) -> FileResponse:
    if not verify_local_storage_token(storage_key, token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid download token")

    path = local_storage_path(storage_key)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")
    return FileResponse(path)

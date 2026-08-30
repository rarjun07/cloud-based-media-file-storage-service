from fastapi.testclient import TestClient

from app.main import app


def test_health_route() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_auth_routes_are_registered_in_openapi() -> None:
    client = TestClient(app)

    response = client.get("/openapi.json")
    paths = response.json()["paths"]

    assert "/api/v1/auth/register" in paths
    assert "/api/v1/auth/login" in paths
    assert "/api/v1/auth/refresh" in paths
    assert "/api/v1/auth/me" in paths
    assert "/api/v1/files/init-upload" in paths
    assert "/api/v1/files/complete-upload" in paths
    assert "/api/v1/files" in paths
    assert "/api/v1/files/{file_id}" in paths
    assert "patch" in paths["/api/v1/files/{file_id}"]
    assert "delete" in paths["/api/v1/files/{file_id}"]
    assert "/api/v1/folders" in paths
    assert "/api/v1/folders/{folder_id}" in paths
    assert "patch" in paths["/api/v1/folders/{folder_id}"]
    assert "delete" in paths["/api/v1/folders/{folder_id}"]
    assert "/api/v1/shares" in paths
    assert "/api/v1/shares/{share_id}" in paths
    assert "/api/v1/public-link" in paths
    assert "/api/v1/public-link/{token}" in paths
    assert "/api/v1/search" in paths
    assert "/api/v1/trash" in paths
    assert "/api/v1/trash/files/{file_id}/restore" in paths
    assert "/api/v1/trash/folders/{folder_id}/restore" in paths

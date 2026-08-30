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

import json
from pathlib import Path

import pytest
import yaml

from scripts.preflight import main as run_preflight


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def test_render_blueprint_targets_backend_service() -> None:
    render_yaml = yaml.safe_load((PROJECT_ROOT / "render.yaml").read_text())
    service = render_yaml["services"][0]

    assert service["type"] == "web"
    assert service["runtime"] == "python"
    assert service["rootDir"] == "backend"
    assert service["buildCommand"] == "pip install -r requirements.txt"
    assert service["startCommand"] == "python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    assert service["healthCheckPath"] == "/api/v1/health"


def test_render_blueprint_does_not_commit_secret_values() -> None:
    render_yaml = yaml.safe_load((PROJECT_ROOT / "render.yaml").read_text())
    env_vars = {item["key"]: item for item in render_yaml["services"][0]["envVars"]}

    assert env_vars["DATABASE_URL"]["sync"] is False
    assert env_vars["SUPABASE_URL"]["sync"] is False
    assert env_vars["SUPABASE_SERVICE_ROLE_KEY"]["sync"] is False
    assert env_vars["FRONTEND_URL"]["sync"] is False
    assert env_vars["BACKEND_URL"]["sync"] is False
    assert env_vars["CORS_ORIGINS"]["sync"] is False
    assert env_vars["GOOGLE_CLIENT_ID"]["sync"] is False
    assert env_vars["GOOGLE_CLIENT_SECRET"]["sync"] is False
    assert env_vars["GOOGLE_REDIRECT_URI"]["sync"] is False
    assert env_vars["JWT_SECRET_KEY"]["generateValue"] is True


def test_postman_collection_and_environment_are_valid_json() -> None:
    collection_path = PROJECT_ROOT / "backend/postman/cloud-storage-api.postman_collection.json"
    environment_path = PROJECT_ROOT / "backend/postman/cloud-storage-api.postman_environment.json"

    collection = json.loads(collection_path.read_text())
    environment = json.loads(environment_path.read_text())

    assert collection["info"]["name"] == "Cloud Based Media File Storage Service API"
    assert environment["name"] == "Cloud Storage API - Local"


def test_preflight_requires_production_secrets(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("BACKEND_URL", raising=False)
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)
    monkeypatch.delenv("GOOGLE_REDIRECT_URI", raising=False)
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)

    with pytest.raises(SystemExit):
        run_preflight()

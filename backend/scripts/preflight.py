import os
import sys
from importlib import import_module
from pathlib import Path


REQUIRED_PRODUCTION_ENV_VARS = (
    "DATABASE_URL",
    "JWT_SECRET_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
)


def main() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_dir))

    app_env = os.getenv("APP_ENV", "development")
    if app_env == "production":
        missing = [name for name in REQUIRED_PRODUCTION_ENV_VARS if not os.getenv(name)]
        if missing:
            missing_names = ", ".join(missing)
            raise SystemExit(f"Missing production environment variables: {missing_names}")

    import_module("app.main")
    print("Backend preflight checks passed")


if __name__ == "__main__":
    main()

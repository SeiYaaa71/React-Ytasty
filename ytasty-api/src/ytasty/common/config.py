"""Configuration lue depuis l'environnement."""

import os


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    try:
        return int(raw) if raw else default
    except ValueError:
        return default


# Secret de signature des JWT. La valeur par defaut n'existe que pour le
# developpement local : en production, JWT_SECRET_KEY doit etre defini.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me-in-production-0123456789abcdef")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = _int_env("ACCESS_TOKEN_EXPIRE_MINUTES", 60)

# Origines autorisees a appeler l'API depuis un navigateur.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

"""Hachage des mots de passe et jetons JWT."""

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from ytasty.common.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)

_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hash.verify(password, password_hash)
    except Exception:
        # Un hash corrompu ne doit pas faire tomber l'API en 500.
        return False


def create_access_token(user) -> str:
    """Construit le JWT a partir d'un utilisateur.

    Le frontend decode cette charge utile pour afficher le nom et le role et
    pour filtrer l'ecran cuisine. Le controle reel reste fait ici a chaque appel.
    """
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "restaurant_id": user.restaurant_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "exp": expires_at,
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None

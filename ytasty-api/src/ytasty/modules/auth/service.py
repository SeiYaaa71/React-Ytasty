"""Regles d'authentification et creation des JWT."""

from ytasty.common.errors import UnauthorizedError
from ytasty.common.security import create_access_token, verify_password
from ytasty.modules.auth import repository


def authenticate(db, username: str, password: str):
    """Verifie le couple identifiant / mot de passe.

    Le message d'erreur est volontairement identique dans les deux cas
    (utilisateur inconnu ou mauvais mot de passe) pour ne pas reveler quels
    identifiants existent.
    """
    user = repository.get_user_by_username(db, username)

    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Identifiant ou mot de passe incorrect")

    return user


def login(db, username: str, password: str) -> dict:
    user = authenticate(db, username, password)

    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "restaurant_id": user.restaurant_id,
        },
    }

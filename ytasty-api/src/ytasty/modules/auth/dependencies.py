"""Dependances FastAPI liees a l'authentification."""

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from ytasty.common.errors import ForbiddenError, UnauthorizedError
from ytasty.common.security import decode_access_token
from ytasty.db.database import get_db
from ytasty.modules.auth import repository


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    """Extrait l'utilisateur du header Authorization.

    On relit l'utilisateur en base plutot que de se fier uniquement au contenu
    du token : un compte supprime ou dont le role a change ne doit pas garder
    ses droits jusqu'a l'expiration du JWT.
    """
    header = request.headers.get("Authorization", "")

    if not header.startswith("Bearer "):
        raise UnauthorizedError("Authentification requise")

    payload = decode_access_token(header.removeprefix("Bearer ").strip())

    if payload is None:
        raise UnauthorizedError("Session expiree ou jeton invalide")

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise UnauthorizedError("Jeton invalide") from None

    user = repository.get_user_by_id(db, user_id)

    if user is None:
        raise UnauthorizedError("Compte introuvable")

    return user


def require_roles(*roles: str):
    """Fabrique une dependance qui n'accepte que certains roles."""

    def dependency(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise ForbiddenError("Votre role ne permet pas cette action")
        return current_user

    return dependency

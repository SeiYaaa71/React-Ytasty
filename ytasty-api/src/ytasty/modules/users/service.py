"""Regles metier du module users."""

from ytasty.common.errors import BadRequestError, ConflictError
from ytasty.common.security import hash_password
from ytasty.modules.restaurants import service as restaurants_service
from ytasty.modules.users import repository

ALLOWED_ROLES = {"staff", "admin", "direction"}
MIN_PASSWORD_LENGTH = 8


def create_user(db, data, current_user):
    """Cree un compte du back-office. Reserve a l'administrateur."""
    if data.role not in ALLOWED_ROLES:
        raise BadRequestError(
            "Role invalide, valeurs attendues : staff, admin ou direction"
        )

    if len(data.password) < MIN_PASSWORD_LENGTH:
        raise BadRequestError(
            f"Le mot de passe doit faire au moins {MIN_PASSWORD_LENGTH} caracteres"
        )

    if repository.get_user_by_username(db, data.username) is not None:
        raise ConflictError("Cet identifiant est deja utilise")

    # Un equipier est forcement rattache a un etablissement : sans cela,
    # l'ecran cuisine ne saurait pas quelles commandes lui montrer.
    if data.role == "staff" and data.restaurant_id is None:
        raise BadRequestError("Un equipier doit etre rattache a un restaurant")

    if data.restaurant_id is not None:
        restaurants_service.get_restaurant_by_id(db, data.restaurant_id)

    fields = data.model_dump(exclude={"password"})
    fields["password_hash"] = hash_password(data.password)

    return repository.create_user(db, fields)

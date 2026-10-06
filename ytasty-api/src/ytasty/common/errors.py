"""Erreurs metier de l'application.

Chaque erreur porte son code HTTP. Le handler declare dans main.py les
transforme en reponse JSON {"detail": "..."} identique a celle que FastAPI
produit pour une HTTPException, ce qui evite au frontend d'avoir deux formats
d'erreur a gerer.
"""


class AppError(Exception):
    """Erreur de base de l'application."""

    status_code = 400

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class BadRequestError(AppError):
    """Donnees invalides ou regle metier non respectee."""

    status_code = 400


class UnauthorizedError(AppError):
    """Authentification absente ou invalide."""

    status_code = 401


class ForbiddenError(AppError):
    """Authentifie, mais le role ne permet pas l'action."""

    status_code = 403


class NotFoundError(AppError):
    """Ressource inexistante."""

    status_code = 404


class ConflictError(AppError):
    """Conflit avec l'etat actuel de la ressource."""

    status_code = 409

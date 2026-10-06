from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ytasty.db.database import get_db
from ytasty.modules.auth import service
from ytasty.modules.auth.dependencies import get_current_user
from ytasty.modules.auth.schemas import AuthUser, LoginRequest, TokenResponse

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    return service.login(db, data.username, data.password)


@router.get("/me", response_model=AuthUser)
def me(current_user=Depends(get_current_user)):
    """Permet au frontend de revalider une session restauree du localStorage."""
    return current_user

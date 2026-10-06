from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ytasty.db.database import get_db
from ytasty.modules.auth.dependencies import require_roles
from ytasty.modules.users import service
from ytasty.modules.users.schemas import UserCreate, UserResponse

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin")),
):
    return service.create_user(db, data, current_user)

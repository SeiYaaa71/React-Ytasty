from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ytasty.db.database import get_db
from ytasty.modules.products import service
from ytasty.modules.auth.dependencies import get_current_user
from ytasty.modules.products.schemas import (
    ProductAvailabilityUpdate,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from ytasty.modules.users.model import User


router = APIRouter(
    prefix="/products",
    tags=["products"],
)

@router.get("")
def get_products(
    category: str | None = None,
    q: str | None = None,
    restaurant_id: int | None = None,
    is_available: bool | None = None,
    db: Session = Depends(get_db),
):
    return service.get_products(
        db,
        category,
        q,
        restaurant_id,
        is_available,
    )


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    return service.get_product(db, product_id)

@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_product(db, data, current_user)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_product(
        db,
        product_id,
        data,
        current_user,
    )


@router.patch("/{product_id}/availability", response_model=ProductResponse)
def update_availability(
    product_id: int,
    data: ProductAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_availability(
        db,
        product_id,
        data.is_available,
        current_user,
    )


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_product(db, product_id, current_user)
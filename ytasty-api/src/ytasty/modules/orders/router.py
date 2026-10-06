from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ytasty.db.database import get_db
from ytasty.modules.auth.dependencies import get_current_user
from ytasty.modules.orders import service
from ytasty.modules.orders.schemas import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
)

router = APIRouter(tags=["orders"])


@router.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
):
    """Commande client, sans authentification."""
    order = service.create_order(db, data)
    return service.serialize_order(order)


@router.get("/orders/{order_number}", response_model=OrderResponse)
def get_order(
    order_number: str,
    db: Session = Depends(get_db),
):
    """Suivi public par numero de commande."""
    order = service.get_order(db, order_number)
    return service.serialize_order(order)


@router.get("/restaurants/{restaurant_id}/orders", response_model=list[OrderResponse])
def get_restaurant_orders(
    restaurant_id: int,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    orders = service.get_restaurant_orders(db, restaurant_id, status, current_user)
    return [service.serialize_order(order) for order in orders]


@router.patch("/orders/{order_number}/status", response_model=OrderResponse)
def update_order_status(
    order_number: str,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = service.update_status(db, order_number, data.status, current_user)
    return service.serialize_order(order)


@router.post("/orders/{order_number}/cancel", response_model=OrderResponse)
def cancel_order(
    order_number: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = service.cancel_order(db, order_number, current_user)
    return service.serialize_order(order)

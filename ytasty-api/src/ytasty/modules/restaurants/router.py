from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ytasty.db.database import get_db
from ytasty.modules.restaurants import service
from ytasty.modules.auth.dependencies import get_current_user
from ytasty.modules.restaurants.schemas import (
    RestaurantAvailabilityUpdate,
    RestaurantResponse,
    RestaurantUpdate,
)
from ytasty.modules.users.model import User


router = APIRouter(
    prefix="/restaurants",
    tags=["restaurants"],
)


@router.get("")
def get_restaurants(db: Session = Depends(get_db)):
    return service.get_restaurants(db)

@router.get("/{restaurant_id}")
def get_restaurant_by_id(
    restaurant_id: int,
    db: Session = Depends(get_db),
):
    return service.get_restaurant_by_id(
        db,
        restaurant_id,
    )

@router.patch("/{restaurant_id}", response_model=RestaurantResponse)
def update_restaurant(
    restaurant_id: int,
    data: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_restaurant(
        db,
        restaurant_id,
        data,
        current_user,
    )

@router.patch("/{restaurant_id}/availability",response_model=RestaurantResponse,)
def update_availability(
    restaurant_id: int,
    data: RestaurantAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_availability(
        db,
        restaurant_id,
        data.is_open,
        current_user,
    )

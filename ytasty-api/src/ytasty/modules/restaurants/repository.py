from ytasty.modules.restaurants.model import Restaurant


def get_restaurants(db):
    return db.query(Restaurant).all()


def get_restaurant_by_id(db, restaurant_id: int):
    return db.query(Restaurant).filter(
        Restaurant.id == restaurant_id
    ).first()

def get_restaurant_by_name(db, name: str):
    return db.query(Restaurant).filter(
        Restaurant.name == name
    ).first()

def update_restaurant(db, restaurant, data: dict):
    for field, value in data.items():
        setattr(restaurant, field, value)

    db.commit()
    db.refresh(restaurant)

    return restaurant

def update_availability(db, restaurant, is_open: bool):
    restaurant.is_open = is_open
    db.commit()
    db.refresh(restaurant)
    return restaurant
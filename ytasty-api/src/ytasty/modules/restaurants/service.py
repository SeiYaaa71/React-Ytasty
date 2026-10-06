from ytasty.common.errors import BadRequestError, ForbiddenError, NotFoundError
from ytasty.modules.restaurants import repository

def get_restaurants(db):
    return repository.get_restaurants(db)


def get_restaurant_by_id(db, restaurant_id: int):
    restaurant = repository.get_restaurant_by_id(
        db,
        restaurant_id,
    )

    if restaurant is None:
        raise NotFoundError("Restaurant introuvable")

    return restaurant

def update_restaurant(db, restaurant_id: int, data, current_user):
    if current_user.role != "admin":
        raise ForbiddenError(
            "Seul un administrateur peut modifier un restaurant"
        )

    restaurant = get_restaurant_by_id(db, restaurant_id)

    fields = data.model_dump(exclude_unset=True)

    if not fields:
        raise BadRequestError("Aucune donnee a modifier")

    new_name = fields.get("name")

    if (
        new_name is not None
        and new_name != restaurant.name
        and repository.get_restaurant_by_name(db, new_name) is not None
    ):
        raise BadRequestError("Ce nom de restaurant est deja utilise")

    return repository.update_restaurant(db, restaurant, fields)

def update_availability(db, restaurant_id: int, is_open: bool, current_user):
    if current_user.role != "admin":
        raise ForbiddenError("Seul un administrateur peut modifier la disponibilité")

    restaurant = get_restaurant_by_id(db, restaurant_id)

    return repository.update_availability(db, restaurant, is_open)
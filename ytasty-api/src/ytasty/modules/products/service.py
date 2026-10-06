from ytasty.common.errors import BadRequestError, ForbiddenError, NotFoundError
from ytasty.modules.products import repository
from ytasty.modules.restaurants import service as restaurants_service


def get_products(
    db,
    category=None,
    q=None,
    restaurant_id=None,
    is_available=None,
):
    return repository.get_products(
        db,
        category,
        q,
        restaurant_id,
        is_available,
    )


def get_product(db, product_id: int):
    product = repository.get_product(db, product_id)

    if product is None:
        raise NotFoundError("Produit introuvable")

    return product

def check_product_access(current_user, restaurant_id: int, message: str):
    # admin partout, staff uniquement sur son propre restaurant.
    if current_user.role == "staff":
        if current_user.restaurant_id != restaurant_id:
            raise ForbiddenError("Ce restaurant n'est pas le vôtre")
    elif current_user.role != "admin":
        raise ForbiddenError(message)


def create_product(db, data, current_user):
    check_product_access(
        current_user,
        data.restaurant_id,
        "Vous ne pouvez pas créer de produit",
    )

    restaurants_service.get_restaurant_by_id(db, data.restaurant_id)

    return repository.create_product(db, data)


def update_product(db, product_id: int, data, current_user):
    product = get_product(db, product_id)

    check_product_access(
        current_user,
        product.restaurant_id,
        "Vous ne pouvez pas modifier ce produit",
    )

    fields = data.model_dump(exclude_unset=True)

    if not fields:
        raise BadRequestError("Aucune donnee a modifier")

    price = fields.get("price")

    if price is not None and price <= 0:
        raise BadRequestError("Le prix doit etre superieur a 0")

    return repository.update_product(db, product, fields)


def update_availability(db, product_id: int, is_available: bool, current_user):
    product = get_product(db, product_id)

    check_product_access(
        current_user,
        product.restaurant_id,
        "Vous ne pouvez pas modifier ce produit",
    )

    return repository.update_product(
        db,
        product,
        {"is_available": is_available},
    )


def delete_product(db, product_id: int, current_user):
    product = get_product(db, product_id)

    check_product_access(
        current_user,
        product.restaurant_id,
        "Vous ne pouvez pas supprimer ce produit",
    )

    if product.order_items:
        raise BadRequestError(
            "Ce produit est present dans des commandes, "
            "rendez-le indisponible au lieu de le supprimer"
        )

    repository.delete_product(db, product)
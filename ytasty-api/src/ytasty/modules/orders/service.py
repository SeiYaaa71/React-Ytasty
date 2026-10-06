"""Regles metier du module orders."""

import random
import string
from decimal import Decimal

from ytasty.common.errors import BadRequestError, ForbiddenError, NotFoundError
from ytasty.modules.orders import repository
from ytasty.modules.orders.model import Order, OrderItem
from ytasty.modules.orders.schemas import ORDER_STATUSES
from ytasty.modules.products import repository as products_repository
from ytasty.modules.restaurants import service as restaurants_service

ORDER_NUMBER_PREFIX = "YC"
TERMINAL_STATUSES = {"collected", "cancelled"}


def _generate_order_number(db) -> str:
    """Numero court, lisible a voix haute au comptoir.

    On retente en cas de collision plutot que de verrouiller la table : avec
    six caracteres alphanumeriques, le cas est rare et la boucle suffit.
    """
    alphabet = string.ascii_uppercase + string.digits

    for _ in range(20):
        candidate = ORDER_NUMBER_PREFIX + "".join(
            random.choices(alphabet, k=6)
        )
        if not repository.order_number_exists(db, candidate):
            return candidate

    raise BadRequestError("Impossible de generer un numero de commande")


def serialize_order(order: Order) -> dict:
    """Aplatit la commande pour la reponse API."""
    customer = order.customer or {}

    return {
        "id": order.id,
        "order_number": order.order_number,
        "restaurant_id": order.restaurant_id,
        "status": order.status,
        "pickup_mode": order.pickup_mode,
        "customer_name": customer.get("name", ""),
        "customer_email": customer.get("email", ""),
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Produit",
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            }
            for item in order.items
        ],
        "total_amount": float(order.total_price),
        "created_at": order.created_at,
    }


def get_order(db, order_number: str) -> Order:
    order = repository.get_order_by_number(db, order_number)

    if order is None:
        raise NotFoundError("Commande introuvable")

    return order


def create_order(db, data) -> Order:
    restaurant = restaurants_service.get_restaurant_by_id(
        db,
        data.restaurant_id,
    )

    if not restaurant.is_open:
        raise BadRequestError(
            "Cet etablissement est ferme et n'accepte pas de commande"
        )

    # Les quantites du meme produit sont regroupees : le client peut avoir
    # ajoute deux fois la meme ligne depuis deux ecrans differents.
    quantities: dict[int, int] = {}
    for item in data.items:
        quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity

    order_items = []
    total = Decimal("0")

    for product_id, quantity in quantities.items():
        product = products_repository.get_product(db, product_id)

        if product is None:
            raise NotFoundError(f"Produit {product_id} introuvable")

        if product.restaurant_id != data.restaurant_id:
            raise BadRequestError(
                f"Le produit {product.name} n'appartient pas a cet etablissement"
            )

        if not product.is_available:
            raise BadRequestError(f"Le produit {product.name} est indisponible")

        # Le prix est fige au moment de la commande : un changement de tarif
        # ensuite ne doit pas modifier une commande deja passee.
        unit_price = Decimal(str(product.price))
        total += unit_price * quantity

        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
            )
        )

    order = Order(
        order_number=_generate_order_number(db),
        restaurant_id=data.restaurant_id,
        total_price=total,
        status="pending",
        pickup_mode=data.pickup_mode,
        customer={
            "name": data.customer.name,
            "email": data.customer.email,
        },
        items=order_items,
    )

    return repository.create_order(db, order)


def _check_restaurant_access(current_user, restaurant_id: int):
    """Un equipier ne voit que son etablissement ; admin et direction, tous."""
    if current_user.role == "staff":
        if current_user.restaurant_id != restaurant_id:
            raise ForbiddenError("Ce restaurant n'est pas le votre")
    elif current_user.role not in {"admin", "direction"}:
        raise ForbiddenError("Votre role ne permet pas cette action")


def get_restaurant_orders(db, restaurant_id: int, status, current_user):
    restaurants_service.get_restaurant_by_id(db, restaurant_id)
    _check_restaurant_access(current_user, restaurant_id)

    return repository.get_orders_by_restaurant(db, restaurant_id, status)


def update_status(db, order_number: str, status: str, current_user) -> Order:
    order = get_order(db, order_number)
    _check_restaurant_access(current_user, order.restaurant_id)

    if order.status in TERMINAL_STATUSES:
        raise BadRequestError(
            "Cette commande est terminee, son statut ne peut plus changer"
        )

    current_index = ORDER_STATUSES.index(order.status)
    target_index = ORDER_STATUSES.index(status)

    # On n'autorise que l'avancement, jamais le retour en arriere : un
    # historique de preparation doit rester coherent.
    if target_index <= current_index:
        raise BadRequestError(
            "Le statut ne peut qu'avancer dans l'ordre de preparation"
        )

    return repository.update_status(db, order, status)


def cancel_order(db, order_number: str, current_user) -> Order:
    order = get_order(db, order_number)
    _check_restaurant_access(current_user, order.restaurant_id)

    if order.status == "cancelled":
        raise BadRequestError("Cette commande est deja annulee")

    if order.status == "collected":
        raise BadRequestError("Une commande deja recuperee ne peut pas etre annulee")

    return repository.update_status(db, order, "cancelled")

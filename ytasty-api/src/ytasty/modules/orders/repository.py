"""Requetes SQLAlchemy du module orders."""

from sqlalchemy.orm import joinedload

from ytasty.modules.orders.model import Order, OrderItem


def _base_query(db):
    # Les items et leur produit sont charges en une requete : sans cela,
    # afficher dix commandes en cuisine en declencherait des dizaines.
    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product)
    )


def get_order_by_number(db, order_number: str):
    return _base_query(db).filter(Order.order_number == order_number).first()


def get_orders_by_restaurant(db, restaurant_id: int, status: str | None = None):
    query = _base_query(db).filter(Order.restaurant_id == restaurant_id)

    if status is not None:
        query = query.filter(Order.status == status)

    return query.order_by(Order.created_at.desc()).all()


def order_number_exists(db, order_number: str) -> bool:
    return (
        db.query(Order.id).filter(Order.order_number == order_number).first()
        is not None
    )


def create_order(db, order: Order):
    db.add(order)
    db.commit()
    db.refresh(order)

    return order


def update_status(db, order: Order, status: str):
    order.status = status
    db.commit()
    db.refresh(order)

    return order

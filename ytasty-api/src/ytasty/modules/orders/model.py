from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, Numeric, String

from sqlalchemy.orm import relationship

from ytasty.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    pickup_mode = Column(String(20), nullable=False)
    customer = Column(JSON, nullable=False)

    restaurant = relationship("Restaurant", back_populates="orders")
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

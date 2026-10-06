from sqlalchemy import JSON, Boolean, Column, ForeignKey, Integer, Numeric, String, Text

from sqlalchemy.orm import relationship

from ytasty.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    image = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    ingredients = Column(JSON, nullable=False)

    restaurant = relationship("Restaurant", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

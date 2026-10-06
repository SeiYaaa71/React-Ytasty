from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.orm import relationship

from ytasty.db.base import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)
    opening_hours = Column(Text, nullable=False)
    contact = Column(String(50), nullable=False)

    users = relationship("User", back_populates="restaurant")
    products = relationship("Product", back_populates="restaurant")
    orders = relationship("Order", back_populates="restaurant")

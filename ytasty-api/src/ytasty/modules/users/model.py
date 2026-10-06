from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ytasty.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    username = Column(String(12), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)

    restaurant = relationship("Restaurant", back_populates="users")

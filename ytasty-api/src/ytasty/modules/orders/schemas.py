from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

# Valeurs acceptees, alignees sur le contrat du projet.
PICKUP_MODES = {"onsite", "takeaway"}
ORDER_STATUSES = [
    "pending",
    "validated",
    "preparing",
    "ready",
    "collected",
]


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, le=99)


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr


class OrderCreate(BaseModel):
    restaurant_id: int
    items: list[OrderItemCreate] = Field(min_length=1)
    pickup_mode: str
    customer: CustomerCreate

    @field_validator("pickup_mode")
    @classmethod
    def check_pickup_mode(cls, value: str) -> str:
        if value not in PICKUP_MODES:
            raise ValueError("pickup_mode doit valoir onsite ou takeaway")
        return value


class OrderStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def check_status(cls, value: str) -> str:
        if value not in ORDER_STATUSES:
            allowed = ", ".join(ORDER_STATUSES)
            raise ValueError(f"status doit valoir l'un de : {allowed}")
        return value


class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: float


class OrderResponse(BaseModel):
    """Reponse aplatie.

    Le modele stocke le client dans une colonne JSON et le total sous le nom
    `total_price`. On expose ici des champs plats pour que le frontend n'ait
    pas a connaitre la forme interne de la table.
    """

    id: int
    order_number: str
    restaurant_id: int
    status: str
    pickup_mode: str
    customer_name: str
    customer_email: str
    items: list[OrderItemResponse]
    total_amount: float
    created_at: datetime

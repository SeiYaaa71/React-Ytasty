from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    image: str
    description: str
    category: str
    price: float
    is_available: bool
    restaurant_id: int
    ingredients: list[str]


class ProductUpdate(BaseModel):
    name: str | None = None
    image: str | None = None
    description: str | None = None
    category: str | None = None
    price: float | None = None
    is_available: bool | None = None
    ingredients: list[str] | None = None


class ProductAvailabilityUpdate(BaseModel):
    is_available: bool

class ProductResponse(ProductCreate):
    id: int

    model_config = {"from_attributes": True}

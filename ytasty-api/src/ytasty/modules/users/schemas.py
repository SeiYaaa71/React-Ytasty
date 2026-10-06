from pydantic import BaseModel


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    username: str
    password: str
    role: str
    restaurant_id: int | None = None


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    username: str
    role: str
    restaurant_id: int | None = None

    model_config = {"from_attributes": True}

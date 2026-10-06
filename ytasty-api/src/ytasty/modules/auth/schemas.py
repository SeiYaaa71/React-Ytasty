from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthUser(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    role: str
    restaurant_id: int | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: AuthUser

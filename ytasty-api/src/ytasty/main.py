from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ytasty.common.config import CORS_ORIGINS
from ytasty.common.errors import AppError
from ytasty.db.base import Base
from ytasty.db.database import engine
from ytasty.modules.auth.router import router as auth_router
from ytasty.modules.orders.model import Order, OrderItem
from ytasty.modules.orders.router import router as orders_router
from ytasty.modules.products.model import Product
from ytasty.modules.products.router import router as products_router
from ytasty.modules.restaurants.model import Restaurant
from ytasty.modules.restaurants.router import router as restaurants_router
from ytasty.modules.users.model import User
from ytasty.modules.users.router import router as users_router

MODELS = [
    Restaurant,
    User,
    Product,
    Order,
    OrderItem,
]

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ytasty Crousty API",
    version="1.0.0",
)

# Sans ce middleware, le navigateur bloque tous les appels du frontend servi
# sur un autre port. Les origines autorisees viennent de CORS_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
def handle_app_error(request: Request, error: AppError):
    """Traduit les erreurs metier en reponses HTTP.

    Le corps a la meme forme que celui d'une HTTPException ({"detail": ...}),
    ce qui evite au frontend d'avoir deux formats d'erreur a interpreter.
    """
    return JSONResponse(
        status_code=error.status_code,
        content={"detail": error.message},
    )


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(restaurants_router)
app.include_router(products_router)
app.include_router(orders_router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}

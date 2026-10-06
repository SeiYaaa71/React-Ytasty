"""Donnees initiales : trois etablissements, les comptes et la carte.

Lancement :  python seed.py
Le script est idempotent : il ne cree que ce qui manque.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from ytasty.common.security import hash_password  # noqa: E402
from ytasty.db.base import Base  # noqa: E402
from ytasty.db.database import SessionLocal, engine  # noqa: E402
from ytasty.modules.orders.model import Order, OrderItem  # noqa: E402,F401
from ytasty.modules.products.model import Product  # noqa: E402
from ytasty.modules.restaurants.model import Restaurant  # noqa: E402
from ytasty.modules.users.model import User  # noqa: E402

RESTAURANTS = [
    {
        "name": "Ytasty Crousty Aix",
        "city": "Aix-en-Provence",
        "address": "12 cours Mirabeau, 13100 Aix-en-Provence",
        "opening_hours": "11h00 - 23h00, tous les jours",
        "contact": "04 42 00 00 01",
        "is_open": True,
    },
    {
        "name": "Ytasty Crousty Lyon",
        "city": "Lyon",
        "address": "8 rue de la Republique, 69002 Lyon",
        "opening_hours": "11h30 - 23h30, tous les jours",
        "contact": "04 72 00 00 02",
        "is_open": True,
    },
    {
        "name": "Ytasty Crousty Paris",
        "city": "Paris",
        "address": "45 rue Montorgueil, 75002 Paris",
        "opening_hours": "11h00 - 00h00, tous les jours",
        "contact": "01 42 00 00 03",
        "is_open": True,
    },
]

IMAGE = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800"

CARTE = [
    ("Le Crousty Signature", "burgers", 12.90,
     ["pain brioche", "boeuf 150g", "cheddar affine", "oignons confits", "sauce crousty"]),
    ("Double Bacon", "burgers", 14.50,
     ["pain brioche", "double boeuf", "bacon grille", "cheddar", "sauce barbecue"]),
    ("Le Vegetarien", "burgers", 11.90,
     ["pain complet", "galette de pois chiches", "avocat", "roquette", "sauce yaourt"]),
    ("Menu Signature", "menus", 17.90,
     ["Le Crousty Signature", "frites maison", "boisson 33cl"]),
    ("Menu Double Bacon", "menus", 19.50,
     ["Double Bacon", "frites maison", "boisson 33cl"]),
    ("Frites maison", "accompagnements", 4.50, ["pomme de terre", "huile de tournesol", "fleur de sel"]),
    ("Potatoes epicees", "accompagnements", 4.90, ["pomme de terre", "paprika", "ail"]),
    ("Coca-Cola 33cl", "boissons", 2.90, ["boisson gazeuse"]),
    ("Limonade artisanale", "boissons", 3.50, ["citron", "sucre de canne", "eau petillante"]),
    ("Cookie chocolat", "desserts", 3.20, ["farine", "chocolat noir", "beurre"]),
    ("Brownie", "desserts", 3.90, ["chocolat", "noix de pecan", "beurre"]),
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Etablissements
        restaurants = []
        for data in RESTAURANTS:
            existing = db.query(Restaurant).filter(
                Restaurant.name == data["name"]
            ).first()
            if existing is None:
                existing = Restaurant(**data)
                db.add(existing)
                db.commit()
                db.refresh(existing)
                print(f"Restaurant cree : {existing.city}")
            restaurants.append(existing)

        # Comptes
        comptes = [
            {
                "first_name": "Admin", "last_name": "Ytasty", "username": "admin123",
                "password": "Admin@123456", "role": "admin", "restaurant_id": None,
            },
            {
                "first_name": "Sofia", "last_name": "Marchand", "username": "staffaix",
                "password": "Staff@123456", "role": "staff", "restaurant_id": restaurants[0].id,
            },
            {
                "first_name": "Karim", "last_name": "Benali", "username": "stafflyon",
                "password": "Staff@123456", "role": "staff", "restaurant_id": restaurants[1].id,
            },
            {
                "first_name": "Claire", "last_name": "Dubois", "username": "direction",
                "password": "Direction@123", "role": "direction", "restaurant_id": None,
            },
        ]

        for compte in comptes:
            if db.query(User).filter(User.username == compte["username"]).first():
                continue
            password = compte.pop("password")
            user = User(**compte, password_hash=hash_password(password))
            db.add(user)
            db.commit()
            print(f"Compte cree : {user.username} ({user.role})")

        # Carte, dupliquee dans les trois etablissements
        for restaurant in restaurants:
            for name, category, price, ingredients in CARTE:
                exists = db.query(Product).filter(
                    Product.name == name,
                    Product.restaurant_id == restaurant.id,
                ).first()
                if exists:
                    continue
                db.add(Product(
                    name=name,
                    image=IMAGE,
                    description=f"{name}, prepare minute dans notre cuisine de {restaurant.city}.",
                    category=category,
                    price=price,
                    is_available=True,
                    restaurant_id=restaurant.id,
                    ingredients=ingredients,
                ))
            db.commit()

        total = db.query(Product).count()
        print(f"\nTermine. {len(restaurants)} etablissements, {total} produits.")
        print("Connexion admin : admin123 / Admin@123456")
    finally:
        db.close()


if __name__ == "__main__":
    main()

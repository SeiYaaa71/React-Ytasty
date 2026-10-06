import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# En Docker, DATABASE_URL pointe sur PostgreSQL. En local sans Docker, on
# retombe sur un fichier SQLite pour pouvoir lancer l'API immediatement.
DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./ytasty.db"

connect_args = (
    {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

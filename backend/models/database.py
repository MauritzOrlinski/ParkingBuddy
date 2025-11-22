from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# PostgreSQL connection URL
# SQLALCHEMY_DATABASE_URL = (
#    "postgresql://admin:adminpassword@localhost:5432/mydb"
#)

DATABASE_HOST = os.getenv("DATABASE_HOST", "postgres_db")
DATABASE_PORT = os.getenv("DATABASE_PORT", "5432")
DATABASE_USER = os.getenv("DATABASE_USER", "admin")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "adminpassword")
DATABASE_NAME = os.getenv("DATABASE_NAME", "mydb")
SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
)

# PostgreSQL engine (no SQLite-specific arguments)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,          # recommended for containerized DBs
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

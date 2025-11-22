from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# PostgreSQL connection URL
SQLALCHEMY_DATABASE_URL = (
    "postgresql://admin:adminpassword@localhost:5432/mydb"
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

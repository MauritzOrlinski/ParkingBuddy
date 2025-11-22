import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from models import schemas, user as user_model
from models.database import SessionLocal

# Secret key - override with env var in production
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days by default

# Prefer Argon2 (no 72-byte limit and generally more secure). Fall back to
# bcrypt if Argon2 backend isn't available in the environment.
try:
    # this will succeed if argon2-cffi is installed
    CryptContext(schemes=["argon2"], deprecated="auto")
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    _HASH_SCHEME = "argon2"
except Exception:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    _HASH_SCHEME = "bcrypt"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # If using bcrypt, enforce its 72-byte input limit and raise a clear
    # ValueError which calling code translates to HTTP 400. Argon2 has no
    # such limit so it's allowed when Argon2 is the active scheme.
    if _HASH_SCHEME == "bcrypt":
        if isinstance(password, str):
            b = password.encode("utf-8")
        else:
            b = bytes(password)
        if len(b) > 72:
            raise ValueError(
                "password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])"
            )
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_email(db: Session, email: str) -> Optional[user_model.User]:
    return db.query(user_model.User).filter(user_model.User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[user_model.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> user_model.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

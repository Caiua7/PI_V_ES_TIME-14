from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# ------------------------------------------------------------------ #
#  Hash de senha (argon2id)                                           #
# ------------------------------------------------------------------ #

_pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ------------------------------------------------------------------ #
#  JWT — access token (15 min) e refresh token (7 dias)              #
# ------------------------------------------------------------------ #

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload.update(
        {
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            "iat": datetime.now(timezone.utc),
            "jti": str(uuid4()),
            "type": "access",
        }
    )
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload.update(
        {
            "exp": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            "iat": datetime.now(timezone.utc),
            "jti": str(uuid4()),
            "type": "refresh",
        }
    )
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, expected_type: str | None = None) -> dict:
    """
    Decodifica e valida um JWT. Lança 401 se inválido ou expirado.
    Passa expected_type="access" ou "refresh" para validar o tipo do token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if expected_type and payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de token inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


# ------------------------------------------------------------------ #
#  Hash de token para armazenamento seguro no banco                   #
#  Refresh tokens e reset tokens nunca são salvos em texto claro.    #
# ------------------------------------------------------------------ #

def hash_token_for_storage(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()

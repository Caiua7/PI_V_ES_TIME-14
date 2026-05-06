from __future__ import annotations

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from app.application.auth_service import AuthService
from app.infrastructure.security import decode_token
from app.models.schemas.auth import UsuarioResponse

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(_oauth2_scheme)) -> UsuarioResponse:
    claims = decode_token(token, expected_type="access")
    return AuthService.get_current_user(claims["sub"])

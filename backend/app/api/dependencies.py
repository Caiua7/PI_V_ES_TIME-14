from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.application.auth_service import AuthService
from app.infrastructure.security import decode_token
from app.models.schemas.auth import UsuarioResponse

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(_oauth2_scheme)) -> UsuarioResponse:
    claims = decode_token(token, expected_type="access")
    return AuthService.get_current_user(claims["sub"])


def require_role(*roles: str) -> Callable:
    def _dependency(current_user: UsuarioResponse = Depends(get_current_user)) -> UsuarioResponse:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: permissão insuficiente.",
            )
        return current_user
    return _dependency

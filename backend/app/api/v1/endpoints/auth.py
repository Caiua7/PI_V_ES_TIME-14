from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Request

from app.api.dependencies import get_current_user
from app.application.auth_service import AuthService
from app.core.limiter import limiter
from app.models.schemas.auth import (
    AuthMessageResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    UsuarioResponse,
)

router = APIRouter()


def _build_ctx(request: Request) -> dict:
    xff = request.headers.get("X-Forwarded-For")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else None)
    return {
        "ip_address": ip,
        "user_agent": request.headers.get("User-Agent"),
        "request_id": str(uuid4()),
    }


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(request: Request, payload: RegisterRequest):
    return AuthService.register(payload, _build_ctx(request))


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest):
    return AuthService.login(payload, _build_ctx(request))


@router.get("/me", response_model=UsuarioResponse)
def me(current_user: UsuarioResponse = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=RefreshResponse)
def refresh(payload: RefreshRequest):
    return AuthService.refresh_tokens(payload)


@router.post("/logout", response_model=AuthMessageResponse)
def logout(request: Request, payload: RefreshRequest):
    AuthService.logout(payload.refresh_token, _build_ctx(request))
    return AuthMessageResponse(message="Sessão encerrada com sucesso.")


@router.post("/forgot-password", response_model=AuthMessageResponse, status_code=202)
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest):
    AuthService.forgot_password(payload, _build_ctx(request))
    return AuthMessageResponse(message="Se o e-mail existir, enviaremos o link de recuperação.")


@router.post("/reset-password", response_model=AuthMessageResponse)
def reset_password(request: Request, payload: ResetPasswordRequest):
    AuthService.reset_password(payload, _build_ctx(request))
    return AuthMessageResponse(message="Senha alterada com sucesso.")

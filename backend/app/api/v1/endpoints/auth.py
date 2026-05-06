from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.application.auth_service import AuthService
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


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(payload: RegisterRequest):
    return AuthService.register(payload)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    return AuthService.login(payload)


@router.get("/me", response_model=UsuarioResponse)
def me(current_user: UsuarioResponse = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=RefreshResponse)
def refresh(payload: RefreshRequest):
    return AuthService.refresh_tokens(payload)


@router.post("/logout", response_model=AuthMessageResponse)
def logout(payload: RefreshRequest):
    AuthService.logout(payload.refresh_token)
    return AuthMessageResponse(message="Sessão encerrada com sucesso.")


@router.post("/forgot-password", response_model=AuthMessageResponse, status_code=202)
def forgot_password(payload: ForgotPasswordRequest):
    AuthService.forgot_password(payload)
    return AuthMessageResponse(message="Se o e-mail existir, enviaremos o link de recuperação.")


@router.post("/reset-password", response_model=AuthMessageResponse)
def reset_password(payload: ResetPasswordRequest):
    AuthService.reset_password(payload)
    return AuthMessageResponse(message="Senha alterada com sucesso.")

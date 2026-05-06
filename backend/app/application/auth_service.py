from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import settings
from app.infrastructure.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token_for_storage,
    decode_token,
    verify_password,
)
from app.infrastructure.supabase_client import supabase
from app.models.schemas.auth import (
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

_TABLE_USERS = "users"
_TABLE_REFRESH_TOKENS = "refresh_tokens"
_TABLE_RESET_TOKENS = "password_reset_tokens"

_DUMMY_HASH = hash_password("dummy-timing-protection-xK9#mP2$")


class AuthService:

    @staticmethod
    def register(payload: RegisterRequest) -> RegisterResponse:
        allowed_domains = settings.get_allowed_domains()
        if allowed_domains:
            domain = str(payload.email).split("@")[-1].lower()
            if domain not in [d.lower() for d in allowed_domains]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Domínio de e-mail não permitido: {domain}",
                )

        existing = (
            supabase.table(_TABLE_USERS)
            .select("id")
            .eq("email", str(payload.email))
            .execute()
        )
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este e-mail já está cadastrado.",
            )

        new_user = {
            "id": str(uuid4()),
            "nome": payload.nome,
            "sobrenome": payload.sobrenome,
            "area": payload.areaCargo,
            "email": str(payload.email),
            "senha_hash": hash_password(payload.senha),
            "role": "pricing",
            "is_active": True,
        }
        response = supabase.table(_TABLE_USERS).insert(new_user).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar usuário.",
            )

        user = response.data[0]
        return RegisterResponse(
            id=user["id"],
            nome=user["nome"],
            email=user["email"],
            role=user["role"],
            areaCargo=user.get("area"),
            created_at=user["created_at"],
        )

    @staticmethod
    def login(payload: LoginRequest) -> LoginResponse:
        result = (
            supabase.table(_TABLE_USERS)
            .select("*")
            .eq("email", str(payload.email))
            .eq("is_active", True)
            .execute()
        )
        user = result.data[0] if result.data else None

        stored_hash = user["senha_hash"] if user else _DUMMY_HASH
        senha_correta = verify_password(payload.senha, stored_hash)

        if not user or not senha_correta:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas.",
            )

        supabase.table(_TABLE_USERS).update(
            {"last_login_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", user["id"]).execute()

        token_data = {"sub": user["id"], "email": user["email"], "role": user["role"]}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        expires_at = (
            datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        ).isoformat()
        supabase.table(_TABLE_REFRESH_TOKENS).insert(
            {
                "id": str(uuid4()),
                "user_id": user["id"],
                "token_hash": hash_token_for_storage(refresh_token),
                "expires_at": expires_at,
            }
        ).execute()

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            usuario=UsuarioResponse(
                id=user["id"],
                nome=user["nome"],
                email=user["email"],
                role=user["role"],
                areaCargo=user.get("area"),
            ),
        )

    @staticmethod
    def get_current_user(user_id: str) -> UsuarioResponse:
        result = (
            supabase.table(_TABLE_USERS)
            .select("id, nome, email, role, area")
            .eq("id", user_id)
            .eq("is_active", True)
            .execute()
        )
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado.",
            )
        user = result.data[0]
        return UsuarioResponse(
            id=user["id"],
            nome=user["nome"],
            email=user["email"],
            role=user["role"],
            areaCargo=user.get("area"),
        )

    @staticmethod
    def refresh_tokens(payload: RefreshRequest) -> RefreshResponse:
        decoded = decode_token(payload.refresh_token, expected_type="refresh")

        token_hash = hash_token_for_storage(payload.refresh_token)
        result = (
            supabase.table(_TABLE_REFRESH_TOKENS)
            .select("id, user_id")
            .eq("token_hash", token_hash)
            .is_("revoked_at", "null")
            .execute()
        )
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido ou já utilizado.",
            )

        stored = result.data[0]

        now = datetime.now(timezone.utc).isoformat()
        supabase.table(_TABLE_REFRESH_TOKENS).update(
            {"revoked_at": now}
        ).eq("id", stored["id"]).execute()

        new_access = create_access_token(
            {"sub": decoded["sub"], "email": decoded["email"], "role": decoded["role"]}
        )

        return RefreshResponse(
            access_token=new_access,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    def logout(raw_refresh_token: str) -> None:
        token_hash = hash_token_for_storage(raw_refresh_token)
        supabase.table(_TABLE_REFRESH_TOKENS).update(
            {"revoked_at": datetime.now(timezone.utc).isoformat()}
        ).eq("token_hash", token_hash).is_("revoked_at", "null").execute()

    @staticmethod
    def forgot_password(payload: ForgotPasswordRequest) -> None:
        result = (
            supabase.table(_TABLE_USERS)
            .select("id")
            .eq("email", str(payload.email))
            .eq("is_active", True)
            .execute()
        )
        if not result.data:
            return

        user_id = result.data[0]["id"]
        raw_token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

        supabase.table(_TABLE_RESET_TOKENS).insert(
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "token_hash": hash_token_for_storage(raw_token),
                "expires_at": expires_at,
            }
        ).execute()

        print(f"[DEV] Token de reset para {payload.email}: {raw_token}")

    @staticmethod
    def reset_password(payload: ResetPasswordRequest) -> None:
        token_hash = hash_token_for_storage(payload.token)
        now = datetime.now(timezone.utc).isoformat()

        result = (
            supabase.table(_TABLE_RESET_TOKENS)
            .select("id, user_id")
            .eq("token_hash", token_hash)
            .is_("used_at", "null")
            .gt("expires_at", now)
            .execute()
        )
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de recuperação inválido ou expirado.",
            )

        stored = result.data[0]

        supabase.table(_TABLE_USERS).update(
            {"senha_hash": hash_password(payload.nova_senha)}
        ).eq("id", stored["user_id"]).execute()

        supabase.table(_TABLE_RESET_TOKENS).update(
            {"used_at": now}
        ).eq("id", stored["id"]).execute()

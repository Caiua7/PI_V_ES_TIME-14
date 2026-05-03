"""
Schemas Pydantic — Auth
Validações de entrada e contratos de resposta para autenticação.
"""
from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ------------------------------------------------------------------ #
#  Constantes                                                          #
# ------------------------------------------------------------------ #

# Letra obrigatória + dígito obrigatório + mínimo 8 caracteres
_SENHA_REGEX = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")


def _validate_senha(v: str) -> str:
    if not _SENHA_REGEX.match(v):
        raise ValueError("A senha deve ter ao menos 8 caracteres, uma letra e um número.")
    return v


# ------------------------------------------------------------------ #
#  Request — POST /auth/login                                          #
# ------------------------------------------------------------------ #

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(..., min_length=1)


# ------------------------------------------------------------------ #
#  Request — POST /auth/register                                       #
# ------------------------------------------------------------------ #

class RegisterRequest(BaseModel):
    nome:      str           = Field(..., min_length=1, max_length=150)
    sobrenome: Optional[str] = Field(None, max_length=150)
    areaCargo: Optional[str] = Field(None, max_length=100)
    email:     EmailStr
    senha:     str           = Field(..., min_length=8)

    @field_validator("senha", mode="before")
    @classmethod
    def validate_senha(cls, v: str) -> str:
        return _validate_senha(v)


# ------------------------------------------------------------------ #
#  Request — POST /auth/forgot-password                                #
# ------------------------------------------------------------------ #

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ------------------------------------------------------------------ #
#  Request — POST /auth/reset-password                                 #
# ------------------------------------------------------------------ #

class ResetPasswordRequest(BaseModel):
    token:      str = Field(..., min_length=1)
    nova_senha: str = Field(..., min_length=8)

    @field_validator("nova_senha", mode="before")
    @classmethod
    def validate_nova_senha(cls, v: str) -> str:
        return _validate_senha(v)


# ------------------------------------------------------------------ #
#  Request — POST /auth/refresh                                        #
# ------------------------------------------------------------------ #

class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


# ------------------------------------------------------------------ #
#  Response — perfil do usuário (compartilhado entre endpoints)        #
# ------------------------------------------------------------------ #

class UsuarioResponse(BaseModel):
    id:        str
    nome:      str
    email:     str
    role:      str
    areaCargo: Optional[str] = None

    class Config:
        from_attributes = True


# ------------------------------------------------------------------ #
#  Response — POST /auth/login                                         #
# ------------------------------------------------------------------ #

class LoginResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    expires_in:    int
    usuario:       UsuarioResponse


# ------------------------------------------------------------------ #
#  Response — POST /auth/register                                      #
# ------------------------------------------------------------------ #

class RegisterResponse(BaseModel):
    id:        str
    nome:      str
    email:     str
    role:      str
    areaCargo: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


# ------------------------------------------------------------------ #
#  Response — POST /auth/refresh                                       #
# ------------------------------------------------------------------ #

class RefreshResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    expires_in:   int


# ------------------------------------------------------------------ #
#  Response — POST /auth/forgot-password e POST /auth/logout           #
# ------------------------------------------------------------------ #

class AuthMessageResponse(BaseModel):
    message: str

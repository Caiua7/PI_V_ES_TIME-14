from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

_SENHA_REGEX = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")


def _validate_senha(v: str) -> str:
    if not _SENHA_REGEX.match(v):
        raise ValueError("A senha deve ter ao menos 8 caracteres, uma letra e um número.")
    return v


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(..., min_length=1)


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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token:      str = Field(..., min_length=1)
    nova_senha: str = Field(..., min_length=8)

    @field_validator("nova_senha", mode="before")
    @classmethod
    def validate_nova_senha(cls, v: str) -> str:
        return _validate_senha(v)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class UsuarioResponse(BaseModel):
    id:        str
    nome:      str
    email:     str
    role:      str
    areaCargo: Optional[str] = None

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    expires_in:    int
    usuario:       UsuarioResponse


class RegisterResponse(BaseModel):
    id:        str
    nome:      str
    email:     str
    role:      str
    areaCargo: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class RefreshResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    expires_in:   int


class AuthMessageResponse(BaseModel):
    message: str

import { apiRequest } from './apiClient'
import type { AuthSession, ForgotPasswordInput, LoginInput, RegisterInput } from '../types'

const SESSION_KEY = 'neoprice_auth_session'

export class ServiceError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code = 'UNKNOWN', status = 500) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.status = status
  }
}

interface LoginApiResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  usuario: {
    id: string
    nome: string
    email: string
    role: string
  }
}

export const authService = {
  getSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  },

  async login(payload: LoginInput): Promise<AuthSession> {
    const data = await apiRequest<LoginApiResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: payload.email, senha: payload.senha }),
    })

    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      usuario: {
        id: data.usuario.id,
        nome: data.usuario.nome,
        email: data.usuario.email,
        areaCargo: '',
        role: data.usuario.role as AuthSession['usuario']['role'],
      },
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  async register(payload: RegisterInput): Promise<AuthSession> {
    await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nome: payload.nome,
        sobrenome: '',
        email: payload.email,
        senha: payload.senha,
        areaCargo: payload.areaCargo,
      }),
    })
    return this.login({ email: payload.email, senha: payload.senha, lembrar: true })
  },

  async forgotPassword(payload: ForgotPasswordInput): Promise<{ message: string }> {
    await apiRequest('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: payload.email }),
    })
    return { message: 'Se o e-mail existir, o link de recuperação será enviado.' }
  },

  async logout(): Promise<void> {
    const session = this.getSession()
    if (session?.refresh_token) {
      await apiRequest('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      }).catch(() => {})
    }
    localStorage.removeItem(SESSION_KEY)
  },
}
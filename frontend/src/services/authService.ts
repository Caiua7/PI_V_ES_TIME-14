import type { ApiError, AuthSession, ForgotPasswordInput, LoginInput, RegisterInput, UserProfile } from '../types'

const SESSION_KEY = 'neoprice_auth_session'
const REFRESH_TOKEN_KEY = 'neoprice_refresh_token'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const API_V1_PREFIX = '/api/v1'

function toServiceError(code: string, status: number, message: string): ServiceError {
  return new ServiceError({ code, status, message })
}

async function parseError(response: Response): Promise<ServiceError> {
  const fallbackMessage = `Erro HTTP ${response.status}`
  try {
    const json = (await response.json()) as
      | { error?: { code?: string; message?: string }; detail?: string | Array<{ msg?: string }>; message?: string }
      | undefined

    if (!json) return toServiceError('HTTP_ERROR', response.status, fallbackMessage)

    const detailMessage = Array.isArray(json.detail) ? json.detail.map((item) => item.msg).filter(Boolean).join(' | ') : json.detail
    const message = json.error?.message || json.message || detailMessage || fallbackMessage
    const code = json.error?.code || 'HTTP_ERROR'
    return toServiceError(code, response.status, String(message))
  } catch {
    return toServiceError('HTTP_ERROR', response.status, fallbackMessage)
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const session = authService.getSession()
  const headers = new Headers(init?.headers || {})
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json')
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`)

  const response = await fetch(`${API_BASE_URL}${API_V1_PREFIX}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function normalizeUser(user: {
  id: string
  nome: string
  email: string
  areaCargo?: string | null
  role: string
}): UserProfile {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    areaCargo: user.areaCargo || '',
    role: user.role as UserProfile['role'],
  }
}

export class ServiceError extends Error {
  readonly code: string
  readonly status: number

  constructor(payload: ApiError) {
    super(payload.message)
    this.name = 'ServiceError'
    this.code = payload.code
    this.status = payload.status
  }
}

export const authService = {
  getSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return null
    const record = parsed as Record<string, unknown>
    const token =
      typeof record.token === 'string'
        ? record.token
        : typeof record.access_token === 'string'
          ? record.access_token
          : null
    const usuario = record.usuario as AuthSession['usuario'] | undefined
    if (!token || !usuario) return null
    return { token, usuario }
  },

  async login(payload: LoginInput): Promise<AuthSession> {
    const data = await apiRequest<{
      access_token: string
      refresh_token: string
      usuario: {
        id: string
        nome: string
        email: string
        areaCargo?: string | null
        role: string
      }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        senha: payload.senha,
      }),
    })

    const session: AuthSession = {
      token: data.access_token,
      usuario: normalizeUser(data.usuario),
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
    return session
  },

  async register(payload: RegisterInput): Promise<AuthSession> {
    if (payload.senha !== payload.confirmarSenha) {
      throw new ServiceError({
        code: 'PASSWORD_MISMATCH',
        status: 400,
        message: 'Senha e confirmacao devem ser iguais.',
      })
    }

    await apiRequest<{
      id: string
      nome: string
      email: string
      role: string
      areaCargo?: string | null
      created_at: string
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nome: payload.nome,
        sobrenome: payload.sobrenome,
        email: payload.email,
        areaCargo: payload.areaCargo,
        senha: payload.senha,
        role: payload.role,
      }),
    })

    // Após cadastro, autentica para preservar UX atual do frontend.
    return authService.login({
      email: payload.email,
      senha: payload.senha,
      lembrar: true,
    })
  },

  async forgotPassword(payload: ForgotPasswordInput): Promise<{ message: string }> {
    const data = await apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: payload.email }),
    })
    return { message: data.message }
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      } catch {
        // Mantém fluxo de logout local mesmo em caso de erro da API.
      }
    }
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

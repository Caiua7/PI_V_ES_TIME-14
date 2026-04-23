import { mockUsers } from '../mocks/auth'
import type { ApiError, AuthSession, ForgotPasswordInput, LoginInput, RegisterInput, UserProfile } from '../types'

type StoredUser = UserProfile & {
  senha: string
}

const SESSION_KEY = 'neoprice_auth_session'
const USERS_KEY = 'neoprice_mock_users'

function delay(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY)
  if (raw) return JSON.parse(raw) as StoredUser[]

  const seeded: StoredUser[] = mockUsers.map((user) => ({ ...user, senha: '123456' }))
  localStorage.setItem(USERS_KEY, JSON.stringify(seeded))
  return seeded
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
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
    return JSON.parse(raw) as AuthSession
  },

  async login(payload: LoginInput): Promise<AuthSession> {
    await delay()
    const users = readUsers()
    const foundUser = users.find((item) => item.email.toLowerCase() === payload.email.toLowerCase())

    if (!foundUser || foundUser.senha !== payload.senha) {
      throw new ServiceError({
        code: 'AUTH_INVALID',
        status: 401,
        message: 'Credenciais invalidas. Verifique e tente novamente.',
      })
    }

    const session: AuthSession = {
      token: `mock-token-${foundUser.id}`,
      usuario: {
        id: foundUser.id,
        nome: foundUser.nome,
        email: foundUser.email,
        areaCargo: foundUser.areaCargo,
        role: foundUser.role,
      },
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  async register(payload: RegisterInput): Promise<AuthSession> {
    await delay(900)

    if (payload.senha !== payload.confirmarSenha) {
      throw new ServiceError({
        code: 'PASSWORD_MISMATCH',
        status: 400,
        message: 'Senha e confirmacao devem ser iguais.',
      })
    }

    const users = readUsers()
    const existing = users.find((item) => item.email.toLowerCase() === payload.email.toLowerCase())
    if (existing) {
      throw new ServiceError({
        code: 'EMAIL_ALREADY_EXISTS',
        status: 409,
        message: 'Este e-mail ja esta cadastrado no mock local.',
      })
    }

    const created: StoredUser = {
      id: `u-${Date.now()}`,
      nome: payload.nome,
      email: payload.email,
      areaCargo: payload.areaCargo,
      role: 'pricing',
      senha: payload.senha,
    }

    const updated = [created, ...users]
    saveUsers(updated)

    const session: AuthSession = {
      token: `mock-token-${created.id}`,
      usuario: {
        id: created.id,
        nome: created.nome,
        email: created.email,
        areaCargo: created.areaCargo,
        role: created.role,
      },
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  async forgotPassword(payload: ForgotPasswordInput): Promise<{ message: string }> {
    await delay(850)

    if (payload.email.toLowerCase().includes('erro')) {
      throw new ServiceError({
        code: 'SEND_ERROR',
        status: 500,
        message: 'Falha simulada ao enviar e-mail. Tente novamente.',
      })
    }

    // TODO(Python API): enviar requisicao POST /auth/forgot-password
    return { message: 'Se o e-mail existir, o link de recuperacao sera enviado.' }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY)
  },
}

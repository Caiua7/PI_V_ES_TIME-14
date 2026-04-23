export type UserRole = 'pricing' | 'pre-sales' | 'cs'

export interface UserProfile {
  id: string
  nome: string
  email: string
  areaCargo: string
  role: UserRole
}

export interface LoginInput {
  email: string
  senha: string
  lembrar: boolean
}

export interface RegisterInput {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
  areaCargo: string
}

export interface ForgotPasswordInput {
  email: string
}

export interface AuthSession {
  token: string
  usuario: UserProfile
}

export interface PricingHistoryRecord {
  id: string
  cliente: string
  tamanho: string
  gestora: string
  codigo: string
  sku: string
  precoLiquido: number
  precoBruto: number
  moeda: 'BRL' | 'USD' | 'EUR'
  margemOrcada: number
  mes: string
  categoria: string
  subcategoria: string
}

export interface PricingFilters {
  busca: string
  categoria: string
  cliente: string
  mes: string
}

export interface DashboardFilters {
  periodo: string
  cliente: string
  categoria: string
}

export interface KpiSummary {
  receitaBruta: number
  receitaLiquida: number
  margemMedia: number
  totalRegistros: number
}

export interface TrendPoint {
  mes: string
  preco: number
  margem: number
}

export interface ComparisonPoint {
  nome: string
  precoLiquido: number
  margem: number
}

export interface AnalyticsInsight {
  titulo: string
  descricao: string
  variacao: string
  tipo: 'positivo' | 'alerta' | 'neutro'
}

export interface ApiError {
  code: string
  message: string
  status: number
  details?: string
}

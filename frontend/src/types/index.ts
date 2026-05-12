export type UserRole = 'pricing' | 'pre_sales' | 'customer'

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
  sobrenome: string
  email: string
  senha: string
  areaCargo: string
  role: 'pricing' | 'pre_sales' | 'customer'
}

export interface ForgotPasswordInput {
  email: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  usuario: UserProfile
}

export interface PricingHistoryRecord {
  id: string
  cliente: string
  sku: string
  codigo: string
  categoria: string
  subcategoria: string
  tamanho: string
  gestora: string
  canal: string
  status: string
  precoBruto: number
  precoLiquido: number
  precoAnterior: number
  custo: number
  margemOrcada: number
  moeda: 'BRL' | 'USD' | 'EUR'
  mes: string
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

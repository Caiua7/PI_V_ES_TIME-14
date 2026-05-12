import { apiRequest } from './apiClient'
import type { PricingHistoryRecord } from '../types'

// Adaptador: converte campos da API (inglês) para o tipo do frontend (português)
function adapt(record: ApiRecord): PricingHistoryRecord {
  return {
    id: record.id,
    cliente: record.cliente,
    sku: record.sku,
    codigo: record.datasul_code ?? '',
    categoria: record.category ?? '',
    subcategoria: record.subcategory ?? '',
    tamanho: record.size ?? '',
    gestora: record.manager ?? '',
    canal: record.channel ?? '',
    status: record.status,

    precoBruto: record.current_price ?? 0,
    precoAnterior: record.previous_price ?? 0,
    precoLiquido: record.previous_price ?? 0,

    custo: record.cost ?? 0,
    margemOrcada: record.margin ?? 0,
    moeda: (record.currency ?? 'BRL') as 'BRL' | 'USD' | 'EUR',
    mes: record.month,
  }
}

interface ApiRecord {
  id: string
  cliente: string
  sku: string
  datasul_code?: string
  category?: string
  subcategory?: string
  size?: string
  manager?: string
  channel?: string
  status: string
  current_price: number
  previous_price?: number
  cost?: number
  margin?: number
  currency?: string
  month: string
}

interface ApiResponse {
  data: ApiRecord[]
  meta: { total: number }
}

export const pricingService = {
  async getAll(): Promise<PricingHistoryRecord[]> {
    const response = await apiRequest<ApiResponse>('/api/v1/pricing/history')
    return response.data.map(adapt)
  },

  async list(filters: Record<string, string>): Promise<PricingHistoryRecord[]> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await apiRequest<ApiResponse>(`/api/v1/pricing/history${query}`)
    return response.data.map(adapt)
  },

  async remove(id: string): Promise<void> {
    await apiRequest(`/api/v1/pricing/history/${id}`, { method: 'DELETE' })
  },

  async create(payload: Omit<PricingHistoryRecord, 'id'>): Promise<PricingHistoryRecord> {
    const body = {
      cliente: payload.cliente,
      sku: payload.sku,
      datasul_code: payload.codigo,
      category: payload.categoria,
      subcategory: payload.subcategoria,
      size: payload.tamanho,
      manager: payload.gestora,
      current_price: payload.precoBruto,
      previous_price: payload.precoAnterior,
      cost: payload.custo,
      margin: payload.margemOrcada,
      currency: payload.moeda,
      month: payload.mes,
      status: payload.status ?? 'Ativo',
    }
    const record = await apiRequest<ApiRecord>('/api/v1/pricing/history', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return adapt(record)
  },
}

interface EvolutionPoint {
  mes: string
  preco: number
  margem: number
}

interface AnalyticsEvolution {
  mode: string
  series: EvolutionPoint[]
}

interface AnalyticsCards {
  registros_analisados: number
  preco_medio: number
  margem_media: number
  variacao_preco: number
  sku_card: { visible: boolean; value: string | null }
  benchmarking_card: { visible: boolean; value: number | null; category: string | null }
}

export const analyticsService = {
  async getEvolution(filters: {
    sku?: string
    category?: string
    date_from?: string
    date_to?: string
  }): Promise<AnalyticsEvolution> {
    const params = new URLSearchParams()
    if (filters.sku) params.append('sku', filters.sku)
    if (filters.category) params.append('category', filters.category)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<AnalyticsEvolution>(`/api/v1/analytics/evolution${query}`)
  },

  async getCards(filters: {
    sku?: string
    category?: string
    date_from?: string
    date_to?: string
  }): Promise<AnalyticsCards> {
    const params = new URLSearchParams()
    if (filters.sku) params.append('sku', filters.sku)
    if (filters.category) params.append('category', filters.category)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<AnalyticsCards>(`/api/v1/analytics/cards${query}`)
  },
}
import type { DashboardFilters, PricingFilters, PricingHistoryRecord } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const API_V1_PREFIX = '/api/v1'
const SESSION_KEY = 'neoprice_auth_session'

function getToken(): string | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { token?: string; access_token?: string }
    return parsed.token ?? parsed.access_token ?? null
  } catch {
    return null
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {})
  const token = getToken()
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${API_V1_PREFIX}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('neoprice_refresh_token')
    window.location.replace('/login')
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`
    try {
      const body = (await response.json()) as { detail?: string | Array<{ msg?: string }>; message?: string }
      const detail = Array.isArray(body.detail) ? body.detail.map((item) => item.msg).filter(Boolean).join(' | ') : body.detail
      message = body.message || detail || message
    } catch {
      // no-op
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

type ApiPricingRecord = {
  id: string
  cliente: string
  size?: string | null
  manager?: string | null
  datasul_code?: string | null
  sku: string
  status?: string | null
  channel?: string | null
  current_price: number
  previous_price?: number | null
  cost?: number | null
  currency: 'BRL' | 'USD' | 'EUR'
  margin?: number | null
  month: string
  category?: string | null
  subcategory?: string | null
}

function mapFromApi(item: ApiPricingRecord): PricingHistoryRecord {
  const bruto = Number(item.current_price || 0)
  const liquido = Number(item.previous_price ?? item.current_price ?? 0)
  return {
    id: item.id,
    cliente: item.cliente || 'Sem cliente',
    tamanho: item.size || '',
    gestora: item.manager || '',
    codigo: item.datasul_code || '',
    sku: item.sku || '',
    precoLiquido: liquido,
    precoBruto: bruto,
    precoAnterior: Number(item.previous_price ?? 0),
    custo: Number(item.cost ?? 0),
    moeda: item.currency || 'BRL',
    margemOrcada: Number(item.margin || 0),
    mes: item.month || '',
    categoria: item.category || 'Sem categoria',
    subcategoria: item.subcategory || 'Sem subcategoria',
    canal: item.channel || '',
    status: item.status || '',
  }
}

function mapToApi(payload: Omit<PricingHistoryRecord, 'id'>): {
  cliente: string
  sku: string
  datasul_code: string
  category: string
  subcategory: string
  size: string
  manager: string
  channel?: string | null
  status: string
  current_price: number
  previous_price: number
  cost?: number | null
  margin: number
  currency: string
  month: string
} {
  return {
    cliente: payload.cliente,
    sku: payload.sku,
    datasul_code: payload.codigo,
    category: payload.categoria,
    subcategory: payload.subcategoria,
    size: payload.tamanho,
    manager: payload.gestora,
    channel: payload.canal || null,
    status: payload.status || 'Ativo',
    current_price: payload.precoBruto,
    previous_price: payload.precoLiquido,
    cost: typeof payload.custo === 'number' ? payload.custo : null,
    margin: payload.margemOrcada,
    currency: payload.moeda,
    month: payload.mes,
  }
}

function applyFilters(rows: PricingHistoryRecord[], filters: PricingFilters): PricingHistoryRecord[] {
  const query = filters.busca.toLowerCase()

  return rows.filter((item) => {
    const byQuery =
      !query ||
      item.cliente.toLowerCase().includes(query) ||
      item.codigo.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query)

    const byCategoria = !filters.categoria || item.categoria === filters.categoria
    const byCliente = !filters.cliente || item.cliente === filters.cliente
    const byMes = !filters.mes || item.mes === filters.mes

    return byQuery && byCategoria && byCliente && byMes
  })
}

export const pricingService = {
  async list(filters: PricingFilters): Promise<PricingHistoryRecord[]> {
    const all = await pricingService.getAll()
    return applyFilters(all, filters)
  },

  async getAll(): Promise<PricingHistoryRecord[]> {
    const data = await apiRequest<{ data: ApiPricingRecord[] }>('/pricing/history')
    return data.data.map(mapFromApi)
  },

  async create(payload: Omit<PricingHistoryRecord, 'id'>): Promise<PricingHistoryRecord> {
    const created = await apiRequest<ApiPricingRecord>('/pricing/history', {
      method: 'POST',
      body: JSON.stringify(mapToApi(payload)),
    })
    return mapFromApi(created)
  },

  async update(id: string, payload: PricingHistoryRecord): Promise<PricingHistoryRecord> {
    const { id: ignoredId, ...rest } = payload
    void ignoredId
    const updated = await apiRequest<ApiPricingRecord>(`/pricing/history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapToApi(rest)),
    })
    return mapFromApi(updated)
  },

  async remove(id: string): Promise<void> {
    await apiRequest<{ message: string; id: string }>(`/pricing/history/${id}`, {
      method: 'DELETE',
    })
  },

  async analytics(filters: DashboardFilters): Promise<PricingHistoryRecord[]> {
    const all = await pricingService.getAll()
    return applyFilters(all, {
      busca: '',
      categoria: filters.categoria,
      cliente: filters.cliente,
      mes: filters.periodo,
    })
  },

  getClients(): string[] {
    return []
  },

  getCategories(): string[] {
    return []
  },

  getMonths(): string[] {
    return []
  },
}

type AnalyticsFilters = {
  client?: string
  sku?: string
  datasul_code?: string
  category?: string
  subcategory?: string
  size?: string
  date_from?: string
  date_to?: string
}

type AnalyticsEvolutionResponse = {
  mode: string
  series: Array<{ mes: string; preco: number; margem: number }>
}

type AnalyticsCardsResponse = {
  registros_analisados: number
  preco_medio: number
  margem_media: number
  variacao_preco?: number
  sku_card: { visible: boolean; value: string | null }
  benchmarking_card: { visible: boolean; value: number | null; category: string | null }
}

function buildQuery(filters: AnalyticsFilters): string {
  const params = new URLSearchParams()
  if (filters.client) params.set('client', filters.client)
  if (filters.sku) params.set('sku', filters.sku)
  if (filters.datasul_code) params.set('datasul_code', filters.datasul_code)
  if (filters.category) params.set('category', filters.category)
  if (filters.subcategory) params.set('subcategory', filters.subcategory)
  if (filters.size) params.set('size', filters.size)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const analyticsService = {
  async getEvolution(filters: AnalyticsFilters): Promise<AnalyticsEvolutionResponse> {
    return apiRequest<AnalyticsEvolutionResponse>(`/analytics/evolution${buildQuery(filters)}`)
  },

  async getCards(filters: AnalyticsFilters): Promise<AnalyticsCardsResponse> {
    return apiRequest<AnalyticsCardsResponse>(`/analytics/cards${buildQuery(filters)}`)
  },
}

import { pricingHistoryMock } from '../mocks/pricingHistory'
import type { DashboardFilters, PricingFilters, PricingHistoryRecord } from '../types'

let pricingStore: PricingHistoryRecord[] = [...pricingHistoryMock]

function delay(ms = 650): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
    await delay()
    // TODO(Python API): substituir por GET /pricing/history com query params
    return applyFilters(pricingStore, filters)
  },

  async getAll(): Promise<PricingHistoryRecord[]> {
    await delay(500)
    // TODO(Python API): substituir por GET /pricing/history
    return [...pricingStore]
  },

  async create(payload: Omit<PricingHistoryRecord, 'id'>): Promise<PricingHistoryRecord> {
    await delay(700)
    // TODO(Python API): substituir por POST /pricing/history
    const created: PricingHistoryRecord = { ...payload, id: `p-${Date.now()}` }
    pricingStore = [created, ...pricingStore]
    return created
  },

  async remove(id: string): Promise<void> {
    await delay(450)
    // TODO(Python API): substituir por DELETE /pricing/history/:id
    pricingStore = pricingStore.filter((item) => item.id !== id)
  },

  async analytics(filters: DashboardFilters): Promise<PricingHistoryRecord[]> {
    await delay(700)
    // TODO(Python API): substituir por GET /pricing/analytics
    return applyFilters(pricingStore, {
      busca: '',
      categoria: filters.categoria,
      cliente: filters.cliente,
      mes: filters.periodo,
    })
  },

  getClients(): string[] {
    return [...new Set(pricingStore.map((item) => item.cliente))]
  },

  getCategories(): string[] {
    return [...new Set(pricingStore.map((item) => item.categoria))]
  },

  getMonths(): string[] {
    return [...new Set(pricingStore.map((item) => item.mes))].sort()
  },
}

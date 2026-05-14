import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Copy,
  Download,
  Edit2,
  Filter,
  Package,
  Plus,
  Settings,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  DollarSign,
  X,
} from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
import ClientAliasManager from '../components/ClientAliasManager'
import { authService } from '../services/authService'
import { pricingService } from '../services/pricingService'
import type { PricingHistoryRecord } from '../types'

type Filters = {
  client: string
  sku: string
  datasulCode: string
  category: string
  subcategory: string
  size: string
  dateFrom: string
  dateTo: string
}

const initialFilters: Filters = {
  client: '',
  sku: '',
  datasulCode: '',
  category: '',
  subcategory: '',
  size: '',
  dateFrom: '',
  dateTo: '',
}

function normalize(value: string): string {
  return String(value || '').trim().toLowerCase()
}

type NewPriceForm = {
  client_id: string
  sku: string
  net_price: string
  gross_price: string
  margin_budget: string
  size: string
  manager: string
  code: string
  category: string
  subcategory: string
  month: string
  obs: string
  date: string
  currency: 'BRL' | 'USD'
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function createEmptyNewPriceForm(): NewPriceForm {
  return {
    client_id: '',
    sku: '',
    net_price: '',
    gross_price: '',
    margin_budget: '',
    size: '',
    manager: '',
    code: '',
    category: '',
    subcategory: '',
    month: '',
    obs: '',
    date: getTodayISO(),
    currency: 'BRL',
  }
}

export default function PricingDashboardPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<PricingHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [showNewPriceModal, setShowNewPriceModal] = useState(false)
  const [showAliasManager, setShowAliasManager] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [basePriceId, setBasePriceId] = useState('')
  const [newPriceForm, setNewPriceForm] = useState<NewPriceForm>(createEmptyNewPriceForm)

  const user = authService.getSession()?.usuario ?? null

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await pricingService.getAll()
        setRows(data)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar dados.'
        setLoadError(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function refreshAliases() {
    try {
      const data = await pricingService.getAll()
      setRows(data)
    } catch (error) {
      console.error(error)
    }
  }

  const getFilteredRows = useMemo(() => {
    return (exclude?: keyof Filters) => {
      const active = exclude ? { ...filters, [exclude]: '' } : filters
      return rows.filter((item) => {
        const byClient = !active.client || normalize(item.cliente) === normalize(active.client)
        const bySku = !active.sku || normalize(item.sku) === normalize(active.sku)
        const byCode = !active.datasulCode || normalize(item.codigo).includes(normalize(active.datasulCode))
        const byCategory = !active.category || normalize(item.categoria) === normalize(active.category)
        const bySubcategory = !active.subcategory || normalize(item.subcategoria) === normalize(active.subcategory)
        const bySize = !active.size || normalize(item.tamanho) === normalize(active.size)

        const month = String(item.mes || '').slice(0, 7)
        const fromMonth = active.dateFrom ? active.dateFrom.slice(0, 7) : ''
        const toMonth = active.dateTo ? active.dateTo.slice(0, 7) : ''
        const byDateFrom = !fromMonth || month >= fromMonth
        const byDateTo = !toMonth || month <= toMonth

        return byClient && bySku && byCode && byCategory && bySubcategory && bySize && byDateFrom && byDateTo
      })
    }
  }, [filters, rows])

  const filteredData = useMemo(() => getFilteredRows(), [getFilteredRows])

  const clientOptions = useMemo(() => {
    const base = getFilteredRows('client')
    return [...new Set(base.map((item) => item.cliente).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }))
  }, [getFilteredRows])

  const skuOptions = useMemo(() => {
    const base = getFilteredRows('sku')
    return [...new Set(base.map((item) => item.sku).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }))
  }, [getFilteredRows])

  const categoryOptions = useMemo(() => {
    const base = getFilteredRows('category')
    return [...new Set(base.map((item) => item.categoria).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }))
  }, [getFilteredRows])

  const subcategoryOptions = useMemo(() => {
    const base = getFilteredRows('subcategory')
    return [...new Set(base.map((item) => item.subcategoria).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }))
  }, [getFilteredRows])

  const sizeOptions = useMemo(() => {
    const base = getFilteredRows('size')
    return [...new Set(base.map((item) => item.tamanho).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }))
  }, [getFilteredRows])

  useEffect(() => {
    setFilters((current) => {
      let changed = false
      const next: Filters = { ...current }
      if (next.client && !clientOptions.some((o) => o.value === next.client)) {
        next.client = ''
        changed = true
      }
      if (next.sku && !skuOptions.some((o) => o.value === next.sku)) {
        next.sku = ''
        changed = true
      }
      if (next.category && !categoryOptions.some((o) => o.value === next.category)) {
        next.category = ''
        changed = true
      }
      if (next.subcategory && !subcategoryOptions.some((o) => o.value === next.subcategory)) {
        next.subcategory = ''
        changed = true
      }
      if (next.size && !sizeOptions.some((o) => o.value === next.size)) {
        next.size = ''
        changed = true
      }
      return changed ? next : current
    })
  }, [clientOptions, skuOptions, categoryOptions, subcategoryOptions, sizeOptions])

  const avgPrice =
    filteredData.length > 0
      ? filteredData.reduce((sum, item) => sum + Number(item.precoBruto || 0), 0) / filteredData.length
      : 0
  const avgMargin =
    filteredData.length > 0
      ? filteredData.reduce((sum, item) => sum + Number(item.margemOrcada || 0), 0) / filteredData.length
      : 0

  function handleFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function openNewPriceModal() {
    setEditingId(null)
    setBasePriceId('')
    setNewPriceForm(createEmptyNewPriceForm())
    setShowNewPriceModal(true)
  }

  function openEditPriceModal(item: PricingHistoryRecord) {
    const today = getTodayISO()
    setEditingId(item.id)
    setBasePriceId('')
    setNewPriceForm({
      client_id: item.cliente || '',
      sku: item.sku || '',
      net_price: String(item.precoLiquido ?? ''),
      gross_price: String(item.precoBruto ?? ''),
      margin_budget: String(item.margemOrcada ?? ''),
      size: item.tamanho || '',
      manager: item.gestora || '',
      code: item.codigo || '',
      category: item.categoria || '',
      subcategory: item.subcategoria || '',
      month: item.mes ? `${String(item.mes).slice(0, 7)}-01` : '',
      obs: '',
      date: item.mes ? `${String(item.mes).slice(0, 7)}-01` : today,
      currency: (item.moeda === 'USD' ? 'USD' : 'BRL'),
    })
    setShowNewPriceModal(true)
  }

  function handleNewPriceChange(field: keyof NewPriceForm, value: string) {
    setNewPriceForm((current) => {
      if (field === 'client_id') {
        return { ...current, client_id: value, sku: '' }
      }
      return { ...current, [field]: value } as NewPriceForm
    })
  }

  function handleBasePriceChange(nextId: string) {
    setBasePriceId(nextId)
    if (!nextId) return
    const base = rows.find((r) => r.id === nextId)
    if (!base) return

    const today = getTodayISO()
    setNewPriceForm((current) => ({
      ...current,
      client_id: base.cliente || '',
      sku: base.sku || '',
      net_price: String(base.precoLiquido ?? ''),
      gross_price: String(base.precoBruto ?? ''),
      margin_budget: String(base.margemOrcada ?? ''),
      size: base.tamanho || '',
      manager: base.gestora || '',
      code: base.codigo || '',
      category: base.categoria || '',
      subcategory: base.subcategoria || '',
      month: base.mes ? `${String(base.mes).slice(0, 7)}-01` : '',
      obs: '',
      date: today,
      currency: (base.moeda === 'USD' ? 'USD' : 'BRL'),
    }))
  }

  async function handleNewPriceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newPriceForm.client_id || !newPriceForm.sku || !newPriceForm.net_price || !newPriceForm.date) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const netPrice = Number.parseFloat(newPriceForm.net_price)
    if (Number.isNaN(netPrice) || netPrice <= 0) {
      alert('Preço líquido deve ser um número positivo.')
      return
    }

    const grossPrice = newPriceForm.gross_price ? Number.parseFloat(newPriceForm.gross_price) : null
    const marginBudget = newPriceForm.margin_budget ? Number.parseFloat(newPriceForm.margin_budget) : null

    const sku = newPriceForm.sku.trim().toUpperCase()
    const monthFromMonthInput = newPriceForm.month ? newPriceForm.month.slice(0, 7) : null
    const monthFromDate = newPriceForm.date ? newPriceForm.date.slice(0, 7) : null
    const effectiveMonth = monthFromMonthInput || monthFromDate || getTodayISO().slice(0, 7)

    try {
      const payloadBase = {
        cliente: newPriceForm.client_id,
        sku,
        codigo: newPriceForm.code?.trim() || '',
        categoria: (newPriceForm.category?.trim() || 'Outros'),
        subcategoria: newPriceForm.subcategory?.trim() || '',
        tamanho: newPriceForm.size?.trim() || '',
        gestora: newPriceForm.manager?.trim() || '',
        canal: '',
        status: 'Ativo',
        precoLiquido: netPrice,
        precoBruto: grossPrice ?? netPrice,
        precoAnterior: netPrice,
        custo: 0,
        margemOrcada: marginBudget ?? 0,
        moeda: newPriceForm.currency,
        mes: effectiveMonth,
      } as const

      if (editingId) {
        const existing = rows.find((r) => r.id === editingId)
        const updated = await pricingService.update(editingId, {
          ...(existing ?? ({} as PricingHistoryRecord)),
          id: editingId,
          ...payloadBase,
        })
        setRows((current) => current.map((row) => (row.id === editingId ? updated : row)))
        alert('Preço atualizado com sucesso!')
      } else {
        const created = await pricingService.create(payloadBase)
        setRows((prev) => [created, ...prev])
        alert('Preço cadastrado com sucesso!')
      }

      setShowNewPriceModal(false)
      setEditingId(null)
      setBasePriceId('')
      setNewPriceForm(createEmptyNewPriceForm())

      const refreshed = await pricingService.getAll()
      setRows(refreshed)
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar preço.')
    }
  }

  function handleExportExcel() {
  const exportData = filteredData.map((item) => ({
    Cliente: item.cliente,
    SKU: item.sku,
    Código: item.codigo,
    Categoria: item.categoria,
    Subcategoria: item.subcategoria,
    Tamanho: item.tamanho,
    Gestora: item.gestora,
    'Preço Líquido': item.precoLiquido,
    'Preço Bruto': item.precoBruto,
    Custo: item.custo,
    Margem: item.margemOrcada,
    Moeda: item.moeda,
    Mês: item.mes,
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)

  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing')

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  const data = new Blob(
    [excelBuffer],
    { type: 'application/octet-stream' }
  )

  saveAs(data, 'NeoPrice_Export.xlsx')
}
  function handleEdit(item: PricingHistoryRecord) {
    openEditPriceModal(item)
  }

  return (
  <div className="min-h-screen bg-gray-50 transition-colors duration-200">

    {showNewPriceModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#171717] rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl border dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 shrink-0 bg-white dark:bg-[#171717]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Editar Preço' : 'Novo Preço'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowNewPriceModal(false)
                setEditingId(null)
                setBasePriceId('')
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <form id="newPriceForm" onSubmit={handleNewPriceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {!editingId && (
                  <div className="col-span-2 mb-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                      <Copy size={16} />
                      Usar preço existente como base
                    </div>
                    <SearchableSelect
                      id="base-price"
                      options={rows.map((r) => ({
                        value: r.id,
                        label: `${r.cliente} • ${r.sku} • ${String(r.mes || '')}`,
                      }))}
                      value={basePriceId}
                      onChange={handleBasePriceChange}
                      placeholder="Selecione um preço existente"
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cliente *</label>
                  <SearchableSelect
                    id="np-client"
                    options={clientOptions}
                    value={newPriceForm.client_id}
                    onChange={(value) => handleNewPriceChange('client_id', value)}
                    placeholder="Selecione um cliente"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">SKU *</label>
                  <input
                    type="text"
                    required
                    value={newPriceForm.sku}
                    onChange={(event) => handleNewPriceChange('sku', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Digite o SKU"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Código</label>
                  <input
                    type="text"
                    value={newPriceForm.code}
                    onChange={(event) => handleNewPriceChange('code', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Gestora</label>
                  <input
                    type="text"
                    value={newPriceForm.manager}
                    onChange={(event) => handleNewPriceChange('manager', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tamanho</label>
                  <input
                    type="text"
                    value={newPriceForm.size}
                    onChange={(event) => handleNewPriceChange('size', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Categoria</label>
                  <SearchableSelect
                    id="np-category"
                    options={categoryOptions}
                    value={newPriceForm.category}
                    onChange={(value) => handleNewPriceChange('category', value)}
                    placeholder="Selecione"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subcategoria</label>
                  <SearchableSelect
                    id="np-subcategory"
                    options={subcategoryOptions}
                    value={newPriceForm.subcategory}
                    onChange={(value) => handleNewPriceChange('subcategory', value)}
                    placeholder="Selecione"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Mês</label>
                  <input
                    type="date"
                    value={newPriceForm.month}
                    onChange={(event) => handleNewPriceChange('month', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Preço Líquido *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newPriceForm.net_price}
                    onChange={(event) => handleNewPriceChange('net_price', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Preço Bruto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPriceForm.gross_price}
                    onChange={(event) => handleNewPriceChange('gross_price', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Margem Orçada (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPriceForm.margin_budget}
                    onChange={(event) => handleNewPriceChange('margin_budget', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Moeda</label>
                  <select
                    value={newPriceForm.currency}
                    onChange={(event) => handleNewPriceChange('currency', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data *</label>
                  <input
                    type="date"
                    required
                    value={newPriceForm.date}
                    onChange={(event) => handleNewPriceChange('date', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Observações</label>
                  <textarea
                    rows={3}
                    value={newPriceForm.obs}
                    onChange={(event) => handleNewPriceChange('obs', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] rounded-b-lg flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowNewPriceModal(false)
                setEditingId(null)
                setBasePriceId('')
                setNewPriceForm(createEmptyNewPriceForm())
              }}
              className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="newPriceForm"
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    )}

    {showAliasManager && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#171717] dark:border dark:border-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Gerenciar Depara de Clientes
            </h2>
            <button
              onClick={() => setShowAliasManager(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-transform hover:scale-110"
            >
              ✕
            </button>
          </div>
          <ClientAliasManager user={user} refreshAliases={refreshAliases} />
        </div>
      </div>
    )}

    <div className="max-w-[110rem] mx-auto px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={openNewPriceModal}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors transition-transform hover:scale-105 active:scale-95 text-white w-[180px]"
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            <Plus size={18} />
            Novo Preço
          </button>

          <label
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors transition-transform hover:scale-105 active:scale-95 text-white w-[180px] cursor-pointer"
            style={{ backgroundColor: 'var(--color-info)' }}
          >
              <Upload size={18} />
              Importar Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const formData = new FormData()
                  formData.append('file', file)
                  try {
                    const session = localStorage.getItem('neoprice_auth_session')
                    const parsed = session ? JSON.parse(session) as { token?: string; access_token?: string } : null
                    const token = parsed?.token ?? parsed?.access_token ?? null
                    const res = await fetch('http://localhost:8000/api/v1/excel/pricing/import-excel', {
                      method: 'POST',
                      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
                      body: formData,
                    })
                    const data = await res.json()
                    alert(`Importação concluída!\nStatus: ${data.status}\nProcessados: ${data.processed_rows}\nErros: ${data.error_rows}`)
                    const updated = await pricingService.getAll()
                    setRows(updated)
                  } catch (err) {
                    alert('Erro ao importar arquivo.')
                    console.error(err)
                  }
                  e.target.value = ''
                }}
              />
            </label>
            <button
              onClick={() => navigate('/pricing/analytics')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors transition-transform hover:scale-105 active:scale-95 text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <BarChart3 size={18} />
              Ver Dashboards/Análises
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
            onClick={handleExportExcel}
            className="flex items-center justify-center px-3 py-2 rounded-lg font-semibold transition-colors hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300" title="Exportar">
              <Download size={18} />
            </button>
            <button
              onClick={() => setShowAliasManager(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <Settings size={18} />
              Gerenciar Depara
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[110rem] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 shadow-sm card-pronutrition hover-lift transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Clientes</p>
                <p className="text-2xl font-bold text-black dark:text-white">{new Set(filteredData.map((item) => item.cliente)).size}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 shadow-sm card-pronutrition hover-lift transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total SKUs</p>
                <p className="text-2xl font-bold text-black dark:text-white">{new Set(filteredData.map((item) => item.codigo)).size}</p>
              </div>
              <Package className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 shadow-sm card-pronutrition hover-lift transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preço Médio</p>
                <p className="text-2xl font-bold text-black dark:text-white">R$ {avgPrice.toFixed(2)}</p>
              </div>
              <DollarSign className="text-yellow-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 shadow-sm card-pronutrition hover-lift transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Margem Média</p>
                <p className="text-2xl font-bold text-black dark:text-white">{avgMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="text-purple-500" size={32} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[110rem] mx-auto px-6">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 shadow-sm mb-6 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">SKU</label>
              <SearchableSelect id="f-sku" options={skuOptions} value={filters.sku} onChange={(value) => handleFilterChange('sku', value)} placeholder="Todos os SKUs" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cliente</label>
              <SearchableSelect id="f-client" options={clientOptions} value={filters.client} onChange={(value) => handleFilterChange('client', value)} placeholder="Todos os clientes" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Código Datasul</label>
              <input type="text" value={filters.datasulCode} onChange={(event) => handleFilterChange('datasulCode', event.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#262626] text-black dark:text-white transition-colors" placeholder="Filtrar por código..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Categoria</label>
              <SearchableSelect id="f-category" options={categoryOptions} value={filters.category} onChange={(value) => handleFilterChange('category', value)} placeholder="Todas" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subcategoria</label>
              <SearchableSelect id="f-subcategory" options={subcategoryOptions} value={filters.subcategory} onChange={(value) => handleFilterChange('subcategory', value)} placeholder="Todas" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tamanho</label>
              <SearchableSelect id="f-size" options={sizeOptions} value={filters.size} onChange={(value) => handleFilterChange('size', value)} placeholder="Todos" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data Inicial</label>
              <input type="date" value={filters.dateFrom} onChange={(event) => handleFilterChange('dateFrom', event.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#262626] text-gray-900 dark:text-white dark:[color-scheme:dark] transition-colors"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data Final</label>
              <input type="date" value={filters.dateTo} onChange={(event) => handleFilterChange('dateTo', event.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#262626] text-gray-900 dark:text-white dark:[color-scheme:dark] transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[110rem] mx-auto px-6 pb-6">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm overflow-hidden transition-colors">
          <div className="overflow-auto h-[calc(100vh-320px)]">
            <table className="w-full min-w-[1500px]">
              <thead className="bg-gray-50 sticky top-0 z-40 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gestora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço líquido</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Preço bruto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0a0a0a] divide-y divide-gray-200 dark:divide-[#27272A] transition-colors">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Carregando...</td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-red-600">{loadError}</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Nenhum dado encontrado</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{item.cliente}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{item.tamanho || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{item.gestora || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{item.codigo || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">R$ {(item.precoLiquido ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">R$ {(item.precoBruto ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/pricing/analytics?sku=${encodeURIComponent(item.sku)}&client=${encodeURIComponent(item.cliente)}`)}
                            className="p-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors transition-transform hover:scale-105 active:scale-95"
                            style={{ color: 'var(--color-success)' }}
                            title="Ver Analytics"
                          >
                            <BarChart3 size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors transition-transform hover:scale-105 active:scale-95"
                            style={{ color: 'var(--color-info)' }}
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                console.log('DELETANDO ID:', item.id)

                                await pricingService.remove(item.id)

                                setRows((current) =>
                                  current.filter((row) => row.id !== item.id)
                                )

                                alert('Registro deletado com sucesso!')
                              } catch (error) {
                                console.error(error)
                                alert('Erro ao deletar registro')
                              }
                            }}
                            className="p-2 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors transition-transform hover:scale-105 active:scale-95"
                            style={{ color: 'var(--color-danger)' }}
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

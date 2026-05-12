import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
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
} from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
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

function toDateFromMonth(month: string): Date {
  const [year, monthPart] = month.split('-').map(Number)
  return new Date(year, (monthPart || 1) - 1, 1)
}

export default function PricingDashboardPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<PricingHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const handleImportExcel = async (
  event: React.ChangeEvent<HTMLInputElement>
  ) => {

  const file = event.target.files?.[0]

  if (!file) return

  try {

    const formData = new FormData()

    formData.append("file", file)

    const response = await fetch(
      "http://127.0.0.1:8000/api/v1/excel/pricing/import-excel",
      {
        method: "POST",
        body: formData,
      }
    )

    const data = await response.json()

    console.log("UPLOAD:", data)

    alert("Excel enviado com sucesso!")

    } catch (error) {

      console.error(error)

      alert("Erro ao importar Excel")
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const data = await pricingService.getAll()
        setRows(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filteredData = useMemo(() => {
    return rows.filter((item) => {
      const byClient = !filters.client || item.cliente === filters.client
      const bySku = !filters.sku || item.sku === filters.sku
      const byCode = !filters.datasulCode || item.codigo.toLowerCase().includes(filters.datasulCode.toLowerCase())
      const byCategory = !filters.category || item.categoria === filters.category
      const bySubcategory = !filters.subcategory || item.subcategoria === filters.subcategory
      const bySize = !filters.size || item.tamanho === filters.size

      const currentDate = toDateFromMonth(item.mes)
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null
      const byDateFrom = !fromDate || currentDate >= fromDate
      const byDateTo = !toDate || currentDate <= toDate

      return byClient && bySku && byCode && byCategory && bySubcategory && bySize && byDateFrom && byDateTo
    })
  }, [filters, rows])

  const clientOptions = useMemo(
    () => [...new Set(rows.map((item) => item.cliente))].map((value) => ({ value, label: value })),
    [rows],
  )
  const skuOptions = useMemo(
    () => [...new Set(rows.map((item) => item.sku))].map((value) => ({ value, label: value })),
    [rows],
  )
  const categoryOptions = useMemo(
    () => [...new Set(rows.map((item) => item.categoria))].map((value) => ({ value, label: value })),
    [rows],
  )
  const subcategoryOptions = useMemo(
    () => [...new Set(rows.map((item) => item.subcategoria))].map((value) => ({ value, label: value })),
    [rows],
  )
  const sizeOptions = useMemo(
    () => [...new Set(rows.map((item) => item.tamanho))].map((value) => ({ value, label: value })),
    [rows],
  )

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

  async function handleNewPrice() {
  const created = await pricingService.create({
    cliente: 'Cliente Novo',
    sku: `SKU-${Date.now().toString().slice(-3)}`,
    codigo: `NP-${Date.now().toString().slice(-3)}`,
    categoria: 'Outros',
    subcategoria: '',
    tamanho: '',
    gestora: '',
    canal: '',
    status: 'Ativo',
    precoBruto: 0,
    precoAnterior: 0,
    precoLiquido: 0,
    custo: 0,
    margemOrcada: 0,
    moeda: 'BRL',
    mes: '2026-05',
  })

  setRows((current) => [created, ...current])
}

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      <div className="max-w-[110rem] mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => void handleNewPrice()}
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
                    const token = session ? JSON.parse(session).access_token : null
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
            <button className="flex items-center justify-center px-3 py-2 rounded-lg font-semibold transition-colors hover:shadow-md hover:bg-gray-100 text-gray-600" title="Exportar">
              <Download size={18} />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors hover:shadow-md hover:bg-gray-100 text-gray-600">
              <Settings size={18} />
              Gerenciar Depara
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[110rem] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm card-pronutrition hover-lift transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Clientes</p>
                <p className="text-2xl font-bold text-black dark:text-white">{new Set(filteredData.map((item) => item.cliente)).size}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm card-pronutrition hover-lift transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total SKUs</p>
                <p className="text-2xl font-bold text-black dark:text-white">{new Set(filteredData.map((item) => item.codigo)).size}</p>
              </div>
              <Package className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm card-pronutrition hover-lift transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preço Médio</p>
                <p className="text-2xl font-bold text-black dark:text-white">R$ {avgPrice.toFixed(2)}</p>
              </div>
              <DollarSign className="text-yellow-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm card-pronutrition hover-lift transition-colors">
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
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm mb-6 transition-colors">
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
              <input type="text" value={filters.datasulCode} onChange={(event) => handleFilterChange('datasulCode', event.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#111827] text-black dark:text-white transition-colors" placeholder="Filtrar por código..." />
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
              <input type="date" value={filters.dateFrom} onChange={(event) => handleFilterChange('dateFrom', event.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#111827] text-gray-900 dark:text-white dark:[color-scheme:dark] transition-colors"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data Final</label>
              <input type="date" value={filters.dateTo} onChange={(event) => handleFilterChange('dateTo', event.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#111827] text-gray-900 dark:text-white dark:[color-scheme:dark] transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[110rem] mx-auto px-6 pb-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden transition-colors">
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
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Carregando...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Nenhum dado encontrado</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1f2937] transition-colors">
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

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, Calendar, Filter, Search, TrendingUp, X } from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
import { pricingService } from '../services/pricingService'
import type { PricingHistoryRecord } from '../types'

function formatShortMonth(month: string): string {
  const [year, monthPart] = month.split('-').map(Number)
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const safeMonth = months[Math.max(0, Math.min(11, (monthPart || 1) - 1))]
  return `${safeMonth}/${String(year).slice(-2)}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '0%'
  if (Number.isInteger(numeric)) return `${numeric}%`
  return `${numeric.toFixed(1).replace('.', ',')}%`
}

type PointLabelProps = {
  x?: number | string
  y?: number | string
  value?: number | string | boolean | null
  index?: number
}

function renderPricePointLabel({ x, y, value, index }: PointLabelProps) {
  const numericX = Number(x)
  const numericY = Number(y)
  if (!Number.isFinite(numericX) || !Number.isFinite(numericY) || typeof value !== 'number') return null
  const isFirst = index === 0
  return (
    <text
      x={isFirst ? numericX + 10 : numericX}
      y={numericY - 10}
      fill="#8b8b8b"
      fontSize={14}
      textAnchor={isFirst ? 'start' : 'middle'}
    >
      {formatCurrency(value)}
    </text>
  )
}

function renderMarginPointLabel({ x, y, value, index }: PointLabelProps) {
  const numericX = Number(x)
  const numericY = Number(y)
  if (!Number.isFinite(numericX) || !Number.isFinite(numericY) || typeof value !== 'number') return null
  const isFirst = index === 0
  return (
    <text
      x={isFirst ? numericX + 10 : numericX}
      y={numericY - 10}
      fill="#8b8b8b"
      fontSize={14}
      textAnchor={isFirst ? 'start' : 'middle'}
    >
      {formatPercent(value)}
    </text>
  )
}

export default function PricingAnalyticsPage() {
  const [searchParams] = useSearchParams()

  const [rows, setRows] = useState<PricingHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedClient, setSelectedClient] = useState(searchParams.get('client') ?? '')
  const [selectedSKU, setSelectedSKU] = useState(searchParams.get('sku') ?? '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [datasulCode, setDatasulCode] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

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

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const byClient = !selectedClient || item.cliente === selectedClient
      const bySku = !selectedSKU || item.sku === selectedSKU
      const byCode = !datasulCode || item.codigo.toLowerCase().includes(datasulCode.toLowerCase())
      const byCategory = !selectedCategory || item.categoria === selectedCategory
      const bySubcategory = !selectedSubcategory || item.subcategoria === selectedSubcategory
      const bySize = !selectedSize || item.tamanho === selectedSize

      const itemDate = new Date(`${item.mes}-01`)
      const startOk = !dateStart || itemDate >= new Date(dateStart)
      const endOk = !dateEnd || itemDate <= new Date(dateEnd)

      return byClient && bySku && byCode && byCategory && bySubcategory && bySize && startOk && endOk
    })
  }, [
    rows,
    selectedClient,
    selectedSKU,
    datasulCode,
    selectedCategory,
    selectedSubcategory,
    selectedSize,
    dateStart,
    dateEnd,
  ])

  const evolutionData = useMemo(() => {
    const grouped = filteredRows.reduce<Record<string, { totalPrice: number; totalMargin: number; count: number }>>(
      (acc, item) => {
        const bucket = acc[item.mes] ?? { totalPrice: 0, totalMargin: 0, count: 0 }
        bucket.totalPrice += item.precoBruto
        bucket.totalMargin += item.margemOrcada
        bucket.count += 1
        acc[item.mes] = bucket
        return acc
      },
      {},
    )

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month: formatShortMonth(month),
        avgPrice: Number((values.totalPrice / values.count).toFixed(2)),
        avgMargin: Number((values.totalMargin / values.count).toFixed(1)),
      }))
  }, [filteredRows])

  const chartData = useMemo(() => {
    const avgPrice =
      filteredRows.length > 0
        ? formatCurrency(filteredRows.reduce((sum, item) => sum + item.precoBruto, 0) / filteredRows.length)
        : formatCurrency(0)
    const avgMargin =
      filteredRows.length > 0
        ? formatPercent(filteredRows.reduce((sum, item) => sum + item.margemOrcada, 0) / filteredRows.length)
        : '0%'

    const latest = [...filteredRows].sort((a, b) => b.mes.localeCompare(a.mes))[0]
    const lastPriceDate = latest ? formatShortMonth(latest.mes) : '-'

    const skuFromCode = datasulCode
      ? filteredRows.find((item) => item.codigo.toLowerCase().includes(datasulCode.toLowerCase()))?.sku ?? '-'
      : ''

    return {
      avgPrice,
      avgMargin,
      lastPriceDate,
      skuFromCode,
      evolutionData,
    }
  }, [datasulCode, evolutionData, filteredRows])

  function clearFilters() {
    setSelectedClient('')
    setSelectedSKU('')
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedSize('')
    setDatasulCode('')
    setDateStart('')
    setDateEnd('')
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      <div className="max-w-[110rem] mx-auto px-6 py-4">
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6 card-pronutrition hover-lift transition-colors duration-200">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              <Filter size={20} />
              Filtros de Análise
            </h3>
            {(selectedClient || selectedSKU || selectedCategory || selectedSubcategory || selectedSize || datasulCode || dateStart || dateEnd) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
              >
                <X size={14} />
                Limpar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">SKU</label>
              <SearchableSelect id="a-sku" options={skuOptions} value={selectedSKU} onChange={setSelectedSKU} placeholder="Todos os SKUs" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Cliente</label>
              <SearchableSelect id="a-client" options={clientOptions} value={selectedClient} onChange={setSelectedClient} placeholder="Todos os Clientes" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Código Datasul</label>
              <input
                type="text"
                value={datasulCode}
                onChange={(event) => setDatasulCode(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Filtrar por código..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Categoria</label>
              <SearchableSelect id="a-category" options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} placeholder="Todas" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Subcategoria</label>
              <SearchableSelect id="a-subcategory" options={subcategoryOptions} value={selectedSubcategory} onChange={setSelectedSubcategory} placeholder="Todas" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Tamanho</label>
              <SearchableSelect id="a-size" options={sizeOptions} value={selectedSize} onChange={setSelectedSize} placeholder="Todos" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Data Inicial</label>
              <input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Data Final</label>
              <input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Carregando analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <Calendar className="text-blue-500 mb-1" size={38} />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-0.5">Data do último preço vigente</p>
                    <p className="text-2xl font-bold text-gray-900">{chartData.lastPriceDate}</p>
                  </div>
                </div>
              </div>

              {datasulCode ? (
                <div className="bg-white rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                  <div className="flex flex-col items-center justify-center text-center gap-2">
                    <Search className="text-indigo-500 mb-1" size={38} />
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-0.5">SKU</p>
                      <p className="text-2xl font-bold text-gray-900">{chartData.skuFromCode}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="bg-white rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <TrendingUp className="text-yellow-500 mb-1" size={38} />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-0.5">Preço Médio</p>
                    <p className="text-2xl font-bold text-gray-900">{chartData.avgPrice}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <BarChart3 className="text-purple-500 mb-1" size={38} />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-0.5">Margem Média</p>
                    <p className="text-2xl font-bold text-gray-900">{chartData.avgMargin}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm card-pronutrition hover-lift">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <TrendingUp size={20} />
                  {selectedSKU ? `Evolução de Preço - ${selectedSKU}` : 'Evolução do Preço Médio'}
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.evolutionData} margin={{ top: 24, right: 40, left: 68, bottom: 16 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} strokeOpacity={0} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        dy={10}
                        padding={{ left: 10, right: 16 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(Number(value))}
                      />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Preço']} />
                      <Area type="monotone" dataKey="avgPrice" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)">
                        <LabelList dataKey="avgPrice" content={renderPricePointLabel} />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm card-pronutrition hover-lift">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <BarChart3 size={20} />
                  {selectedSKU ? `Evolução de Margem - ${selectedSKU}` : 'Evolução da Margem Média'}
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.evolutionData} margin={{ top: 24, right: 40, left: 68, bottom: 16 }}>
                      <defs>
                        <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} strokeOpacity={0} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        dy={10}
                        padding={{ left: 10, right: 16 }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [formatPercent(Number(value)), 'Margem']} />
                      <Area type="monotone" dataKey="avgMargin" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)">
                        <LabelList dataKey="avgMargin" content={renderMarginPointLabel} />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

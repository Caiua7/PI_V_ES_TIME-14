import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)
}

function formatPercent(value: number): string {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '0%'
  return `${numeric.toFixed(1).replace('.', ',')}%`
}

function normalize(value: string): string {
  return String(value || '').trim().toLowerCase()
}

export default function PricingAnalyticsPage() {
  const [searchParams] = useSearchParams()

  const [rows, setRows] = useState<PricingHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [evolutionData, setEvolutionData] = useState<{ month: string; avgPrice: number; avgMargin: number }[]>([])
  const [cards, setCards] = useState<{
    registros_analisados: number
    preco_medio: number
    margem_media: number
    sku_card: { visible: boolean; value: string | null }
    benchmarking_card: { visible: boolean; value: number | null; category: string | null }
  } | null>(null)

  const [selectedClient, setSelectedClient] = useState(searchParams.get('client') ?? '')
  const [selectedSKU, setSelectedSKU] = useState(searchParams.get('sku') ?? '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [datasulCode, setDatasulCode] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  // Carrega dados (uma vez)
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

  const optionRows = useMemo(() => {
    return (exclude?: 'client' | 'sku' | 'category' | 'subcategory' | 'size') => {
      const active = {
        client: exclude === 'client' ? '' : selectedClient,
        sku: exclude === 'sku' ? '' : selectedSKU,
        category: exclude === 'category' ? '' : selectedCategory,
        subcategory: exclude === 'subcategory' ? '' : selectedSubcategory,
        size: exclude === 'size' ? '' : selectedSize,
        datasulCode,
        dateStart,
        dateEnd,
      }

      const fromMonth = active.dateStart ? active.dateStart.slice(0, 7) : ''
      const toMonth = active.dateEnd ? active.dateEnd.slice(0, 7) : ''
      const codeQuery = normalize(active.datasulCode)

      return rows.filter((r) => {
        const byClient = !active.client || normalize(r.cliente) === normalize(active.client)
        const bySku = !active.sku || normalize(r.sku) === normalize(active.sku)
        const byCategory = !active.category || normalize(r.categoria) === normalize(active.category)
        const bySubcategory = !active.subcategory || normalize(r.subcategoria) === normalize(active.subcategory)
        const bySize = !active.size || normalize(r.tamanho) === normalize(active.size)
        const byCode = !codeQuery || normalize(r.codigo).includes(codeQuery)

        const month = String(r.mes || '').slice(0, 7)
        const byFrom = !fromMonth || month >= fromMonth
        const byTo = !toMonth || month <= toMonth

        return byClient && bySku && byCategory && bySubcategory && bySize && byCode && byFrom && byTo
      })
    }
  }, [rows, selectedClient, selectedSKU, selectedCategory, selectedSubcategory, selectedSize, datasulCode, dateStart, dateEnd])

  const filteredRows = useMemo(() => optionRows(), [optionRows])

  useEffect(() => {
    const byMonth = new Map<string, { sumPrice: number; sumMargin: number; count: number }>()

    for (const row of filteredRows) {
      const month = String(row.mes || '').slice(0, 7)
      if (!month) continue
      const agg = byMonth.get(month) ?? { sumPrice: 0, sumMargin: 0, count: 0 }
      agg.sumPrice += Number(row.precoBruto ?? 0)
      agg.sumMargin += Number(row.margemOrcada ?? 0)
      agg.count += 1
      byMonth.set(month, agg)
    }

    const series = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, agg]) => ({
        month: formatShortMonth(month),
        avgPrice: agg.count ? Number((agg.sumPrice / agg.count).toFixed(2)) : 0,
        avgMargin: agg.count ? Number((agg.sumMargin / agg.count).toFixed(2)) : 0,
      }))

    setEvolutionData(series)

    const total = filteredRows.length
    const sumPrice = filteredRows.reduce((acc, item) => acc + Number(item.precoBruto ?? 0), 0)
    const sumMargin = filteredRows.reduce((acc, item) => acc + Number(item.margemOrcada ?? 0), 0)
    const preco_medio = total ? Number((sumPrice / total).toFixed(2)) : 0
    const margem_media = total ? Number((sumMargin / total).toFixed(2)) : 0

    setCards({
      registros_analisados: total,
      preco_medio,
      margem_media,
      sku_card: { visible: Boolean(selectedSKU), value: selectedSKU || null },
      benchmarking_card: { visible: Boolean(selectedCategory), value: selectedCategory ? margem_media : null, category: selectedCategory || null },
    })
  }, [filteredRows, selectedSKU, selectedCategory])

  const clientOptions = useMemo(() => {
    const base = optionRows('client')
    return [...new Set(base.map((r) => r.cliente).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ value: v, label: v }))
  }, [optionRows])

  const skuOptions = useMemo(() => {
    const base = optionRows('sku')
    return [...new Set(base.map((r) => r.sku).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ value: v, label: v }))
  }, [optionRows])

  const categoryOptions = useMemo(() => {
    const base = optionRows('category')
    return [...new Set(base.map((r) => r.categoria).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ value: v, label: v }))
  }, [optionRows])

  const subcategoryOptions = useMemo(() => {
    const base = optionRows('subcategory')
    return [...new Set(base.map((r) => r.subcategoria).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ value: v, label: v }))
  }, [optionRows])

  const sizeOptions = useMemo(() => {
    const base = optionRows('size')
    return [...new Set(base.map((r) => r.tamanho).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ value: v, label: v }))
  }, [optionRows])

  useEffect(() => {
    if (selectedClient && !clientOptions.some((o) => o.value === selectedClient)) setSelectedClient('')
    if (selectedSKU && !skuOptions.some((o) => o.value === selectedSKU)) setSelectedSKU('')
    if (selectedCategory && !categoryOptions.some((o) => o.value === selectedCategory)) setSelectedCategory('')
    if (selectedSubcategory && !subcategoryOptions.some((o) => o.value === selectedSubcategory)) setSelectedSubcategory('')
    if (selectedSize && !sizeOptions.some((o) => o.value === selectedSize)) setSelectedSize('')
  }, [clientOptions, skuOptions, categoryOptions, subcategoryOptions, sizeOptions, selectedClient, selectedSKU, selectedCategory, selectedSubcategory, selectedSize])

  function clearFilters() {
    setSelectedClient(''); setSelectedSKU(''); setSelectedCategory('')
    setSelectedSubcategory(''); setSelectedSize(''); setDatasulCode('')
    setDateStart(''); setDateEnd('')
  }

  const hasFilters = selectedClient || selectedSKU || selectedCategory || selectedSubcategory || selectedSize || datasulCode || dateStart || dateEnd

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      <div className="max-w-[110rem] mx-auto px-6 py-4">

        {/* Filtros */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 shadow-sm mb-6 card-pronutrition hover-lift">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white"><Filter size={20} />Filtros de Análise</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors">
                <X size={14} />Limpar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">SKU</label>
              <SearchableSelect id="a-sku" options={skuOptions} value={selectedSKU} onChange={setSelectedSKU} placeholder="Todos os SKUs" /></div>
            <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cliente</label>
              <SearchableSelect id="a-client" options={clientOptions} value={selectedClient} onChange={setSelectedClient} placeholder="Todos os Clientes" /></div>
            <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Código Datasul</label>
              <input type="text" value={datasulCode} onChange={(e) => setDatasulCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Filtrar por código..." /></div>
            <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Categoria</label>
              <SearchableSelect id="a-category" options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} placeholder="Todas" /></div>
            <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subcategoria</label>
              <SearchableSelect id="a-subcategory" options={subcategoryOptions} value={selectedSubcategory} onChange={setSelectedSubcategory} placeholder="Todas" /></div>
            <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tamanho</label>
              <SearchableSelect id="a-size" options={sizeOptions} value={selectedSize} onChange={setSelectedSize} placeholder="Todos" /></div>
            <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data Inicial</label>
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" /></div>
            <div><label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data Final</label>
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#262626] text-gray-900 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" /></div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Carregando analytics...</div>
        ) : (
          <>
            {/* Cards KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <Calendar className="text-blue-500 mb-1" size={38} />
                  <p className="text-sm font-medium text-gray-600">Registros Analisados</p>
                  <p className="text-2xl font-bold text-black dark:text-white">{cards?.registros_analisados ?? 0}</p>
                </div>
              </div>

              {cards?.sku_card.visible && (
                <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                  <div className="flex flex-col items-center justify-center text-center gap-2">
                    <Search className="text-indigo-500 mb-1" size={38} />
                    <p className="text-sm font-medium text-gray-600">SKU Selecionado</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{cards.sku_card.value}</p>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <TrendingUp className="text-yellow-500 mb-1" size={38} />
                  <p className="text-sm font-medium text-gray-600">Preço Médio</p>
                  <p className="text-2xl font-bold text-black dark:text-white">{formatCurrency(cards?.preco_medio ?? 0)}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <BarChart3 className="text-purple-500 mb-1" size={38} />
                  <p className="text-sm font-medium text-gray-600">Margem Média</p>
                  <p className="text-2xl font-bold text-black dark:text-white">{formatPercent(cards?.margem_media ?? 0)}</p>
                </div>
              </div>

              {cards?.benchmarking_card.visible && (
                <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-4 shadow-sm card-pronutrition hover-lift">
                  <div className="flex flex-col items-center justify-center text-center gap-2">
                    <BarChart3 className="text-green-500 mb-1" size={38} />
                    <p className="text-sm font-medium text-gray-600">Margem Média — {cards.benchmarking_card.category}</p>
                    <p className="text-2xl font-bold text-black dark:text-white">{formatPercent(cards.benchmarking_card.value ?? 0)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 shadow-sm card-pronutrition hover-lift">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <TrendingUp size={20} />{selectedSKU ? `Evolução de Preço — ${selectedSKU}` : 'Evolução do Preço Médio'}
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 24, right: 40, left: 68, bottom: 16 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} padding={{ left: 10, right: 16 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => formatCurrency(Number(v))} />
                      <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Preço']} />
                      <Area type="monotone" dataKey="avgPrice" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)">
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 shadow-sm card-pronutrition hover-lift">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <BarChart3 size={20} />{selectedSKU ? `Evolução de Margem — ${selectedSKU}` : 'Evolução da Margem Média'}
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 24, right: 40, left: 68, bottom: 16 }}>
                      <defs>
                        <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} padding={{ left: 10, right: 16 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v) => [formatPercent(Number(v)), 'Margem']} />
                      <Area type="monotone" dataKey="avgMargin" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)">
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

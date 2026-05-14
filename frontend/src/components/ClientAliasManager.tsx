import { useEffect, useMemo, useState } from 'react'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { getSupabaseClient } from '../services/supabaseClient'
import { addNotification } from '../utils/notifications'
import type { UserProfile } from '../types'

type DeparaRow = {
  id: string
  source_value: string  // alias (ex: "ML", "Meli")
  target_value: string  // cliente canônico (ex: "Mercado Livre")
  is_active: boolean
}

export default function ClientAliasManager({
  user,
  refreshAliases,
}: {
  user: UserProfile | null
  refreshAliases?: () => void
}) {
  const [depara, setDepara] = useState<DeparaRow[]>([])
  const [newAlias, setNewAlias] = useState('')
  const [newClient, setNewClient] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAlias, setEditAlias] = useState('')
  const [editClient, setEditClient] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('depara_mappings')
        .select('id, source_value, target_value, is_active')
        .eq('mapping_type', 'client')
        .eq('is_active', true)
        .order('target_value')

      if (error) throw error
      setDepara((data as DeparaRow[]) || [])
    } catch (error) {
      console.error('Erro ao carregar depara:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newAlias.trim() || !newClient.trim()) return

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from('depara_mappings').insert({
        mapping_type: 'client',
        source_value: newAlias.trim(),
        target_value: newClient.trim(),
        created_by: user?.id ?? null,
      })

      if (error) throw error

      void addNotification('alias', `Novo depara adicionado: ${newAlias.trim()} → ${newClient.trim()}`, user?.id ?? null)
      setNewAlias('')
      setNewClient('')
      await loadData()
      if (refreshAliases) refreshAliases()
    } catch (error) {
      console.error('Erro ao adicionar depara:', error)
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      alert('Erro ao adicionar depara: ' + message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este depara?')) return

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('depara_mappings')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      void addNotification('alias', 'Depara desativado', user?.id ?? null)
      await loadData()
      if (refreshAliases) refreshAliases()
    } catch (error) {
      console.error('Erro ao excluir depara:', error)
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      alert('Erro ao excluir depara: ' + message)
    }
  }

  function handleEdit(row: DeparaRow) {
    setEditingId(row.id)
    setEditAlias(row.source_value)
    setEditClient(row.target_value)
  }

  async function handleSaveEdit(id: string) {
    if (!editAlias.trim() || !editClient.trim()) return

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('depara_mappings')
        .update({ source_value: editAlias.trim(), target_value: editClient.trim() })
        .eq('id', id)

      if (error) throw error

      void addNotification('alias', `Depara atualizado: ${editAlias.trim()} → ${editClient.trim()}`, user?.id ?? null)
      setEditingId(null)
      await loadData()
      if (refreshAliases) refreshAliases()
    } catch (error) {
      console.error('Erro ao editar depara:', error)
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      alert('Erro ao editar depara: ' + message)
    }
  }

  // Agrupa por cliente canônico (target_value)
  const grouped = useMemo(() => {
    const map: Record<string, DeparaRow[]> = {}
    depara.forEach((row) => {
      if (!map[row.target_value]) map[row.target_value] = []
      map[row.target_value].push(row)
    })
    return map
  }, [depara])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-gray-900 dark:text-white" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Formulário de adição */}
      <form
        onSubmit={handleAdd}
        className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Adicionar Novo Depara
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Alias (como aparece no arquivo) *
            </label>
            <input
              type="text"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              placeholder="Ex: G suplementos, Growthsuplementos"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Cliente canônico (nome oficial) *
            </label>
            <input
              type="text"
              value={newClient}
              onChange={(e) => setNewClient(e.target.value)}
              placeholder="Ex: Growth Suplementos"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!newAlias.trim() || !newClient.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>
        </div>
      </form>

      {/* Lista agrupada por cliente canônico */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([clientName, rows]) => (
          <div
            key={clientName}
            className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
          >
            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              {clientName}
            </h4>
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                >
                  {editingId === row.id ? (
                    <div className="flex items-center gap-3 flex-1 flex-wrap">
                      <input
                        type="text"
                        value={editAlias}
                        onChange={(e) => setEditAlias(e.target.value)}
                        placeholder="Alias"
                        className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-gray-400">→</span>
                      <input
                        type="text"
                        value={editClient}
                        onChange={(e) => setEditClient(e.target.value)}
                        placeholder="Cliente canônico"
                        className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSaveEdit(row.id)}
                        className="px-3 py-2 rounded-lg font-semibold transition-colors"
                        style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-2 rounded-lg font-semibold transition-colors text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {row.source_value}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          style={{ color: 'var(--color-warning)' }}
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id)}
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          style={{ color: 'var(--color-danger)' }}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Nenhum depara cadastrado ainda.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Use o formulário acima para adicionar depara de clientes.
          </p>
        </div>
      )}
    </div>
  )
}
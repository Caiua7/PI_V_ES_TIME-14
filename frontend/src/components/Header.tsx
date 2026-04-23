import { Bell, ChevronLeft, Moon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { UserProfile } from '../types'

export default function Header({
  user,
  onLogout,
}: {
  user: UserProfile | null
  onLogout: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()

  const isAnalytics = location.pathname.includes('/pricing/analytics')
  const title = isAnalytics ? 'Pricing Analytics' : 'NeoPrice'
  const subtitle = isAnalytics ? 'Dashboard de Análises e Inteligência de Dados' : 'Dados e análises'

  const fullName = user?.nome ?? 'Usuário NeoPrice'
  const email = user?.email ?? 'user@neoprice.com'
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {isAnalytics ? (
          <button
            type="button"
            onClick={() => navigate('/pricing/dashboard')}
            className="rounded-full h-10 w-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            title="Voltar"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}

        <div className="flex items-center gap-4">
          <img src="/logo-pronutrition-symbol.png" alt="NeoPrice" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-full text-gray-500 hover:bg-gray-100 h-10 w-10 inline-flex items-center justify-center"
          title="Tema"
        >
          <Moon className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="relative rounded-full text-gray-500 hover:bg-gray-100 h-10 w-10 inline-flex items-center justify-center"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1"></div>

        <button
          type="button"
          onClick={onLogout}
          className="relative h-12 flex items-center gap-3 px-2 hover:bg-gray-100 rounded-lg"
          title="Sair"
        >
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-medium text-gray-900">{fullName}</span>
            <span className="text-xs text-gray-500">{email}</span>
          </div>
          <div className="h-9 w-9 rounded-full border border-gray-200 bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {initials || 'NP'}
          </div>
        </button>
      </div>
    </header>
  )
}

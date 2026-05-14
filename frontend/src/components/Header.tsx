import { Bell, ChevronDown, ChevronLeft, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark'
    } catch {
      return false
    }
  })
  const [menuOpen, setMenuOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    } catch {
      void 0
    }
  }, [darkMode])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isAnalytics = location.pathname.includes('/pricing/analytics')

  const title = isAnalytics ? 'Pricing Analytics' : 'NeoPrice'

  const subtitle = isAnalytics
    ? 'Dashboard de Análises e Inteligência de Dados'
    : 'Dados e análises'

  const fullName = user?.nome ?? 'Usuário NeoPrice'

  const email = user?.email ?? 'user@neoprice.com'

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <header className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#27272A] px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-4">
        {isAnalytics ? (
          <button
            type="button"
            onClick={() => navigate('/pricing/dashboard')}
            className="rounded-full h-10 w-10 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#171717]"
            title="Voltar"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}

        <div className="flex items-center gap-4">
          <img
            src="/logo-pronutrition-symbol.png"
            alt="NeoPrice"
            className="h-10 w-auto"
          />

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setDarkMode((prev) => !prev)}
          className="rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#171717] h-10 w-10 inline-flex items-center justify-center transition-colors"
          title="Tema"
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <button
          type="button"
          className="relative rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#171717] h-10 w-10 inline-flex items-center justify-center transition-colors"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-[#27272A] mx-1"></div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative h-12 flex items-center gap-3 px-2 hover:bg-gray-100 dark:hover:bg-[#171717] rounded-lg transition-colors"
          >
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {fullName}
              </span>

              <span className="text-xs text-gray-500 dark:text-gray-400">
                {email}
              </span>
            </div>

            <div className="h-9 w-9 rounded-full border border-gray-200 dark:border-[#27272A] bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
              {initials || 'NP'}
            </div>

            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#27272A] rounded-xl shadow-lg py-2 z-50">
              <button
                type="button"
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-[#171717] transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

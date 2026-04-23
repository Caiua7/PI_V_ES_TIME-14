import { useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { PricingLayout } from './components/layout'
import CadastroPage from './pages/Cadastro'
import ForgotPasswordPage from './pages/ForgotPassword'
import LoginPage from './pages/Login'
import PricingAnalyticsPage from './pages/PricingAnalytics'
import PricingDashboardPage from './pages/PricingDashboard'
import { authService } from './services/authService'
import type { AuthSession } from './types'

function ProtectedRoute({
  session,
  children,
}: {
  session: AuthSession | null
  children: ReactNode
}) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession())

  async function handleLogout() {
    await authService.logout()
    setSession(null)
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to={session ? '/pricing/dashboard' : '/login'} replace />} />

        <Route
          path="/login"
          element={session ? <Navigate to="/pricing/dashboard" replace /> : <LoginPage onLogin={setSession} />}
        />
        <Route
          path="/cadastro"
          element={session ? <Navigate to="/pricing/dashboard" replace /> : <CadastroPage onRegister={setSession} />}
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/pricing/dashboard"
          element={(
            <ProtectedRoute session={session}>
              <PricingLayout user={session?.usuario ?? null} onLogout={handleLogout}>
                <PricingDashboardPage />
              </PricingLayout>
            </ProtectedRoute>
          )}
        />

        <Route
          path="/pricing/analytics"
          element={(
            <ProtectedRoute session={session}>
              <PricingLayout user={session?.usuario ?? null} onLogout={handleLogout}>
                <PricingAnalyticsPage />
              </PricingLayout>
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<Navigate to={session ? '/pricing/dashboard' : '/login'} replace />} />
      </Routes>
    </div>
  )
}

export default App

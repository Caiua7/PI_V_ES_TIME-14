import type { ReactNode } from 'react'
import Header from './Header'
import type { UserProfile } from '../types'

export function AuthLayout({
  title,
  subtitle,
  children,
  cardClassName,
}: {
  title: string
  subtitle: string
  children: ReactNode
  cardClassName?: string
}) {
  return (
    <main className="auth-page">
      <section className={`auth-card ${cardClassName ?? ''}`}>
        <header className="auth-header">
          <img src="/logo-pronutrition-symbol.png" alt="NeoPrice" className="auth-logo" />
          <h1 className="auth-brand-title">NeoPrice</h1>
          {subtitle ? <p className="auth-brand-subtitle">{subtitle}</p> : null}
          {title ? <h2 className="auth-section-title">{title}</h2> : null}
        </header>
        {children}
      </section>
    </main>
  )
}

export function PricingLayout({
  user,
  onLogout,
  children,
}: {
  user: UserProfile | null
  onLogout: () => void
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      <main>{children}</main>
    </div>
  )
}

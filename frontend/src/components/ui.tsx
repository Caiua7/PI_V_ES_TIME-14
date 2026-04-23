import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'info'
}

export function Button({ loading, variant = 'primary', children, className, ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} ${className ?? ''}`} disabled={loading || props.disabled} {...props}>
      {loading ? 'Carregando...' : children}
    </button>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: ReactNode
  rightElement?: ReactNode
}

export function Input({ label, error, id, icon, rightElement, className, ...props }: InputProps) {
  const hasIcon = Boolean(icon)
  const hasRightElement = Boolean(rightElement)

  return (
    <label className="field" htmlFor={id}>
      <span className="label-pronutrition">{label}</span>
      <div className={hasIcon || hasRightElement ? 'icon-input-wrap' : undefined}>
        {hasIcon ? <span className="icon-input">{icon}</span> : null}
        <input
          id={id}
          className={`input-pronutrition ${hasIcon ? 'icon-input-field' : ''} ${
            hasRightElement ? 'icon-input-right' : ''
          } ${error ? 'input-error' : ''} ${className ?? ''}`}
          {...props}
        />
        {hasRightElement ? rightElement : null}
      </div>
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Array<{ value: string; label: string }>
  error?: string
  icon?: ReactNode
}

export function Select({ label, options, error, id, icon, className, ...props }: SelectProps) {
  const hasIcon = Boolean(icon)

  return (
    <label className="field" htmlFor={id}>
      <span className="label-pronutrition">{label}</span>
      <div className={hasIcon ? 'icon-input-wrap' : undefined}>
        {hasIcon ? <span className="icon-input">{icon}</span> : null}
        <select
          id={id}
          className={`input-pronutrition ${hasIcon ? 'icon-input-field' : ''} ${error ? 'input-error' : ''} ${className ?? ''}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  )
}

export function StatusMessage({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  return <div className={`status status-${type}`}>{message}</div>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export function KpiCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="kpi-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  )
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="chart-card">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

import { clsx } from 'clsx'

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs)
}

export function getApiBase() {
  const url = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (!url) return ''
  return url.replace(/\/$/, '')
}

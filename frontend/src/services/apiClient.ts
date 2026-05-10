const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = localStorage.getItem('neoprice_auth_session')
  const token = session ? JSON.parse(session).access_token : null

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.detail ?? `Erro ${response.status}`)
  }

  return response.json() as Promise<T>
}
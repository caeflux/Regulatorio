const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface FetchOptions extends RequestInit {
  token?: string
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, any>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(res.status, data.error || 'Erro na requisição', data.details)
  }

  return data
}

export const api = {
  get: <T = any>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),

  post: <T = any>(path: string, body?: any, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  patch: <T = any>(path: string, body?: any, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T = any>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
}

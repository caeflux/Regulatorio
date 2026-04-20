'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { api, ApiError } from '@/lib/api'

interface User {
  id: string
  nome: string
  email: string
  role: string
  tenantId: string
}

interface Tenant {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
}

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  token: string | null
  isLoading: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  cnpj: string
  razaoSocial: string
  nomeAdmin: string
  emailAdmin: string
  senhaAdmin: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setToken(accessToken)
  }

  const clearAuth = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setToken(null)
    setUser(null)
    setTenant(null)
  }

  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      const res = await api.get('/api/v1/auth/me', accessToken)
      setUser(res.data)
      setTenant(res.data.tenant)
      setToken(accessToken)
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        // Tentar refresh
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          try {
            const refreshRes = await api.post('/api/v1/auth/refresh', { refreshToken })
            saveTokens(refreshRes.data.accessToken, refreshRes.data.refreshToken)
            const profileRes = await api.get('/api/v1/auth/me', refreshRes.data.accessToken)
            setUser(profileRes.data)
            setTenant(profileRes.data.tenant)
          } catch {
            clearAuth()
          }
        } else {
          clearAuth()
        }
      }
    }
  }, [])

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken')
    if (savedToken) {
      fetchProfile(savedToken).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [fetchProfile])

  const login = async (email: string, senha: string) => {
    const res = await api.post('/api/v1/auth/login', { email, senha })
    saveTokens(res.data.accessToken, res.data.refreshToken)
    setUser(res.data.user)
    setTenant(res.data.tenant)
  }

  const register = async (data: RegisterData) => {
    const res = await api.post('/api/v1/auth/register', data)
    saveTokens(res.data.accessToken, res.data.refreshToken)
    setUser(res.data.user)
    setTenant(res.data.tenant)
  }

  const logout = () => {
    clearAuth()
  }

  return (
    <AuthContext.Provider value={{ user, tenant, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

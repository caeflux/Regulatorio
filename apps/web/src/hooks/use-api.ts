'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from './use-auth'

interface UseApiOptions {
  immediate?: boolean
}

export function useApi<T = any>(path: string, options: UseApiOptions = { immediate: true }) {
  const { token } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get(path, token)
      setData(res.data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }, [path, token])

  useEffect(() => {
    if (options.immediate && token) {
      fetchData()
    }
  }, [fetchData, options.immediate, token])

  return { data, isLoading, error, refetch: fetchData }
}

export function useApiMutation<TBody = any, TResponse = any>(path: string, method: 'POST' | 'PATCH' | 'DELETE' = 'POST') {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (body?: TBody, pathOverride?: string): Promise<TResponse | null> => {
    if (!token) return null
    setIsLoading(true)
    setError(null)
    try {
      const targetPath = pathOverride || path
      let res: any
      if (method === 'DELETE') {
        res = await api.delete(targetPath, token)
      } else if (method === 'PATCH') {
        res = await api.patch(targetPath, body, token)
      } else {
        res = await api.post(targetPath, body, token)
      }
      return res
    } catch (err: any) {
      setError(err.message || 'Erro na operação')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [path, method, token])

  return { mutate, isLoading, error }
}

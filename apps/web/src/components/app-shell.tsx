'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from './ui/sidebar'
import { PageLoading } from './ui/loading'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login')
    }
  }, [isLoading, user, router])

  if (isLoading) return <PageLoading />
  if (!user) return null

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Calculator,
  FileSpreadsheet,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendário', icon: Calendar },
  { href: '/fust-funttel', label: 'FUST / FUNTTEL', icon: Calculator },
  { href: '/dici', label: 'DICI', icon: FileSpreadsheet },
  { href: '/contracts', label: 'Contratos', icon: FileText },
  { href: '/knowledge', label: 'Base de Conhecimento', icon: BookOpen },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, tenant, logout } = useAuth()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <Shield className="h-7 w-7 text-primary-600" />
        <span className="text-lg font-bold text-gray-900">RegTelecom</span>
      </div>

      {/* Tenant info */}
      <div className="border-b border-gray-100 px-6 py-3">
        <p className="text-xs font-medium text-gray-500">Empresa</p>
        <p className="truncate text-sm font-semibold text-gray-800">
          {tenant?.nomeFantasia || tenant?.razaoSocial || '—'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
            {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{user?.nome}</p>
            <p className="truncate text-xs text-gray-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

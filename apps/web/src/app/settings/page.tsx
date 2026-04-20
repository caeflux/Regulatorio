'use client'

import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/hooks/use-auth'
import { formatCNPJ } from '@/lib/utils'
import { User, Building2, Shield } from 'lucide-react'

export default function SettingsPage() {
  const { user, tenant } = useAuth()

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="text-sm text-gray-500">Dados da empresa e do usuario</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Empresa */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Empresa</h2>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Razao Social</dt>
              <dd className="font-medium text-gray-900">{tenant?.razaoSocial || '—'}</dd>
            </div>
            {tenant?.nomeFantasia && (
              <div>
                <dt className="text-sm text-gray-500">Nome Fantasia</dt>
                <dd className="font-medium text-gray-900">{tenant.nomeFantasia}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-500">CNPJ</dt>
              <dd className="font-medium text-gray-900">{tenant ? formatCNPJ(tenant.cnpj) : '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Usuário */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Meu Perfil</h2>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Nome</dt>
              <dd className="font-medium text-gray-900">{user?.nome || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{user?.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Perfil</dt>
              <dd className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-600" />
                <span className="font-medium text-gray-900">{user?.role || '—'}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AppShell>
  )
}

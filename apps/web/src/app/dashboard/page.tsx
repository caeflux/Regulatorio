'use client'

import { AppShell } from '@/components/app-shell'
import { useApi } from '@/hooks/use-api'
import { Loading } from '@/components/ui/loading'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  Calculator,
} from 'lucide-react'

interface DashboardData {
  periodo: string
  pendentes: number
  emAndamento: number
  concluidas: number
  atrasadas: number
  total: number
  complianceRate: number
  semaforo: 'VERDE' | 'AMARELO' | 'VERMELHO'
}

interface UpcomingItem {
  id: string
  nome: string
  tipo: string
  dataLimite: string
  status: string
  diasRestantes: number
}

export default function DashboardPage() {
  const { data: dashboard, isLoading: loadingDash } = useApi<DashboardData>('/api/v1/obligations/dashboard')
  const { data: upcoming, isLoading: loadingUp } = useApi<UpcomingItem[]>('/api/v1/obligations/upcoming?days=30')

  const semaforoColors = {
    VERDE: 'bg-green-500',
    AMARELO: 'bg-yellow-500',
    VERMELHO: 'bg-red-500',
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visao geral do compliance regulatorio</p>
      </div>

      {loadingDash ? (
        <Loading />
      ) : dashboard ? (
        <>
          {/* Semáforo + Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {/* Semáforo */}
            <div className="card flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full ${semaforoColors[dashboard.semaforo]}`} />
              <div>
                <p className="text-sm text-gray-500">Status Geral</p>
                <p className="text-lg font-bold">
                  {dashboard.semaforo === 'VERDE' ? 'Em dia' : dashboard.semaforo === 'AMARELO' ? 'Atencao' : 'Critico'}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 text-gray-500">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm">Compliance</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-primary-600">{dashboard.complianceRate}%</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-4 w-4" />
                <p className="text-sm">Pendentes</p>
              </div>
              <p className="mt-2 text-3xl font-bold">{dashboard.pendentes}</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm">Concluidas</p>
              </div>
              <p className="mt-2 text-3xl font-bold">{dashboard.concluidas}</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm">Atrasadas</p>
              </div>
              <p className="mt-2 text-3xl font-bold">{dashboard.atrasadas}</p>
            </div>
          </div>

          {/* Próximas obrigações */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Proximas obrigacoes (30 dias)</h2>
            {loadingUp ? (
              <Loading />
            ) : upcoming && upcoming.length > 0 ? (
              <div className="card overflow-hidden p-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Obrigacao</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Prazo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Dias</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {upcoming.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nome}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.tipo.replace(/_/g, ' ')}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(item.dataLimite)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm font-semibold ${
                              item.diasRestantes <= 3
                                ? 'text-red-600'
                                : item.diasRestantes <= 7
                                ? 'text-yellow-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {item.diasRestantes}d
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card text-center text-gray-500">
                <Calendar className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2">Nenhuma obrigacao nos proximos 30 dias</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </AppShell>
  )
}

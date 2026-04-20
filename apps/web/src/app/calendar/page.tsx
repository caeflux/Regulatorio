'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { useApi, useApiMutation } from '@/hooks/use-api'
import { Loading } from '@/components/ui/loading'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, CheckCircle } from 'lucide-react'

interface CalendarItem {
  id: string
  nome: string
  tipo: string
  frequencia: string
  dataLimite: string
  status: string
  diasRestantes: number
  responsavel?: { id: string; nome: string }
  periodo: string
  notas?: string
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data, isLoading, refetch } = useApi<CalendarItem[]>(
    `/api/v1/obligations/calendar?year=${year}&month=${month}`,
  )

  const { mutate: generate, isLoading: generating } = useApiMutation('/api/v1/obligations/generate')
  const { mutate: complete } = useApiMutation('/placeholder')

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  const handleGenerate = async () => {
    await generate(undefined, `/api/v1/obligations/generate?year=${year}&month=${month}`)
    refetch()
  }

  const handleComplete = async (id: string) => {
    await complete(undefined, `/api/v1/obligations/${id}/complete`)
    refetch()
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de Obrigacoes</h1>
          <p className="text-sm text-gray-500">Acompanhe prazos e entregas regulatorias</p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          {generating ? 'Gerando...' : 'Gerar Obrigacoes'}
        </button>
      </div>

      {/* Month selector */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={prevMonth} className="btn-secondary p-2">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
          {monthNames[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="btn-secondary p-2">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {isLoading ? (
        <Loading />
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className={`card flex items-center justify-between ${
                item.diasRestantes < 0
                  ? 'border-l-4 border-l-red-500'
                  : item.diasRestantes <= 3
                  ? 'border-l-4 border-l-yellow-500'
                  : 'border-l-4 border-l-primary-500'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{item.nome}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  <span>{item.tipo.replace(/_/g, ' ')}</span>
                  <span>{item.frequencia}</span>
                  <span>Prazo: {formatDate(item.dataLimite)}</span>
                  {item.responsavel && <span>Resp: {item.responsavel.nome}</span>}
                </div>
                {item.notas && <p className="mt-1 text-sm text-gray-400">{item.notas}</p>}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-bold ${
                    item.diasRestantes < 0
                      ? 'text-red-600'
                      : item.diasRestantes <= 3
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}
                >
                  {item.diasRestantes < 0
                    ? `${Math.abs(item.diasRestantes)}d atrasado`
                    : `${item.diasRestantes}d restantes`}
                </span>
                {item.status !== 'CONCLUIDA' && (
                  <button
                    onClick={() => handleComplete(item.id)}
                    className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                    title="Marcar como concluida"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <p>Nenhuma obrigacao para este mes.</p>
          <p className="mt-1 text-sm">Clique em "Gerar Obrigacoes" para criar as instancias do mes.</p>
        </div>
      )}
    </AppShell>
  )
}

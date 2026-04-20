import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
  EM_ANDAMENTO: { label: 'Em Andamento', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  CONCLUIDA: { label: 'Concluída', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  ATRASADA: { label: 'Atrasada', className: 'bg-red-50 text-red-700 ring-red-600/20' },
  CALCULADO: { label: 'Calculado', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  PAGO: { label: 'Pago', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  ATRASADO: { label: 'Atrasado', className: 'bg-red-50 text-red-700 ring-red-600/20' },
  RASCUNHO: { label: 'Rascunho', className: 'bg-gray-50 text-gray-700 ring-gray-600/20' },
  VALIDADO: { label: 'Validado', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  ENVIADO: { label: 'Enviado', className: 'bg-green-50 text-green-700 ring-green-600/20' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-50 text-gray-700 ring-gray-600/20' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

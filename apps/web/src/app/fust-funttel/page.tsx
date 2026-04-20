'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { useApi, useApiMutation } from '@/hooks/use-api'
import { Loading } from '@/components/ui/loading'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/lib/utils'
import { Calculator, Download, DollarSign } from 'lucide-react'

interface SummaryData {
  ano: number
  fust: { total: number; pago: number; pendente: number }
  funttel: { total: number; pago: number; pendente: number }
  grandTotal: number
  grandPago: number
}

export default function FustFunttelPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [showCalculator, setShowCalculator] = useState(false)

  const { data: summary, isLoading, refetch } = useApi<SummaryData>(
    `/api/v1/contributions/summary?year=${year}`,
  )

  const { mutate: calculate, isLoading: calculating, error: calcError } = useApiMutation('/api/v1/contributions/calculate')

  const [form, setForm] = useState({
    mes: new Date().getMonth() + 1,
    ano: currentYear,
    receitaOperacionalBruta: '',
    icms: '',
    pis: '',
    cofins: '',
    vendasCanceladas: '',
    descontos: '',
  })
  const [calcResult, setCalcResult] = useState<any>(null)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await calculate({
      mes: form.mes,
      ano: form.ano,
      revenue: {
        receitaOperacionalBruta: parseFloat(form.receitaOperacionalBruta) || 0,
        icms: parseFloat(form.icms) || 0,
        pis: parseFloat(form.pis) || 0,
        cofins: parseFloat(form.cofins) || 0,
        vendasCanceladas: parseFloat(form.vendasCanceladas) || 0,
        descontos: parseFloat(form.descontos) || 0,
      },
    })
    if (result) {
      setCalcResult((result as any).data)
      refetch()
    }
  }

  const handleExportCSV = () => {
    window.open(`/api/v1/contributions/export/csv?year=${year}`, '_blank')
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FUST / FUNTTEL</h1>
          <p className="text-sm text-gray-500">Calculadora e gestao de contribuicoes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </button>
          <button onClick={() => setShowCalculator(!showCalculator)} className="btn-primary">
            <Calculator className="mr-2 h-4 w-4" />
            {showCalculator ? 'Fechar' : 'Calcular'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <Loading />
      ) : summary ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500">FUST Total ({year})</p>
            <p className="mt-1 text-2xl font-bold text-primary-600">{formatCurrency(summary.fust.total)}</p>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>Pago: {formatCurrency(summary.fust.pago)}</span>
              <span>Pendente: {formatCurrency(summary.fust.pendente)}</span>
            </div>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">FUNTTEL Total ({year})</p>
            <p className="mt-1 text-2xl font-bold text-primary-600">{formatCurrency(summary.funttel.total)}</p>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>Pago: {formatCurrency(summary.funttel.pago)}</span>
              <span>Pendente: {formatCurrency(summary.funttel.pendente)}</span>
            </div>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Total Geral ({year})</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(summary.grandTotal)}</p>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>Pago: {formatCurrency(summary.grandPago)}</span>
              <span>Pendente: {formatCurrency(summary.grandTotal - summary.grandPago)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Calculator form */}
      {showCalculator && (
        <div className="card mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Calcular Contribuicoes</h2>
          {calcError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{calcError}</div>
          )}
          <form onSubmit={handleCalculate} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mes</label>
              <select
                value={form.mes}
                onChange={(e) => setForm({ ...form, mes: parseInt(e.target.value) })}
                className="input-field mt-1"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ano</label>
              <input
                type="number"
                value={form.ano}
                onChange={(e) => setForm({ ...form, ano: parseInt(e.target.value) })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Receita Operacional Bruta (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.receitaOperacionalBruta}
                onChange={(e) => setForm({ ...form, receitaOperacionalBruta: e.target.value })}
                className="input-field mt-1"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ICMS (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.icms}
                onChange={(e) => setForm({ ...form, icms: e.target.value })}
                className="input-field mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">PIS (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.pis}
                onChange={(e) => setForm({ ...form, pis: e.target.value })}
                className="input-field mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">COFINS (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.cofins}
                onChange={(e) => setForm({ ...form, cofins: e.target.value })}
                className="input-field mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendas Canceladas (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.vendasCanceladas}
                onChange={(e) => setForm({ ...form, vendasCanceladas: e.target.value })}
                className="input-field mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descontos (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.descontos}
                onChange={(e) => setForm({ ...form, descontos: e.target.value })}
                className="input-field mt-1"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={calculating} className="btn-primary w-full">
                {calculating ? 'Calculando...' : 'Calcular'}
              </button>
            </div>
          </form>

          {/* Result */}
          {calcResult && (
            <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-500">FUST (1%)</p>
                <p className="text-xl font-bold text-primary-700">{formatCurrency(calcResult.fust?.valorDevido || 0)}</p>
                <p className="text-xs text-gray-400">Base: {formatCurrency(calcResult.fust?.baseCalculo || 0)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">FUNTTEL (0,5%)</p>
                <p className="text-xl font-bold text-primary-700">{formatCurrency(calcResult.funttel?.valorDevido || 0)}</p>
                <p className="text-xs text-gray-400">Base: {formatCurrency(calcResult.funttel?.baseCalculo || 0)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Devido</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(calcResult.total || 0)}</p>
                <p className="text-xs text-gray-400">Periodo: {calcResult.periodo}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}

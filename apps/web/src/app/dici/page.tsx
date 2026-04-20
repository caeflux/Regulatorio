'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { useApi, useApiMutation } from '@/hooks/use-api'
import { Loading } from '@/components/ui/loading'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'
import { FileSpreadsheet, Upload, CheckCircle, Download, AlertCircle } from 'lucide-react'

interface DICIReport {
  id: string
  periodo: string
  tipo: string
  status: string
  dataEnvio?: string
  createdAt: string
}

export default function DICIPage() {
  const currentYear = new Date().getFullYear()
  const { data: reports, isLoading, refetch } = useApi<DICIReport[]>(
    `/api/v1/dici/reports?year=${currentYear}`,
  )

  const { mutate: generate, isLoading: generating } = useApiMutation('/api/v1/dici/generate')
  const { mutate: validate, isLoading: validating } = useApiMutation('/placeholder')

  const [genForm, setGenForm] = useState({
    mes: new Date().getMonth() || 12,
    ano: new Date().getMonth() === 0 ? currentYear - 1 : currentYear,
  })
  const [validationResult, setValidationResult] = useState<any>(null)
  const [generateResult, setGenerateResult] = useState<any>(null)

  const handleValidate = async () => {
    const res = await validate(undefined, `/api/v1/dici/validate?mes=${genForm.mes}&ano=${genForm.ano}`)
    if (res) setValidationResult((res as any).data)
  }

  const handleGenerate = async () => {
    const res = await generate({ mes: genForm.mes, ano: genForm.ano, tipo: 'MENSAL' })
    if (res) {
      setGenerateResult((res as any).data)
      refetch()
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">DICI - Coleta de Dados</h1>
        <p className="text-sm text-gray-500">Gere e valide relatorios DICI para envio a ANATEL</p>
      </div>

      {/* Generate section */}
      <div className="card mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Gerar Relatorio DICI</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mes de referencia</label>
            <select
              value={genForm.mes}
              onChange={(e) => setGenForm({ ...genForm, mes: parseInt(e.target.value) })}
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
              value={genForm.ano}
              onChange={(e) => setGenForm({ ...genForm, ano: parseInt(e.target.value) })}
              className="input-field mt-1 w-24"
            />
          </div>
          <button onClick={handleValidate} disabled={validating} className="btn-secondary">
            <CheckCircle className="mr-2 h-4 w-4" />
            {validating ? 'Validando...' : 'Validar Dados'}
          </button>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar CSV ANATEL'}
          </button>
        </div>

        {/* Validation result */}
        {validationResult && (
          <div className={`mt-4 rounded-lg p-4 ${validationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-semibold ${validationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                {validationResult.valid ? 'Dados validos' : 'Dados com erros'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Total de acessos: {validationResult.totalAcessos?.toLocaleString()} | Linhas: {validationResult.totalLinhas}
            </p>
            {validationResult.errors?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {validationResult.errors.map((err: any, i: number) => (
                  <li key={i} className="text-sm text-red-600">
                    Linha {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            )}
            {validationResult.warnings?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {validationResult.warnings.map((w: any, i: number) => (
                  <li key={i} className="text-sm text-yellow-700">
                    Aviso: {w.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Generate result */}
        {generateResult && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="font-semibold text-blue-700">CSV gerado com sucesso</p>
            <p className="text-sm text-gray-600">
              Periodo: {generateResult.periodo} | Linhas: {generateResult.totalLinhas} | Acessos: {generateResult.totalAcessos?.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Reports history */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Historico de Relatorios</h2>
      {isLoading ? (
        <Loading />
      ) : reports && reports.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Periodo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Envio</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Criado em</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.periodo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{report.tipo}</td>
                  <td className="px-6 py-4"><StatusBadge status={report.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {report.dataEnvio ? formatDate(report.dataEnvio) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(report.createdAt)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => window.open(`/api/v1/dici/download/${report.id}`, '_blank')}
                      className="text-primary-600 hover:text-primary-800"
                      title="Download CSV"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2">Nenhum relatorio DICI gerado ainda.</p>
        </div>
      )}
    </AppShell>
  )
}

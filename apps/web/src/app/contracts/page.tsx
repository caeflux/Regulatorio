'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { useApi, useApiMutation } from '@/hooks/use-api'
import { Loading } from '@/components/ui/loading'
import { formatDate } from '@/lib/utils'
import { FileText, Plus, Eye } from 'lucide-react'

interface Template {
  id: string
  nome: string
  tipo: string
  versao: number
  variaveis: Record<string, any> | null
}

interface Document {
  id: string
  formato: string
  createdAt: string
  template: { nome: string; tipo: string }
}

export default function ContractsPage() {
  const { data: templates, isLoading: loadingTemplates } = useApi<Template[]>('/api/v1/contracts/templates')
  const { data: documents, isLoading: loadingDocs, refetch } = useApi<Document[]>('/api/v1/contracts/documents')
  const { mutate: generate, isLoading: generating } = useApiMutation('/placeholder')

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null)

  const handleGenerate = async (template: Template) => {
    const res = await generate({ dados: {} }, `/api/v1/contracts/templates/${template.id}/generate`)
    if (res) {
      setGeneratedDoc((res as any).data?.documento || null)
      refetch()
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contratos e Documentos</h1>
        <p className="text-sm text-gray-500">Gere documentos a partir de modelos regulatorios</p>
      </div>

      {/* Templates */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Modelos Disponiveis</h2>
      {loadingTemplates ? (
        <Loading />
      ) : templates && templates.length > 0 ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">{tpl.nome}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">Tipo: {tpl.tipo} | v{tpl.versao}</p>
              </div>
              <button
                onClick={() => handleGenerate(tpl)}
                disabled={generating}
                className="btn-primary mt-4 w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Gerar Documento
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card mb-8 text-center py-8 text-gray-500">
          <p>Nenhum modelo disponivel.</p>
        </div>
      )}

      {/* Generated preview */}
      {generatedDoc && (
        <div className="card mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Documento Gerado</h2>
            <button onClick={() => setGeneratedDoc(null)} className="text-sm text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>
          <div
            className="prose max-w-none rounded-lg border border-gray-200 bg-white p-6"
            dangerouslySetInnerHTML={{ __html: generatedDoc }}
          />
        </div>
      )}

      {/* Generated documents */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Documentos Gerados</h2>
      {loadingDocs ? (
        <Loading />
      ) : documents && documents.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Formato</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.template.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.template.tipo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.formato}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-500">
          <p>Nenhum documento gerado ainda.</p>
        </div>
      )}
    </AppShell>
  )
}

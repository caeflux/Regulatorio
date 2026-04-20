'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { useApi } from '@/hooks/use-api'
import { Loading } from '@/components/ui/loading'
import { formatDate } from '@/lib/utils'
import { BookOpen, Search, Tag, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'

interface Article {
  id: string
  titulo: string
  slug: string
  categoria: string
  tags: string[]
  updatedAt: string
}

interface ArticleFull extends Article {
  conteudo: string
  legislacaoRefs?: Record<string, any>
  versao: number
}

export default function KnowledgePage() {
  const { token } = useAuth()
  const { data, isLoading } = useApi<{ articles: Article[]; pagination: any }>('/api/v1/knowledge/articles')
  const { data: categories } = useApi<string[]>('/api/v1/knowledge/categories')

  const [selectedArticle, setSelectedArticle] = useState<ArticleFull | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Article[] | null>(null)
  const [searching, setSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length < 2) return
    setSearching(true)
    try {
      const res = await api.get(`/api/v1/knowledge/search?q=${encodeURIComponent(searchQuery)}`, token || undefined)
      setSearchResults(res.data)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const openArticle = async (slug: string) => {
    setLoadingArticle(true)
    try {
      const res = await api.get(`/api/v1/knowledge/articles/${slug}`, token || undefined)
      setSelectedArticle(res.data)
    } catch {
      // handle error
    } finally {
      setLoadingArticle(false)
    }
  }

  const articlesToShow = searchResults || data?.articles || []

  if (selectedArticle) {
    return (
      <AppShell>
        <button
          onClick={() => setSelectedArticle(null)}
          className="mb-4 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <article className="card">
          <div className="mb-4">
            <span className="text-xs font-medium text-primary-600 uppercase">{selectedArticle.categoria}</span>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{selectedArticle.titulo}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedArticle.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              v{selectedArticle.versao} | Atualizado em {formatDate(selectedArticle.updatedAt)}
            </p>
          </div>
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
            {selectedArticle.conteudo}
          </div>
        </article>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Base de Conhecimento</h1>
        <p className="text-sm text-gray-500">Guias e tutoriais sobre obrigacoes regulatorias ANATEL</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value === '') setSearchResults(null)
            }}
            className="input-field pl-10"
            placeholder="Buscar artigos..."
          />
        </div>
        <button type="submit" disabled={searching} className="btn-primary">
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Articles */}
      {isLoading ? (
        <Loading />
      ) : articlesToShow.length > 0 ? (
        <div className="space-y-3">
          {articlesToShow.map((article) => (
            <button
              key={article.id}
              onClick={() => openArticle(article.slug)}
              className="card w-full text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-primary-600 uppercase">{article.categoria}</span>
                  <h3 className="mt-1 font-semibold text-gray-900">{article.titulo}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(article.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2">
            {searchResults !== null ? 'Nenhum artigo encontrado.' : 'Nenhum artigo publicado.'}
          </p>
        </div>
      )}
    </AppShell>
  )
}

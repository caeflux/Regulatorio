import { prisma } from '../../config/prisma'
import { AppError } from '../auth/service'

export class KnowledgeService {
  /**
   * Listar artigos publicados com filtros
   */
  async listArticles(filters?: { categoria?: string; tag?: string; page?: number; limit?: number }) {
    const where: any = { publicado: true }

    if (filters?.categoria) {
      where.categoria = filters.categoria
    }
    if (filters?.tag) {
      where.tags = { has: filters.tag }
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const [articles, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        select: {
          id: true,
          titulo: true,
          slug: true,
          categoria: true,
          tags: true,
          versao: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.knowledgeArticle.count({ where }),
    ])

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Buscar artigo por slug
   */
  async getBySlug(slug: string) {
    const article = await prisma.knowledgeArticle.findUnique({
      where: { slug },
    })

    if (!article || !article.publicado) {
      throw new AppError('Artigo não encontrado', 404)
    }

    return article
  }

  /**
   * Busca textual em artigos
   */
  async search(query: string, filters?: { categoria?: string }) {
    const where: any = {
      publicado: true,
      OR: [
        { titulo: { contains: query, mode: 'insensitive' } },
        { conteudo: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    }

    if (filters?.categoria) {
      where.categoria = filters.categoria
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      select: {
        id: true,
        titulo: true,
        slug: true,
        categoria: true,
        tags: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    return articles
  }

  /**
   * Listar categorias disponíveis
   */
  async listCategories() {
    const articles = await prisma.knowledgeArticle.findMany({
      where: { publicado: true },
      select: { categoria: true },
      distinct: ['categoria'],
    })

    return articles.map((a) => a.categoria)
  }

  /**
   * Listar todas as tags
   */
  async listTags() {
    const articles = await prisma.knowledgeArticle.findMany({
      where: { publicado: true },
      select: { tags: true },
    })

    const tagSet = new Set<string>()
    articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }

  /**
   * Criar artigo (ADMIN/GESTOR)
   */
  async createArticle(data: {
    titulo: string
    slug: string
    categoria: string
    conteudo: string
    tags?: string[]
    legislacaoRefs?: Record<string, any>
    publicado?: boolean
  }) {
    // Verificar slug único
    const existing = await prisma.knowledgeArticle.findUnique({
      where: { slug: data.slug },
    })
    if (existing) {
      throw new AppError('Já existe um artigo com este slug', 409)
    }

    return prisma.knowledgeArticle.create({
      data: {
        titulo: data.titulo,
        slug: data.slug,
        categoria: data.categoria,
        conteudo: data.conteudo,
        tags: data.tags || [],
        legislacaoRefs: data.legislacaoRefs || null,
        publicado: data.publicado ?? false,
      },
    })
  }

  /**
   * Atualizar artigo (ADMIN/GESTOR)
   */
  async updateArticle(
    articleId: string,
    data: Partial<{
      titulo: string
      categoria: string
      conteudo: string
      tags: string[]
      legislacaoRefs: Record<string, any>
      publicado: boolean
    }>,
  ) {
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      throw new AppError('Artigo não encontrado', 404)
    }

    return prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        ...data,
        versao: { increment: 1 },
      },
    })
  }
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { KnowledgeService } from './service'
import type { JwtPayload } from '@regtelecom/shared'

const service = new KnowledgeService()

const createArticleSchema = z.object({
  titulo: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  categoria: z.string().min(2),
  conteudo: z.string().min(10),
  tags: z.array(z.string()).optional(),
  legislacaoRefs: z.record(z.any()).optional(),
  publicado: z.boolean().optional(),
})

const updateArticleSchema = z.object({
  titulo: z.string().min(3).optional(),
  categoria: z.string().min(2).optional(),
  conteudo: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  legislacaoRefs: z.record(z.any()).optional(),
  publicado: z.boolean().optional(),
})

export async function knowledgeRoutes(app: FastifyInstance) {
  // Rotas públicas (sem autenticação obrigatória)

  // GET /knowledge/articles?categoria=DICI&tag=fust&page=1&limit=20
  app.get('/articles', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { categoria?: string; tag?: string; page?: string; limit?: string }
    const data = await service.listArticles({
      categoria: query.categoria,
      tag: query.tag,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    })
    return reply.send({ success: true, data })
  })

  // GET /knowledge/articles/:slug - Artigo completo
  app.get('/articles/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string }
    const data = await service.getBySlug(slug)
    return reply.send({ success: true, data })
  })

  // GET /knowledge/search?q=fust&categoria=contribuicoes
  app.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { q?: string; categoria?: string }

    if (!query.q || query.q.length < 2) {
      return reply.status(400).send({
        success: false,
        error: 'Parâmetro de busca "q" deve ter pelo menos 2 caracteres',
      })
    }

    const data = await service.search(query.q, { categoria: query.categoria })
    return reply.send({ success: true, data })
  })

  // GET /knowledge/categories
  app.get('/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await service.listCategories()
    return reply.send({ success: true, data })
  })

  // GET /knowledge/tags
  app.get('/tags', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await service.listTags()
    return reply.send({ success: true, data })
  })

  // Rotas administrativas (requerem autenticação + ADMIN/GESTOR)

  // POST /knowledge/articles - Criar artigo
  app.post('/articles', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user as JwtPayload
    if (role !== 'ADMIN' && role !== 'GESTOR') {
      return reply.status(403).send({
        success: false,
        error: 'Apenas administradores e gestores podem criar artigos',
      })
    }

    const parsed = createArticleSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const data = await service.createArticle(parsed.data)
    return reply.status(201).send({
      success: true,
      data,
      message: 'Artigo criado com sucesso',
    })
  })

  // PATCH /knowledge/articles/:id - Atualizar artigo
  app.patch('/articles/:id', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user as JwtPayload
    if (role !== 'ADMIN' && role !== 'GESTOR') {
      return reply.status(403).send({
        success: false,
        error: 'Apenas administradores e gestores podem editar artigos',
      })
    }

    const { id } = request.params as { id: string }
    const parsed = updateArticleSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const data = await service.updateArticle(id, parsed.data)
    return reply.send({
      success: true,
      data,
      message: 'Artigo atualizado com sucesso',
    })
  })
}

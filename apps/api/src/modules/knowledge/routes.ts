import { FastifyInstance } from 'fastify'

export async function knowledgeRoutes(app: FastifyInstance) {
  // GET /knowledge/articles - Listar artigos (público, sem auth obrigatório)
  app.get('/articles', async (request, reply) => {
    // TODO: Listar artigos com filtros por categoria e tags
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /knowledge/articles/:slug - Artigo completo
  app.get('/articles/:slug', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /knowledge/search - Busca full-text
  app.get('/search', async (request, reply) => {
    // TODO: Busca full-text com PostgreSQL tsvector
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })
}

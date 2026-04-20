import { FastifyInstance } from 'fastify'

export async function contractRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /contracts/templates - Listar templates disponíveis
  app.get('/templates', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // POST /contracts/templates/:id/generate - Gerar documento
  app.post('/templates/:id/generate', async (request, reply) => {
    // TODO: Merge template Handlebars com dados do ISP, gerar PDF/DOCX
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /contracts/documents - Documentos gerados pelo tenant
  app.get('/documents', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })
}

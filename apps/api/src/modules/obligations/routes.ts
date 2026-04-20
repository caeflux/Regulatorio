import { FastifyInstance } from 'fastify'

export async function obligationRoutes(app: FastifyInstance) {
  // Todas as rotas requerem autenticação
  app.addHook('preHandler', app.authenticate)

  // GET /obligations/calendar - Visão calendário
  app.get('/calendar', async (request, reply) => {
    // TODO: Retornar obrigações do mês/ano com status
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /obligations/upcoming - Próximas obrigações (30 dias)
  app.get('/upcoming', async (request, reply) => {
    // TODO: Listar obrigações dos próximos N dias
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /obligations/overdue - Obrigações atrasadas
  app.get('/overdue', async (request, reply) => {
    // TODO: Listar obrigações com status ATRASADA
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // PATCH /obligations/:id/status - Atualizar status
  app.patch('/:id/status', async (request, reply) => {
    // TODO: Atualizar status da obligation instance
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // POST /obligations/:id/complete - Marcar como concluída
  app.post('/:id/complete', async (request, reply) => {
    // TODO: Marcar concluída + upload comprovante
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })
}

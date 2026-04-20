import { FastifyInstance } from 'fastify'

export async function contributionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /contributions/calculate - Calcular FUST + FUNTTEL
  app.post('/calculate', async (request, reply) => {
    // TODO: Receber receitas, calcular contribuições
    // FUST: 1% sobre (ROB - ICMS - PIS/COFINS)
    // FUNTTEL: 0,5% sobre (RB - vendas canceladas - descontos - ICMS - PIS - COFINS)
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /contributions - Histórico de contribuições
  app.get('/', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // POST /contributions/:id/pay - Registrar pagamento
  app.post('/:id/pay', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /contributions/summary - Resumo anual
  app.get('/summary', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /contributions/export/csv - Exportar para contabilidade
  app.get('/export/csv', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })
}

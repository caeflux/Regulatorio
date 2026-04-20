import { FastifyInstance } from 'fastify'

export async function diciRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /dici/data - Input de dados de acesso
  app.post('/data', async (request, reply) => {
    // TODO: Receber dados de acessos (município, tecnologia, velocidade, qtd)
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // POST /dici/import/csv - Importar dados brutos via CSV
  app.post('/import/csv', async (request, reply) => {
    // TODO: Parse CSV, validar, inserir dados de acesso
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // POST /dici/generate - Gerar CSV no formato ANATEL
  app.post('/generate', async (request, reply) => {
    // TODO: Gerar CSV com encoding UTF-8 BOM + CRLF
    // Campos: CNPJ, IBGE, tipo_acesso, tecnologia, vel_down, vel_up, qtd, zona
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /dici/validate - Validação pré-envio
  app.get('/validate', async (request, reply) => {
    // TODO: Validar dados contra regras ANATEL
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /dici/reports - Histórico de relatórios
  app.get('/reports', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /dici/download/:id - Download do CSV gerado
  app.get('/download/:id', async (request, reply) => {
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })
}

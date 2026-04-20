import { FastifyInstance } from 'fastify'

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register - Registro de novo ISP + admin
  app.post('/register', async (request, reply) => {
    // TODO: Implementar registro com CNPJ, razão social, email, senha
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // POST /auth/login - Login com email/senha
  app.post('/login', async (request, reply) => {
    // TODO: Validar credenciais, gerar JWT
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // POST /auth/refresh - Renovar access token
  app.post('/refresh', async (request, reply) => {
    // TODO: Validar refresh token, gerar novo access token
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /auth/govbr - Iniciar fluxo OAuth2 GOV.BR
  app.get('/govbr', async (request, reply) => {
    // TODO: Redirecionar para GOV.BR OAuth2
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /auth/govbr/callback - Callback OAuth2 GOV.BR
  app.get('/govbr/callback', async (request, reply) => {
    // TODO: Processar callback, criar/vincular usuário
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })

  // GET /auth/me - Perfil do usuário autenticado
  app.get('/me', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    // TODO: Retornar dados do usuário + tenant
    reply.status(501).send({ message: 'Em desenvolvimento' })
  })
}

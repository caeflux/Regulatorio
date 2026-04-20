import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AuthService, AppError } from './service'
import { registerSchema, loginSchema, refreshSchema } from './schemas'
import type { JwtPayload } from '@regtelecom/shared'

const authService = new AuthService()

export async function authRoutes(app: FastifyInstance) {
  // Error handler para rotas de auth
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: error.message,
      })
    }
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: 'Erro interno do servidor',
    })
  })

  // POST /auth/register
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const result = await authService.register(parsed.data)

    const payload: JwtPayload = {
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role as JwtPayload['role'],
    }

    const accessToken = app.jwt.sign(payload, { expiresIn: '15m' })
    const refreshToken = app.jwt.sign(
      { userId: result.user.id, type: 'refresh' },
      { expiresIn: '7d' },
    )

    return reply.status(201).send({
      success: true,
      data: { accessToken, refreshToken, user: result.user, tenant: result.tenant },
    })
  })

  // POST /auth/login
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const result = await authService.login(parsed.data)

    const accessToken = app.jwt.sign(result.payload, { expiresIn: '15m' })
    const refreshToken = app.jwt.sign(
      { userId: result.payload.userId, type: 'refresh' },
      { expiresIn: '7d' },
    )

    return reply.send({
      success: true,
      data: { accessToken, refreshToken, user: result.user, tenant: result.tenant },
    })
  })

  // POST /auth/refresh
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = refreshSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Refresh token é obrigatório' })
    }

    try {
      const decoded = app.jwt.verify<{ userId: string; type: string }>(parsed.data.refreshToken)
      if (decoded.type !== 'refresh') {
        return reply.status(401).send({ success: false, error: 'Token inválido' })
      }

      const profile = await authService.getProfile(decoded.userId)
      const payload: JwtPayload = {
        userId: profile.id,
        tenantId: profile.tenant.id,
        email: profile.email,
        role: profile.role as JwtPayload['role'],
      }

      const accessToken = app.jwt.sign(payload, { expiresIn: '15m' })
      const refreshToken = app.jwt.sign(
        { userId: profile.id, type: 'refresh' },
        { expiresIn: '7d' },
      )

      return reply.send({ success: true, data: { accessToken, refreshToken } })
    } catch {
      return reply.status(401).send({ success: false, error: 'Refresh token inválido ou expirado' })
    }
  })

  // GET /auth/me (requer autenticação)
  app.get('/me', { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as JwtPayload
      const profile = await authService.getProfile(userId)
      return reply.send({ success: true, data: profile })
    },
  )

  // GET /auth/users (requer ADMIN)
  app.get('/users', { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId, role } = request.user as JwtPayload
      if (role !== 'ADMIN') {
        return reply.status(403).send({ success: false, error: 'Apenas administradores podem listar usuários' })
      }
      const users = await authService.listUsers(tenantId)
      return reply.send({ success: true, data: users })
    },
  )
}

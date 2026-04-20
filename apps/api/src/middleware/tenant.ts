import { FastifyReply, FastifyRequest } from 'fastify'

export async function tenantMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { tenantId?: string }

  if (!user?.tenantId) {
    reply.status(403).send({ error: 'Tenant não identificado' })
    return
  }

  // Injeta tenantId no request para uso nos handlers
  request.tenantId = user.tenantId
}

// Augment Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    tenant: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

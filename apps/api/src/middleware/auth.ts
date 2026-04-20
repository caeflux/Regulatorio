import { FastifyReply, FastifyRequest } from 'fastify'
import type { JwtPayload } from '@regtelecom/shared'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    // Injetar tenantId no request para uso nos handlers
    const payload = request.user as JwtPayload
    request.tenantId = payload.tenantId
  } catch {
    return reply.status(401).send({
      success: false,
      error: 'Token inválido ou expirado',
    })
  }
}

// Middleware de autorização por role
export function requireRole(...roles: JwtPayload['role'][]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as JwtPayload
    if (!roles.includes(payload.role)) {
      return reply.status(403).send({
        success: false,
        error: `Acesso restrito. Roles necessárias: ${roles.join(', ')}`,
      })
    }
  }
}

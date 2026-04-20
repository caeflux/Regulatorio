import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ObligationService } from './service'
import type { JwtPayload } from '@regtelecom/shared'

const service = new ObligationService()

export async function obligationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /obligations/dashboard
  app.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const data = await service.getDashboard(tenantId)
    return reply.send({ success: true, data })
  })

  // GET /obligations/calendar?year=2026&month=4
  app.get('/calendar', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { year?: string; month?: string }
    const year = parseInt(query.year || String(new Date().getFullYear()))
    const month = parseInt(query.month || String(new Date().getMonth() + 1))

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return reply.status(400).send({ success: false, error: 'year/month inválidos' })
    }

    const data = await service.getCalendar(tenantId, year, month)
    return reply.send({ success: true, data })
  })

  // GET /obligations/upcoming?days=30
  app.get('/upcoming', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { days?: string }
    const days = parseInt(query.days || '30')

    const data = await service.getUpcoming(tenantId, days)
    return reply.send({ success: true, data })
  })

  // GET /obligations/overdue
  app.get('/overdue', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const data = await service.getOverdue(tenantId)
    return reply.send({ success: true, data })
  })

  // POST /obligations/generate?year=2026&month=4
  app.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { year?: string; month?: string }
    const year = parseInt(query.year || String(new Date().getFullYear()))
    const month = parseInt(query.month || String(new Date().getMonth() + 1))

    const created = await service.generateInstances(tenantId, year, month)
    return reply.send({
      success: true,
      data: { created, count: created.length },
      message: `${created.length} obrigações geradas para ${month}/${year}`,
    })
  })

  // PATCH /obligations/:id/status
  app.patch('/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const body = z.object({ status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA']) }).safeParse(request.body)

    if (!body.success) {
      return reply.status(400).send({ success: false, error: 'Status inválido' })
    }

    const data = await service.updateStatus(tenantId, id, body.data.status)
    return reply.send({ success: true, data })
  })

  // POST /obligations/:id/complete
  app.post('/:id/complete', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const body = request.body as { comprovanteUrl?: string; notas?: string }

    const data = await service.complete(tenantId, id, body?.comprovanteUrl, body?.notas)
    return reply.send({ success: true, data, message: 'Obrigação concluída' })
  })
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ContributionService } from './service'
import type { JwtPayload } from '@regtelecom/shared'

const service = new ContributionService()

const calculateSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2020).max(2100),
  revenue: z.object({
    receitaOperacionalBruta: z.number().positive(),
    icms: z.number().min(0).default(0),
    pis: z.number().min(0).default(0),
    cofins: z.number().min(0).default(0),
    vendasCanceladas: z.number().min(0).default(0),
    descontos: z.number().min(0).default(0),
  }),
})

export async function contributionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /contributions/calculate - Calcular FUST + FUNTTEL
  app.post('/calculate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const parsed = calculateSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const { mes, ano, revenue } = parsed.data
    const data = await service.calculate(tenantId, mes, ano, revenue)
    return reply.send({
      success: true,
      data,
      message: `Contribuições calculadas para ${mes}/${ano}`,
    })
  })

  // GET /contributions?year=2026&type=FUST
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { year?: string; type?: string }

    const filters: { year?: number; type?: string } = {}
    if (query.year) {
      const year = parseInt(query.year)
      if (isNaN(year)) {
        return reply.status(400).send({ success: false, error: 'Ano inválido' })
      }
      filters.year = year
    }
    if (query.type) {
      if (!['FUST', 'FUNTTEL'].includes(query.type)) {
        return reply.status(400).send({ success: false, error: 'Tipo deve ser FUST ou FUNTTEL' })
      }
      filters.type = query.type
    }

    const data = await service.list(tenantId, filters)
    return reply.send({ success: true, data })
  })

  // POST /contributions/:id/pay - Registrar pagamento
  app.post('/:id/pay', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const body = request.body as { comprovanteUrl?: string } | undefined

    const data = await service.registerPayment(tenantId, id, body?.comprovanteUrl)
    return reply.send({ success: true, data, message: 'Pagamento registrado' })
  })

  // GET /contributions/summary?year=2026
  app.get('/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { year?: string }
    const year = parseInt(query.year || String(new Date().getFullYear()))

    if (isNaN(year)) {
      return reply.status(400).send({ success: false, error: 'Ano inválido' })
    }

    const data = await service.getSummary(tenantId, year)
    return reply.send({ success: true, data })
  })

  // GET /contributions/export/csv?year=2026
  app.get('/export/csv', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { year?: string }
    const year = parseInt(query.year || String(new Date().getFullYear()))

    if (isNaN(year)) {
      return reply.status(400).send({ success: false, error: 'Ano inválido' })
    }

    const csv = await service.exportCSV(tenantId, year)
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="contribuicoes_${year}.csv"`)
      .send(csv)
  })
}

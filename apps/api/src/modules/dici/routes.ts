import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { DICIService } from './service'
import type { JwtPayload } from '@regtelecom/shared'

const service = new DICIService()

const accessDataItemSchema = z.object({
  municipioIbge: z.string().regex(/^\d{7}$/, 'Código IBGE deve ter 7 dígitos'),
  tipoAcesso: z.enum(['PESSOA_FISICA', 'PESSOA_JURIDICA']),
  tecnologia: z.enum(['FTTX', 'CABLE_MODEM', 'XDSL', 'RADIO', 'SATELITE', 'OUTROS']),
  velocidadeDown: z.number().positive(),
  velocidadeUp: z.number().positive(),
  zona: z.enum(['URBANA', 'RURAL']),
  quantidade: z.number().int().positive(),
})

const saveDataSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2020).max(2100),
  dados: z.array(accessDataItemSchema).min(1, 'Pelo menos um registro de acesso é obrigatório'),
})

export async function diciRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /dici/data - Input de dados de acesso
  app.post('/data', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const parsed = saveDataSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const { mes, ano, dados } = parsed.data
    const data = await service.saveAccessData(tenantId, mes, ano, dados)
    return reply.send({
      success: true,
      data,
      message: `${data.count} registros salvos para ${mes}/${ano}`,
    })
  })

  // POST /dici/import/csv - Importar dados brutos via CSV
  app.post('/import/csv', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const body = request.body as { mes?: number; ano?: number; csvContent?: string }

    if (!body.mes || !body.ano || !body.csvContent) {
      return reply.status(400).send({
        success: false,
        error: 'Campos obrigatórios: mes, ano, csvContent',
      })
    }

    // Parse CSV simples (ponto-e-vírgula)
    const lines = body.csvContent.trim().split(/\r?\n/)
    const header = lines[0]?.toLowerCase() || ''
    const dataLines = header.includes('municipio') || header.includes('ibge') ? lines.slice(1) : lines

    const rows = dataLines.map((line) => {
      const cols = line.split(';').map((c) => c.trim())
      return {
        municipioIbge: cols[0] || '',
        tipoAcesso: (cols[1] === 'PF' ? 'PESSOA_FISICA' : 'PESSOA_JURIDICA') as 'PESSOA_FISICA' | 'PESSOA_JURIDICA',
        tecnologia: (cols[2] || 'OUTROS') as 'FTTX' | 'CABLE_MODEM' | 'XDSL' | 'RADIO' | 'SATELITE' | 'OUTROS',
        velocidadeDown: parseFloat(cols[3] || '0'),
        velocidadeUp: parseFloat(cols[4] || '0'),
        zona: (cols[5] === 'RURAL' ? 'RURAL' : 'URBANA') as 'URBANA' | 'RURAL',
        quantidade: parseInt(cols[6] || '0'),
      }
    }).filter((r) => r.municipioIbge && r.quantidade > 0)

    if (rows.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'Nenhum registro válido encontrado no CSV',
      })
    }

    const data = await service.importCSV(tenantId, body.mes, body.ano, rows)
    return reply.send({
      success: true,
      data,
      message: `${data.count} registros importados do CSV`,
    })
  })

  // POST /dici/generate - Gerar CSV no formato ANATEL
  app.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const body = request.body as { mes?: number; ano?: number; tipo?: string }

    const mes = body?.mes || new Date().getMonth() // mês anterior
    const ano = body?.ano || new Date().getFullYear()
    const tipo = (body?.tipo || 'MENSAL') as 'MENSAL' | 'SEMESTRAL' | 'ANUAL'

    if (mes < 1 || mes > 12) {
      return reply.status(400).send({ success: false, error: 'Mês inválido (1-12)' })
    }

    const data = await service.generate(tenantId, mes, ano, tipo)
    return reply.send({ success: true, data })
  })

  // GET /dici/validate?mes=4&ano=2026
  app.get('/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { mes?: string; ano?: string }
    const mes = parseInt(query.mes || String(new Date().getMonth()))
    const ano = parseInt(query.ano || String(new Date().getFullYear()))

    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12) {
      return reply.status(400).send({ success: false, error: 'mes/ano inválidos' })
    }

    const data = await service.validate(tenantId, mes, ano)
    return reply.send({ success: true, data })
  })

  // GET /dici/reports?year=2026&tipo=MENSAL
  app.get('/reports', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { year?: string; tipo?: string }

    const filters: { year?: number; tipo?: string } = {}
    if (query.year) filters.year = parseInt(query.year)
    if (query.tipo) filters.tipo = query.tipo

    const data = await service.listReports(tenantId, filters)
    return reply.send({ success: true, data })
  })

  // GET /dici/download/:id - Download do CSV gerado
  app.get('/download/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const { id } = request.params as { id: string }

    const result = await service.download(tenantId, id)
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${result.filename}"`)
      .send(result.csv)
  })

  // PATCH /dici/reports/:id/sent - Marcar como enviado
  app.patch('/reports/:id/sent', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const { id } = request.params as { id: string }

    const data = await service.markAsSent(tenantId, id)
    return reply.send({ success: true, data, message: 'Relatório marcado como enviado' })
  })
}

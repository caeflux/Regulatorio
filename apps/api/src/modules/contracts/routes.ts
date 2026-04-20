import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ContractService } from './service'
import type { JwtPayload } from '@regtelecom/shared'

const service = new ContractService()

const generateSchema = z.object({
  dados: z.record(z.any()).default({}),
})

const createTemplateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipo: z.string().min(2, 'Tipo é obrigatório'),
  conteudo: z.string().min(10, 'Conteúdo do template é obrigatório'),
  variaveis: z.record(z.any()).optional(),
})

export async function contractRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /contracts/templates - Listar templates disponíveis
  app.get('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { tipo?: string; search?: string }
    const data = await service.listTemplates({
      tipo: query.tipo,
      search: query.search,
    })
    return reply.send({ success: true, data })
  })

  // GET /contracts/templates/:id - Detalhes do template
  app.get('/templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = await service.getTemplate(id)
    return reply.send({ success: true, data })
  })

  // POST /contracts/templates/:id/generate - Gerar documento
  app.post('/templates/:id/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const parsed = generateSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const data = await service.generateDocument(tenantId, id, parsed.data.dados)
    return reply.send({
      success: true,
      data,
      message: 'Documento gerado com sucesso',
    })
  })

  // POST /contracts/templates - Criar template (ADMIN)
  app.post('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user as JwtPayload
    if (role !== 'ADMIN') {
      return reply.status(403).send({
        success: false,
        error: 'Apenas administradores podem criar templates',
      })
    }

    const parsed = createTemplateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const data = await service.createTemplate(parsed.data)
    return reply.status(201).send({
      success: true,
      data,
      message: 'Template criado com sucesso',
    })
  })

  // GET /contracts/documents - Documentos gerados pelo tenant
  app.get('/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const query = request.query as { templateId?: string }
    const data = await service.listDocuments(tenantId, {
      templateId: query.templateId,
    })
    return reply.send({ success: true, data })
  })

  // GET /contracts/documents/:id - Visualizar documento gerado
  app.get('/documents/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantId } = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const data = await service.getDocument(tenantId, id)
    return reply.send({ success: true, data })
  })
}

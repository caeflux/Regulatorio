import { prisma } from '../../config/prisma'
import { AppError } from '../auth/service'
import Handlebars from 'handlebars'

export class ContractService {
  /**
   * Listar templates de contrato disponíveis
   */
  async listTemplates(filters?: { tipo?: string; search?: string }) {
    const where: any = { ativo: true }

    if (filters?.tipo) {
      where.tipo = filters.tipo
    }
    if (filters?.search) {
      where.nome = { contains: filters.search, mode: 'insensitive' }
    }

    return prisma.contractTemplate.findMany({
      where,
      select: {
        id: true,
        nome: true,
        tipo: true,
        versao: true,
        variaveis: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nome: 'asc' },
    })
  }

  /**
   * Buscar template por ID (com conteúdo completo)
   */
  async getTemplate(templateId: string) {
    const template = await prisma.contractTemplate.findFirst({
      where: { id: templateId, ativo: true },
    })

    if (!template) {
      throw new AppError('Template não encontrado', 404)
    }

    return template
  }

  /**
   * Gerar documento a partir do template com dados do ISP
   */
  async generateDocument(tenantId: string, templateId: string, dados: Record<string, any>) {
    const template = await prisma.contractTemplate.findFirst({
      where: { id: templateId, ativo: true },
    })

    if (!template) {
      throw new AppError('Template não encontrado', 404)
    }

    // Buscar dados do tenant para merge automático
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) throw new AppError('Tenant não encontrado', 404)

    // Merge de dados: template vars + dados do tenant
    const mergeData = {
      // Dados automáticos do tenant
      empresa_cnpj: tenant.cnpj,
      empresa_razao_social: tenant.razaoSocial,
      empresa_nome_fantasia: tenant.nomeFantasia || tenant.razaoSocial,
      empresa_endereco: tenant.endereco || '',
      empresa_telefone: tenant.telefone || '',
      empresa_email: tenant.email || '',
      empresa_site: tenant.site || '',
      licenca_scm: tenant.licencaScm || '',
      licenca_stfc: tenant.licencaStfc || '',
      numero_outorga: tenant.numeroOutorga || '',
      data_geracao: new Date().toLocaleDateString('pt-BR'),
      // Dados fornecidos pelo usuário
      ...dados,
    }

    // Compilar template Handlebars
    let documentoGerado: string
    try {
      const compiledTemplate = Handlebars.compile(template.conteudo)
      documentoGerado = compiledTemplate(mergeData)
    } catch (err) {
      throw new AppError('Erro ao processar template. Verifique as variáveis.', 400)
    }

    // Salvar documento gerado
    const doc = await prisma.generatedDocument.create({
      data: {
        tenantId,
        templateId,
        dadosMerge: mergeData,
        formato: 'HTML', // HTML renderizado, pode ser convertido para PDF no frontend
      },
    })

    return {
      id: doc.id,
      templateNome: template.nome,
      templateTipo: template.tipo,
      formato: doc.formato,
      documento: documentoGerado,
      createdAt: doc.createdAt,
    }
  }

  /**
   * Listar documentos gerados pelo tenant
   */
  async listDocuments(tenantId: string, filters?: { templateId?: string }) {
    const where: any = { tenantId }
    if (filters?.templateId) {
      where.templateId = filters.templateId
    }

    return prisma.generatedDocument.findMany({
      where,
      include: {
        template: {
          select: { nome: true, tipo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Buscar documento gerado por ID e re-renderizar
   */
  async getDocument(tenantId: string, documentId: string) {
    const doc = await prisma.generatedDocument.findFirst({
      where: { id: documentId, tenantId },
      include: {
        template: true,
      },
    })

    if (!doc) {
      throw new AppError('Documento não encontrado', 404)
    }

    // Re-renderizar com os dados salvos
    let documentoGerado: string
    try {
      const compiledTemplate = Handlebars.compile(doc.template.conteudo)
      documentoGerado = compiledTemplate(doc.dadosMerge as Record<string, any>)
    } catch {
      documentoGerado = '<!-- Erro ao renderizar template -->'
    }

    return {
      id: doc.id,
      templateNome: doc.template.nome,
      templateTipo: doc.template.tipo,
      formato: doc.formato,
      documento: documentoGerado,
      dadosMerge: doc.dadosMerge,
      createdAt: doc.createdAt,
    }
  }

  /**
   * Criar novo template (ADMIN only)
   */
  async createTemplate(data: {
    nome: string
    tipo: string
    conteudo: string
    variaveis?: Record<string, any>
  }) {
    return prisma.contractTemplate.create({
      data: {
        nome: data.nome,
        tipo: data.tipo,
        conteudo: data.conteudo,
        variaveis: data.variaveis || null,
      },
    })
  }
}

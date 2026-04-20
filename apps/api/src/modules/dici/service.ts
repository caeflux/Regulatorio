import { prisma } from '../../config/prisma'
import { AppError } from '../auth/service'
import { validateDICIData, generateDICICSV, compareWithPreviousMonth, type DICIRow } from '../../utils/dici-generator'

export interface AccessDataInput {
  municipioIbge: string
  tipoAcesso: 'PESSOA_FISICA' | 'PESSOA_JURIDICA'
  tecnologia: 'FTTX' | 'CABLE_MODEM' | 'XDSL' | 'RADIO' | 'SATELITE' | 'OUTROS'
  velocidadeDown: number
  velocidadeUp: number
  zona: 'URBANA' | 'RURAL'
  quantidade: number
}

export class DICIService {
  /**
   * Salvar/atualizar dados de acesso para um mês
   */
  async saveAccessData(tenantId: string, mes: number, ano: number, data: AccessDataInput[]) {
    // Deletar dados existentes do período e inserir novos
    await prisma.accessData.deleteMany({
      where: { tenantId, mes, ano },
    })

    const created = await prisma.accessData.createMany({
      data: data.map((d) => ({
        tenantId,
        mes,
        ano,
        municipioIbge: d.municipioIbge,
        tipoAcesso: d.tipoAcesso,
        tecnologia: d.tecnologia,
        velocidadeDown: d.velocidadeDown,
        velocidadeUp: d.velocidadeUp,
        zona: d.zona,
        quantidade: d.quantidade,
      })),
    })

    return { count: created.count, periodo: `${ano}-${String(mes).padStart(2, '0')}` }
  }

  /**
   * Importar dados de acesso via linhas CSV parseadas
   */
  async importCSV(tenantId: string, mes: number, ano: number, rows: AccessDataInput[]) {
    return this.saveAccessData(tenantId, mes, ano, rows)
  }

  /**
   * Validar dados do período antes de gerar o relatório
   */
  async validate(tenantId: string, mes: number, ano: number) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) throw new AppError('Tenant não encontrado', 404)

    const accessData = await prisma.accessData.findMany({
      where: { tenantId, mes, ano },
    })

    if (accessData.length === 0) {
      return {
        valid: false,
        errors: [{ row: 0, field: 'dados', message: 'Nenhum dado de acesso encontrado para o período', severity: 'error' as const }],
        warnings: [],
        totalAcessos: 0,
      }
    }

    // Converter para formato DICIRow para validação
    const diciRows: DICIRow[] = accessData.map((d) => ({
      cnpj: tenant.cnpj,
      municipioIbge: d.municipioIbge,
      tipoAcesso: d.tipoAcesso === 'PESSOA_FISICA' ? 'PF' : 'PJ',
      tecnologia: d.tecnologia,
      velocidadeDown: Number(d.velocidadeDown),
      velocidadeUp: Number(d.velocidadeUp),
      quantidade: d.quantidade,
      zona: d.zona,
    }))

    const errors = validateDICIData(diciRows)

    // Comparar com mês anterior
    const prevMonth = mes === 1 ? 12 : mes - 1
    const prevYear = mes === 1 ? ano - 1 : ano
    const previousData = await prisma.accessData.findMany({
      where: { tenantId, mes: prevMonth, ano: prevYear },
    })

    let warnings: typeof errors = []
    if (previousData.length > 0) {
      const prevRows: DICIRow[] = previousData.map((d) => ({
        cnpj: tenant.cnpj,
        municipioIbge: d.municipioIbge,
        tipoAcesso: d.tipoAcesso === 'PESSOA_FISICA' ? 'PF' : 'PJ',
        tecnologia: d.tecnologia,
        velocidadeDown: Number(d.velocidadeDown),
        velocidadeUp: Number(d.velocidadeUp),
        quantidade: d.quantidade,
        zona: d.zona,
      }))
      warnings = compareWithPreviousMonth(diciRows, prevRows)
    }

    const criticalErrors = errors.filter((e) => e.severity === 'error')
    const totalAcessos = diciRows.reduce((sum, r) => sum + r.quantidade, 0)

    return {
      valid: criticalErrors.length === 0,
      errors: criticalErrors,
      warnings: [...errors.filter((e) => e.severity === 'warning'), ...warnings],
      totalAcessos,
      totalLinhas: diciRows.length,
    }
  }

  /**
   * Gerar CSV no formato ANATEL e salvar como relatório
   */
  async generate(tenantId: string, mes: number, ano: number, tipo: 'MENSAL' | 'SEMESTRAL' | 'ANUAL' = 'MENSAL') {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) throw new AppError('Tenant não encontrado', 404)

    const accessData = await prisma.accessData.findMany({
      where: { tenantId, mes, ano },
    })

    if (accessData.length === 0) {
      throw new AppError('Nenhum dado de acesso encontrado para o período', 400)
    }

    const diciRows: DICIRow[] = accessData.map((d) => ({
      cnpj: tenant.cnpj,
      municipioIbge: d.municipioIbge,
      tipoAcesso: d.tipoAcesso === 'PESSOA_FISICA' ? 'PF' : 'PJ',
      tecnologia: d.tecnologia,
      velocidadeDown: Number(d.velocidadeDown),
      velocidadeUp: Number(d.velocidadeUp),
      quantidade: d.quantidade,
      zona: d.zona,
    }))

    // Validar antes de gerar
    const validationErrors = validateDICIData(diciRows)
    const criticalErrors = validationErrors.filter((e) => e.severity === 'error')
    if (criticalErrors.length > 0) {
      throw new AppError(`Dados inválidos: ${criticalErrors.length} erro(s) encontrado(s)`, 400)
    }

    // Gerar CSV
    const csvBuffer = generateDICICSV(diciRows)
    const periodo = `${ano}-${String(mes).padStart(2, '0')}`

    // Salvar relatório no banco (o arquivo seria salvo em S3/storage em produção)
    const report = await prisma.dICIReport.create({
      data: {
        tenantId,
        periodo,
        tipo,
        status: 'VALIDADO',
        validacaoErros: validationErrors.length > 0 ? validationErrors : undefined,
      },
    })

    return {
      id: report.id,
      periodo,
      tipo,
      status: report.status,
      csv: csvBuffer.toString('utf-8'),
      totalLinhas: diciRows.length,
      totalAcessos: diciRows.reduce((sum, r) => sum + r.quantidade, 0),
      validacao: {
        erros: 0,
        warnings: validationErrors.filter((e) => e.severity === 'warning').length,
      },
    }
  }

  /**
   * Listar relatórios DICI do tenant
   */
  async listReports(tenantId: string, filters?: { year?: number; tipo?: string }) {
    const where: any = { tenantId }

    if (filters?.year) {
      where.periodo = { startsWith: String(filters.year) }
    }
    if (filters?.tipo) {
      where.tipo = filters.tipo
    }

    return prisma.dICIReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Buscar relatório por ID e gerar CSV para download
   */
  async download(tenantId: string, reportId: string) {
    const report = await prisma.dICIReport.findFirst({
      where: { id: reportId, tenantId },
    })

    if (!report) {
      throw new AppError('Relatório não encontrado', 404)
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) throw new AppError('Tenant não encontrado', 404)

    // Extrair mes/ano do período
    const [anoStr, mesStr] = report.periodo.split('-')
    const ano = parseInt(anoStr)
    const mes = parseInt(mesStr)

    const accessData = await prisma.accessData.findMany({
      where: { tenantId, mes, ano },
    })

    if (accessData.length === 0) {
      throw new AppError('Dados de acesso não encontrados para o período do relatório', 404)
    }

    const diciRows: DICIRow[] = accessData.map((d) => ({
      cnpj: tenant.cnpj,
      municipioIbge: d.municipioIbge,
      tipoAcesso: d.tipoAcesso === 'PESSOA_FISICA' ? 'PF' : 'PJ',
      tecnologia: d.tecnologia,
      velocidadeDown: Number(d.velocidadeDown),
      velocidadeUp: Number(d.velocidadeUp),
      quantidade: d.quantidade,
      zona: d.zona,
    }))

    const csvBuffer = generateDICICSV(diciRows)

    return {
      filename: `DICI_${tenant.cnpj.replace(/\D/g, '')}_${report.periodo}.csv`,
      csv: csvBuffer,
    }
  }

  /**
   * Marcar relatório como enviado à ANATEL
   */
  async markAsSent(tenantId: string, reportId: string) {
    const report = await prisma.dICIReport.findFirst({
      where: { id: reportId, tenantId },
    })

    if (!report) {
      throw new AppError('Relatório não encontrado', 404)
    }

    return prisma.dICIReport.update({
      where: { id: reportId },
      data: {
        status: 'ENVIADO',
        dataEnvio: new Date(),
      },
    })
  }
}

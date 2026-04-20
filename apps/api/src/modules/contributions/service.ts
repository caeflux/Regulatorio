import { prisma } from '../../config/prisma'
import { AppError } from '../auth/service'
import { calcularContribuicoes, type RevenueInput } from '../../utils/fust-funttel'
import dayjs from 'dayjs'

export class ContributionService {
  /**
   * Registrar receitas e calcular contribuições
   */
  async calculate(tenantId: string, mes: number, ano: number, revenue: RevenueInput) {
    // Upsert receita
    const revenueEntry = await prisma.revenueEntry.upsert({
      where: {
        tenantId_mes_ano: { tenantId, mes, ano },
      },
      update: {
        receitaOperacionalBruta: revenue.receitaOperacionalBruta,
        icms: revenue.icms,
        pis: revenue.pis,
        cofins: revenue.cofins,
        vendasCanceladas: revenue.vendasCanceladas || 0,
        descontos: revenue.descontos || 0,
      },
      create: {
        tenantId,
        mes,
        ano,
        receitaOperacionalBruta: revenue.receitaOperacionalBruta,
        icms: revenue.icms,
        pis: revenue.pis,
        cofins: revenue.cofins,
        vendasCanceladas: revenue.vendasCanceladas || 0,
        descontos: revenue.descontos || 0,
      },
    })

    // Calcular contribuições
    const result = calcularContribuicoes(revenue)
    const periodo = `${ano}-${String(mes).padStart(2, '0')}`

    // Upsert FUST
    const fust = await prisma.contribution.upsert({
      where: {
        tenantId_tipo_periodo: { tenantId, tipo: 'FUST', periodo },
      },
      update: {
        baseCalculo: result.fust.baseCalculo,
        aliquota: result.fust.aliquota,
        valorDevido: result.fust.valorDevido,
      },
      create: {
        tenantId,
        tipo: 'FUST',
        periodo,
        baseCalculo: result.fust.baseCalculo,
        aliquota: result.fust.aliquota,
        valorDevido: result.fust.valorDevido,
      },
    })

    // Upsert FUNTTEL
    const funttel = await prisma.contribution.upsert({
      where: {
        tenantId_tipo_periodo: { tenantId, tipo: 'FUNTTEL', periodo },
      },
      update: {
        baseCalculo: result.funttel.baseCalculo,
        aliquota: result.funttel.aliquota,
        valorDevido: result.funttel.valorDevido,
      },
      create: {
        tenantId,
        tipo: 'FUNTTEL',
        periodo,
        baseCalculo: result.funttel.baseCalculo,
        aliquota: result.funttel.aliquota,
        valorDevido: result.funttel.valorDevido,
      },
    })

    return {
      periodo,
      receita: revenueEntry,
      fust: { ...result.fust, id: fust.id },
      funttel: { ...result.funttel, id: funttel.id },
      total: result.total,
    }
  }

  /**
   * Listar contribuições com filtros
   */
  async list(tenantId: string, filters: { year?: number; type?: string }) {
    const where: any = { tenantId }

    if (filters.year) {
      where.periodo = { startsWith: String(filters.year) }
    }
    if (filters.type) {
      where.tipo = filters.type
    }

    return prisma.contribution.findMany({
      where,
      orderBy: { periodo: 'desc' },
    })
  }

  /**
   * Registrar pagamento
   */
  async registerPayment(tenantId: string, contributionId: string, comprovanteUrl?: string) {
    const contribution = await prisma.contribution.findFirst({
      where: { id: contributionId, tenantId },
    })

    if (!contribution) {
      throw new AppError('Contribuição não encontrada', 404)
    }

    return prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: 'PAGO',
        dataPagamento: new Date(),
        comprovanteUrl,
      },
    })
  }

  /**
   * Resumo anual
   */
  async getSummary(tenantId: string, year: number) {
    const contributions = await prisma.contribution.findMany({
      where: {
        tenantId,
        periodo: { startsWith: String(year) },
      },
      orderBy: { periodo: 'asc' },
    })

    const fustTotal = contributions
      .filter((c) => c.tipo === 'FUST')
      .reduce((sum, c) => sum + Number(c.valorDevido), 0)

    const funttelTotal = contributions
      .filter((c) => c.tipo === 'FUNTTEL')
      .reduce((sum, c) => sum + Number(c.valorDevido), 0)

    const fustPago = contributions
      .filter((c) => c.tipo === 'FUST' && c.status === 'PAGO')
      .reduce((sum, c) => sum + Number(c.valorDevido), 0)

    const funttelPago = contributions
      .filter((c) => c.tipo === 'FUNTTEL' && c.status === 'PAGO')
      .reduce((sum, c) => sum + Number(c.valorDevido), 0)

    return {
      ano: year,
      fust: { total: fustTotal, pago: fustPago, pendente: fustTotal - fustPago },
      funttel: { total: funttelTotal, pago: funttelPago, pendente: funttelTotal - funttelPago },
      grandTotal: fustTotal + funttelTotal,
      grandPago: fustPago + funttelPago,
      meses: contributions,
    }
  }

  /**
   * Exportar CSV para contabilidade
   */
  async exportCSV(tenantId: string, year: number): Promise<string> {
    const contributions = await prisma.contribution.findMany({
      where: {
        tenantId,
        periodo: { startsWith: String(year) },
      },
      orderBy: [{ periodo: 'asc' }, { tipo: 'asc' }],
    })

    const header = 'Periodo;Tipo;Base_Calculo;Aliquota;Valor_Devido;Status;Data_Pagamento'
    const rows = contributions.map((c) =>
      [
        c.periodo,
        c.tipo,
        Number(c.baseCalculo).toFixed(2),
        Number(c.aliquota).toFixed(4),
        Number(c.valorDevido).toFixed(2),
        c.status,
        c.dataPagamento ? dayjs(c.dataPagamento).format('DD/MM/YYYY') : '',
      ].join(';'),
    )

    return [header, ...rows].join('\r\n')
  }
}

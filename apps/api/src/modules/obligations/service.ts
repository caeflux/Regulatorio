import { prisma } from '../../config/prisma'
import { AppError } from '../auth/service'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

// Feriados nacionais fixos (dia/mês)
const FERIADOS_FIXOS = [
  '01-01', // Confraternização Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25', // Natal
]

function isFeriado(date: dayjs.Dayjs): boolean {
  const mmdd = date.format('MM-DD')
  return FERIADOS_FIXOS.includes(mmdd)
}

function isWeekend(date: dayjs.Dayjs): boolean {
  const day = date.day()
  return day === 0 || day === 6
}

function nextBusinessDay(date: dayjs.Dayjs): dayjs.Dayjs {
  let d = date
  while (isWeekend(d) || isFeriado(d)) {
    d = d.add(1, 'day')
  }
  return d
}

function lastBusinessDayOfMonth(year: number, month: number): dayjs.Dayjs {
  let d = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').startOf('day')
  while (isWeekend(d) || isFeriado(d)) {
    d = d.subtract(1, 'day')
  }
  return d
}

export class ObligationService {
  /**
   * Gerar instâncias de obrigações para um tenant em um mês específico
   */
  async generateInstances(tenantId: string, year: number, month: number) {
    const obligations = await prisma.obligation.findMany({
      where: { ativo: true },
    })

    const created: string[] = []

    for (const obl of obligations) {
      // Verificar frequência
      if (obl.frequencia === 'MENSAL') {
        // Gerar para todo mês
      } else if (obl.frequencia === 'SEMESTRAL') {
        if (month !== 1 && month !== 7) continue
      } else if (obl.frequencia === 'ANUAL') {
        // Coleta Anual → março, Cadastral → janeiro
        if (obl.tipo === 'COLETA_ANUAL' && month !== 3) continue
        if (obl.tipo === 'CADASTRAL_MOSAICO' && month !== 1) continue
        if (obl.tipo === 'CONFORMIDADE_RGC' && month !== 12) continue
      } else if (obl.frequencia === 'EVENTUAL') {
        continue // Não gerar automaticamente
      }

      // Calcular data limite
      let dataLimite: dayjs.Dayjs

      if (obl.prazoRegra === 'ULTIMO_DIA_UTIL') {
        // FUNTTEL: último dia útil do mês seguinte
        const nextMonth = month === 12 ? 1 : month + 1
        const nextYear = month === 12 ? year + 1 : year
        dataLimite = lastBusinessDayOfMonth(nextYear, nextMonth)
      } else if (obl.prazoRegra === 'DIA_UTIL') {
        // Prazo cai em dia útil, se não, posterga
        const baseDate = dayjs(`${year}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, '0')}-${String(obl.prazoDia).padStart(2, '0')}`)
        dataLimite = nextBusinessDay(baseDate)
      } else {
        // DIA_CORRIDO: data exata, se fds/feriado posterga
        if (obl.tipo === 'COLETA_ANUAL') {
          dataLimite = nextBusinessDay(dayjs(`${year}-03-31`))
        } else if (obl.tipo === 'CADASTRAL_MOSAICO') {
          dataLimite = nextBusinessDay(dayjs(`${year}-01-31`))
        } else {
          const refMonth = month + 1 > 12 ? 1 : month + 1
          const refYear = month + 1 > 12 ? year + 1 : year
          const day = Math.min(obl.prazoDia, dayjs(`${refYear}-${String(refMonth).padStart(2, '0')}-01`).daysInMonth())
          dataLimite = nextBusinessDay(dayjs(`${refYear}-${String(refMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`))
        }
      }

      const periodo = `${year}-${String(month).padStart(2, '0')}`

      try {
        await prisma.obligationInstance.create({
          data: {
            tenantId,
            obligationId: obl.id,
            periodo,
            dataLimite: dataLimite.toDate(),
            status: 'PENDENTE',
          },
        })
        created.push(obl.nome)
      } catch {
        // Unique constraint — já existe, pular
      }
    }

    return created
  }

  /**
   * Visão calendário do mês
   */
  async getCalendar(tenantId: string, year: number, month: number) {
    const startDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toDate()
    const endDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').toDate()

    const instances = await prisma.obligationInstance.findMany({
      where: {
        tenantId,
        dataLimite: { gte: startDate, lte: endDate },
      },
      include: {
        obligation: true,
        responsavel: { select: { id: true, nome: true } },
      },
      orderBy: { dataLimite: 'asc' },
    })

    return instances.map((inst) => ({
      id: inst.id,
      nome: inst.obligation.nome,
      tipo: inst.obligation.tipo,
      frequencia: inst.obligation.frequencia,
      dataLimite: inst.dataLimite.toISOString(),
      status: inst.status,
      diasRestantes: dayjs(inst.dataLimite).diff(dayjs(), 'day'),
      responsavel: inst.responsavel,
      periodo: inst.periodo,
      notas: inst.notas,
    }))
  }

  /**
   * Próximas obrigações (N dias)
   */
  async getUpcoming(tenantId: string, days: number = 30) {
    const now = new Date()
    const futureDate = dayjs().add(days, 'day').toDate()

    const instances = await prisma.obligationInstance.findMany({
      where: {
        tenantId,
        dataLimite: { gte: now, lte: futureDate },
        status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
      },
      include: {
        obligation: true,
        responsavel: { select: { id: true, nome: true } },
      },
      orderBy: { dataLimite: 'asc' },
    })

    return instances.map((inst) => ({
      id: inst.id,
      nome: inst.obligation.nome,
      tipo: inst.obligation.tipo,
      dataLimite: inst.dataLimite.toISOString(),
      status: inst.status,
      diasRestantes: dayjs(inst.dataLimite).diff(dayjs(), 'day'),
      responsavel: inst.responsavel,
      periodo: inst.periodo,
    }))
  }

  /**
   * Obrigações atrasadas
   */
  async getOverdue(tenantId: string) {
    // Primeiro, atualizar status de todas que passaram do prazo
    await prisma.obligationInstance.updateMany({
      where: {
        tenantId,
        dataLimite: { lt: new Date() },
        status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
      },
      data: { status: 'ATRASADA' },
    })

    const instances = await prisma.obligationInstance.findMany({
      where: {
        tenantId,
        status: 'ATRASADA',
      },
      include: {
        obligation: true,
        responsavel: { select: { id: true, nome: true } },
      },
      orderBy: { dataLimite: 'asc' },
    })

    return instances.map((inst) => ({
      id: inst.id,
      nome: inst.obligation.nome,
      tipo: inst.obligation.tipo,
      dataLimite: inst.dataLimite.toISOString(),
      status: inst.status,
      diasAtraso: dayjs().diff(dayjs(inst.dataLimite), 'day'),
      responsavel: inst.responsavel,
      periodo: inst.periodo,
    }))
  }

  /**
   * Dashboard de compliance
   */
  async getDashboard(tenantId: string) {
    const currentMonth = dayjs().format('YYYY-MM')

    const [pendentes, emAndamento, concluidas, atrasadas, total] = await Promise.all([
      prisma.obligationInstance.count({ where: { tenantId, status: 'PENDENTE', periodo: currentMonth } }),
      prisma.obligationInstance.count({ where: { tenantId, status: 'EM_ANDAMENTO', periodo: currentMonth } }),
      prisma.obligationInstance.count({ where: { tenantId, status: 'CONCLUIDA', periodo: currentMonth } }),
      prisma.obligationInstance.count({ where: { tenantId, status: 'ATRASADA' } }),
      prisma.obligationInstance.count({ where: { tenantId, periodo: currentMonth } }),
    ])

    const complianceRate = total > 0 ? Math.round((concluidas / total) * 100) : 0
    const semaforo = atrasadas > 0 ? 'VERMELHO' : pendentes > 0 ? 'AMARELO' : 'VERDE'

    return {
      periodo: currentMonth,
      pendentes,
      emAndamento,
      concluidas,
      atrasadas,
      total,
      complianceRate,
      semaforo,
    }
  }

  /**
   * Atualizar status
   */
  async updateStatus(tenantId: string, instanceId: string, status: string) {
    const instance = await prisma.obligationInstance.findFirst({
      where: { id: instanceId, tenantId },
    })

    if (!instance) {
      throw new AppError('Obrigação não encontrada', 404)
    }

    return prisma.obligationInstance.update({
      where: { id: instanceId },
      data: {
        status: status as any,
        completedAt: status === 'CONCLUIDA' ? new Date() : undefined,
      },
    })
  }

  /**
   * Marcar como concluída com comprovante
   */
  async complete(tenantId: string, instanceId: string, comprovanteUrl?: string, notas?: string) {
    const instance = await prisma.obligationInstance.findFirst({
      where: { id: instanceId, tenantId },
    })

    if (!instance) {
      throw new AppError('Obrigação não encontrada', 404)
    }

    return prisma.obligationInstance.update({
      where: { id: instanceId },
      data: {
        status: 'CONCLUIDA',
        completedAt: new Date(),
        comprovanteUrl,
        notas,
      },
    })
  }
}

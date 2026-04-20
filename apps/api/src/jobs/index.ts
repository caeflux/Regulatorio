/**
 * Jobs assíncronos — BullMQ
 *
 * Jobs planejados:
 * - generate-obligation-instances: diário, gera instâncias de obrigações do mês
 * - send-alerts: verifica obrigações próximas e dispara alertas (email/whatsapp/push)
 * - sync-erp-data: sync periódico com ERPs integrados (HubSoft, IXCsoft, MK)
 * - scrape-legislation: diário, busca novas resoluções ANATEL
 * - generate-dici-csv: gera CSV no formato ANATEL sob demanda
 * - calculate-contributions: calcula FUST/FUNTTEL após input de receita
 */

// TODO: Implementar workers BullMQ
// import { Queue, Worker } from 'bullmq'
// import IORedis from 'ioredis'
// import { config } from '../config/env'

export const JOB_NAMES = {
  GENERATE_OBLIGATIONS: 'generate-obligation-instances',
  SEND_ALERTS: 'send-alerts',
  SYNC_ERP: 'sync-erp-data',
  SCRAPE_LEGISLATION: 'scrape-legislation',
  GENERATE_DICI: 'generate-dici-csv',
  CALCULATE_CONTRIBUTIONS: 'calculate-contributions',
} as const

// Placeholder — será implementado na sprint de infraestrutura
console.log('📋 Jobs registrados:', Object.values(JOB_NAMES).join(', '))

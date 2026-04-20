// ============================================
// TIPOS COMPARTILHADOS — RegTelecom
// ============================================

// Auth
export interface JwtPayload {
  userId: string
  tenantId: string
  email: string
  role: 'ADMIN' | 'GESTOR' | 'OPERADOR'
}

export interface RegisterInput {
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
  email: string
  senha: string
  nome: string
  cpf?: string
}

export interface LoginInput {
  email: string
  senha: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    nome: string
    email: string
    role: string
    tenant: {
      id: string
      razaoSocial: string
      cnpj: string
      plan: string
    }
  }
}

// Obligations
export interface ObligationCalendarItem {
  id: string
  nome: string
  tipo: string
  dataLimite: string
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'ATRASADA'
  diasRestantes: number
  responsavel?: string
}

// Contributions
export interface ContributionCalculation {
  tipo: 'FUST' | 'FUNTTEL'
  baseCalculo: number
  aliquota: number
  valorDevido: number
  detalhamento: {
    receita: number
    deducoes: Record<string, number>
    baseCalculo: number
  }
}

// DICI
export interface DICIValidationResult {
  valid: boolean
  errors: Array<{
    row: number
    field: string
    message: string
    severity: 'error' | 'warning'
  }>
  totalRows: number
  totalAcessos: number
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

// Constants
export const FUST_ALIQUOTA = 0.01
export const FUNTTEL_ALIQUOTA = 0.005

export const OBLIGATION_TYPES = [
  'DICI_MENSAL',
  'DICI_SEMESTRAL',
  'DICI_ANUAL',
  'FUST',
  'FUNTTEL',
  'COLETA_ANUAL',
  'CADASTRAL_MOSAICO',
  'SEGURANCA_CIBERNETICA',
  'CONFORMIDADE_RGC',
  'OUTORGA',
  'OUTRO',
] as const

export const TECHNOLOGIES = [
  'FTTX',
  'CABLE_MODEM',
  'XDSL',
  'RADIO',
  'SATELITE',
  'OUTROS',
] as const

export const TECHNOLOGY_LABELS: Record<string, string> = {
  FTTX: 'Fibra Óptica (FTTX)',
  CABLE_MODEM: 'Cable Modem',
  XDSL: 'xDSL',
  RADIO: 'Rádio',
  SATELITE: 'Satélite',
  OUTROS: 'Outros',
}

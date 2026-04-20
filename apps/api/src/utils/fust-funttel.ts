/**
 * Calculadora FUST e FUNTTEL
 *
 * FUST (Lei 9.998/2000): 1% sobre ROB - ICMS - PIS/COFINS
 * FUNTTEL (Lei 10.052/2000): 0,5% sobre RB - vendas canceladas - descontos - ICMS - PIS - COFINS
 */

export interface RevenueInput {
  receitaOperacionalBruta: number
  icms: number
  pis: number
  cofins: number
  vendasCanceladas?: number
  descontos?: number
}

export interface ContributionResult {
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

const FUST_ALIQUOTA = 0.01   // 1%
const FUNTTEL_ALIQUOTA = 0.005 // 0,5%

/**
 * Calcula contribuição FUST
 * Base: ROB - ICMS - PIS/COFINS
 */
export function calcularFUST(input: RevenueInput): ContributionResult {
  const deducoes = {
    ICMS: input.icms,
    PIS: input.pis,
    COFINS: input.cofins,
  }

  const totalDeducoes = Object.values(deducoes).reduce((sum, v) => sum + v, 0)
  const baseCalculo = Math.max(0, input.receitaOperacionalBruta - totalDeducoes)
  const valorDevido = Number((baseCalculo * FUST_ALIQUOTA).toFixed(2))

  return {
    tipo: 'FUST',
    baseCalculo,
    aliquota: FUST_ALIQUOTA,
    valorDevido,
    detalhamento: {
      receita: input.receitaOperacionalBruta,
      deducoes,
      baseCalculo,
    },
  }
}

/**
 * Calcula contribuição FUNTTEL
 * Base: RB - vendas canceladas - descontos - ICMS - PIS - COFINS
 */
export function calcularFUNTTEL(input: RevenueInput): ContributionResult {
  const deducoes = {
    'Vendas Canceladas': input.vendasCanceladas || 0,
    'Descontos': input.descontos || 0,
    ICMS: input.icms,
    PIS: input.pis,
    COFINS: input.cofins,
  }

  const totalDeducoes = Object.values(deducoes).reduce((sum, v) => sum + v, 0)
  const baseCalculo = Math.max(0, input.receitaOperacionalBruta - totalDeducoes)
  const valorDevido = Number((baseCalculo * FUNTTEL_ALIQUOTA).toFixed(2))

  return {
    tipo: 'FUNTTEL',
    baseCalculo,
    aliquota: FUNTTEL_ALIQUOTA,
    valorDevido,
    detalhamento: {
      receita: input.receitaOperacionalBruta,
      deducoes,
      baseCalculo,
    },
  }
}

/**
 * Calcula ambas contribuições de uma vez
 */
export function calcularContribuicoes(input: RevenueInput): {
  fust: ContributionResult
  funttel: ContributionResult
  total: number
} {
  const fust = calcularFUST(input)
  const funttel = calcularFUNTTEL(input)

  return {
    fust,
    funttel,
    total: fust.valorDevido + funttel.valorDevido,
  }
}

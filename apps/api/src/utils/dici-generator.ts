/**
 * Gerador de CSV DICI no formato exato da ANATEL
 *
 * Requisitos ANATEL:
 * - Encoding: UTF-8 BOM (byte order mark: EF BB BF)
 * - Delimitador de linha: CRLF (\r\n)
 * - Delimitador de campo: ponto-e-vírgula (;)
 */

export interface DICIRow {
  cnpj: string
  municipioIbge: string
  tipoAcesso: 'PF' | 'PJ' // Pessoa Física / Jurídica
  tecnologia: 'FTTX' | 'CABLE_MODEM' | 'XDSL' | 'RADIO' | 'SATELITE' | 'OUTROS'
  velocidadeDown: number // Mbps
  velocidadeUp: number   // Mbps
  quantidade: number
  zona: 'URBANA' | 'RURAL'
}

export interface DICIValidationError {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

const TECNOLOGIA_MAP: Record<string, string> = {
  FTTX: 'Fibra',
  CABLE_MODEM: 'Cable Modem',
  XDSL: 'xDSL',
  RADIO: 'Rádio',
  SATELITE: 'Satélite',
  OUTROS: 'Outros',
}

/**
 * Valida dados antes de gerar o CSV
 */
export function validateDICIData(rows: DICIRow[]): DICIValidationError[] {
  const errors: DICIValidationError[] = []

  rows.forEach((row, index) => {
    const rowNum = index + 1

    // CNPJ: 14 dígitos
    const cnpjClean = row.cnpj.replace(/\D/g, '')
    if (cnpjClean.length !== 14) {
      errors.push({
        row: rowNum,
        field: 'cnpj',
        message: `CNPJ inválido: ${row.cnpj} (deve ter 14 dígitos)`,
        severity: 'error',
      })
    }

    // Código IBGE: 7 dígitos
    if (!/^\d{7}$/.test(row.municipioIbge)) {
      errors.push({
        row: rowNum,
        field: 'municipioIbge',
        message: `Código IBGE inválido: ${row.municipioIbge} (deve ter 7 dígitos)`,
        severity: 'error',
      })
    }

    // Velocidades positivas
    if (row.velocidadeDown <= 0) {
      errors.push({
        row: rowNum,
        field: 'velocidadeDown',
        message: 'Velocidade de download deve ser positiva',
        severity: 'error',
      })
    }

    if (row.velocidadeUp <= 0) {
      errors.push({
        row: rowNum,
        field: 'velocidadeUp',
        message: 'Velocidade de upload deve ser positiva',
        severity: 'error',
      })
    }

    // Quantidade positiva
    if (row.quantidade <= 0 || !Number.isInteger(row.quantidade)) {
      errors.push({
        row: rowNum,
        field: 'quantidade',
        message: 'Quantidade deve ser um inteiro positivo',
        severity: 'error',
      })
    }

    // Warning: velocidade muito alta
    if (row.velocidadeDown > 10000) {
      errors.push({
        row: rowNum,
        field: 'velocidadeDown',
        message: `Velocidade de download muito alta: ${row.velocidadeDown} Mbps. Verificar.`,
        severity: 'warning',
      })
    }

    // Tecnologia válida
    if (!TECNOLOGIA_MAP[row.tecnologia]) {
      errors.push({
        row: rowNum,
        field: 'tecnologia',
        message: `Tecnologia inválida: ${row.tecnologia}`,
        severity: 'error',
      })
    }
  })

  return errors
}

/**
 * Gera CSV no formato ANATEL (UTF-8 BOM + CRLF + ponto-e-vírgula)
 */
export function generateDICICSV(rows: DICIRow[]): Buffer {
  const BOM = '\uFEFF' // UTF-8 BOM
  const CRLF = '\r\n'
  const SEP = ';'

  // Header
  const header = [
    'CNPJ',
    'COD_IBGE_MUNICIPIO',
    'TIPO_ACESSO',
    'TECNOLOGIA',
    'VELOCIDADE_DOWNLOAD_MBPS',
    'VELOCIDADE_UPLOAD_MBPS',
    'QUANTIDADE_ACESSOS',
    'ZONA',
  ].join(SEP)

  // Data rows
  const dataRows = rows.map((row) =>
    [
      row.cnpj.replace(/\D/g, ''), // CNPJ só números
      row.municipioIbge,
      row.tipoAcesso,
      row.tecnologia,
      row.velocidadeDown.toFixed(2),
      row.velocidadeUp.toFixed(2),
      row.quantidade.toString(),
      row.zona,
    ].join(SEP)
  )

  const csv = BOM + [header, ...dataRows].join(CRLF) + CRLF

  return Buffer.from(csv, 'utf-8')
}

/**
 * Compara dados do mês atual com o anterior para detectar variações
 */
export function compareWithPreviousMonth(
  current: DICIRow[],
  previous: DICIRow[]
): DICIValidationError[] {
  const warnings: DICIValidationError[] = []

  const currentTotal = current.reduce((sum, r) => sum + r.quantidade, 0)
  const previousTotal = previous.reduce((sum, r) => sum + r.quantidade, 0)

  if (previousTotal > 0) {
    const variation = Math.abs((currentTotal - previousTotal) / previousTotal) * 100

    if (variation > 10) {
      warnings.push({
        row: 0,
        field: 'quantidade',
        message: `Variação de ${variation.toFixed(1)}% no total de acessos em relação ao mês anterior (${previousTotal} → ${currentTotal}). Verificar se está correto.`,
        severity: 'warning',
      })
    }
  }

  return warnings
}

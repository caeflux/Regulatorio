import { z } from 'zod'

// Validação de CNPJ (algoritmo completo)
function isValidCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return false
  if (/^(\d)\1+$/.test(clean)) return false

  const calc = (digits: string, factor: number[]): number => {
    const sum = digits.split('').reduce((acc, d, i) => acc + parseInt(d) * factor[i], 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const f1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const f2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const d1 = calc(clean.substring(0, 12), f1)
  const d2 = calc(clean.substring(0, 13), f2)

  return parseInt(clean[12]) === d1 && parseInt(clean[13]) === d2
}

export const registerSchema = z.object({
  cnpj: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine(isValidCNPJ, { message: 'CNPJ inválido' }),
  razaoSocial: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  nomeFantasia: z.string().optional(),
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cpf: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>

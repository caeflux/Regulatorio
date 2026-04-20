import bcrypt from 'bcryptjs'
import { prisma } from '../../config/prisma'
import type { RegisterInput, LoginInput } from './schemas'
import type { JwtPayload } from '@regtelecom/shared'

const SALT_ROUNDS = 12

export class AuthService {
  /**
   * Registra novo ISP (tenant) + usuário admin
   */
  async register(input: RegisterInput) {
    // Verificar se CNPJ já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { cnpj: input.cnpj },
    })
    if (existingTenant) {
      throw new AppError('CNPJ já cadastrado', 409)
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    })
    if (existingUser) {
      throw new AppError('Email já cadastrado', 409)
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(input.senha, SALT_ROUNDS)

    // Criar tenant + user admin em transação
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          cnpj: input.cnpj,
          razaoSocial: input.razaoSocial,
          nomeFantasia: input.nomeFantasia,
          email: input.email,
        },
      })

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.email,
          senhaHash,
          nome: input.nome,
          cpf: input.cpf,
          role: 'ADMIN',
        },
      })

      return { tenant, user }
    })

    return {
      tenant: {
        id: result.tenant.id,
        cnpj: result.tenant.cnpj,
        razaoSocial: result.tenant.razaoSocial,
        plan: result.tenant.plan,
      },
      user: {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        role: result.user.role,
      },
    }
  }

  /**
   * Login com email e senha
   */
  async login(input: LoginInput): Promise<{ payload: JwtPayload; user: any; tenant: any }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { tenant: true },
    })

    if (!user || !user.senhaHash) {
      throw new AppError('Credenciais inválidas', 401)
    }

    if (!user.active) {
      throw new AppError('Usuário desativado', 403)
    }

    if (!user.tenant.active) {
      throw new AppError('Conta do ISP desativada', 403)
    }

    const senhaValida = await bcrypt.compare(input.senha, user.senhaHash)
    if (!senhaValida) {
      throw new AppError('Credenciais inválidas', 401)
    }

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    const payload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    }

    return {
      payload,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        razaoSocial: user.tenant.razaoSocial,
        cnpj: user.tenant.cnpj,
        plan: user.tenant.plan,
      },
    }
  }

  /**
   * Buscar perfil do usuário autenticado
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    })

    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      cargo: user.cargo,
      role: user.role,
      lastLogin: user.lastLogin,
      tenant: {
        id: user.tenant.id,
        cnpj: user.tenant.cnpj,
        razaoSocial: user.tenant.razaoSocial,
        nomeFantasia: user.tenant.nomeFantasia,
        licencaScm: user.tenant.licencaScm,
        licencaStfc: user.tenant.licencaStfc,
        numeroOutorga: user.tenant.numeroOutorga,
        plan: user.tenant.plan,
      },
    }
  }

  /**
   * Listar usuários do tenant
   */
  async listUsers(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId, active: true },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        role: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }
}

// Error class para tratamento de erros HTTP
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

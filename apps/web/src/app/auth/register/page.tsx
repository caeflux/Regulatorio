'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [form, setForm] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeAdmin: '',
    emailAdmin: '',
    senhaAdmin: '',
    confirmarSenha: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.senhaAdmin !== form.confirmarSenha) {
      setError('As senhas nao coincidem')
      return
    }
    if (form.senhaAdmin.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      await register({
        cnpj: form.cnpj.replace(/\D/g, ''),
        razaoSocial: form.razaoSocial,
        nomeAdmin: form.nomeAdmin,
        emailAdmin: form.emailAdmin,
        senhaAdmin: form.senhaAdmin,
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold">RegTelecom</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Registrar sua empresa</h2>
          <p className="mt-2 text-sm text-gray-500">
            Comece a gerenciar suas obrigacoes regulatorias ANATEL
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Dados da Empresa</h3>

          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
              CNPJ
            </label>
            <input
              id="cnpj"
              name="cnpj"
              value={form.cnpj}
              onChange={handleChange}
              className="input-field mt-1"
              placeholder="00.000.000/0000-00"
              required
            />
          </div>

          <div>
            <label htmlFor="razaoSocial" className="block text-sm font-medium text-gray-700">
              Razao Social
            </label>
            <input
              id="razaoSocial"
              name="razaoSocial"
              value={form.razaoSocial}
              onChange={handleChange}
              className="input-field mt-1"
              placeholder="Nome da empresa"
              required
            />
          </div>

          <hr className="border-gray-200" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Administrador</h3>

          <div>
            <label htmlFor="nomeAdmin" className="block text-sm font-medium text-gray-700">
              Nome completo
            </label>
            <input
              id="nomeAdmin"
              name="nomeAdmin"
              value={form.nomeAdmin}
              onChange={handleChange}
              className="input-field mt-1"
              placeholder="Seu nome"
              required
            />
          </div>

          <div>
            <label htmlFor="emailAdmin" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="emailAdmin"
              name="emailAdmin"
              type="email"
              value={form.emailAdmin}
              onChange={handleChange}
              className="input-field mt-1"
              placeholder="admin@empresa.com"
              required
            />
          </div>

          <div>
            <label htmlFor="senhaAdmin" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="relative mt-1">
              <input
                id="senhaAdmin"
                name="senhaAdmin"
                type={showPassword ? 'text' : 'password'}
                value={form.senhaAdmin}
                onChange={handleChange}
                className="input-field pr-10"
                placeholder="Minimo 8 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
              Confirmar senha
            </label>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              value={form.confirmarSenha}
              onChange={handleChange}
              className="input-field mt-1"
              placeholder="Repita a senha"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Registrando...' : 'Registrar empresa'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Ja tem conta?{' '}
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}

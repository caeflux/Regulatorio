'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, senha)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary-600 to-primary-900 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <Shield className="h-16 w-16 text-white/90" />
        <h1 className="mt-6 text-4xl font-bold text-white">RegTelecom</h1>
        <p className="mt-3 text-lg text-primary-100">
          Plataforma de compliance regulatorio ANATEL para ISPs brasileiros.
          Gerencie obrigacoes, contribuicoes e relatorios em um so lugar.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4">
          {[
            'Calendario de obrigacoes',
            'Calculadora FUST/FUNTTEL',
            'Gerador DICI automatizado',
            'Modelos de contrato',
          ].map((feat) => (
            <div key={feat} className="rounded-lg bg-white/10 px-4 py-3 text-sm text-white">
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold">RegTelecom</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Entrar na sua conta</h2>
          <p className="mt-2 text-sm text-gray-500">
            Acesse o painel de compliance da sua empresa
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative mt-1">
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Sua senha"
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

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Ainda nao tem conta?{' '}
            <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
              Registre sua empresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

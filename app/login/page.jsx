'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import BrandLogo from '../components/BrandLogo'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email o contraseña inválidos')
      setIsLoading(false)
      return
    }

    if (result?.ok) {
      router.push(callbackUrl)
    }
  }

  return (
    <div className="min-h-screen bg-brand-white flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <BrandLogo size={80} />
          </motion.div>
          <h1 className="font-serif text-3xl tracking-tight mb-2">0880</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-black/50">
            Panel de Administración
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6 bg-white p-8 border border-brand-black/10"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs uppercase tracking-wider"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-black/70 mb-2 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border border-brand-black/20 bg-white focus:outline-none focus:border-brand-black disabled:opacity-50"
              placeholder="admin@0880.mx"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-black/70 mb-2 uppercase tracking-wide">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border border-brand-black/20 bg-white focus:outline-none focus:border-brand-black disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-black text-white py-3 uppercase text-xs font-bold tracking-[0.2em] hover:bg-brand-black/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </motion.form>

        <p className="text-center text-[10px] text-brand-black/40 uppercase tracking-wider mt-6">
          Panel privado · 0880
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-white flex items-center justify-center">Cargando...</div>}>
      <LoginContent />
    </Suspense>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import PasswordInput from '@/components/PasswordInput'

type Mode = 'password' | 'otp-email' | 'otp-code'

export default function CompanyLogin() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendCooldown])

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/company/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/company/portal')
  }

  async function sendCode(emailVal: string) {
    setLoading(true); setError('')
    const res = await fetch('/api/company/otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailVal }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return false }
    return true
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (await sendCode(email)) {
      setMode('otp-code'); setResendCooldown(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }

  function handleCodeInput(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...code]; next[i] = val.slice(-1); setCode(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }
  function handleCodeKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }
  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setCode(pasted.split('')); inputRefs.current[5]?.focus() }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const full = code.join('')
    if (full.length < 6) { setError('Enter the full 6-digit code.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/company/verify-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: full }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/company/portal')
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 px-10 py-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Link href="/"><Logo /></Link></div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'otp-code' ? 'Enter Your Code' : 'Company Portal'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {mode === 'password' && 'Sign in to view your shortlisted candidates'}
            {mode === 'otp-email' && 'Enter your company email to get a login code'}
            {mode === 'otp-code' && `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hr@company.com"
                required autoFocus className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                required className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading || !email.trim() || !password}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="flex items-center justify-between text-xs pt-1">
              <button type="button" onClick={() => { setMode('otp-email'); setError('') }} className="text-indigo-600 hover:underline font-medium">
                Sign in with email code
              </button>
              <button type="button" onClick={() => { setMode('otp-email'); setError('') }} className="text-slate-400 hover:text-slate-600">
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {mode === 'otp-email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hr@company.com"
                required autoFocus className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading || !email.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all">
              {loading ? 'Sending code...' : 'Send Login Code'}
            </button>
            <p className="text-center text-xs">
              <button type="button" onClick={() => { setMode('password'); setError('') }} className="text-slate-400 hover:text-slate-600">
                ← Back to password login
              </button>
            </p>
          </form>
        )}

        {mode === 'otp-code' && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3 text-center">6-digit code</label>
              <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input key={i} ref={el => { inputRefs.current[i] = el }} type="text" inputMode="numeric" maxLength={1}
                    value={digit} onChange={e => handleCodeInput(i, e.target.value)} onKeyDown={e => handleCodeKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors" />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</p>}
            <button type="submit" disabled={loading || code.join('').length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all">
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setMode('otp-email'); setCode(['','','','','','']); setError('') }} className="text-slate-400 hover:text-slate-600">
                ← Change email
              </button>
              <button type="button" onClick={async () => { setCode(['','','','','','']); setError(''); if (await sendCode(email)) setResendCooldown(30) }}
                disabled={resendCooldown > 0 || loading}
                className="text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline font-medium">
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

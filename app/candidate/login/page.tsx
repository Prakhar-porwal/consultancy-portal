'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

export default function CandidateLogin() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
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

  async function sendOtp(emailVal: string) {
    setLoading(true)
    setError('')
    const res = await fetch('/api/candidate-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailVal }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return false }
    return true
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await sendOtp(email)
    if (ok) {
      setStep('code')
      setResendCooldown(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }

  function handleCodeInput(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...code]
    next[i] = val.slice(-1)
    setCode(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }

  function handleCodeKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) { setError('Enter the full 6-digit code.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/candidate-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: fullCode }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }

    // Store session in localStorage
    localStorage.setItem('rsd_candidate', JSON.stringify({
      email: data.email,
      name: data.name,
      validUntil: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }))
    router.push('/candidate/jobs')
  }

  async function resend() {
    setCode(['', '', '', '', '', ''])
    setError('')
    const ok = await sendOtp(email)
    if (ok) {
      setResendCooldown(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 px-10 py-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link href="/"><Logo /></Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 'email' ? 'View Available Jobs' : 'Enter Your Code'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {step === 'email'
              ? 'Enter the email you used when submitting your profile'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending code...</>
              ) : 'Send Code'}
            </button>
            <p className="text-center text-xs text-slate-400">
              Don&apos;t have a profile?{' '}
              <Link href="/apply" className="text-indigo-600 hover:underline font-medium">Submit your profile</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3 text-center">6-digit code</label>
              <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeInput(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.join('').length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Verifying...</>
              ) : 'Verify & View Jobs'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep('email'); setCode(['','','','','','']); setError('') }} className="text-slate-400 hover:text-slate-600">
                ← Change email
              </button>
              <button
                type="button"
                onClick={resend}
                disabled={resendCooldown > 0 || loading}
                className="text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline font-medium"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

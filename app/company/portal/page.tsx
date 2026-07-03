'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Candidate } from '@/lib/supabase'
import Logo from '@/components/Logo'

export default function CompanyPortal() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<{ name: string; hasPassword: boolean } | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  // set-password panel
  const [showPw, setShowPw] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/company/me')
      if (!meRes.ok) { router.push('/company/login'); return }
      const me = await meRes.json()
      setCompany({ name: me.name, hasPassword: me.hasPassword })
      const cRes = await fetch('/api/company/candidates')
      setCandidates(cRes.ok ? await cRes.json() : [])
      setLoading(false)
    })()
  }, [router])

  async function signOut() {
    await fetch('/api/company/logout', { method: 'POST' })
    router.push('/company/login')
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    if (pw.length < 6) { setPwMsg('Password must be at least 6 characters.'); return }
    if (pw !== pw2) { setPwMsg('Passwords do not match.'); return }
    setPwSaving(true)
    const res = await fetch('/api/company/set-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    const data = await res.json()
    setPwSaving(false)
    if (!res.ok) { setPwMsg(data.error ?? 'Failed to set password.'); return }
    setShowPw(false); setPw(''); setPw2('')
    setCompany(c => c ? { ...c, hasPassword: true } : c)
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400 text-sm">Loading...</div></main>
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Logo />
          <span className="text-slate-400 text-sm ml-1 hidden sm:inline">/ Client Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:block truncate max-w-[160px]">{company?.name}</span>
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-800 transition-colors shrink-0">Sign out</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Your Shortlisted Candidates</h1>
          <p className="text-slate-500 text-sm mt-1">
            {candidates.length > 0
              ? `${candidates.length} candidate${candidates.length > 1 ? 's' : ''} shared by matchwork for your open positions`
              : 'No candidates have been shared with you yet.'}
          </p>
        </div>

        {/* Set-password nudge */}
        {company && !company.hasPassword && (
          <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            {!showPw ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-indigo-800">Set a password for faster sign-in next time (optional).</p>
                <button onClick={() => setShowPw(true)} className="text-sm font-semibold text-indigo-600 hover:underline shrink-0">Set password</button>
              </div>
            ) : (
              <form onSubmit={savePassword} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password (min 6 chars)"
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                  <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Confirm password"
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
                {pwMsg && <p className="text-xs text-red-600">{pwMsg}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={pwSaving} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    {pwSaving ? 'Saving...' : 'Save password'}
                  </button>
                  <button type="button" onClick={() => { setShowPw(false); setPwMsg('') }} className="text-sm text-slate-500 hover:text-slate-700 px-2">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No candidates yet</p>
            <p className="text-slate-400 text-sm mt-1">matchwork will share shortlisted profiles here as they&apos;re ready.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map(c => (
              <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="w-full text-left p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-slate-900">{c.full_name}</h2>
                        {c.is_immediate_joiner && <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">Immediate joiner</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-slate-500">
                        {c.current_company && <span>{c.current_company}</span>}
                        <span>· {c.total_experience} exp</span>
                        <span>· {c.current_location}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-indigo-600 font-bold text-sm">₹{c.expected_ctc} LPA</div>
                      <div className="text-xs text-slate-400">expected</div>
                    </div>
                  </div>
                </button>

                {expanded === c.id && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <Detail label="Phone"><a href={`tel:${c.phone}`} className="text-indigo-600 hover:underline">{c.phone}</a>{c.alt_phone ? <span className="text-slate-400"> / {c.alt_phone}</span> : null}</Detail>
                      <Detail label="Email"><a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline break-all">{c.email}</a></Detail>
                      {c.linkedin_url && <Detail label="LinkedIn"><a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">View profile</a></Detail>}
                      <Detail label="Current CTC">₹{c.current_ctc} LPA</Detail>
                      <Detail label="Notice period">{c.notice_period}</Detail>
                      <Detail label="Ready to relocate">{c.ready_to_relocate ? 'Yes' : 'No'}</Detail>
                      {(c.education_type || c.education_institution) && <Detail label="Education">{[c.education_type, c.education_institution].filter(Boolean).join(' · ')}</Detail>}
                      {c.preferred_location && <Detail label="Preferred location">{c.preferred_location}</Detail>}
                    </div>

                    {c.skills && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                            <span key={s} className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {c.resume_url && (
                      <a href={c.resume_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-sm shadow-indigo-500/30 transition-colors">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Resume
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          Candidates shared exclusively for your consideration by matchwork.
        </p>
      </div>
    </main>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-slate-700">{children}</p>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Job } from '@/lib/supabase'

export default function CandidateJobs() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('rsd_candidate')
    if (!raw) { router.push('/candidate/login'); return }

    let session: { email: string; name: string; validUntil: number }
    try { session = JSON.parse(raw) } catch { router.push('/candidate/login'); return }

    if (Date.now() > session.validUntil) {
      localStorage.removeItem('rsd_candidate')
      router.push('/candidate/login')
      return
    }

    setUserName(session.name)
    setUserEmail(session.email)

    const email = session.email.toLowerCase()
    Promise.all([
      supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('job_applications').select('job_id').eq('candidate_email', email),
    ]).then(([{ data: jobData }, { data: appData }]) => {
      setJobs(jobData ?? [])
      setAppliedJobIds(new Set(appData?.map(r => r.job_id) ?? []))
      setLoading(false)
    })
  }, [router])

  async function handleApply(jobId: string) {
    if (!userEmail || appliedJobIds.has(jobId) || applying) return
    setApplying(jobId)
    const { error } = await supabase
      .from('job_applications')
      .insert({ job_id: jobId, candidate_email: userEmail.toLowerCase() })
    if (!error) {
      setAppliedJobIds(prev => new Set([...prev, jobId]))
    }
    setApplying(null)
  }

  function handleSignOut() {
    localStorage.removeItem('rsd_candidate')
    router.push('/candidate/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-gray-900">matchwork</span>
          <span className="text-gray-400 text-sm ml-1">/ Jobs</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">Hi, {userName}</span>
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Positions</h1>
          <p className="text-gray-500 text-sm mt-1">
            {jobs.length > 0
              ? `${jobs.length} open position${jobs.length > 1 ? 's' : ''} — apply via matchwork`
              : 'No open positions at this time. Check back soon.'}
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No open positions right now</p>
            <p className="text-gray-400 text-sm mt-1">We&apos;ll reach out when we find the right match.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                  className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                        {job.experience_required && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {job.experience_required}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Posted {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 shrink-0 mt-0.5 transition-transform ${expanded === job.id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expanded === job.id && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Job Description</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{job.description}</p>
                    </div>
                    {job.jd_url && (
                      <div className="mt-4">
                        <a
                          href={job.jd_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Job Description
                        </a>
                      </div>
                    )}
                    <div className="mt-5 flex flex-col gap-3">
                      {appliedJobIds.has(job.id) ? (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          You&apos;ve applied for this role — we&apos;ll be in touch!
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={applying === job.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          {applying === job.id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              Applying...
                            </>
                          ) : 'Apply Now'}
                        </button>
                      )}
                      <p className="text-xs text-gray-400 text-center">
                        Questions? Email us at{' '}
                        <a href="mailto:prakhar@rsd.org.in" className="text-blue-500 underline">prakhar@rsd.org.in</a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Your profile is with matchwork. We&apos;ll reach out when we find the right match.
        </p>
      </div>
    </main>
  )
}

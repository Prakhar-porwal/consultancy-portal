'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, type Candidate, type Client, type Job, type EmailLog, type HiringRequirement } from '@/lib/supabase'
import Logo from '@/components/Logo'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-indigo-100 text-indigo-700',
  screening: 'bg-yellow-100 text-yellow-700',
  shortlisted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  placed: 'bg-purple-100 text-purple-700',
}

const STATUS_OPTIONS = ['new', 'screening', 'shortlisted', 'rejected', 'placed']

// The client's own decision on a candidate (set by the company in their portal)
const CLIENT_DECISION_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-500',
  shortlisted: 'bg-amber-100 text-amber-700',
  selected: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}
const clientDecisionLabel = (v?: string) => (v ?? 'pending').charAt(0).toUpperCase() + (v ?? 'pending').slice(1)

const INITIAL_EMAIL = {
  toEmail: '',
  toName: '',
  cc: '',
  subject: 'Candidate Profiles — matchwork',
  customNote: '',
}

const INITIAL_JOB = {
  title: '',
  description: '',
  location: '',
  experience_required: '',
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'clients' | 'logs' | 'requirements'>('candidates')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [assigningClient, setAssigningClient] = useState<string | null>(null)

  // multi-select for email
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState(INITIAL_EMAIL)
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState<{ success?: string; error?: string }>({})

  // jobs
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [jobForm, setJobForm] = useState(INITIAL_JOB)
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [jobSaving, setJobSaving] = useState(false)
  const [jobError, setJobError] = useState('')

  // logs
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // requirements
  const [requirements, setRequirements] = useState<HiringRequirement[]>([])
  const [reqLoading, setReqLoading] = useState(false)
  const [updatingReqStatus, setUpdatingReqStatus] = useState<string | null>(null)

  // clients management
  const [showClientModal, setShowClientModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientSaving, setClientSaving] = useState(false)
  const [clientError, setClientError] = useState('')

  // applications
  const [applications, setApplications] = useState<{ candidate_email: string; job_id: string }[]>([])
  const [jobsMap, setJobsMap] = useState<Record<string, string>>({})

  // Gate: confirm an admin session before rendering or loading any data.
  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/admin/login'); return false }
    setAuthed(true)
    return true
  }, [router])

  // Attaches the admin's Supabase access token so protected API routes
  // (/api/logs, /api/clients, /api/send-email) can verify the caller.
  async function authHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: cands }, { data: cls }, { data: jobRows }, { data: appRows }] = await Promise.all([
      supabase.from('candidates').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name, email, created_at').order('name'),
      supabase.from('jobs').select('id, title'),
      supabase.from('job_applications').select('candidate_email, job_id'),
    ])
    setCandidates(cands ?? [])
    setClients(cls ?? [])
    setApplications(appRows ?? [])
    const map: Record<string, string> = {}
    for (const j of (jobRows ?? [])) map[j.id] = j.title
    setJobsMap(map)
    setLoading(false)
  }, [])

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true)
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
    setJobs(data ?? [])
    setJobsLoading(false)
  }, [])

  useEffect(() => {
    // Only load data once the session is confirmed — never for a guest.
    checkAuth().then(ok => { if (ok) fetchData() })
  }, [checkAuth, fetchData])

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    const res = await fetch('/api/logs', { headers: await authHeaders() })
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLogsLoading(false)
  }, [])

  const fetchRequirements = useCallback(async () => {
    setReqLoading(true)
    const { data } = await supabase.from('hiring_requirements').select('*').order('created_at', { ascending: false })
    setRequirements((data ?? []) as HiringRequirement[])
    setReqLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'jobs') fetchJobs()
    if (activeTab === 'logs') fetchLogs()
    if (activeTab === 'requirements') fetchRequirements()
  }, [activeTab, fetchJobs, fetchLogs, fetchRequirements])

  function openNewJob() {
    setEditingJob(null)
    setJobForm(INITIAL_JOB)
    setJdFile(null)
    setJobError('')
    setShowJobModal(true)
  }

  function openEditJob(job: Job) {
    setEditingJob(job)
    setJobForm({
      title: job.title,
      description: job.description,
      location: job.location,
      experience_required: job.experience_required ?? '',
    })
    setJdFile(null)
    setJobError('')
    setShowJobModal(true)
  }

  async function saveJob() {
    if (!jobForm.title.trim() || !jobForm.description.trim() || !jobForm.location.trim()) {
      setJobError('Title, description, and location are required.')
      return
    }
    setJobSaving(true)
    setJobError('')

    let jd_url: string | null = editingJob?.jd_url ?? null
    if (jdFile) {
      const ext = jdFile.name.split('.').pop()
      const fileName = `jd/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, jdFile, { upsert: false })
      if (uploadError) {
        setJobError('Failed to upload JD file: ' + uploadError.message)
        setJobSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName)
      jd_url = urlData.publicUrl
    }

    const payload = {
      title: jobForm.title.trim(),
      description: jobForm.description.trim(),
      location: jobForm.location.trim(),
      experience_required: jobForm.experience_required.trim() || null,
      jd_url,
    }
    let dbError
    if (editingJob) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', editingJob.id)
      dbError = error
    } else {
      const { error } = await supabase.from('jobs').insert({ ...payload, status: 'active' })
      dbError = error
    }
    if (dbError) {
      setJobError(dbError.message)
      setJobSaving(false)
      return
    }
    await fetchJobs()
    setShowJobModal(false)
    setJobSaving(false)
  }

  async function toggleJobStatus(job: Job) {
    const newStatus = job.status === 'active' ? 'closed' : 'active'
    await supabase.from('jobs').update({ status: newStatus }).eq('id', job.id)
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j))
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job posting?')) return
    await supabase.from('jobs').delete().eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  function openNewClient() {
    setEditingClient(null)
    setClientName('')
    setClientEmail('')
    setClientError('')
    setShowClientModal(true)
  }

  function openEditClient(client: Client) {
    setEditingClient(client)
    setClientName(client.name)
    setClientEmail(client.email ?? '')
    setClientError('')
    setShowClientModal(true)
  }

  async function saveClient() {
    if (!clientName.trim()) { setClientError('Client name is required.'); return }
    setClientSaving(true)
    setClientError('')
    const payload = editingClient
      ? { id: editingClient.id, name: clientName, email: clientEmail }
      : { name: clientName, email: clientEmail }
    const res = await fetch('/api/clients', {
      method: editingClient ? 'PATCH' : 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setClientError(data.error ?? 'Failed to save.'); setClientSaving(false); return }
    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? data : c))
    } else {
      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setShowClientModal(false)
    setClientSaving(false)
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`Delete client "${name}"? Candidates assigned to them will become unassigned.`)) return
    const res = await fetch('/api/clients', {
      method: 'DELETE',
      headers: await authHeaders(),
      body: JSON.stringify({ id }),
    })
    if (!res.ok) return
    setClients(prev => prev.filter(c => c.id !== id))
    setCandidates(prev => prev.map(c => c.client_id === id ? { ...c, client_id: null } : c))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingStatus(id)
    await supabase.from('candidates').update({ status }).eq('id', id)
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: status as Candidate['status'] } : c))
    if (selectedCandidate?.id === id) setSelectedCandidate(prev => prev ? { ...prev, status: status as Candidate['status'] } : null)
    setUpdatingStatus(null)
  }

  async function assignClient(candidateId: string, clientId: string | null) {
    setAssigningClient(candidateId)
    await supabase.from('candidates').update({ client_id: clientId }).eq('id', candidateId)
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, client_id: clientId } : c))
    if (selectedCandidate?.id === candidateId) setSelectedCandidate(prev => prev ? { ...prev, client_id: clientId } : null)
    setAssigningClient(null)
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Current CTC', 'Expected CTC', 'Notice Period', 'Immediate Joiner', 'Experience', 'Skills', 'Location', 'Status', 'Client', 'Client Decision', 'Submitted On']
    const rows = filtered.map(c => [
      c.full_name, c.email, c.phone, c.current_company ?? '',
      c.current_ctc, c.expected_ctc, c.notice_period,
      c.is_immediate_joiner ? 'Yes' : 'No',
      c.total_experience, c.skills, c.current_location,
      c.status,
      clients.find(cl => cl.id === c.client_id)?.name ?? 'Unassigned',
      c.client_id ? clientDecisionLabel(c.client_status) : '',
      new Date(c.created_at).toLocaleDateString('en-IN'),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleCheck(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleCheckAll() {
    if (checkedIds.size === filtered.length && filtered.length > 0) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(filtered.map(c => c.id)))
    }
  }

  function removeFromEmail(id: string) {
    setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  async function sendEmail() {
    if (!emailForm.toEmail || !emailForm.toName) return
    setEmailSending(true)
    setEmailResult({})
    try {
      const selected = candidates.filter(c => checkedIds.has(c.id))
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ candidates: selected, ...emailForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEmailResult({ success: `Email sent to ${emailForm.toEmail}` })
      setTimeout(() => {
        setShowEmailModal(false)
        setCheckedIds(new Set())
        setEmailForm(INITIAL_EMAIL)
        setEmailResult({})
      }, 2500)
    } catch (err) {
      setEmailResult({ error: err instanceof Error ? err.message : 'Failed to send email.' })
    } finally {
      setEmailSending(false)
    }
  }

  function getAppliedJobs(email: string): string[] {
    return applications
      .filter(a => a.candidate_email.toLowerCase() === email.toLowerCase())
      .map(a => jobsMap[a.job_id])
      .filter(Boolean) as string[]
  }

  const filtered = candidates.filter(c => {
    const matchClient = selectedClient === 'all' || c.client_id === selectedClient
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) ||
      c.skills.toLowerCase().includes(q) || c.current_location.toLowerCase().includes(q)
    return matchClient && matchStatus && matchSearch
  })

  const allChecked = filtered.length > 0 && checkedIds.size === filtered.length
  const someChecked = checkedIds.size > 0

  const stats = {
    total: candidates.length,
    new: candidates.filter(c => c.status === 'new').length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    placed: candidates.filter(c => c.status === 'placed').length,
  }

  const tabBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`

  // Rendered in two places (inline on desktop, scrollable row on mobile);
  // w-max keeps it from shrinking so the overflow-x-auto parent can scroll.
  const tabBar = (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-max">
      <button onClick={() => setActiveTab('candidates')} className={tabBtn(activeTab === 'candidates')}>
        Candidates
      </button>
      <button onClick={() => setActiveTab('jobs')} className={tabBtn(activeTab === 'jobs')}>
        Jobs
        {jobs.filter(j => j.status === 'active').length > 0 && (
          <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">
            {jobs.filter(j => j.status === 'active').length}
          </span>
        )}
      </button>
      <button onClick={() => setActiveTab('clients')} className={tabBtn(activeTab === 'clients')}>
        Clients
        {clients.length > 0 && (
          <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
            {clients.length}
          </span>
        )}
      </button>
      <button onClick={() => setActiveTab('logs')} className={tabBtn(activeTab === 'logs')}>
        Logs
      </button>
      <button onClick={() => setActiveTab('requirements')} className={tabBtn(activeTab === 'requirements')}>
        Requirements
        {requirements.filter(r => r.status === 'new').length > 0 && (
          <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">
            {requirements.filter(r => r.status === 'new').length}
          </span>
        )}
      </button>
    </div>
  )

  // Don't render the dashboard (or any of its data UI) until the session is confirmed.
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Checking access…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/"><Logo /></Link>
            <span className="text-slate-400 text-sm ml-1 hidden sm:inline">/ Admin</span>
          </div>
          {/* Tabs inline on wide screens */}
          <div className="hidden lg:block">{tabBar}</div>
          <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-slate-800 transition-colors shrink-0">
            Sign out
          </button>
        </div>
        {/* Tabs on their own scrollable row on mobile / tablet */}
        <div className="lg:hidden px-4 sm:px-6 pb-3 overflow-x-auto">{tabBar}</div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── JOBS TAB ── */}
        {activeTab === 'jobs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Job Postings</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {jobs.filter(j => j.status === 'active').length} active · {jobs.filter(j => j.status === 'closed').length} closed
                </p>
              </div>
              <button
                onClick={openNewJob}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post New Job
              </button>
            </div>

            {jobsLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-500 font-medium">No job postings yet</p>
                <p className="text-slate-400 text-sm mt-1">Click &quot;Post New Job&quot; to create your first posting.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 text-base">{job.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {job.status === 'active' ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {job.location}
                          </span>
                          {job.experience_required && (
                            <span>{job.experience_required}</span>
                          )}
                          <span className="text-slate-400 text-xs">
                            Posted {new Date(job.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.description}</p>
                        {job.jd_url && (
                          <a
                            href={job.jd_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                            onClick={e => e.stopPropagation()}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            JD attached
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleJobStatus(job)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${job.status === 'active' ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                        >
                          {job.status === 'active' ? 'Close' : 'Reopen'}
                        </button>
                        <button
                          onClick={() => openEditJob(job)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {activeTab === 'logs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Email Logs</h2>
                <p className="text-sm text-slate-500 mt-0.5">History of candidate CVs sent to clients</p>
              </div>
              {logs.length > 0 && (
                <button
                  onClick={() => {
                    const headers = ['Date', 'Time', 'Sent To', 'Email', 'CC', 'Candidates', 'Assigned Client', 'Subject']
                    const rows = logs.map(log => {
                      const candidateNames = log.candidates.map(c => c.name).join('; ')
                      const assignedClients = log.candidates.map(c => {
                        const cand = candidates.find(x => x.id === c.id)
                        return cand?.client_id ? (clients.find(cl => cl.id === cand.client_id)?.name ?? '') : ''
                      }).filter(Boolean).join('; ')
                      return [
                        new Date(log.sent_at).toLocaleDateString('en-IN'),
                        new Date(log.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                        log.to_name,
                        log.to_email,
                        log.cc ?? '',
                        candidateNames,
                        assignedClients || 'Unassigned',
                        log.subject ?? '',
                      ]
                    })
                    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `email-logs-${new Date().toISOString().slice(0, 10)}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CSV
                </button>
              )}
            </div>

            {logsLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-500 font-medium">No emails sent yet</p>
                <p className="text-slate-400 text-sm mt-1">Logs will appear here after you send candidate profiles to a client.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Date & Time', 'Sent To', 'CC', 'Candidates', 'Assigned Client', 'Subject'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map(log => {
                        const assignedClients = [...new Set(
                          log.candidates
                            .map(c => candidates.find(x => x.id === c.id)?.client_id)
                            .filter(Boolean)
                            .map(cid => clients.find(cl => cl.id === cid)?.name)
                            .filter(Boolean)
                        )] as string[]

                        return (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                              <div className="font-medium text-slate-700">{new Date(log.sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              <div className="text-slate-400">{new Date(log.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{log.to_name}</div>
                              <div className="text-xs text-slate-400">{log.to_email}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              {log.cc ? (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {log.cc.split(',').map(e => e.trim()).filter(Boolean).map(email => (
                                    <span key={email} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                                      {email}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {log.candidates.map(c => (
                                  <span key={c.id} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {assignedClients.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {assignedClients.map(name => (
                                    <span key={name} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300">Unassigned</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 max-w-[200px]">
                              <div className="truncate text-xs" title={log.subject ?? ''}>{log.subject ?? '—'}</div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                  {logs.length} email{logs.length !== 1 ? 's' : ''} sent
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CLIENTS TAB ── */}
        {activeTab === 'clients' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Clients</h2>
                <p className="text-sm text-slate-500 mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={openNewClient}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Client
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-500 font-medium">No clients yet</p>
                <p className="text-slate-400 text-sm mt-1">Click &quot;Add Client&quot; to create your first client.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map(client => {
                  const assigned = candidates.filter(c => c.client_id === client.id)
                  return (
                    <div key={client.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-base shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {client.name}
                            {client.email
                              ? <span className="ml-2 text-xs font-normal text-indigo-500">🔑 {client.email}</span>
                              : <span className="ml-2 text-xs font-normal text-slate-300">no portal login</span>}
                          </p>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {assigned.length} candidate{assigned.length !== 1 ? 's' : ''} assigned
                            {assigned.length > 0 && (
                              <span className="ml-2 text-slate-300">·</span>
                            )}
                            {assigned.length > 0 && (
                              <span className="ml-2 text-xs text-slate-400">{assigned.map(c => c.full_name).slice(0, 3).join(', ')}{assigned.length > 3 ? ` +${assigned.length - 3} more` : ''}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">
                          Added {new Date(client.created_at).toLocaleDateString('en-IN')}
                        </span>
                        <button
                          onClick={() => openEditClient(client)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteClient(client.id, client.name)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── REQUIREMENTS TAB ── */}
        {activeTab === 'requirements' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Hiring Requirements</h2>
                <p className="text-sm text-slate-500 mt-0.5">Requirements submitted by companies via the portal</p>
              </div>
              {requirements.length > 0 && (
                <span className="text-sm text-slate-500">{requirements.length} total</span>
              )}
            </div>

            {reqLoading ? (
              <div className="text-center py-16 text-slate-400 text-sm">Loading...</div>
            ) : requirements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">No requirements yet</p>
                <p className="text-slate-400 text-sm mt-1">Share the <strong>/hire</strong> link with companies to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requirements.map(req => {
                  const REQ_STATUS_COLORS: Record<string, string> = {
                    new: 'bg-orange-100 text-orange-700',
                    in_progress: 'bg-indigo-100 text-indigo-700',
                    fulfilled: 'bg-emerald-100 text-emerald-700',
                    closed: 'bg-slate-100 text-slate-500',
                  }
                  return (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{req.job_title}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {req.company_name} &middot; {req.num_positions} position{req.num_positions !== 1 ? 's' : ''} &middot; {req.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${REQ_STATUS_COLORS[req.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {req.status.replace('_', ' ')}
                          </span>
                          <select
                            value={req.status}
                            disabled={updatingReqStatus === req.id}
                            onChange={async e => {
                              const newStatus = e.target.value as HiringRequirement['status']
                              setUpdatingReqStatus(req.id)
                              await supabase.from('hiring_requirements').update({ status: newStatus }).eq('id', req.id)
                              setRequirements(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus } : r))
                              setUpdatingReqStatus(null)
                            }}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="fulfilled">Fulfilled</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                        <div>
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Experience</span>
                          <p className="font-medium text-slate-800 mt-0.5">{req.experience_required}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Timeline</span>
                          <p className="font-medium text-slate-800 mt-0.5">{req.timeline}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Budget</span>
                          <p className="font-medium text-slate-800 mt-0.5">{req.budget_ctc || '—'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Received</span>
                          <p className="font-medium text-slate-800 mt-0.5">
                            {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Skills Required</span>
                        <p className="text-sm text-slate-700 mt-1">{req.skills_required}</p>
                      </div>

                      {req.notes && (
                        <div className="mb-3">
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Notes</span>
                          <p className="text-sm text-slate-700 mt-1">{req.notes}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 items-center">
                        <div>
                          <span className="text-xs text-slate-400">Contact: </span>
                          <span className="text-sm font-medium text-slate-800">{req.contact_name}</span>
                        </div>
                        <a href={`mailto:${req.contact_email}`} className="text-sm text-indigo-600 hover:underline">
                          {req.contact_email}
                        </a>
                        <a href={`tel:${req.contact_phone}`} className="text-sm text-indigo-600 hover:underline">
                          {req.contact_phone}
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CANDIDATES TAB ── */}
        {activeTab === 'candidates' && <>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Candidates', value: stats.total, color: 'text-indigo-600' },
            { label: 'New', value: stats.new, color: 'text-indigo-600' },
            { label: 'Shortlisted', value: stats.shortlisted, color: 'text-emerald-600' },
            { label: 'Placed', value: stats.placed, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, skills..."
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px] flex-1"
          />
          <select
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Clients</option>
            <option value="unassigned">Unassigned</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button
            onClick={exportCSV}
            className="ml-auto bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading candidates...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No candidates found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleCheckAll}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    {['Name', 'Contact', 'Experience', 'CTC (Current → Expected)', 'Notice Period', 'Skills', 'Resume', 'Applied For', 'Client', 'Client Decision', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(c => (
                    <tr
                      key={c.id}
                      className={`cursor-pointer transition-colors ${checkedIds.has(c.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                      onClick={() => setSelectedCandidate(c)}
                    >
                      <td className="px-4 py-3" onClick={e => toggleCheck(c.id, e)}>
                        <input
                          type="checkbox"
                          checked={checkedIds.has(c.id)}
                          onChange={() => {}}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {c.full_name}
                        {c.is_immediate_joiner && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Immediate</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <div>{c.email}</div>
                        <div className="text-xs">{c.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.total_experience}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {c.current_ctc} → {c.expected_ctc} LPA
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.notice_period}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[160px]">
                        <div className="truncate" title={c.skills}>{c.skills}</div>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {c.resume_url ? (
                          <a
                            href={c.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Resume
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {getAppliedJobs(c.email).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {getAppliedJobs(c.email).map(title => (
                              <span key={title} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full whitespace-nowrap">{title}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.client_id ?? ''}
                          onChange={e => assignClient(c.id, e.target.value || null)}
                          disabled={assigningClient === c.id}
                          className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        >
                          <option value="">Unassigned</option>
                          {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.client_id ? (
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${CLIENT_DECISION_COLORS[c.client_status ?? 'pending']}`}
                            title="The client's decision from their portal">
                            {clientDecisionLabel(c.client_status)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={e => updateStatus(c.id, e.target.value)}
                          disabled={updatingStatus === c.id}
                          className={`rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 border-0 ${STATUS_COLORS[c.status]}`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(c.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {candidates.length} candidates
          </div>
        </div>
        </>}
      </div>

      {/* Client modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowClientModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveClient()}
                  placeholder="e.g. Tata Projects, L&T, etc."
                  autoFocus
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Portal Login Email <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveClient()}
                  placeholder="hr@company.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">The company logs into their portal with this email to view their assigned candidates.</p>
              </div>
              {clientError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{clientError}</p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowClientModal(false)}
                className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveClient}
                disabled={clientSaving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {clientSaving ? 'Saving...' : editingClient ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowJobModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{editingJob ? 'Edit Job Posting' : 'Post New Job'}</h2>
              <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                <input
                  value={jobForm.title}
                  onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Senior Civil Engineer"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                <input
                  value={jobForm.location}
                  onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience Required <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  value={jobForm.experience_required}
                  onChange={e => setJobForm(f => ({ ...f, experience_required: e.target.value }))}
                  placeholder="e.g. 5-8 years"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Description *</label>
                <textarea
                  value={jobForm.description}
                  onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))}
                  rows={6}
                  placeholder="Describe the role, responsibilities, required skills, qualifications..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  JD File <span className="text-slate-400 font-normal">(optional — PDF or DOCX, max 5 MB)</span>
                </label>
                {editingJob?.jd_url && !jdFile && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <a href={editingJob.jd_url} target="_blank" rel="noopener noreferrer" className="underline truncate">Current JD attached</a>
                    <span className="text-slate-400 ml-auto shrink-0">Upload new to replace</span>
                  </div>
                )}
                <label className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-lg px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                  <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-slate-500">
                    {jdFile ? jdFile.name : 'Click to upload JD (PDF / DOCX)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] ?? null
                      if (f && f.size > 5 * 1024 * 1024) {
                        setJobError('JD file must be under 5 MB.')
                        return
                      }
                      setJdFile(f)
                      setJobError('')
                    }}
                  />
                </label>
                {jdFile && (
                  <button
                    type="button"
                    onClick={() => setJdFile(null)}
                    className="mt-1 text-xs text-red-500 hover:text-red-700"
                  >
                    Remove selected file
                  </button>
                )}
              </div>
              {jobError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{jobError}</p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowJobModal(false)}
                className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveJob}
                disabled={jobSaving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {jobSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving...
                  </>
                ) : editingJob ? 'Save Changes' : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating action bar when candidates are selected */}
      {someChecked && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{checkedIds.size} candidate{checkedIds.size > 1 ? 's' : ''} selected</span>
          <button
            onClick={() => setShowEmailModal(true)}
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send to Client
          </button>
          <button
            onClick={() => setCheckedIds(new Set())}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Email modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Send Candidate Profiles</h2>
                <p className="text-sm text-slate-500 mt-0.5">{checkedIds.size} candidate{checkedIds.size > 1 ? 's' : ''} selected</p>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Selected candidates chips */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Selected Candidates</p>
                <div className="flex flex-wrap gap-2">
                  {candidates.filter(c => checkedIds.has(c.id)).map(c => (
                    <span key={c.id} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
                      {c.full_name}
                      {c.resume_url && (
                        <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <button onClick={() => removeFromEmail(c.id)} className="text-indigo-400 hover:text-indigo-700 leading-none">×</button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  <svg className="w-3 h-3 inline text-emerald-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Green icon = resume will be attached
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                  <input
                    value={emailForm.toName}
                    onChange={e => setEmailForm(f => ({ ...f, toName: e.target.value }))}
                    placeholder="Hiring Manager"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client Email *</label>
                  <input
                    type="email"
                    value={emailForm.toEmail}
                    onChange={e => setEmailForm(f => ({ ...f, toEmail: e.target.value }))}
                    placeholder="client@company.com"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CC <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={emailForm.cc}
                  onChange={e => setEmailForm(f => ({ ...f, cc: e.target.value }))}
                  placeholder="colleague@matchwork.in, another@company.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple emails with commas.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Subject</label>
                <input
                  value={emailForm.subject}
                  onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Note <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  value={emailForm.customNote}
                  onChange={e => setEmailForm(f => ({ ...f, customNote: e.target.value }))}
                  rows={3}
                  placeholder="Add a personal note or context for the client..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 flex items-start gap-2">
                <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Email will be sent from your configured Gmail account. Resumes (where uploaded) will be attached automatically.
              </div>

              {emailResult.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {emailResult.error}
                </div>
              )}
              {emailResult.success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {emailResult.success}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={emailSending || !emailForm.toEmail || !emailForm.toName || checkedIds.size === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {emailSending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate detail drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedCandidate(null)}>
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Candidate Details</h2>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg">
                  {selectedCandidate.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedCandidate.full_name}</p>
                  <p className="text-sm text-slate-500">{selectedCandidate.current_company || 'No company listed'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedCandidate.status]}`}>
                  {selectedCandidate.status.charAt(0).toUpperCase() + selectedCandidate.status.slice(1)}
                </span>
                {selectedCandidate.client_id && (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${CLIENT_DECISION_COLORS[selectedCandidate.client_status ?? 'pending']}`}
                    title="The client's decision from their portal">
                    Client: {clientDecisionLabel(selectedCandidate.client_status)}
                  </span>
                )}
              </div>

              {[
                { label: 'Email', value: selectedCandidate.email },
                { label: 'Phone', value: selectedCandidate.phone },
                ...(selectedCandidate.alt_phone ? [{ label: 'Alt Phone', value: selectedCandidate.alt_phone }] : []),
                { label: 'Experience', value: selectedCandidate.total_experience },
                { label: 'Current CTC', value: `${selectedCandidate.current_ctc} LPA` },
                { label: 'Expected CTC', value: `${selectedCandidate.expected_ctc} LPA` },
                { label: 'Notice Period', value: selectedCandidate.notice_period },
                { label: 'Immediate Joiner', value: selectedCandidate.is_immediate_joiner ? 'Yes' : 'No' },
                { label: 'Ready to Relocate', value: selectedCandidate.ready_to_relocate ? 'Yes' : 'No' },
                { label: 'Education', value: selectedCandidate.education_type || 'Not specified' },
                { label: 'Institution', value: selectedCandidate.education_institution || 'Not specified' },
                { label: 'Current Location', value: selectedCandidate.current_location },
                { label: 'Preferred Location', value: selectedCandidate.preferred_location || 'Not specified' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">{value}</span>
                </div>
              ))}
              {selectedCandidate.linkedin_url && (
                <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500">LinkedIn</span>
                  <a
                    href={selectedCandidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-right max-w-[200px] truncate"
                  >
                    View Profile
                  </a>
                </div>
              )}

              <div className="py-2 border-b border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Skills</p>
                <p className="text-sm text-slate-800">{selectedCandidate.skills}</p>
              </div>

              {getAppliedJobs(selectedCandidate.email).length > 0 && (
                <div className="py-2 border-b border-slate-100">
                  <p className="text-sm text-slate-500 mb-1.5">Applied For</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getAppliedJobs(selectedCandidate.email).map(title => (
                      <span key={title} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">{title}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.resume_url ? (
                <a
                  href={selectedCandidate.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Resume
                </a>
              ) : (
                <p className="text-sm text-slate-400 italic">No resume uploaded</p>
              )}

              <div className="pt-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">Assign Client</label>
                <select
                  value={selectedCandidate.client_id ?? ''}
                  onChange={e => assignClient(selectedCandidate.id, e.target.value || null)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedCandidate.id, s)}
                      disabled={updatingStatus === selectedCandidate.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedCandidate.status === s
                          ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-indigo-400'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-400 pt-2">
                Submitted on {new Date(selectedCandidate.created_at).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

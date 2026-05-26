'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Candidate, type Client, type Job } from '@/lib/supabase'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  screening: 'bg-yellow-100 text-yellow-700',
  shortlisted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  placed: 'bg-purple-100 text-purple-700',
}

const STATUS_OPTIONS = ['new', 'screening', 'shortlisted', 'rejected', 'placed']

const INITIAL_EMAIL = {
  toEmail: '',
  toName: '',
  subject: 'Candidate Profiles — RSD Consultancy',
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
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs'>('candidates')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [clients, setClients] = useState<Client[]>([])
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

  // applications
  const [applications, setApplications] = useState<{ candidate_email: string; job_id: string }[]>([])
  const [jobsMap, setJobsMap] = useState<Record<string, string>>({})

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin/login')
  }, [router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: cands }, { data: cls }, { data: jobRows }, { data: appRows }] = await Promise.all([
      supabase.from('candidates').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
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
    checkAuth()
    fetchData()
  }, [checkAuth, fetchData])

  useEffect(() => {
    if (activeTab === 'jobs') fetchJobs()
  }, [activeTab, fetchJobs])

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
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Current CTC', 'Expected CTC', 'Notice Period', 'Immediate Joiner', 'Experience', 'Skills', 'Location', 'Status', 'Client', 'Submitted On']
    const rows = filtered.map(c => [
      c.full_name, c.email, c.phone, c.current_company ?? '',
      c.current_ctc, c.expected_ctc, c.notice_period,
      c.is_immediate_joiner ? 'Yes' : 'No',
      c.total_experience, c.skills, c.current_location,
      c.status,
      clients.find(cl => cl.id === c.client_id)?.name ?? 'Unassigned',
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
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-gray-900">RSD Consultancy</span>
            <span className="text-gray-400 text-sm ml-1">/ Admin</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-2">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'candidates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Candidates
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'jobs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Jobs
              {jobs.filter(j => j.status === 'active').length > 0 && (
                <span className="ml-1.5 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                  {jobs.filter(j => j.status === 'active').length}
                </span>
              )}
            </button>
          </div>
        </div>
        <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          Sign out
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── JOBS TAB ── */}
        {activeTab === 'jobs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Job Postings</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {jobs.filter(j => j.status === 'active').length} active · {jobs.filter(j => j.status === 'closed').length} closed
                </p>
              </div>
              <button
                onClick={openNewJob}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post New Job
              </button>
            </div>

            {jobsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 font-medium">No job postings yet</p>
                <p className="text-gray-400 text-sm mt-1">Click &quot;Post New Job&quot; to create your first posting.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-base">{job.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {job.status === 'active' ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {job.location}
                          </span>
                          {job.experience_required && (
                            <span>{job.experience_required}</span>
                          )}
                          <span className="text-gray-400 text-xs">
                            Posted {new Date(job.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{job.description}</p>
                        {job.jd_url && (
                          <a
                            href={job.jd_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800"
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
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${job.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                        >
                          {job.status === 'active' ? 'Close' : 'Reopen'}
                        </button>
                        <button
                          onClick={() => openEditJob(job)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
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

        {/* ── CANDIDATES TAB ── */}
        {activeTab === 'candidates' && <>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Candidates', value: stats.total, color: 'text-blue-600' },
            { label: 'New', value: stats.new, color: 'text-blue-600' },
            { label: 'Shortlisted', value: stats.shortlisted, color: 'text-green-600' },
            { label: 'Placed', value: stats.placed, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, skills..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px] flex-1"
          />
          <select
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Clients</option>
            <option value="unassigned">Unassigned</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button
            onClick={exportCSV}
            className="ml-auto bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading candidates...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No candidates found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleCheckAll}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    {['Name', 'Contact', 'Experience', 'CTC (Current → Expected)', 'Notice Period', 'Skills', 'Resume', 'Applied For', 'Client', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(c => (
                    <tr
                      key={c.id}
                      className={`cursor-pointer transition-colors ${checkedIds.has(c.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedCandidate(c)}
                    >
                      <td className="px-4 py-3" onClick={e => toggleCheck(c.id, e)}>
                        <input
                          type="checkbox"
                          checked={checkedIds.has(c.id)}
                          onChange={() => {}}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {c.full_name}
                        {c.is_immediate_joiner && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Immediate</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div>{c.email}</div>
                        <div className="text-xs">{c.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.total_experience}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {c.current_ctc} → {c.expected_ctc} LPA
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.notice_period}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                        <div className="truncate" title={c.skills}>{c.skills}</div>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {c.resume_url ? (
                          <a
                            href={c.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Resume
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
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
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.client_id ?? ''}
                          onChange={e => assignClient(c.id, e.target.value || null)}
                          disabled={assigningClient === c.id}
                          className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Unassigned</option>
                          {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={e => updateStatus(c.id, e.target.value)}
                          disabled={updatingStatus === c.id}
                          className={`rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 border-0 ${STATUS_COLORS[c.status]}`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                        {new Date(c.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {candidates.length} candidates
          </div>
        </div>
        </>}
      </div>

      {/* Job modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowJobModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingJob ? 'Edit Job Posting' : 'Post New Job'}</h2>
              <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  value={jobForm.title}
                  onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Senior Civil Engineer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  value={jobForm.location}
                  onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Required <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={jobForm.experience_required}
                  onChange={e => setJobForm(f => ({ ...f, experience_required: e.target.value }))}
                  placeholder="e.g. 5-8 years"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                <textarea
                  value={jobForm.description}
                  onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))}
                  rows={6}
                  placeholder="Describe the role, responsibilities, required skills, qualifications..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  JD File <span className="text-gray-400 font-normal">(optional — PDF or DOCX, max 5 MB)</span>
                </label>
                {editingJob?.jd_url && !jdFile && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <a href={editingJob.jd_url} target="_blank" rel="noopener noreferrer" className="underline truncate">Current JD attached</a>
                    <span className="text-gray-400 ml-auto shrink-0">Upload new to replace</span>
                  </div>
                )}
                <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-gray-500">
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
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveJob}
                disabled={jobSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{checkedIds.size} candidate{checkedIds.size > 1 ? 's' : ''} selected</span>
          <button
            onClick={() => setShowEmailModal(true)}
            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send to Client
          </button>
          <button
            onClick={() => setCheckedIds(new Set())}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Email modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Send Candidate Profiles</h2>
                <p className="text-sm text-gray-500 mt-0.5">{checkedIds.size} candidate{checkedIds.size > 1 ? 's' : ''} selected</p>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Selected candidates chips */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected Candidates</p>
                <div className="flex flex-wrap gap-2">
                  {candidates.filter(c => checkedIds.has(c.id)).map(c => (
                    <span key={c.id} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {c.full_name}
                      {c.resume_url && (
                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <button onClick={() => removeFromEmail(c.id)} className="text-blue-400 hover:text-blue-700 leading-none">×</button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  <svg className="w-3 h-3 inline text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Green icon = resume will be attached
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                  <input
                    value={emailForm.toName}
                    onChange={e => setEmailForm(f => ({ ...f, toName: e.target.value }))}
                    placeholder="Hiring Manager"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Email *</label>
                  <input
                    type="email"
                    value={emailForm.toEmail}
                    onChange={e => setEmailForm(f => ({ ...f, toEmail: e.target.value }))}
                    placeholder="client@company.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                <input
                  value={emailForm.subject}
                  onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Note <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={emailForm.customNote}
                  onChange={e => setEmailForm(f => ({ ...f, customNote: e.target.value }))}
                  rows={3}
                  placeholder="Add a personal note or context for the client..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
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
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={emailSending || !emailForm.toEmail || !emailForm.toName || checkedIds.size === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
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
              <h2 className="text-lg font-semibold text-gray-900">Candidate Details</h2>
              <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {selectedCandidate.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedCandidate.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedCandidate.current_company || 'No company listed'}</p>
                </div>
              </div>

              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedCandidate.status]}`}>
                {selectedCandidate.status.charAt(0).toUpperCase() + selectedCandidate.status.slice(1)}
              </span>

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
                <div key={label} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-[200px]">{value}</span>
                </div>
              ))}
              {selectedCandidate.linkedin_url && (
                <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-500">LinkedIn</span>
                  <a
                    href={selectedCandidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-right max-w-[200px] truncate"
                  >
                    View Profile
                  </a>
                </div>
              )}

              <div className="py-2 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Skills</p>
                <p className="text-sm text-gray-800">{selectedCandidate.skills}</p>
              </div>

              {getAppliedJobs(selectedCandidate.email).length > 0 && (
                <div className="py-2 border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-1.5">Applied For</p>
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
                  className="flex items-center gap-2 w-full border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Resume
                </a>
              ) : (
                <p className="text-sm text-gray-400 italic">No resume uploaded</p>
              )}

              <div className="pt-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Assign Client</label>
                <select
                  value={selectedCandidate.client_id ?? ''}
                  onChange={e => assignClient(selectedCandidate.id, e.target.value || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedCandidate.id, s)}
                      disabled={updatingStatus === selectedCandidate.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedCandidate.status === s
                          ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-blue-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400 pt-2">
                Submitted on {new Date(selectedCandidate.created_at).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

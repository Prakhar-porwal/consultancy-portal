'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'

const NOTICE_PERIOD_OPTIONS = [
  'Immediate',
  '15 days',
  '1 month',
  '2 months',
  '3 months',
  'More than 3 months',
]

const EXPERIENCE_OPTIONS = [
  '4 years', '5 years', '6 years', '7 years', '8 years', '9 years',
  '10 years', '11 years', '12 years', '13 years', '14 years', '15 years',
  '16-18 years', '18-20 years', '20+ years',
]

const SKILL_GROUPS = [
  {
    label: 'Civil & Structural',
    skills: [
      'AutoCAD', 'Revit', 'Civil 3D', 'STAAD Pro', 'ETABS', 'SAP2000',
      'Structural Design', 'RCC Design', 'Steel Design', 'Foundation Design',
      'Road Design', 'Drainage Design', 'Highway Engineering',
      'Geotechnical Engineering', 'Water Supply & Sanitation',
      'Surveying', 'Soil Testing', 'Building Construction', 'Waterproofing',
    ],
  },
  {
    label: 'QA / QC',
    skills: [
      'Quality Control', 'Quality Assurance', 'QA/QC Management',
      'NDT (Non-Destructive Testing)', 'Material Testing', 'Concrete Mix Design',
      'Lab Testing', 'Field Testing', 'Third Party Inspection',
      'IS Codes', 'IRC Codes', 'Inspection & Test Plan (ITP)',
      'Method Statements', 'As-Built Documentation', 'Punch List Management',
    ],
  },
  {
    label: 'Project & Contracts',
    skills: [
      'Project Management', 'Site Supervision', 'Quantity Surveying',
      'Estimation & Costing', 'BOQ Preparation', 'Billing',
      'Tender Documentation', 'Contract Management', 'MEP Coordination',
      'Primavera P6', 'MS Project',
    ],
  },
  {
    label: 'Electronics & Electrical',
    skills: [
      'AutoCAD Electrical', 'PLC Programming', 'SCADA', 'HMI',
      'Panel Design', 'Electrical Estimation', 'Load Calculation',
      'Single Line Diagram', 'Cable Tray Design', 'Switchgear',
      'Motor Control Center (MCC)', 'Power Distribution',
      'Substation Design', 'Earthing & Lightning Protection',
      'Protection & Relay', 'Instrumentation', 'DCS', 'VFD / Drives',
      'Low Voltage Systems', 'MEP Design',
    ],
  },
]

const EDUCATION_OPTIONS = [
  'Graduation (B.E. / B.Tech / B.Sc / B.Com / etc.)',
  'Diploma',
  'Post Graduation (M.E. / M.Tech / MBA / etc.)',
  'Other',
]

type FormData = {
  full_name: string
  email: string
  phone: string
  alt_phone: string
  linkedin_url: string
  ready_to_relocate: string
  education_type: string
  education_institution: string
  current_company: string
  current_ctc: string
  expected_ctc: string
  notice_period: string
  is_immediate_joiner: boolean
  total_experience: string
  skills: string
  current_location: string
  preferred_location: string
}

const INITIAL: FormData = {
  full_name: '', email: '', phone: '', alt_phone: '', linkedin_url: '',
  ready_to_relocate: '', education_type: '', education_institution: '',
  current_company: '', current_ctc: '', expected_ctc: '', notice_period: '',
  is_immediate_joiner: false, total_experience: '', skills: '',
  current_location: '', preferred_location: '',
}

type FieldErrors = Partial<Record<keyof FormData | 'resume', string>>

function validate(form: FormData, resumeFile: File | null): FieldErrors {
  const e: FieldErrors = {}
  if (!form.full_name.trim()) e.full_name = 'Full name is required.'
  else if (form.full_name.trim().length < 2) e.full_name = 'Name must be at least 2 characters.'
  else if (!/^[a-zA-Z\s.'-]+$/.test(form.full_name.trim())) e.full_name = "Name can only contain letters, spaces, and . ' -"

  if (!form.email.trim()) e.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.'

  if (!form.phone.trim()) e.phone = 'Phone number is required.'
  else {
    const digits = form.phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '')
    if (!/^[6-9]\d{9}$/.test(digits)) e.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6–9).'
  }

  if (form.alt_phone.trim()) {
    const digits = form.alt_phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '')
    if (!/^[6-9]\d{9}$/.test(digits)) e.alt_phone = 'Enter a valid 10-digit Indian mobile number.'
  }

  if (form.linkedin_url.trim() && !/^https?:\/\/(www\.)?linkedin\.com\//.test(form.linkedin_url.trim()))
    e.linkedin_url = 'Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourname).'

  if (!form.ready_to_relocate) e.ready_to_relocate = 'Please select an option.'
  if (!form.education_type) e.education_type = 'Please select your education.'
  if (!form.education_institution.trim()) e.education_institution = 'Please enter your college / university / institution name.'

  if (!form.current_location.trim()) e.current_location = 'Current location is required.'
  else if (form.current_location.trim().length < 2) e.current_location = 'Enter a valid location.'

  if (!form.total_experience) e.total_experience = 'Please select your experience.'

  if (!form.current_ctc) e.current_ctc = 'Current CTC is required.'
  else if (isNaN(parseFloat(form.current_ctc)) || parseFloat(form.current_ctc) < 0) e.current_ctc = 'Enter a valid CTC (0 or above).'

  if (!form.expected_ctc) e.expected_ctc = 'Expected CTC is required.'
  else if (isNaN(parseFloat(form.expected_ctc)) || parseFloat(form.expected_ctc) <= 0) e.expected_ctc = 'Expected CTC must be greater than 0.'

  if (!form.notice_period) e.notice_period = 'Please select a notice period.'

  if (!form.skills.trim()) e.skills = 'Please list at least one skill.'
  else if (form.skills.trim().length < 2) e.skills = 'Skills are too short.'

  if (!resumeFile) e.resume = 'Please upload your resume.'
  else if (resumeFile.size > 5 * 1024 * 1024) e.resume = 'File must be under 5 MB.'

  return e
}

const ALL_SKILLS = SKILL_GROUPS.flatMap(g => g.skills)

export default function CandidateForm() {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormData | 'resume', boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [skillQuery, setSkillQuery] = useState('')
  const [serverError, setServerError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    const updated = { ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }
    setForm(updated)
    if (submitAttempted) setErrors(validate(updated, resumeFile))
    else if (touched[name as keyof FormData]) {
      const allErrors = validate(updated, resumeFile)
      setErrors(prev => ({ ...prev, [name]: allErrors[name as keyof typeof allErrors] }))
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = e.target.name as keyof FormData
    setTouched(prev => ({ ...prev, [name]: true }))
    const allErrors = validate(form, resumeFile)
    setErrors(prev => ({ ...prev, [name]: allErrors[name as keyof typeof allErrors] }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setResumeFile(file)
    setErrors(prev => ({ ...prev, resume: validate(form, file).resume }))
    setTouched(prev => ({ ...prev, resume: true }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitAttempted(true)
    const errs = validate(form, resumeFile)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setServerError('')
    setLoading(true)
    try {
      let resume_url: string | null = null
      if (resumeFile) {
        setUploadProgress('Uploading resume...')
        const ext = resumeFile.name.split('.').pop()
        const fileName = `${Date.now()}_${form.full_name.replace(/\s+/g, '_')}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('resumes').upload(fileName, resumeFile, { upsert: false })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName)
        resume_url = urlData.publicUrl
        setUploadProgress('Saving details...')
      }

      const { error: dbError } = await supabase.from('candidates').insert({
        ...form,
        current_ctc: parseFloat(form.current_ctc),
        expected_ctc: parseFloat(form.expected_ctc),
        ready_to_relocate: form.ready_to_relocate === 'yes',
        alt_phone: form.alt_phone.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        resume_url,
        status: 'new',
      })
      if (dbError) throw dbError
      setSubmitted(true)
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg px-10 py-12 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Thank You!</h2>
          <p className="text-slate-500 leading-relaxed mb-2">
            Your application has been successfully submitted to <span className="font-semibold text-slate-700">matchwork</span>.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our team will carefully review your profile and reach out to you shortly if there is a suitable opportunity.
          </p>
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <Link
              href="/candidate/login"
              className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              View Available Jobs
            </Link>
            <p className="text-xs text-slate-400">For queries, contact us at</p>
            <p className="text-sm font-medium text-indigo-600">support@matchwork.in</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 py-10 px-4">
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <Link
          href="/candidate/login"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Candidate Login
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Join matchwork</h1>
          <p className="text-slate-500 mt-1">Submit your profile to explore exciting opportunities</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <h2 className="text-xl font-semibold text-slate-800 border-b pb-3">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name *" error={errors.full_name}>
              <input name="full_name" value={form.full_name} onChange={handleChange} onBlur={handleBlur}
                placeholder="John Doe" className={ic(errors.full_name)} />
            </Field>
            <Field label="Email Address *" error={errors.email}>
              <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur}
                placeholder="john@example.com" className={ic(errors.email)} />
            </Field>
            <Field label="Phone Number *" error={errors.phone}>
              <input name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur}
                placeholder="+91 9876543210" maxLength={13} className={ic(errors.phone)} />
            </Field>
            <Field label="Alternative Phone" error={errors.alt_phone}>
              <input name="alt_phone" value={form.alt_phone} onChange={handleChange} onBlur={handleBlur}
                placeholder="+91 9876543210 (optional)" maxLength={13} className={ic(errors.alt_phone)} />
            </Field>
            <Field label="LinkedIn Profile URL" error={errors.linkedin_url}>
              <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} onBlur={handleBlur}
                placeholder="https://linkedin.com/in/yourname" className={ic(errors.linkedin_url)} />
            </Field>
            <Field label="Current Company">
              <input name="current_company" value={form.current_company} onChange={handleChange} onBlur={handleBlur}
                placeholder="Infosys, TCS, etc." className={ic()} />
            </Field>
            <Field label="Ready to Relocate *" error={errors.ready_to_relocate}>
              <select name="ready_to_relocate" value={form.ready_to_relocate} onChange={handleChange} onBlur={handleBlur} className={ic(errors.ready_to_relocate)}>
                <option value="">Select option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Education *" error={errors.education_type}>
              <select name="education_type" value={form.education_type} onChange={handleChange} onBlur={handleBlur} className={ic(errors.education_type)}>
                <option value="">Select education</option>
                {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="College / University / Institution *" error={errors.education_institution}>
                <input name="education_institution" value={form.education_institution} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. IIT Bombay, VJTI, Government Polytechnic" className={ic(errors.education_institution)} />
              </Field>
            </div>
            <Field label="Current Location *" error={errors.current_location}>
              <input name="current_location" value={form.current_location} onChange={handleChange} onBlur={handleBlur}
                placeholder="Mumbai, Maharashtra" className={ic(errors.current_location)} />
            </Field>
            <Field label="Preferred Location">
              <input name="preferred_location" value={form.preferred_location} onChange={handleChange} onBlur={handleBlur}
                placeholder="Bangalore, Pune, etc." className={ic()} />
            </Field>
          </div>

          <h2 className="text-xl font-semibold text-slate-800 border-b pb-3 pt-2">Professional Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Total Experience *" error={errors.total_experience}>
              <select name="total_experience" value={form.total_experience} onChange={handleChange} onBlur={handleBlur} className={ic(errors.total_experience)}>
                <option value="">Select experience</option>
                {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Current CTC (LPA) *" error={errors.current_ctc}>
              <input name="current_ctc" type="number" min="0" step="0.1"
                value={form.current_ctc} onChange={handleChange} onBlur={handleBlur}
                className={ic(errors.current_ctc)} />
            </Field>
            <Field label="Expected CTC (LPA) *" error={errors.expected_ctc}>
              <input name="expected_ctc" type="number" min="0" step="0.1"
                value={form.expected_ctc} onChange={handleChange} onBlur={handleBlur}
                className={ic(errors.expected_ctc)} />
            </Field>
            <Field label="Notice Period *" error={errors.notice_period}>
              <select name="notice_period" value={form.notice_period} onChange={handleChange} onBlur={handleBlur} className={ic(errors.notice_period)}>
                <option value="">Select notice period</option>
                {NOTICE_PERIOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-3 bg-indigo-50 rounded-lg p-4">
            <input type="checkbox" id="is_immediate_joiner" name="is_immediate_joiner"
              checked={form.is_immediate_joiner} onChange={handleChange}
              className="w-5 h-5 accent-indigo-600 cursor-pointer" />
            <label htmlFor="is_immediate_joiner" className="text-slate-700 font-medium cursor-pointer">
              I am an immediate joiner / can join within 15 days
            </label>
          </div>

          <Field label="Key Skills *" error={errors.skills}>
            {form.skills.trim() && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                  <span key={skill} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">
                    {skill}
                    <button type="button"
                      onClick={() => {
                        const updated = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(s => s.toLowerCase() !== skill.toLowerCase()).join(', ') }
                        setForm(updated)
                        if (submitAttempted || touched.skills) setErrors(prev => ({ ...prev, skills: validate(updated, resumeFile).skills }))
                      }}
                      className="text-indigo-400 hover:text-indigo-700 leading-none ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input type="text" value={skillQuery}
                onChange={e => setSkillQuery(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && skillQuery.trim()) {
                    e.preventDefault()
                    const newSkill = skillQuery.trim().replace(/,$/, '')
                    if (!newSkill) return
                    const added = form.skills.split(',').map(s => s.trim().toLowerCase())
                    if (added.includes(newSkill.toLowerCase())) { setSkillQuery(''); return }
                    const updated = { ...form, skills: form.skills.trim() ? `${form.skills.trim()}, ${newSkill}` : newSkill }
                    setForm(updated)
                    setSkillQuery('')
                    if (submitAttempted || touched.skills) setErrors(prev => ({ ...prev, skills: validate(updated, resumeFile).skills }))
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setSkillQuery(''), 150)
                  setTouched(prev => ({ ...prev, skills: true }))
                  setErrors(prev => ({ ...prev, skills: validate(form, resumeFile).skills }))
                }}
                placeholder="Type to search or add custom skill, press Enter to add"
                className={ic(errors.skills)} />
              {skillQuery.trim().length >= 1 && (() => {
                const q = skillQuery.toLowerCase()
                const added = form.skills.split(',').map(s => s.trim().toLowerCase())
                const matches = ALL_SKILLS.filter(s => s.toLowerCase().includes(q) && !added.includes(s.toLowerCase()))
                if (!matches.length) return null
                return (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {matches.map(skill => (
                      <button key={skill} type="button"
                        onMouseDown={() => {
                          const updated = { ...form, skills: form.skills.trim() ? `${form.skills.trim()}, ${skill}` : skill }
                          setForm(updated)
                          setSkillQuery('')
                          if (submitAttempted || touched.skills) setErrors(prev => ({ ...prev, skills: validate(updated, resumeFile).skills }))
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                        {skill}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Search and select skills, or type them separated by commas</p>
          </Field>

          <Field label="Resume * (PDF or DOCX, max 5 MB)" error={errors.resume}>
            <div className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${errors.resume ? 'border-red-400 bg-red-50' : resumeFile ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
              <input type="file" accept=".pdf,.docx" onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {resumeFile ? (
                <div className="flex items-center justify-center gap-2 text-indigo-700">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium truncate max-w-[260px]">{resumeFile.name}</span>
                  <button type="button"
                    onClick={e => { e.stopPropagation(); setResumeFile(null); setErrors(v => ({ ...v, resume: undefined })) }}
                    className="ml-1 text-slate-400 hover:text-red-500 shrink-0">✕</button>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">
                  <svg className="w-8 h-8 mx-auto mb-1 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                  <p className="text-xs text-slate-400 mt-0.5">PDF or DOCX, up to 5 MB</p>
                </div>
              )}
            </div>
          </Field>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{serverError}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-lg transition-colors text-lg">
            {loading ? (uploadProgress || 'Submitting...') : 'Submit Application'}
          </button>

          <p className="text-center text-xs text-slate-400">
            Your information is confidential and will only be shared with relevant clients.
          </p>
        </form>
      </div>
    </main>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  )
}

function ic(error?: string) {
  return `border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent w-full bg-white ${
    error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-indigo-500'
  }`
}

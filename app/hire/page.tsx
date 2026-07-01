'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const EXPERIENCE_OPTIONS = [
  '1-2 years', '2-4 years', '4-6 years', '6-8 years', '8-10 years',
  '10-15 years', '15+ years', 'Any',
]

const TIMELINE_OPTIONS = [
  'Immediately (within 1 week)',
  'Within 15 days',
  'Within 1 month',
  'Within 2 months',
  'Within 3 months',
  'Flexible',
]

type FormData = {
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  job_title: string
  num_positions: string
  experience_required: string
  skills_required: string
  location: string
  budget_ctc: string
  timeline: string
  notes: string
}

const INITIAL: FormData = {
  company_name: '', contact_name: '', contact_email: '', contact_phone: '',
  job_title: '', num_positions: '1', experience_required: '',
  skills_required: '', location: '', budget_ctc: '', timeline: '', notes: '',
}

type FieldErrors = Partial<Record<keyof FormData, string>>

function validate(form: FormData): FieldErrors {
  const e: FieldErrors = {}

  if (!form.company_name.trim()) e.company_name = 'Company name is required.'
  if (!form.contact_name.trim()) e.contact_name = 'Contact person name is required.'

  if (!form.contact_email.trim()) e.contact_email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())) e.contact_email = 'Enter a valid email address.'

  if (!form.contact_phone.trim()) e.contact_phone = 'Phone number is required.'
  else {
    const digits = form.contact_phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '')
    if (!/^[6-9]\d{9}$/.test(digits)) e.contact_phone = 'Enter a valid 10-digit Indian mobile number.'
  }

  if (!form.job_title.trim()) e.job_title = 'Job title / role is required.'

  if (!form.num_positions || parseInt(form.num_positions) < 1)
    e.num_positions = 'Enter number of positions (minimum 1).'

  if (!form.experience_required) e.experience_required = 'Please select experience required.'
  if (!form.skills_required.trim()) e.skills_required = 'Please mention required skills.'
  if (!form.location.trim()) e.location = 'Job location is required.'
  if (!form.timeline) e.timeline = 'Please select a hiring timeline.'

  return e
}

export default function HirePage() {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (submitAttempted) setErrors(validate(updated))
    else if (touched[name as keyof FormData]) {
      const allErrors = validate(updated)
      setErrors(prev => ({ ...prev, [name]: allErrors[name as keyof typeof allErrors] }))
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = e.target.name as keyof FormData
    setTouched(prev => ({ ...prev, [name]: true }))
    const allErrors = validate(form)
    setErrors(prev => ({ ...prev, [name]: allErrors[name as keyof typeof allErrors] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitAttempted(true)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setServerError('')
    setLoading(true)
    try {
      const { error } = await supabase.from('hiring_requirements').insert({
        ...form,
        num_positions: parseInt(form.num_positions),
        budget_ctc: form.budget_ctc.trim() || null,
        notes: form.notes.trim() || null,
      })
      if (error) throw error
      setSubmitted(true)
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg px-10 py-12 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Requirement Received!</h2>
          <p className="text-gray-500 leading-relaxed mb-2">
            Thank you, <span className="font-semibold text-gray-700">{form.contact_name}</span>. We&apos;ve received your hiring requirement for{' '}
            <span className="font-semibold text-gray-700">{form.job_title}</span>.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Our team will review your requirement and get back to you with shortlisted candidates within <strong>48–72 hours</strong>.
          </p>
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-400">For urgent requirements, contact us directly:</p>
            <a href="mailto:support@matchwork.in" className="text-sm font-medium text-blue-600 block hover:underline">
              support@matchwork.in
            </a>
            <Link
              href="/"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors mt-2"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      {/* Navbar */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-gray-800">matchwork</span>
        </Link>
        <Link
          href="/apply"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          Register as Candidate →
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            For Companies / Employers
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Post a Hiring Requirement</h1>
          <p className="text-gray-500 mt-2">
            Tell us what you need — we&apos;ll deliver shortlisted candidates in <strong>48–72 hours</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">

          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Company & Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Company Name *" error={errors.company_name}>
                <input name="company_name" value={form.company_name} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. ABC Infrastructure Pvt. Ltd." className={ic(errors.company_name)} />
              </Field>
            </div>
            <Field label="Contact Person Name *" error={errors.contact_name}>
              <input name="contact_name" value={form.contact_name} onChange={handleChange} onBlur={handleBlur}
                placeholder="Your name" className={ic(errors.contact_name)} />
            </Field>
            <Field label="Designation">
              <input name="notes" placeholder="HR Manager, Director, etc." className={ic()}
                onChange={() => {}} />
            </Field>
            <Field label="Email Address *" error={errors.contact_email}>
              <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} onBlur={handleBlur}
                placeholder="hr@company.com" className={ic(errors.contact_email)} />
            </Field>
            <Field label="Phone / WhatsApp *" error={errors.contact_phone}>
              <input name="contact_phone" value={form.contact_phone} onChange={handleChange} onBlur={handleBlur}
                placeholder="+91 9876543210" maxLength={13} className={ic(errors.contact_phone)} />
            </Field>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 pt-2">Job Requirement Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Job Title / Role *" error={errors.job_title}>
                <input name="job_title" value={form.job_title} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. Senior Structural Engineer, QA/QC Manager" className={ic(errors.job_title)} />
              </Field>
            </div>
            <Field label="Number of Positions *" error={errors.num_positions}>
              <input name="num_positions" type="number" min="1" value={form.num_positions}
                onChange={handleChange} onBlur={handleBlur} className={ic(errors.num_positions)} />
            </Field>
            <Field label="Experience Required *" error={errors.experience_required}>
              <select name="experience_required" value={form.experience_required} onChange={handleChange} onBlur={handleBlur}
                className={ic(errors.experience_required)}>
                <option value="">Select experience</option>
                {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Job Location *" error={errors.location}>
              <input name="location" value={form.location} onChange={handleChange} onBlur={handleBlur}
                placeholder="Mumbai, Delhi, Bangalore, etc." className={ic(errors.location)} />
            </Field>
            <Field label="Budget / CTC Offered (LPA)">
              <input name="budget_ctc" value={form.budget_ctc} onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. 8-12 LPA (optional)" className={ic()} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Skills / Qualifications Required *" error={errors.skills_required}>
                <textarea name="skills_required" value={form.skills_required} onChange={handleChange} onBlur={handleBlur}
                  rows={3}
                  placeholder="e.g. AutoCAD, STAAD Pro, 5+ years in structural design, B.Tech Civil"
                  className={`${ic(errors.skills_required)} resize-none`} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Hiring Timeline *" error={errors.timeline}>
                <select name="timeline" value={form.timeline} onChange={handleChange} onBlur={handleBlur}
                  className={ic(errors.timeline)}>
                  <option value="">Select timeline</option>
                  {TIMELINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Additional Notes (optional)">
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                  placeholder="Any other details — work location type (onsite/remote), specific certifications, etc."
                  className={`${ic()} resize-none`} />
              </Field>
            </div>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{serverError}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors text-lg">
            {loading ? 'Submitting...' : 'Submit Hiring Requirement →'}
          </button>

          <p className="text-center text-xs text-gray-400">
            We will contact you within 24 hours. All information is kept strictly confidential.
          </p>
        </form>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">How does this work?</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Once you submit this form, our team manually reviews your requirement and searches our candidate database. You&apos;ll receive shortlisted CVs via email within 48–72 hours. There are <strong>no upfront charges</strong> — you only pay upon successful placement.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  )
}

function ic(error?: string) {
  return `border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent w-full bg-white ${
    error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
  }`
}

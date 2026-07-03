'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <main className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#services"     className="hover:text-indigo-600 transition-colors">Domains</a>
            <a href="#why-us"       className="hover:text-indigo-600 transition-colors">Why Us</a>
            <a href="#contact"      className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/apply" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              I&apos;m a Candidate
            </Link>
            <Link href="/company/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Company Login
            </Link>
            <Link href="/hire" className="hidden sm:block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
              Hire Talent →
            </Link>
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-6 py-4 flex flex-col gap-4">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#services"     onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Domains</a>
            <a href="#why-us"       onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Why Us</a>
            <a href="#contact"      onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Contact</a>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Link href="/apply" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">I&apos;m a Candidate</Link>
              <Link href="/company/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Company Login</Link>
              <Link href="/hire"  onClick={() => setMobileMenuOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-center">Hire Talent →</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-28 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-4 py-1.5 text-sm font-medium text-indigo-300 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Engineering &amp; Construction Recruitment
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
              The right engineer,<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                matched to you.
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              matchwork delivers pre-screened engineering talent directly to hiring companies — with confidential CVs, expert shortlists, and zero time wasted.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/hire" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/30 text-base">
                Post a Hiring Requirement →
              </Link>
              <Link href="/apply" className="w-full sm:w-auto border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base">
                Register as a Candidate
              </Link>
            </div>
          </div>
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: '200+', label: 'Candidates ready' },
              { value: '48 hrs', label: 'Avg. shortlist time' },
              { value: '15 Days', label: 'Avg. time to hire' },
              { value: '100%', label: 'Confidential process' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                <div className="text-3xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-4xl font-extrabold text-slate-900">How matchwork delivers talent</h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">A simple, fast, and fully managed hiring pipeline — from requirement to joining.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01', color: 'bg-indigo-600', title: 'Share Your Requirement',
                desc: 'Tell us the role, domain, experience, and budget. A one-page JD or a quick call works perfectly.',
                icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
              },
              {
                step: '02', color: 'bg-violet-600', title: 'We Shortlist & Screen',
                desc: 'Our team searches our curated database, screens candidates, and prepares a professional summary within 48 hours.',
                icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
              },
              {
                step: '03', color: 'bg-emerald-600', title: 'Interview & Hire',
                desc: 'Select who you like, we coordinate interviews, handle negotiations, and track joining — all with zero effort from you.',
                icon: <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-6 right-6 text-6xl font-black text-slate-50 group-hover:text-slate-100 transition-colors select-none">{item.step}</div>
                <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ZIGZAG FEATURES ── */}
      <section id="services" className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-28">

          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Shortlisting</p>
              <h2 className="text-4xl font-extrabold text-slate-900 leading-tight mb-5">2–5 curated profiles,<br />not 500 random CVs.</h2>
              <p className="text-slate-500 leading-relaxed mb-6">Every candidate we send has been reviewed by a domain expert. You only see people who genuinely fit — saving hours of screening time.</p>
              <ul className="space-y-3">
                {['Skills & experience verified', 'CTC within your budget', 'Notice period aligned', 'Recommendation note included'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                    <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-950 rounded-3xl p-6 shadow-2xl">
              <div className="text-xs text-slate-500 font-mono mb-4">Candidate shortlist · Today</div>
              {[
                { name: 'Arjun Sharma', role: 'Site Engineer', exp: '7 yrs', ctc: '₹12–15 LPA', tag: 'Available Now', dot: 'bg-emerald-400' },
                { name: 'Priya Mehta', role: 'QA/QC Engineer', exp: '5 yrs', ctc: '₹9–11 LPA', tag: '30-day notice', dot: 'bg-amber-400' },
              ].map(c => (
                <div key={c.name} className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-white font-semibold text-sm">{c.name}</div>
                      <div className="text-slate-400 text-xs">{c.role} · {c.exp}</div>
                    </div>
                    <span className="text-indigo-400 font-bold text-sm">{c.ctc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${c.dot} rounded-full`} />
                    <span className="text-slate-400 text-xs">{c.tag}</span>
                  </div>
                </div>
              ))}
              <div className="mt-4 bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300">
                📎 Redacted CVs attached · 2 candidates
              </div>
            </div>
          </div>

          {/* Feature 2 — reversed */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-8 border border-indigo-100">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🔒', title: 'Contact Redacted', desc: 'Phone & email stripped from every CV automatically' },
                  { icon: '💧', title: 'Watermarked', desc: 'Confidential watermark on all shared documents' },
                  { icon: '📋', title: 'Full Audit Log', desc: 'Every delivery tracked — who got which CV and when' },
                  { icon: '🤝', title: 'You Stay Central', desc: 'Clients reach candidates only through you' },
                ].map(f => (
                  <div key={f.title} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-slate-900 font-semibold text-sm mb-1">{f.title}</div>
                    <div className="text-slate-500 text-xs">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-violet-600 font-semibold text-sm uppercase tracking-widest mb-3">Confidentiality</p>
              <h2 className="text-4xl font-extrabold text-slate-900 leading-tight mb-5">Your recruitment<br />stays protected.</h2>
              <p className="text-slate-500 leading-relaxed">Candidate contact details are automatically removed before CVs reach your clients — so every placement goes through you. No bypassing, no lost fees.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-3">Specialisation</p>
              <h2 className="text-4xl font-extrabold text-slate-900 leading-tight mb-5">Built for engineering<br />&amp; construction.</h2>
              <p className="text-slate-500 leading-relaxed mb-6">We understand your domain. Our team speaks BOQ, P6, STAAD Pro, IS codes — so candidates are screened for what actually matters.</p>
              <div className="grid grid-cols-2 gap-3">
                {['Civil & Structural', 'QA / QC', 'Electrical & MEP', 'Project Controls', 'Contracts & QS', 'Senior Leadership'].map(d => (
                  <div key={d} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-950 rounded-3xl p-6 shadow-2xl">
              <div className="text-xs text-slate-500 font-mono mb-5">Active candidate pool</div>
              {[
                { domain: 'Civil & Structural', count: 80, pct: 100, color: 'bg-indigo-500' },
                { domain: 'QA / QC', count: 55, pct: 69, color: 'bg-violet-500' },
                { domain: 'Electrical & MEP', count: 40, pct: 50, color: 'bg-emerald-500' },
                { domain: 'Project Controls', count: 30, pct: 37, color: 'bg-amber-500' },
              ].map(d => (
                <div key={d.domain} className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">{d.domain}</span>
                    <span className="text-slate-500">{d.count}+ candidates</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY MATCHWORK ── */}
      <section id="why-us" className="py-24 px-6 bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-3">Why Us</p>
            <h2 className="text-4xl font-extrabold">Why companies choose matchwork</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">We&apos;re not a job portal. We&apos;re your dedicated recruitment partner.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', border: 'border-indigo-500/20 bg-indigo-500/5',  accent: 'text-indigo-300',  title: 'Speed',         sub: '48-hour shortlists',     desc: 'Profiles on your desk within 2 business days of sharing the requirement.' },
              { icon: '🎯', border: 'border-violet-500/20 bg-violet-500/5',  accent: 'text-violet-300',  title: 'Precision',     sub: 'Only fits, no fillers',   desc: 'Every candidate we share genuinely matches your requirement — no bulk dumps.' },
              { icon: '🔒', border: 'border-emerald-500/20 bg-emerald-500/5',accent: 'text-emerald-300', title: 'Confidentiality',sub: 'Process stays clean',     desc: 'Auto-redacted CVs, single-channel communication, zero cold calls.' },
              { icon: '🏗️', border: 'border-amber-500/20 bg-amber-500/5',   accent: 'text-amber-300',   title: 'Domain Depth',  sub: 'We speak your language',  desc: 'Our team knows BOQ, STAAD Pro, P6 — screened on what matters.' },
              { icon: '📊', border: 'border-pink-500/20 bg-pink-500/5',      accent: 'text-pink-300',    title: 'Transparency',  sub: 'Full delivery log',       desc: 'Track every candidate we\'ve sent — no confusion, full accountability.' },
              { icon: '🤝', border: 'border-cyan-500/20 bg-cyan-500/5',      accent: 'text-cyan-300',    title: 'Partnership',   sub: 'Long-term relationship',  desc: 'Whether you hire 1 or 100 — our process scales and commitment stays.' },
            ].map(card => (
              <div key={card.title} className={`border ${card.border} rounded-2xl p-6`}>
                <div className="text-3xl mb-4">{card.icon}</div>
                <h3 className="text-white font-bold text-lg">{card.title}</h3>
                <p className={`text-xs font-semibold mt-0.5 mb-3 ${card.accent}`}>{card.sub}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="py-24 px-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">Ready to find your next great hire?</h2>
          <p className="text-indigo-200 text-lg mb-10">Share your requirement today — we&apos;ll deliver a shortlist within 48 hours.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/hire"  className="w-full sm:w-auto bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg text-base">Post a Requirement →</Link>
            <Link href="/apply" className="w-full sm:w-auto border border-white/40 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors text-base">I&apos;m a Candidate</Link>
          </div>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-indigo-200 text-sm">
            <a href="tel:+919667710275"          className="flex items-center gap-2 hover:text-white transition-colors">📞 +91 96677 10275</a>
            <a href="mailto:support@matchwork.in" className="flex items-center gap-2 hover:text-white transition-colors">✉️ support@matchwork.in</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
            <div className="max-w-xs">
              <Logo light />
              <p className="text-slate-500 text-sm mt-4 leading-relaxed">Specialist recruitment for engineering &amp; construction. Pre-screened talent, delivered fast.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <h4 className="text-slate-200 font-semibold mb-4">Company</h4>
                <ul className="space-y-2.5">
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#services"     className="hover:text-white transition-colors">Domains</a></li>
                  <li><a href="#why-us"       className="hover:text-white transition-colors">Why matchwork</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-200 font-semibold mb-4">Get Started</h4>
                <ul className="space-y-2.5">
                  <li><Link href="/hire"  className="hover:text-white transition-colors">Post a Requirement</Link></li>
                  <li><Link href="/apply" className="hover:text-white transition-colors">Register as Candidate</Link></li>
                  <li><a href="mailto:support@matchwork.in" className="hover:text-white transition-colors">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">© {new Date().getFullYear()} matchwork. All rights reserved.</p>
            <p className="text-sm">matchwork.in · Recruitment &amp; Staffing</p>
          </div>
        </div>
      </footer>

    </main>
  )
}

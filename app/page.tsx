import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow">
              <span className="text-white font-bold text-base">R</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg leading-none">matchwork</span>
              <p className="text-xs text-gray-400 leading-none mt-0.5">Recruitment &amp; Staffing</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/apply"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors hidden sm:block"
            >
              I&apos;m a Candidate
            </Link>
            <Link
              href="/hire"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Post a Requirement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            Specialized Engineering &amp; Technical Recruitment
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            We Connect the Right Talent<br />
            <span className="text-blue-200">with the Right Company</span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            matchwork specializes in sourcing pre-screened engineering, QA/QC, and project management professionals — faster than any job portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/hire"
              className="bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg"
            >
              Post a Hiring Requirement →
            </Link>
            <Link
              href="/apply"
              className="border border-white/40 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              Register as a Candidate
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 border-b border-gray-100 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '200+', label: 'Candidates in Database' },
            { value: '30+', label: 'Companies Served' },
            { value: '15 Days', label: 'Avg. Time to Hire' },
            { value: '100%', label: 'Confidential Process' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Our Hiring Specializations</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">We maintain a curated pool of verified professionals across key engineering domains.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                title: 'Civil & Structural',
                skills: ['AutoCAD & Revit', 'STAAD Pro / ETABS', 'Structural & RCC Design', 'Road & Highway Eng.', 'Geotechnical Eng.'],
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'QA / QC',
                skills: ['Quality Assurance', 'NDT Inspection', 'Material Testing', 'IS / IRC Codes', 'ITP & Method Statements'],
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Electrical & MEP',
                skills: ['PLC / SCADA / HMI', 'Panel & Switchgear Design', 'Power Distribution', 'MEP Coordination', 'Instrumentation & DCS'],
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
                title: 'Project Management',
                skills: ['Primavera P6 / MS Project', 'BOQ & Estimation', 'Contract Management', 'Site Supervision', 'Quantity Surveying'],
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: 'Senior Leadership',
                skills: ['Project Directors', 'GM / DGM Level', 'Department Heads', 'Cluster Managers', 'VP / AVP Roles'],
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: 'Urgent / Niche Hiring',
                skills: ['Immediate Joiners', 'Contract Staffing', 'Bulk Hiring', 'Pan-India Placement', 'Confidential Search'],
              },
            ].map(service => (
              <div key={service.title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-200 transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  {service.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{service.title}</h3>
                <ul className="space-y-1.5">
                  {service.skills.map(s => (
                    <li key={s} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">How It Works for You</h2>
            <p className="text-gray-500 mt-3">Simple 3-step process — no job portal complexity, no wasted time.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Share Your Requirement',
                desc: 'Fill a simple form telling us what role you need, how many positions, experience required, and your timeline.',
              },
              {
                step: '02',
                title: 'We Screen & Shortlist',
                desc: 'We search our database of pre-registered candidates and personally screen profiles matching your exact criteria.',
              },
              {
                step: '03',
                title: 'You Interview & Hire',
                desc: 'We send you shortlisted CVs within 48–72 hours. You interview and hire. We handle the coordination.',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why matchwork */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose matchwork Over Job Portals?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'No Subscription Fees',
                desc: 'You pay only on successful placement — no monthly portal charges or posting fees.',
                icon: '💰',
              },
              {
                title: 'Pre-Screened Profiles Only',
                desc: 'Every candidate in our database has been interviewed and verified before we share their profile with you.',
                icon: '✅',
              },
              {
                title: 'Faster Turnaround',
                desc: 'We typically deliver shortlisted candidates in 48–72 hours vs weeks of waiting on job portals.',
                icon: '⚡',
              },
              {
                title: 'Sector Specialized',
                desc: 'We specialize in engineering, construction, and infrastructure — not a generic "all jobs" portal.',
                icon: '🎯',
              },
            ].map(item => (
              <div key={item.title} className="flex gap-4 bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-600 py-16 px-6 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Hire the Right Person?</h2>
          <p className="text-blue-100 mb-8 text-lg">Share your requirement and we&apos;ll get back to you within 24 hours.</p>
          <Link
            href="/hire"
            className="inline-block bg-white text-blue-700 font-bold px-10 py-4 rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg"
          >
            Post a Hiring Requirement →
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Get in Touch</h2>
            <p className="text-gray-500 mt-3">Have questions? We&apos;d love to hear from you.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">Email</div>
              <a href="mailto:prakhar@rsd.org.in" className="text-blue-600 text-sm hover:underline">prakhar@rsd.org.in</a>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">Phone / WhatsApp</div>
              <a href="tel:+919876543210" className="text-blue-600 text-sm hover:underline">+91 98765 43210</a>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">Location</div>
              <span className="text-gray-500 text-sm">India (Pan-India Placement)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-white font-semibold">matchwork</span>
          </div>
          <p className="text-sm text-center">© {new Date().getFullYear()} matchwork. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/apply" className="hover:text-white transition-colors">Candidates</Link>
            <Link href="/hire" className="hover:text-white transition-colors">Companies</Link>
            <Link href="/admin/login" className="hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

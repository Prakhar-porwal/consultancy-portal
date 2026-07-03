import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import { signOtp, COMPANY_OTP_COOKIE } from '@/lib/companyAuth'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 })

  // Only registered client companies can request a code.
  const { data: rows } = await admin()
    .from('clients')
    .select('id, name')
    .ilike('email', email.trim())
    .limit(1)

  if (!rows?.[0]) {
    return NextResponse.json(
      { error: 'No company account found for this email. Please contact matchwork to get access.' },
      { status: 404 },
    )
  }

  const code = String(crypto.randomInt(100000, 999999))
  const ts = Date.now()
  const hmac = signOtp(email, code, ts)

  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  await transporter.sendMail({
    from: `matchwork <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your matchwork Client Portal Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;">
        <div style="background:#4f46e5;border-radius:12px 12px 0 0;padding:24px 28px;">
          <div style="font-size:20px;font-weight:700;color:#fff;">matchwork</div>
          <div style="font-size:12px;color:#c7d2fe;margin-top:2px;">Client Portal</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
          <p style="font-size:15px;color:#0f172a;margin:0 0 16px;">Your one-time login code is:</p>
          <div style="background:#fff;border:2px solid #4f46e5;border-radius:12px;padding:20px;text-align:center;">
            <span style="font-size:36px;font-weight:800;color:#4f46e5;letter-spacing:8px;">${code}</span>
          </div>
          <p style="font-size:13px;color:#64748b;margin:16px 0 0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <p style="font-size:13px;color:#64748b;margin:0;">Need help? Contact us:</p>
            <p style="font-size:13px;color:#0f172a;margin:4px 0 0;">📞 <a href="tel:+919667710275" style="color:#4f46e5;text-decoration:none;font-weight:600;">+91 96677 10275</a> &nbsp;|&nbsp; ✉️ <a href="mailto:support@matchwork.in" style="color:#4f46e5;text-decoration:none;font-weight:600;">support@matchwork.in</a></p>
          </div>
        </div>
      </div>
    `,
  })

  const res = NextResponse.json({ success: true })
  res.cookies.set(COMPANY_OTP_COOKIE, JSON.stringify({ email: email.toLowerCase().trim(), hmac, ts, code }), {
    httpOnly: true,
    maxAge: 60 * 10,
    path: '/',
  })
  return res
}

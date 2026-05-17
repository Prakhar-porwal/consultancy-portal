import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function sign(email: string, code: string, ts: number) {
  const secret = process.env.SMTP_PASS ?? 'rsd-otp-secret'
  return crypto.createHmac('sha256', secret).update(`${email}:${code}:${ts}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 })

  // Check candidate exists (service role key bypasses RLS)
  const { data: rows } = await supabaseAdmin
    .from('candidates')
    .select('full_name')
    .ilike('email', email.trim())
    .limit(1)

  const candidate = rows?.[0] ?? null

  if (!candidate) {
    return NextResponse.json({ error: 'No profile found for this email. Please submit your profile first.' }, { status: 404 })
  }

  const code = String(crypto.randomInt(100000, 999999))
  const ts = Date.now()
  const hmac = sign(email, code, ts)

  // Send OTP email
  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  await transporter.sendMail({
    from: `RSD Consultancy <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your RSD Consultancy Login Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;">
        <div style="background:#1d4ed8;border-radius:12px 12px 0 0;padding:24px 28px;">
          <div style="font-size:20px;font-weight:700;color:#fff;">RSD Consultancy</div>
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
          <p style="font-size:15px;color:#111827;margin:0 0 16px;">Your one-time login code is:</p>
          <div style="background:#fff;border:2px solid #1d4ed8;border-radius:12px;padding:20px;text-align:center;">
            <span style="font-size:36px;font-weight:800;color:#1d4ed8;letter-spacing:8px;">${code}</span>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:16px 0 0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;">
            <p style="font-size:13px;color:#6b7280;margin:0;">Need help? Contact us:</p>
            <p style="font-size:13px;color:#111827;margin:4px 0 0;">📞 <a href="tel:+919667710275" style="color:#1d4ed8;text-decoration:none;font-weight:600;">+91 96677 10275</a> &nbsp;|&nbsp; ✉️ <a href="mailto:prakhar@rsd.org.in" style="color:#1d4ed8;text-decoration:none;font-weight:600;">prakhar@rsd.org.in</a></p>
          </div>
        </div>
      </div>
    `,
  })

  const res = NextResponse.json({ success: true })
  // Store hmac + ts in cookie so we can verify without a DB
  res.cookies.set('rsd_otp', JSON.stringify({ email: email.toLowerCase().trim(), hmac, ts, code }), {
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })
  return res
}

import crypto from 'crypto'
import type { NextRequest } from 'next/server'

// HMAC secret for OTP + session signing. Reuses SMTP_PASS (already required in
// prod) so no new env var is needed; falls back for local dev only.
const SECRET = process.env.SMTP_PASS ?? 'matchwork-company-secret'

export const COMPANY_COOKIE = 'mw_company'
export const COMPANY_OTP_COOKIE = 'mw_company_otp'

// ── Passwords ────────────────────────────────────────────────────────────────
// scrypt with a random salt, stored as "salt:hash". No external deps.
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(test, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ── OTP signing (stateless, verified via signed cookie) ─────────────────────
export function signOtp(email: string, code: string, ts: number): string {
  return crypto.createHmac('sha256', SECRET)
    .update(`${email.toLowerCase().trim()}:${code}:${ts}`)
    .digest('hex')
}

// ── Session token: base64url(payload).hmac ──────────────────────────────────
export function signSession(clientId: string, ttlMs = 24 * 60 * 60 * 1000): string {
  const payload = Buffer.from(JSON.stringify({ cid: clientId, exp: Date.now() + ttlMs })).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/** Returns the client id if the token is valid and unexpired, else null. */
export function verifySession(token: string | undefined): string | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const { cid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { cid: string; exp: number }
    if (!cid || Date.now() > exp) return null
    return cid
  } catch { return null }
}

/** Reads and validates the company session cookie from a request. */
export function getCompanyClientId(req: NextRequest): string | null {
  return verifySession(req.cookies.get(COMPANY_COOKIE)?.value)
}

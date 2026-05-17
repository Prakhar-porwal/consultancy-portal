import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import JSZip from 'jszip'
import type { Candidate } from '@/lib/supabase'

// Matches: 9876543210 / +91 9876543210 / +919876543210 / 98765-43210
// Non-global versions for .test() — global regexes are stateful and break repeated .test() calls
const PHONE_RE = /(\+?91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}/
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
// Global versions for .replace() in redactText
const PHONE_RE_G = /(\+?91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}/g
const EMAIL_RE_G = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

function redactText(text: string): string {
  return text
    .replace(PHONE_RE_G, '█████████████')
    .replace(EMAIL_RE_G, '████████████████')
}

async function redactDocx(buf: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buf)

  // document.xml holds the main body text
  // header*.xml and footer*.xml may also contain contact info
  const xmlFiles = Object.keys(zip.files).filter(
    name => name.match(/word\/(document|header\d*|footer\d*)\.xml$/)
  )

  for (const fileName of xmlFiles) {
    const content = await zip.files[fileName].async('string')
    // Strip XML tags temporarily to find plain-text phone/email inside <w:t> nodes
    const redacted = content.replace(
      /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g,
      (_, open, inner, close) => `${open}${redactText(inner)}${close}`
    )
    zip.file(fileName, redacted)
  }

  const result = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return result
}

type TextRect = { page: number; x: number; y: number; width: number; height: number }

async function findSensitiveRects(pdfBuffer: Buffer, pageSizes: { width: number; height: number }[]): Promise<TextRect[]> {
  // pdf2json: pure Node.js PDF parser — no browser DOM dependencies (no DOMMatrix issue)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFParser = require('pdf2json')

  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parser = new PDFParser(null, 1)
    const rects: TextRect[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser.on('pdfParser_dataError', (err: any) => {
      console.error('[redact] pdf2json error:', String(err))
      resolve([])
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser.on('pdfParser_dataReady', (data: any) => {
      ;(data?.Pages ?? []).forEach((page: any, pageIdx: number) => {
        const pdf2jsonW = page.Width ?? 1
        const pdf2jsonH = page.Height ?? 1
        const pdfLibW = pageSizes[pageIdx]?.width ?? 595
        const pdfLibH = pageSizes[pageIdx]?.height ?? 842
        const scaleX = pdfLibW / pdf2jsonW
        const scaleY = pdfLibH / pdf2jsonH

        ;(page.Texts ?? []).forEach((textItem: any) => {
          const str = decodeURIComponent(textItem.R?.[0]?.T ?? '')
          if (!PHONE_RE.test(str) && !EMAIL_RE.test(str)) return
          const fontSize = textItem.R?.[0]?.TS?.[1] ?? 12
          const x = textItem.x * scaleX
          const y = pdfLibH - textItem.y * scaleY - fontSize - 4
          rects.push({ page: pageIdx, x: x - 2, y, width: textItem.w * scaleX + 8, height: fontSize + 8 })
        })
      })
      console.log(`[redact] pdf2json found ${rects.length} sensitive rects`)
      resolve(rects)
    })

    parser.parseBuffer(pdfBuffer)
  })
}

async function redactResumePdf(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })
  const pages = pdfDoc.getPages()
  const pageSizes = pages.map(p => p.getSize())

  let rects: TextRect[] = []
  try {
    rects = await findSensitiveRects(pdfBuffer, pageSizes)
  } catch (e) {
    console.error('[redact] pdf2json extraction failed:', String(e))
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Draw black redaction boxes over each phone/email text item
  for (const r of rects) {
    const page = pages[r.page]
    if (!page) continue
    page.drawRectangle({ x: r.x, y: r.y, width: r.width, height: r.height, color: rgb(0.1, 0.1, 0.1) })
    page.drawText('REDACTED', {
      x: r.x + 3,
      y: r.y + 3,
      size: Math.min(7, r.height - 2),
      font,
      color: rgb(0.7, 0.7, 0.7),
    })
  }

  // Diagonal watermark on every page
  for (const page of pages) {
    const { width, height } = page.getSize()
    page.drawText('RSD CONSULTANCY — CONFIDENTIAL', {
      x: width / 2 - 120,
      y: height / 2,
      size: 16,
      font: boldFont,
      color: rgb(0.8, 0.82, 0.88),
      opacity: 0.25,
      rotate: degrees(40),
    })
  }

  return Buffer.from(await pdfDoc.save())
}

function buildHtml(candidates: Candidate[], clientName: string, customNote: string): string {
  const rows = candidates
    .map(
      c => `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="display:inline-block;width:44px;height:44px;background:#dbeafe;border-radius:50%;text-align:center;line-height:44px;font-size:18px;font-weight:700;color:#1d4ed8;vertical-align:middle;">
                ${c.full_name.charAt(0).toUpperCase()}
              </div>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <div style="font-size:18px;font-weight:700;color:#111827;">${c.full_name}</div>
              <div style="font-size:13px;color:#6b7280;margin-top:2px;">${c.current_company || 'Currently exploring opportunities'}</div>
            </td>
            ${c.is_immediate_joiner ? `<td style="text-align:right;vertical-align:middle;"><span style="background:#dcfce7;color:#16a34a;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">Immediate Joiner</span></td>` : ''}
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #f3f4f6;padding-top:16px;">
          <tr>
            <td width="50%" style="padding:6px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:2px;">Experience</td></tr>
                <tr><td style="font-size:14px;color:#111827;font-weight:500;">${c.total_experience}</td></tr>
              </table>
            </td>
            <td width="50%" style="padding:6px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:2px;">Current CTC</td></tr>
                <tr><td style="font-size:14px;color:#111827;font-weight:500;">${c.current_ctc} LPA</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:6px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:2px;">Expected CTC</td></tr>
                <tr><td style="font-size:14px;color:#111827;font-weight:500;">${c.expected_ctc} LPA</td></tr>
              </table>
            </td>
            <td width="50%" style="padding:6px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:2px;">Notice Period</td></tr>
                <tr><td style="font-size:14px;color:#111827;font-weight:500;">${c.notice_period}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:6px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:2px;">Location</td></tr>
                <tr><td style="font-size:14px;color:#111827;font-weight:500;">${c.current_location}</td></tr>
              </table>
            </td>
            <td width="50%" style="padding:6px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:2px;">Contact</td></tr>
                <tr><td style="font-size:13px;color:#6b7280;font-style:italic;">Available via RSD Consultancy</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f3f4f6;">
          <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Key Skills</div>
          <div style="font-size:13px;color:#374151;">${c.skills}</div>
        </div>

        ${c.resume_url ? `
        <div style="margin-top:14px;">
          <span style="display:inline-block;background:#e0e7ff;color:#3730a3;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;">
            📎 Resume attached to this email
          </span>
        </div>` : ''}

        <div style="margin-top:14px;padding-top:12px;border-top:1px solid #f3f4f6;background:#fefce8;border-radius:0 0 8px 8px;padding:10px 14px;">
          <span style="font-size:12px;color:#92400e;">
            📞 To schedule an interview or get contact details, please reach out to <strong>RSD Consultancy</strong> at <a href="mailto:prakhar@rsd.org.in" style="color:#1d4ed8;">prakhar@rsd.org.in</a>
          </span>
        </div>
      </div>
    `
    )
    .join('')

  const noteBlock = customNote
    ? `<div style="background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;font-size:14px;color:#1e40af;line-height:1.6;">${customNote}</div>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;border-radius:12px 12px 0 0;padding:28px 32px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">RSD Consultancy</div>
            <div style="font-size:13px;color:#bfdbfe;margin-top:4px;">Candidate Profiles — Shared exclusively for your consideration</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#f9fafb;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">

            <p style="font-size:15px;color:#111827;margin:0 0 8px;">Dear <strong>${clientName || 'Hiring Manager'}</strong>,</p>
            <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 20px;">
              I hope this email finds you well. Please find below the candidate profile${candidates.length > 1 ? 's' : ''} we have carefully selected for your open position${candidates.length > 1 ? 's' : ''}. Resumes are attached to this email for your convenience.
            </p>

            ${noteBlock}

            <div style="font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;">
              ${candidates.length} Candidate${candidates.length > 1 ? 's' : ''} Shortlisted
            </div>

            ${rows}

            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
              <p style="font-size:14px;color:#4b5563;margin:0 0 6px;">Please feel free to reach out for any further information or to schedule interviews.</p>
              <p style="font-size:14px;color:#111827;font-weight:600;margin:0;">Warm regards,<br>RSD Consultancy Team</p>
              <p style="font-size:13px;color:#9ca3af;margin:4px 0 0;">prakhar@rsd.org.in</p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 0;text-align:center;">
            <p style="font-size:11px;color:#9ca3af;margin:0;">This email and its attachments are confidential and intended solely for the addressee.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const { candidates, toEmail, toName, subject, customNote } = await req.json() as {
      candidates: Candidate[]
      toEmail: string
      toName: string
      subject: string
      customNote: string
    }

    if (!candidates?.length || !toEmail) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const attachments: { filename: string; content: Buffer }[] = []
    for (const c of candidates) {
      if (c.resume_url) {
        try {
          const res = await fetch(c.resume_url)
          const rawBuf = Buffer.from(await res.arrayBuffer())
          const ext = (c.resume_url.split('.').pop()?.split('?')[0] ?? 'pdf').toLowerCase()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let finalBuf: any = rawBuf
          if (ext === 'pdf') finalBuf = await redactResumePdf(rawBuf)
          else if (ext === 'docx') finalBuf = await redactDocx(rawBuf)
          attachments.push({
            filename: `${c.full_name.replace(/\s+/g, '_')}_Resume.${ext}`,
            content: finalBuf,
          })
        } catch {
          // skip if individual resume fetch fails
        }
      }
    }

    await transporter.sendMail({
      from: `RSD Consultancy <${process.env.SMTP_USER}>`,
      to: `${toName} <${toEmail}>`,
      subject,
      html: buildHtml(candidates, toName, customNote),
      attachments,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email.' },
      { status: 500 }
    )
  }
}

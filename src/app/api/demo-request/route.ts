import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Demo requests from the Suliko Office landing page (/tms).
 *
 * Unlike /api/contact, everything a visitor types is escaped before it goes
 * into the email's HTML: this is a public form, and an unescaped field lets
 * anyone inject markup or links into a message the sales inbox trusts.
 */

const INBOX = 'tako@suliko.ge';
// The sender domain already verified in Resend (see /api/notary-upload).
const FROM = 'Suliko Office <noreply@th.com.ge>';

const TEAM_SIZES = { t1: '1–3 people', t2: '4–10 people', t3: '11–25 people', t4: '26+ people' } as const;
const ORDER_VOLUMES = { o1: 'Under 50', o2: '50–150', o3: '150–500', o4: '500+' } as const;

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().default('');

const DemoRequest = z.object({
  name: z.string().trim().min(1).max(100),
  company: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(200),
  phone: optionalText(40),
  team: z.enum(['', ...Object.keys(TEAM_SIZES)] as [string, ...string[]]).optional().default(''),
  orders: z.enum(['', ...Object.keys(ORDER_VOLUMES)] as [string, ...string[]]).optional().default(''),
  message: optionalText(2000),
  locale: z.enum(['en', 'ka', 'pl']).optional().default('en'),
  /** Honeypot: hidden from people, filled in by naive bots. */
  website: z.string().optional().default(''),
});

/**
 * Best-effort throttle: 5 requests per IP per 10 minutes.
 *
 * It lives in the memory of one serverless instance, so it slows a single
 * script hammering the form but is not a guarantee across instances. It exists
 * to keep the inbox usable, not as a security boundary.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const parsed = DemoRequest.safeParse(body);
  if (!parsed.success) {
    const emailInvalid = parsed.error.issues.some((i) => i.path[0] === 'email');
    return NextResponse.json({ error: emailInvalid ? 'invalid_email' : 'invalid' }, { status: 400 });
  }
  const data = parsed.data;

  // Pretend success so a bot learns nothing from the response.
  if (data.website) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('[demo-request] RESEND_API_KEY is not set');
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }

  const rows: [string, string][] = [
    ['Name', data.name],
    ['Company', data.company],
    ['Email', data.email],
    ['Phone', data.phone || 'not given'],
    ['Team size', TEAM_SIZES[data.team as keyof typeof TEAM_SIZES] ?? 'not given'],
    ['Orders per month', ORDER_VOLUMES[data.orders as keyof typeof ORDER_VOLUMES] ?? 'not given'],
    ['Page language', data.locale],
  ];

  const html = `
    <h2>New Suliko Office demo request</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="color:#525c75">${label}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`
        )
        .join('')}
    </table>
    <p style="color:#525c75">Message:</p>
    <p>${data.message ? escapeHtml(data.message).replace(/\n/g, '<br>') : 'None'}</p>
  `;

  const text = [
    'New Suliko Office demo request',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Message:',
    data.message || 'None',
  ].join('\n');

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to: [INBOX],
      replyTo: data.email,
      // Resend sets the subject as a header, not HTML, but newlines would still
      // break it, and the schema's trim() doesn't touch interior ones.
      subject: `[Suliko Office] Demo request: ${data.company.replace(/[\r\n]+/g, ' ')}`,
      html,
      text,
    });

    if (error) {
      console.error('[demo-request] Resend error:', error);
      return NextResponse.json({ error: 'server' }, { status: 502 });
    }
  } catch (error) {
    console.error('[demo-request] send failed:', error);
    return NextResponse.json({ error: 'server' }, { status: 502 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

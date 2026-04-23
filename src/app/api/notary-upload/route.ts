import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const INBOX = 'info@th.com.ge';
const FROM = 'Suliko <noreply@suliko.ge>';

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('[notary-upload] RESEND_API_KEY is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = (formData.get('phone') as string) || 'N/A';
    const sourceLanguage = (formData.get('source_language') as string) || '-';
    const targetLanguage = (formData.get('target_language') as string) || '-';
    const notarialCertification = (formData.get('notarial_certification') as string) || 'No';
    const fileEntries = formData.getAll('files') as File[];

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields: name, email' }, { status: 400 });
    }
    if (fileEntries.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    const attachments = await Promise.all(
      fileEntries.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
      }))
    );

    const fileList = fileEntries.map((f) => f.name).join(', ');

    // 1. Forward to inbox with all details + attachments
    const inboxResult = await resend.emails.send({
      from: FROM,
      to: INBOX,
      replyTo: email,
      subject: `New Notary Submission from ${name}`,
      html: `
        <h2>New Notary File Submission</h2>
        <h3>www.suliko.ge</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Source Language:</strong> ${sourceLanguage}</p>
        <p><strong>Target Language:</strong> ${targetLanguage}</p>
        <p><strong>Notarial Certification:</strong> ${notarialCertification}</p>
        <p><strong>Files:</strong> ${fileList}</p>
      `,
      attachments,
    });

    if (inboxResult.error) {
      console.error('[notary-upload] inbox email error:', inboxResult.error);
      return NextResponse.json({ error: inboxResult.error.message }, { status: 500 });
    }

    // 2. Send confirmation to user
    const confirmResult = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'We received your documents – Suliko',
      html: confirmationTemplate({ name, email, phone, fileList, sourceLanguage, targetLanguage, notarialCertification }),
    });

    if (confirmResult.error) {
      console.error('[notary-upload] confirmation email error:', confirmResult.error);
      // Inbox succeeded — don't fail the whole request
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[notary-upload] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function confirmationTemplate({
  name, email, phone, fileList, sourceLanguage, targetLanguage, notarialCertification,
}: {
  name: string; email: string; phone: string; fileList: string;
  sourceLanguage: string; targetLanguage: string; notarialCertification: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:32px 40px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Suliko</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px">Professional Notary Translation Services</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px">We received your documents, ${name}!</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
              Our team will review your files and send you a free quote within <strong>5 minutes</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px">
              <tr><td style="padding:20px">
                <p style="margin:0 0 8px;color:#374151;font-size:14px"><strong>Email:</strong> ${email}</p>
                <p style="margin:0 0 8px;color:#374151;font-size:14px"><strong>Phone:</strong> ${phone}</p>
                <p style="margin:0 0 8px;color:#374151;font-size:14px"><strong>Source Language:</strong> ${sourceLanguage}</p>
                <p style="margin:0 0 8px;color:#374151;font-size:14px"><strong>Target Language:</strong> ${targetLanguage}</p>
                <p style="margin:0 0 8px;color:#374151;font-size:14px"><strong>Notarial Certification:</strong> ${notarialCertification}</p>
                <p style="margin:0;color:#374151;font-size:14px"><strong>Files:</strong> ${fileList}</p>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;color:#6b7280;font-size:14px">Need immediate help? Message us on WhatsApp:</p>
            <a href="https://wa.me/995591729911" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
              Message on WhatsApp
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
            <p style="margin:0;color:#9ca3af;font-size:12px">Suliko · info@suliko.ge</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

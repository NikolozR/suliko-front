// import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = (formData.get('phone') as string) || 'N/A';
    const fileEntries = formData.getAll('files') as File[];

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email' },
        { status: 400 }
      );
    }

    if (fileEntries.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    // --- Resend (commented out until API key is configured) ---
    // const apiKey = process.env.RESEND_API_KEY;
    // const resend = new Resend(apiKey);
    // const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    // const attachments = await Promise.all(
    //   fileEntries.map(async (file) => ({
    //     filename: file.name,
    //     content: Buffer.from(await file.arrayBuffer()),
    //   }))
    // );
    // const { error } = await resend.emails.send({
    //   from: fromEmail,
    //   to: ['info@th.com.ge'],
    //   replyTo: email,
    //   subject: 'New Notary File Submission',
    //   html: `...`,
    //   attachments,
    // });
    // if (error) throw new Error(error.message);

    // --- formsubmit.co ---
    const outForm = new FormData();
    outForm.append('name', name);
    outForm.append('email', email);
    outForm.append('phone', phone);
    outForm.append('_subject', 'New Notary File Submission');
    outForm.append('_captcha', 'false');
    fileEntries.forEach((file) => outForm.append('attachment', file, file.name));

    const fsRes = await fetch('https://formsubmit.co/ajax/info@th.com.ge', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: outForm,
    });

    if (!fsRes.ok) {
      const text = await fsRes.text();
      console.error('formsubmit.co error:', text);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Notary upload error:', err);
    return NextResponse.json(
      { error: 'Failed to process request', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

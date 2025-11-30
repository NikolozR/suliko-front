import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { 
          error: 'Email service is not configured. Please contact the administrator.', 
          details: 'RESEND_API_KEY missing. Please add RESEND_API_KEY to your .env.local file and restart the server.' 
        },
        { status: 500 }
      );
    }

    // Log that API key is found (but don't log the actual key for security)
    console.log('Resend API key found, length:', apiKey.length);

    // Initialize Resend client
    const resend = new Resend(apiKey);

    const body = await request.json();
    const { email, subject, message } = body;

    // Validate required fields
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: email, subject, message' },
        { status: 400 }
      );
    }

    // Get the from email - use verified domain or default onresend.com for testing
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail = process.env.RESEND_TO_EMAIL || 'Info@suliko.ge';

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `Support Request: ${subject}`,
      html: `
        <h2>New Support Request</h2>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `
New Support Request

From: ${email}
Subject: ${subject}

Message:
${message}
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Email sent successfully', id: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

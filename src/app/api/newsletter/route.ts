import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, captchaToken } = await request.json();

    console.log('Newsletter subscription attempt:', { email, hasCaptchaToken: !!captchaToken });

    // Validate required fields
    if (!email || !captchaToken) {
      console.log('Missing required fields:', { email: !!email, captchaToken: !!captchaToken });
      return NextResponse.json(
        { error: 'Email and CAPTCHA token are required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    console.log('Secret key available:', !!secretKey);

    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not set');
      return NextResponse.json(
        { error: 'CAPTCHA configuration error' },
        { status: 500 }
      );
    }

    // Verify CAPTCHA token with Google
    const captchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: captchaToken,
        remoteip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      }),
    });

    const captchaResult = await captchaResponse.json();
    console.log('CAPTCHA verification result:', captchaResult);

    if (!captchaResult.success) {
      console.log('CAPTCHA verification failed:', captchaResult['error-codes']);
      return NextResponse.json(
        { error: 'CAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Save the email to your database
    // 2. Send a confirmation email
    // 3. Add to your newsletter service (Mailchimp, ConvertKit, etc.)

    console.log('Newsletter subscription successful for:', email);
    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
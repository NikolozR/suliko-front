import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow this in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  return NextResponse.json({
    hasSiteKey: !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    hasSecretKey: !!process.env.RECAPTCHA_SECRET_KEY,
    siteKeyPrefix: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.substring(0, 10) + '...',
    nodeEnv: process.env.NODE_ENV,
  });
}

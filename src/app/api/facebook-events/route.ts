import { NextRequest, NextResponse } from 'next/server';
import { hashEmail, hashPhone, getCurrentTimestamp } from '@/shared/utils/hashUtils';
import { getMetaPixelId, isProductionDeployment } from '@/shared/utils/analyticsEnv';

/**
 * Conversions API access token. Server-side only — deliberately no NEXT_PUBLIC_
 * prefix, so Next.js will not inline it into the client bundle.
 */
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const API_VERSION = 'v21.0';

interface FacebookEventData {
  event_name: string;
  event_time: number;
  action_source: string;
  user_data: {
    em?: string[];
    ph?: string[];
    fbc?: string;
    fbp?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fb_login_id?: string;
  };
  attribution_data?: {
    attribution_share: string;
  };
  custom_data?: {
    /** Revenue events only; absent on registrations and other non-revenue events. */
    currency?: string;
    value?: string;
    content_name?: string;
    content_category?: string;
  };
  original_event_data?: {
    event_name: string;
    event_time: number;
  };
}

interface FacebookEventsPayload {
  data: FacebookEventData[];
  test_event_code?: string;
}

export async function POST(request: NextRequest) {
  const pixelId = getMetaPixelId();

  if (!isProductionDeployment() || !pixelId || !FACEBOOK_ACCESS_TOKEN) {
    // Same gate as the browser pixel. Without it, a registration on localhost or
    // a preview deployment would still reach Meta through this route.
    return NextResponse.json(
      { skipped: true, reason: 'Conversions API disabled outside production' },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const { 
      eventName, 
      userData, 
      customData,
      testEventCode 
    } = body;

    // Validate required fields
    if (!eventName || !userData) {
      return NextResponse.json(
        { error: 'Missing required fields: eventName, userData' },
        { status: 400 }
      );
    }

    // Prepare enhanced user data with all tracking parameters
    const enhancedUserData: {
      em?: string[];
      ph?: string[];
      fbc?: string;
      fbp?: string;
      external_id?: string;
      client_ip_address?: string;
      client_user_agent?: string;
      fb_login_id?: string;
    } = {};

    // Hash email
    if (userData.email) {
      const hashedEmail = hashEmail(userData.email);
      if (hashedEmail) {
        enhancedUserData.em = [hashedEmail];
      }
    }

    // Hash phone
    if (userData.phone) {
      const hashedPhone = hashPhone(userData.phone);
      if (hashedPhone) {
        enhancedUserData.ph = [hashedPhone];
      }
    }

    // Enhanced tracking parameters
    if (userData.clickId) {
      enhancedUserData.fbc = userData.clickId;
    }

    if (userData.browserId) {
      enhancedUserData.fbp = userData.browserId;
    }

    if (userData.externalId) {
      enhancedUserData.external_id = userData.externalId;
    }

    if (userData.facebookLoginId) {
      enhancedUserData.fb_login_id = userData.facebookLoginId;
    }

    // Get IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || request.headers.get('x-client-ip');
    if (clientIp) {
      enhancedUserData.client_ip_address = clientIp;
    }

    // Get user agent from request headers
    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      enhancedUserData.client_user_agent = userAgent;
    }

    // Create Facebook event payload with enhanced data
    const facebookEvent: FacebookEventData = {
      event_name: eventName,
      event_time: getCurrentTimestamp(),
      action_source: 'website',
      user_data: enhancedUserData,
      attribution_data: {
        attribution_share: '0.3'
      },
      custom_data: {
        content_name: customData?.contentName || 'User Registration',
        content_category: customData?.contentCategory || 'User Signup',
        // Only for genuine revenue events; omitted otherwise so that free
        // signups do not register as zero-value purchases.
        ...(customData?.currency ? { currency: customData.currency } : {}),
        ...(customData?.value ? { value: customData.value } : {})
      },
      original_event_data: {
        event_name: eventName,
        event_time: getCurrentTimestamp()
      }
    };

    const payload: FacebookEventsPayload = {
      data: [facebookEvent],
      // Events carrying a test code appear only in Meta's Test Events tool and
      // are never counted as conversions, so this is set only when a caller
      // explicitly asks for it while debugging.
      ...(testEventCode ? { test_event_code: testEventCode } : {})
    };

    // Send to Facebook Conversions API
    const facebookResponse = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${FACEBOOK_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const facebookData = await facebookResponse.json();

    if (!facebookResponse.ok) {
      console.error('Facebook API Error:', facebookData);
      return NextResponse.json(
        { error: 'Failed to send event to Facebook', details: facebookData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      facebookResponse: facebookData,
      eventSent: {
        eventName,
        timestamp: facebookEvent.event_time,
        userDataHashed: !!enhancedUserData.em?.length || !!enhancedUserData.ph?.length
      }
    });

  } catch (error) {
    console.error('Server-side Facebook event error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

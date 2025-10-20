import { NextRequest, NextResponse } from 'next/server';
import { hashEmail, hashPhone, getCurrentTimestamp } from '@/shared/utils/hashUtils';

const FACEBOOK_ACCESS_TOKEN = 'EAAHoqwDjfusBPglG2tVZCqQhzZC3LxJHoZB9ct6hRxEZA8z3dFXxzm86mF1ZBQqGcHwpZBtIlIo3nfzdBygnqagFcMdWq7uVhGGHXb3rZCZB0QqPVq6NuTZApAfer4Da56oQ7GSJB0xkjn1BMxg9VGeP5gFg9Eb11XsgpCskx11SYxRVSly0hIZC0e6mjZABwVnoQZDZD';
const PIXEL_ID = '763067889892928';
const API_VERSION = 'v21.0';

interface FacebookEventData {
  event_name: string;
  event_time: number;
  action_source: string;
  user_data: {
    em?: string[];
    ph?: string[];
  };
  attribution_data?: {
    attribution_share: string;
  };
  custom_data?: {
    currency: string;
    value: string;
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      eventName, 
      userData, 
      customData 
    } = body;

    // Validate required fields
    if (!eventName || !userData) {
      return NextResponse.json(
        { error: 'Missing required fields: eventName, userData' },
        { status: 400 }
      );
    }

    // Prepare user data hashes
    const hashedUserData: { em?: string[]; ph?: string[] } = {};

    if (userData.email) {
      const hashedEmail = hashEmail(userData.email);
      if (hashedEmail) {
        hashedUserData.em = [hashedEmail];
      }
    }

    if (userData.phone) {
      const hashedPhone = hashPhone(userData.phone);
      if (hashedPhone) {
        hashedUserData.ph = [hashedPhone];
      }
    }

    // Create Facebook event payload
    const facebookEvent: FacebookEventData = {
      event_name: eventName,
      event_time: getCurrentTimestamp(),
      action_source: 'website',
      user_data: hashedUserData,
      attribution_data: {
        attribution_share: '0.3'
      },
      custom_data: {
        currency: customData?.currency || 'GEL',
        value: customData?.value || '0.00',
        content_name: customData?.contentName || 'User Registration',
        content_category: customData?.contentCategory || 'User Signup'
      },
      original_event_data: {
        event_name: eventName,
        event_time: getCurrentTimestamp()
      }
    };

    const payload: FacebookEventsPayload = {
      data: [facebookEvent]
    };

    // Send to Facebook Conversions API
    const facebookResponse = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}`,
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
        userDataHashed: !!hashedUserData.em?.length || !!hashedUserData.ph?.length
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

// app/api/payment/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try to read FormData from the request body
    const formData = await request.formData();
    
    // Convert FormData to object for logging/processing
    const formObject: Record<string, string> = {};
    formData.forEach((value, key) => {
      formObject[key] = value.toString();
    });

    console.log('Received FormData:', formObject);

    // Convert FormData to query string for the external API
    const queryString = new URLSearchParams(formObject).toString();
    console.log('Query String:', queryString);

    // Call your external API
    const res = await fetch(
      `https://content.api24.ge/api/Payment/callback?${queryString}`,
      { method: 'GET' }
    );
    const data = await res.json();

    // Return response to the external service
    return NextResponse.json(data);
    
  } catch (err) {
    console.error('Callback execution failed:', err);
    return NextResponse.json(
      { error: `Callback execution failed: ${err}` },
      { status: 500 }
    );
  }
}

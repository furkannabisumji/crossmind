import { NextResponse } from 'next/server';
import { serverFetch, API_PREFIX } from '@/lib/server-api';

/**
 * API route for submitting messages to the messaging system
 * This proxies requests to the ElizaOS backend messaging API
 * Uses server-only API helper to avoid client component dependencies
 */
export async function POST(request) {
  try {
    const data = await request.json();
    console.log('[API Route] Submitting message to backend:', JSON.stringify(data));

    try {
      // Forward the request to the ElizaOS backend using server-side helper
      const result = await serverFetch('/messaging/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('[API Route] Message submitted successfully:', JSON.stringify(result));
      
      return NextResponse.json(result, { status: 200 });
    } catch (apiError) {
      console.error(`[API Route] Error submitting message:`, apiError);
      
      return NextResponse.json(
        { 
          error: 'Failed to submit message to backend',
          details: apiError.message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API Route] Error processing message submission:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

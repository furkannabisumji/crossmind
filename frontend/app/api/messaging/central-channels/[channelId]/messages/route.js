import { NextResponse } from 'next/server';
import { serverFetch } from '@/lib/server-api';

/**
 * API route for getting messages from a specific channel
 * This allows us to debug what messages are actually stored in the backend
 */
export async function GET(request, { params }) {
  try {
    const { channelId } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    
    console.log(`[API Route] Getting messages for channel: ${channelId}, limit: ${limit}`);

    try {
      // Forward the request to the ElizaOS backend
      const result = await serverFetch(`/messaging/central-channels/${channelId}/messages?limit=${limit}`, {
        method: 'GET',
      });
      
      console.log(`[API Route] Retrieved ${result.messages?.length || 0} messages from channel`);
      
      return NextResponse.json(result, { status: 200 });
    } catch (apiError) {
      console.error(`[API Route] Error retrieving messages:`, apiError);
      
      return NextResponse.json(
        { 
          error: 'Failed to get messages from backend',
          details: apiError.message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API Route] Error processing message retrieval:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

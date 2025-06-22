/**
 * API route that creates a channel and adds an agent to it
 * This provides a simple endpoint to get a working channel ID
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://crossmind.reponchain.com/api';

// GET handler - creates a channel and adds the specified agent
export async function GET(req) {
  // Get agent ID from query params or use default
  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId') || '2e7fded5-6c90-0786-93e9-40e713a5e19d';
  
  try {
    console.log(`[Channel Setup] Creating channel for agent ${agentId}...`);
    
    // Step 1: Create a new channel
    const channelName = `Agent Channel ${new Date().toISOString().substring(0, 16)}`;
    const createResponse = await axios.post(`${API_BASE_URL}/messaging/channels`, {
      name: channelName,
      description: 'Channel for agent participation'
    });
    
    if (!createResponse.data?.data?.channel?.id) {
      return NextResponse.json({
        success: false,
        error: 'No channel ID in response',
        response: createResponse.data
      }, { status: 500 });
    }
    
    const channelId = createResponse.data.data.channel.id;
    console.log(`[Channel Setup] Created channel: ${channelId}`);
    
    // Step 2: Add agent to the new channel
    let agentAdded = false;
    let addResponse = null;
    
    // Try with messaging/central-channels endpoint
    try {
      console.log(`[Channel Setup] Adding agent ${agentId} to channel ${channelId} (central-channels)...`);
      addResponse = await axios.post(`${API_BASE_URL}/messaging/central-channels/${channelId}/agents`, {
        agentId
      });
      agentAdded = true;
      console.log('[Channel Setup] Agent added successfully via central-channels');
    } catch (error) {
      console.log(`[Channel Setup] central-channels failed: ${error.message}`);
      
      // Try with messaging/channels endpoint
      try {
        console.log(`[Channel Setup] Adding agent ${agentId} to channel ${channelId} (channels)...`);
        addResponse = await axios.post(`${API_BASE_URL}/messaging/channels/${channelId}/agents`, {
          agentId
        });
        agentAdded = true;
        console.log('[Channel Setup] Agent added successfully via channels');
      } catch (altError) {
        console.log(`[Channel Setup] channels endpoint also failed: ${altError.message}`);
        console.log('Error details:', altError.response?.data);
      }
    }
    
    // Return the result with channel details
    return NextResponse.json({
      success: true,
      channelId,
      channelName,
      agentId,
      agentAdded,
      channel: createResponse.data?.data?.channel,
      addResponse: addResponse?.data
    });
    
  } catch (error) {
    console.error('[Channel Setup] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data
    }, { status: error.response?.status || 500 });
  }
}

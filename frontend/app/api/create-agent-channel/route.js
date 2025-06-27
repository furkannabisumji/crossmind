/**
 * API route that creates a DM channel with an agent
 * This provides a DM channel that the agent will recognize and respond to
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://crossmind.reponchain.com/api';

// GET handler - creates a DM channel with the specified agent
export async function GET(req) {
  // Get agent ID from query params or use default
  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId') || '2e7fded5-6c90-0786-93e9-40e713a5e19d';
  const currentUserId = url.searchParams.get('currentUserId') || 'a7d55bf7-ad76-4f70-a6bb-c93ee7fa5625'; // Default user ID
  
  try {
    console.log(`[DM Channel Setup] Creating DM channel between user ${currentUserId} and agent ${agentId}...`);
    
    // Step 1: Create a DM channel with proper metadata
    const createResponse = await axios.post(`${API_BASE_URL}/messaging/channels`, {
      name: `Chat - ${new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })}`,
      type: 'DM', // This is the key change - DM instead of group
      messageServerId: '00000000-0000-0000-0000-000000000000',
      metadata: {
        isDm: true,
        user1: currentUserId,
        user2: agentId,
        forAgent: agentId,
        createdAt: new Date().toISOString()
      }
    });
    
    if (!createResponse.data?.data?.channel?.id) {
      return NextResponse.json({
        success: false,
        error: 'No channel ID in response',
        response: createResponse.data
      }, { status: 500 });
    }
    
    const channelId = createResponse.data.data.channel.id;
    console.log(`[DM Channel Setup] Created DM channel: ${channelId}`);
    
    // Step 2: Add agent to the new channel
    let agentAdded = false;
    let addResponse = null;
    
    // Try with messaging/central-channels endpoint
    try {
      console.log(`[DM Channel Setup] Adding agent ${agentId} to DM channel ${channelId} (central-channels)...`);
      addResponse = await axios.post(`${API_BASE_URL}/messaging/central-channels/${channelId}/agents`, {
        agentId
      });
      agentAdded = true;
      console.log('[DM Channel Setup] Agent added successfully via central-channels');
    } catch (error) {
      console.log(`[DM Channel Setup] central-channels failed: ${error.message}`);
      
      // Try with messaging/channels endpoint
      try {
        console.log(`[DM Channel Setup] Adding agent ${agentId} to DM channel ${channelId} (channels)...`);
        addResponse = await axios.post(`${API_BASE_URL}/messaging/channels/${channelId}/agents`, {
          agentId
        });
        agentAdded = true;
        console.log('[DM Channel Setup] Agent added successfully via channels');
      } catch (altError) {
        console.log(`[DM Channel Setup] channels endpoint also failed: ${altError.message}`);
        console.log('Error details:', altError.response?.data);
      }
    }
    
    // Return the result with DM channel details
    return NextResponse.json({
      success: true,
      channelId,
      channelName: createResponse.data.data.channel.name,
      agentId,
      agentAdded,
      channel: createResponse.data?.data?.channel,
      addResponse: addResponse?.data
    });
    
  } catch (error) {
    console.error('[DM Channel Setup] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data
    }, { status: error.response?.status || 500 });
  }
}

/**
 * Next.js API route (App Router) to proxy agent-channel association requests
 * This handles the POST /api/messaging/central-channels/:channelId/agents endpoint
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://crossmind.reponchain.com/api';

// GET handler for listing agents in a channel
export async function GET(req, { params }) {
  const { channelId } = params;
  console.log(`[API Proxy] GET /api/messaging/central-channels/${channelId}/agents`);

  try {
    const response = await axios.get(`${API_BASE_URL}/messaging/central-channels/${channelId}/agents`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`[API Proxy] Error getting agents for channel:`, error.message);
    return NextResponse.json({
      success: false,
      error: error.response?.data?.error || error.message,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    }, { status: error.response?.status || 500 });
  }
}

// POST handler for adding agent to a channel
export async function POST(req, { params }) {
  const { channelId } = params;
  const body = await req.json();
  const { agentId } = body || {};
  
  console.log(`[API Proxy] POST /api/messaging/central-channels/${channelId}/agents`, { 
    agentId, 
    channelId,
    body
  });
  
  // Instead of using the channelId from the URL (which might be the non-existent central bus),
  // create or use an existing dynamic channel
  let actualChannelId = channelId;
  const dynamicChannelName = `User Channel ${Date.now()}`;
  const requestId = req.headers.get('x-request-id') || Date.now().toString();

  try {
    // Try to check all available channels to see if the target exists
    // Try multiple endpoints to find the one that works
    const endpoints = [
      '/messaging/channels',
      '/messaging/central-channels',
      '/messaging/servers/central/channels'
    ];
    
    let foundChannels = false;
    let channels = [];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`[API Proxy] Checking channels with endpoint: ${endpoint}`);
        const channelsResponse = await axios.get(`${API_BASE_URL}${endpoint}`);
        channels = channelsResponse.data?.data?.channels || [];
        console.log(`[API Proxy] Found ${channels.length} channels with endpoint ${endpoint}`);
        foundChannels = true;
        break; // Exit loop if we found channels
      } catch (endpointErr) {
        console.log(`[API Proxy] Endpoint ${endpoint} failed:`, endpointErr.message);
      }
    }
    
    if (!foundChannels) {
      console.log('[API Proxy] Could not find any working channel listing endpoint');
      
      // Create a dynamic channel for this session instead of using central bus
      try {
        console.log(`[API Proxy] Creating dynamic channel: ${dynamicChannelName}`);
        
        // First get available message servers
        let serverId = '00000000-0000-0000-0000-000000000000'; // Default server ID
        try {
          const serversResponse = await axios.get(`${API_BASE_URL}/messaging/central-servers`);
          const servers = serversResponse.data?.data?.servers || [];
          if (servers.length > 0) {
            serverId = servers[0].id;
            console.log(`[API Proxy] Using message server: ${serverId}`);
          }
        } catch (serversErr) {
          console.log(`[API Proxy] Failed to get servers, using default: ${serversErr.message}`);
        }
        
          const currentUserId = url.searchParams.get('currentUserId') || 'a7d55bf7-ad76-4f70-a6bb-c93ee7fa5625'; // Default user ID
        // Create a new channel with the required fields
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
        
        const newChannel = createResponse.data?.data?.channel;
        if (newChannel?.id) {
          actualChannelId = newChannel.id;
          console.log(`[API Proxy] Created dynamic channel with ID: ${actualChannelId}`);
        }
      } catch (createErr) {
        console.log('[API Proxy] Failed to create dynamic channel:', createErr.message);
      }
    } else {
      // Log channel IDs for debugging
      channels.forEach(channel => {
        console.log(`[API Proxy] Channel: ${channel.id} - ${channel.name || 'Unnamed'}`);
      });
      
      // Check if our target channel exists
      const targetChannel = channels.find(c => c.id === channelId);
      if (!targetChannel) {
        console.log(`[API Proxy] WARNING: Target channel ${channelId} not found in channel list!`);
        
        // Log central bus candidates (channels that might be the central message bus)
        const centralCandidates = channels.filter(c => 
          c.id.includes('00000000') || 
          (c.name && c.name.toLowerCase().includes('central')) ||
          (c.type && c.type.toLowerCase().includes('bus'))
        );
        
        if (centralCandidates.length > 0) {
          console.log(`[API Proxy] Possible central bus candidates:`, 
            centralCandidates.map(c => ({ id: c.id, name: c.name, type: c.type }))
          );
        }
      } else {
        console.log(`[API Proxy] Target channel ${channelId} exists: ${targetChannel.name || 'Unnamed'}`);
      }
    }
    
    // Now try the agent addition with detailed logging
    console.log(`[API Proxy] Attempting to add agent ${agentId} to channel ${actualChannelId}`);
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/messaging/central-channels/${actualChannelId}/agents`,
      data: { agentId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[API Proxy] Success adding agent:`, response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`[API Proxy] Error adding agent to channel:`, error.message);
    
    // Try to get more information about the error
    if (error.response?.status === 404) {
      console.log("[API Proxy] 404 error details:", {
        data: error.response?.data,
        path: `/messaging/central-channels/${channelId}/agents`
      });
      
      // Try alternative endpoint format as a last resort
      try {
        console.log("[API Proxy] Attempting alternative endpoint format...");
        const altResponse = await axios({
          method: 'post',
          url: `${API_BASE_URL}/messaging/channels/${actualChannelId}/agents`,
          data: { agentId },
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[API Proxy] Alternative endpoint succeeded:`, altResponse.data);
        return NextResponse.json(altResponse.data);
      } catch (altError) {
        console.log(`[API Proxy] Alternative endpoint also failed:`, altError.message);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error.response?.data?.error || error.message,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        channelId
      }
    }, { status: error.response?.status || 500 });
  }
}

// DELETE handler for removing agent from a channel
export async function DELETE(req, { params }) {
  const { channelId } = params;
  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId');
  
  console.log(`[API Proxy] DELETE /api/messaging/central-channels/${channelId}/agents/${agentId}`);

  try {
    const response = await axios.delete(
      `${API_BASE_URL}/messaging/central-channels/${channelId}/agents/${agentId}`
    );
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`[API Proxy] Error removing agent from channel:`, error.message);
    return NextResponse.json({
      success: false,
      error: error.response?.data?.error || error.message,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    }, { status: error.response?.status || 500 });
  }
}

/**
 * API route that creates a dynamic agent channel if needed and adds an agent to it
 * This API doesn't require the caller to know about channel IDs at all
 */

import { NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = "https://crossmind.reponchain.com/api";

/**
 * Handle POST request to add an agent to a dynamically created channel
 * Request body should contain { agentId: string }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { agentId } = body || {};

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: agentId",
        },
        { status: 400 }
      );
    }

    console.log(`[API] Adding agent ${agentId} to a dynamic channel`);

    // Step 1: Get a server ID to use for channel creation
    let serverId = "00000000-0000-0000-0000-000000000000"; // Default server ID
    try {
      const serversResponse = await axios.get(
        `${API_BASE_URL}/messaging/central-servers`
      );
      const servers = serversResponse.data?.data?.servers || [];
      if (servers.length > 0) {
        serverId = servers[0].id;
        console.log(`[API] Using message server: ${serverId}`);
      }
    } catch (serversErr) {
      console.log(
        `[API] Failed to get servers, using default: ${serversErr.message}`
      );
    }

    // Step 2: Create a new channel with a unique name for this session
    const dynamicChannelName = `Agent Channel ${Date.now()}`;
    
    // Extract currentUserId from request URL or body
    const url = new URL(req.url);
    const currentUserId =
      url.searchParams.get("currentUserId") ||
      body.currentUserId ||
      "a7d55bf7-ad76-4f70-a6bb-c93ee7fa5625"; // Default user ID

    const createResponse = await axios.post(
      `${API_BASE_URL}/messaging/channels`,
      {
        name: `Chat - ${new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}`,
        type: "DM", // This is the key change - DM instead of group
        messageServerId: "00000000-0000-0000-0000-000000000000",
        metadata: {
          isDm: true,
          user1: currentUserId,
          user2: agentId,
          forAgent: agentId,
          createdAt: new Date().toISOString(),
        },
      }
    );

    const newChannel = createResponse.data?.data?.channel;
    if (!newChannel?.id) {
      throw new Error(
        "Failed to create dynamic channel: No channel ID returned"
      );
    }

    const channelId = newChannel.id;
    console.log(`[API] Created dynamic channel with ID: ${channelId}`);

    // Step 3: Add the agent to the newly created channel
    const response = await axios({
      method: "post",
      url: `${API_BASE_URL}/messaging/central-channels/${channelId}/agents`,
      data: { agentId },
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`[API] Successfully added agent to channel:`, response.data);

    // Return both the success status and the newly created channelId
    // so the UI can use it for future operations
    return NextResponse.json({
      success: true,
      data: {
        channelId: channelId,
        agentId: agentId,
        channelName: dynamicChannelName,
        ...response.data?.data,
      },
    });
  } catch (error) {
    console.error(
      `[API] Error adding agent to dynamic channel:`,
      error.message
    );
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.error || error.message,
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        },
      },
      { status: error.response?.status || 500 }
    );
  }
}

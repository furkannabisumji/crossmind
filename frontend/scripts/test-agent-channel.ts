/**
 * Test script for verifying agent-channel participation endpoint
 * 
 * This script attempts to add Zoya agent (ID: 2e7fded5-6c90-0786-93e9-40e713a5e19d) 
 * to the central bus channel (UUID: 00000000-0000-0000-0000-000000000000)
 * using the updated endpoint format from the ElizaOS architecture documentation
 */

import { apiClient } from "../lib/api";
import clientLogger from "../lib/logger";

// ElizaOS central bus channel ID - used for all message routing
const CENTRAL_BUS_CHANNEL_ID = "00000000-0000-0000-0000-000000000000";

// Zoya agent ID from previous testing
const ZOYA_AGENT_ID = "2e7fded5-6c90-0786-93e9-40e713a5e19d";

async function testAddAgentToChannel() {
  console.log("-----------------------------------------------");
  console.log("Testing adding agent to central bus channel...");
  console.log(`Agent ID: ${ZOYA_AGENT_ID}`);
  console.log(`Channel ID: ${CENTRAL_BUS_CHANNEL_ID}`);
  console.log("-----------------------------------------------");

  try {
    // Attempt to add the agent to the central bus channel
    const result = await apiClient.addAgentToChannel(
      CENTRAL_BUS_CHANNEL_ID, 
      ZOYA_AGENT_ID
    );
    
    console.log("SUCCESS! Agent added to channel:");
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error("FAILED! Error adding agent to channel:");
    console.error(error);
    return false;
  }
}

// Execute the test
testAddAgentToChannel()
  .then(success => {
    if (success) {
      console.log("\nTest completed successfully!");
    } else {
      console.log("\nTest failed!");
    }
  })
  .catch(error => {
    console.error("Unexpected error during test:", error);
  });

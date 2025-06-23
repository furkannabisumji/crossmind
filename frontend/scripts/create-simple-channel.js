/**
 * Simple script to create a new channel and add an agent to it
 * Run with: node scripts/create-simple-channel.js
 */

const axios = require('axios');

const API_BASE_URL = 'https://crossmind.reponchain.com/api';
const TEST_AGENT_ID = '2e7fded5-6c90-0786-93e9-40e713a5e19d'; // Your agent ID

async function main() {
  try {
    console.log('=== Creating a new channel and adding agent ===');
    
    // Step 1: Create a new channel
    console.log('\nStep 1: Creating new channel...');
    const createResponse = await axios.post(`${API_BASE_URL}/messaging/channels`, {
      name: 'Agent Communication Channel',
      description: 'Channel for agent participation testing'
    });
    
    console.log('Channel created successfully!');
    const channelData = createResponse.data?.data?.channel;
    const channelId = channelData?.id;
    console.log(`Channel ID: ${channelId}`);
    console.log('Channel details:', channelData);
    
    if (!channelId) {
      console.error('Error: No channel ID returned');
      return;
    }
    
    // Step 2: Add agent to the newly created channel
    console.log(`\nStep 2: Adding agent ${TEST_AGENT_ID} to channel ${channelId}...`);
    
    try {
      const addAgentResponse = await axios.post(`${API_BASE_URL}/messaging/central-channels/${channelId}/agents`, {
        agentId: TEST_AGENT_ID
      });
      console.log('Agent added successfully!');
      console.log(addAgentResponse.data);
    } catch (error) {
      console.log(`Failed to add agent with central-channels endpoint: ${error.message}`);
      
      // Try alternative endpoint
      try {
        console.log('\nTrying alternative endpoint...');
        const altAddResponse = await axios.post(`${API_BASE_URL}/messaging/channels/${channelId}/agents`, {
          agentId: TEST_AGENT_ID
        });
        console.log('Agent added successfully with alternative endpoint!');
        console.log(altAddResponse.data);
      } catch (altError) {
        console.log(`Alternative endpoint also failed: ${altError.message}`);
        console.log('Error details:', altError.response?.data);
      }
    }
    
    // Return the channel ID for use in the application
    console.log(`\n=== IMPORTANT: USE THIS CHANNEL ID IN YOUR APP ===`);
    console.log(`Channel ID for agent communication: ${channelId}`);
    
  } catch (error) {
    console.error('Error creating channel:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

main().catch(error => console.error('Fatal error:', error));

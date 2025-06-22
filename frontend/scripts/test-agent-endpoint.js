/**
 * Simple test script for verifying agent-channel participation endpoint
 * Uses direct fetch calls rather than the API client
 */

// Constants
const API_BASE_URL = 'https://crossmind.reponchain.com/api';
const CENTRAL_BUS_CHANNEL_ID = '00000000-0000-0000-0000-000000000000';
const ZOYA_AGENT_ID = '2e7fded5-6c90-0786-93e9-40e713a5e19d';

async function testEndpoints() {
  console.log('Testing endpoints for adding agent to channel...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Channel ID: ${CENTRAL_BUS_CHANNEL_ID}`);
  console.log(`Agent ID: ${ZOYA_AGENT_ID}`);
  console.log('-----------------------------------------------');

  // Test various endpoint formats based on the ElizaOS architecture document
  const endpoints = [
    {
      name: 'messaging/central-channels/:channelId/agents',
      url: `${API_BASE_URL}/messaging/central-channels/${CENTRAL_BUS_CHANNEL_ID}/agents`,
      method: 'POST',
      body: { agentId: ZOYA_AGENT_ID }
    },
    {
      name: 'messaging/channels/:channelId/participants/:agentId',
      url: `${API_BASE_URL}/messaging/channels/${CENTRAL_BUS_CHANNEL_ID}/participants/${ZOYA_AGENT_ID}`,
      method: 'POST',
      body: { type: 'agent' }
    },
    {
      name: 'messaging/participants',
      url: `${API_BASE_URL}/messaging/participants`,
      method: 'POST',
      body: { channelId: CENTRAL_BUS_CHANNEL_ID, agentId: ZOYA_AGENT_ID, type: 'agent' }
    }
  ];

  let anySuccess = false;
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting endpoint: ${endpoint.name}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(endpoint.body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed with status: ${response.status}`);
        console.error(`Error: ${errorText}`);
      } else {
        const data = await response.json();
        console.log('SUCCESS! Response:');
        console.log(JSON.stringify(data, null, 2));
        anySuccess = true;
      }
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
    }
  }
  
  return anySuccess;
}

// Run the test
testEndpoints()
  .then(success => {
    console.log(success ? '\nTest passed!' : '\nTest failed!');
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });

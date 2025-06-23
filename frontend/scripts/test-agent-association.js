/**
 * Test script for verifying agent-channel association API endpoint
 * Tests the updated addAgentToChannel function in api.ts
 */

// Import required modules and utilities
// Note: We'll use direct fetch for testing rather than the API client
// to avoid bundling/transpilation issues in Node.js environment

// Constants
const API_BASE_URL = 'https://crossmind.reponchain.com';
const CENTRAL_BUS_CHANNEL_ID = '00000000-0000-0000-0000-000000000000';
const ZOYA_AGENT_ID = '2e7fded5-6c90-0786-93e9-40e713a5e19d';

async function testAddAgentToChannel() {
  console.log('Testing agent-channel association using updated endpoint...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Channel ID: ${CENTRAL_BUS_CHANNEL_ID}`);
  console.log(`Agent ID: ${ZOYA_AGENT_ID}`);
  console.log('-----------------------------------------------');

  // Test the correct endpoint format from the Postman collection
  const url = `${API_BASE_URL}/api/messaging/central-channels/${CENTRAL_BUS_CHANNEL_ID}/agents`;
  
  try {
    console.log(`Making POST request to: ${url}`);
    console.log(`Request body: ${JSON.stringify({ agentId: ZOYA_AGENT_ID })}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agentId: ZOYA_AGENT_ID })
    });
    
    let responseText;
    
    try {
      responseText = await response.text();
      const responseData = JSON.parse(responseText);
      console.log(`Response status: ${response.status}`);
      console.log('Response data:', JSON.stringify(responseData, null, 2));
      
      if (!response.ok) {
        console.error('Request failed with status:', response.status);
        return false;
      }
      
      console.log('Agent successfully added to channel!');
      return true;
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', responseText);
      console.error('Parse error:', parseError);
      return false;
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    return false;
  }
}

// Run the test
testAddAgentToChannel()
  .then(success => {
    console.log(success ? '\nTest passed! ✅' : '\nTest failed! ❌');
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });

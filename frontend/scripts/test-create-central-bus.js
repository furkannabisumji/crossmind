/**
 * Test script to create the central bus channel with a specific UUID
 * and then test agent participation on that channel.
 * 
 * Run with: node scripts/test-create-central-bus.js
 */

const axios = require('axios');

const API_BASE_URL = 'https://crossmind.reponchain.com/api';
const CENTRAL_BUS_ID = '00000000-0000-0000-0000-000000000000';
const TEST_AGENT_ID = '2e7fded5-6c90-0786-93e9-40e713a5e19d'; // Use your agent ID here

async function main() {
  try {
    console.log('=== Testing Central Bus Channel Creation ===');
    console.log(`Using API: ${API_BASE_URL}`);
    
    // Step 1: Try to get information about the central bus channel
    console.log(`\nStep 1: Checking if central bus channel exists (${CENTRAL_BUS_ID})...`);
    try {
      const centralChannelResponse = await axios.get(`${API_BASE_URL}/messaging/central-channels/${CENTRAL_BUS_ID}/details`);
      console.log('Central bus channel found!');
      console.log(centralChannelResponse.data);
    } catch (error) {
      console.log(`Central bus channel not found: ${error.response?.status} ${error.response?.statusText}`);
      console.log('Error details:', error.response?.data);
      
      // Step 2: Try to create the central bus channel with the specific UUID
      console.log('\nStep 2: Creating central bus channel...');
      try {
        const createResponse = await axios.post(`${API_BASE_URL}/messaging/channels`, {
          id: CENTRAL_BUS_ID,
          name: 'Central Message Bus',
          description: 'Main message routing channel for all agent communications'
        });
        console.log('Channel created successfully!');
        console.log(createResponse.data);
      } catch (createError) {
        console.log(`Failed to create channel: ${createError.response?.status} ${createError.response?.statusText}`);
        console.log('Error details:', createError.response?.data);
        
        // Try with alternative endpoint
        console.log('\nAttempting with alternative endpoint...');
        try {
          const altCreateResponse = await axios.post(`${API_BASE_URL}/messaging/central-channels`, {
            id: CENTRAL_BUS_ID,
            name: 'Central Message Bus',
            description: 'Main message routing channel for all agent communications'
          });
          console.log('Channel created successfully with alternative endpoint!');
          console.log(altCreateResponse.data);
        } catch (altCreateError) {
          console.log(`Alternative endpoint also failed: ${altCreateError.response?.status} ${altCreateError.response?.statusText}`);
          console.log('Error details:', altCreateError.response?.data);
        }
      }
    }
    
    // Step 3: Try to list all channels to find candidates for the central bus
    console.log('\nStep 3: Listing all channels to find central bus candidates...');
    
    // Try different endpoints to find the one that works
    const endpoints = [
      '/messaging/channels',
      '/messaging/central-channels',
      '/messaging/servers/central/channels'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const listResponse = await axios.get(`${API_BASE_URL}${endpoint}`);
        console.log(`Success with endpoint: ${endpoint}`);
        
        const channels = listResponse.data?.data?.channels || [];
        console.log(`Found ${channels.length} channels:`);
        
        // Look for potential central bus channels
        const centralCandidates = channels.filter(c => 
          (c.id && c.id.includes('00000000')) || 
          (c.name && c.name.toLowerCase().includes('central')) ||
          (c.type && c.type.toLowerCase().includes('bus'))
        );
        
        console.log('\nPotential central bus channels:');
        centralCandidates.forEach(channel => {
          console.log(`- ID: ${channel.id}, Name: ${channel.name || 'Unnamed'}, Type: ${channel.type || 'Unknown'}`);
        });
        
        // Show all channels
        console.log('\nAll channels:');
        channels.forEach(channel => {
          console.log(`- ID: ${channel.id}, Name: ${channel.name || 'Unnamed'}, Type: ${channel.type || 'Unknown'}`);
        });
        
        break; // Break out of loop if successful
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed: ${error.response?.status} ${error.message}`);
      }
    }
    
    // Step 4: Try to add agent to the central bus channel
    console.log(`\nStep 4: Adding agent ${TEST_AGENT_ID} to central bus channel...`);
    try {
      const addAgentResponse = await axios.post(`${API_BASE_URL}/messaging/central-channels/${CENTRAL_BUS_ID}/agents`, {
        agentId: TEST_AGENT_ID
      });
      console.log('Agent added successfully!');
      console.log(addAgentResponse.data);
    } catch (error) {
      console.log(`Failed to add agent: ${error.response?.status} ${error.response?.statusText}`);
      console.log('Error details:', error.response?.data);
      
      // Try alternative endpoint format
      console.log('\nTrying alternative endpoint format...');
      try {
        const altAddResponse = await axios.post(`${API_BASE_URL}/messaging/channels/${CENTRAL_BUS_ID}/agents`, {
          agentId: TEST_AGENT_ID
        });
        console.log('Agent added successfully with alternative endpoint!');
        console.log(altAddResponse.data);
      } catch (altError) {
        console.log(`Alternative endpoint also failed: ${altError.response?.status} ${altError.response?.statusText}`);
        console.log('Error details:', altError.response?.data);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

main().catch(error => console.error('Fatal error:', error));

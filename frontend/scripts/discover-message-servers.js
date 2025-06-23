/**
 * Script to discover message servers and use them to create a channel
 * Run with: node scripts/discover-message-servers.js
 */

const axios = require('axios');

const API_BASE_URL = 'https://crossmind.reponchain.com/api';
const TEST_AGENT_ID = '2e7fded5-6c90-0786-93e9-40e713a5e19d'; // Your agent ID

async function main() {
  try {
    console.log('=== Discovering Message Servers ===');
    
    // Try various endpoints to discover servers
    const serverEndpoints = [
      '/messaging/servers',
      '/messaging/central-servers',
      '/messaging/message-servers'
    ];
    
    let servers = [];
    let foundServers = false;
    
    for (const endpoint of serverEndpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        servers = response.data?.data?.servers || [];
        console.log(`Found ${servers.length} servers with endpoint ${endpoint}`);
        
        if (servers.length > 0) {
          foundServers = true;
          
          console.log('\nServer List:');
          servers.forEach(server => {
            console.log(`- ID: ${server.id}`);
            console.log(`  Name: ${server.name || 'Unnamed'}`);
            console.log(`  Type: ${server.type || 'Unknown'}`);
            console.log('  Details:', JSON.stringify(server, null, 2));
            console.log('');
          });
          
          break;
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed: ${error.message}`);
      }
    }
    
    if (!foundServers) {
      // If no servers found, try creating a central server
      console.log('\nNo servers found. Attempting to create a server...');
      
      try {
        const createServerResponse = await axios.post(`${API_BASE_URL}/messaging/servers`, {
          name: 'Central Server',
          type: 'central'
        });
        
        console.log('Server created!');
        console.log(createServerResponse.data);
        
        const serverId = createServerResponse.data?.data?.server?.id;
        if (serverId) {
          console.log(`\nUsing new server ID: ${serverId}`);
          servers = [{ id: serverId, name: 'Central Server', type: 'central' }];
          foundServers = true;
        }
      } catch (createError) {
        console.log(`Failed to create server: ${createError.message}`);
      }
    }
    
    if (!foundServers || servers.length === 0) {
      console.log('Could not find or create any servers. Cannot proceed with channel creation.');
      return;
    }
    
    // Use the first server to create a channel
    const serverId = servers[0].id;
    console.log(`\n=== Creating channel on server ${serverId} ===`);
    
    const createResponse = await axios.post(`${API_BASE_URL}/messaging/channels`, {
      messageServerId: serverId,
      name: 'Agent Test Channel',
      type: 'group'
    });
    
    console.log('Channel created successfully!');
    const channelData = createResponse.data?.data?.channel;
    const channelId = channelData?.id;
    console.log(`Channel ID: ${channelId}`);
    console.log('Channel details:', JSON.stringify(channelData, null, 2));
    
    if (!channelId) {
      console.error('Error: No channel ID returned');
      return;
    }
    
    // Add agent to the channel
    console.log(`\n=== Adding agent ${TEST_AGENT_ID} to channel ${channelId} ===`);
    
    // Try with /messaging/channels/:channelId/agents endpoint
    try {
      const addAgentResponse = await axios.post(`${API_BASE_URL}/messaging/channels/${channelId}/agents`, {
        agentId: TEST_AGENT_ID
      });
      console.log('Agent added successfully!');
      console.log(addAgentResponse.data);
    } catch (error) {
      console.log(`Failed with /messaging/channels endpoint: ${error.message}`);
      
      // Try with /messaging/central-channels/:channelId/agents
      try {
        const altAddResponse = await axios.post(`${API_BASE_URL}/messaging/central-channels/${channelId}/agents`, {
          agentId: TEST_AGENT_ID
        });
        console.log('Agent added successfully with central-channels endpoint!');
        console.log(altAddResponse.data);
      } catch (altError) {
        console.log(`Failed with central-channels endpoint: ${altError.message}`);
      }
    }
    
    console.log(`\n=== IMPORTANT: USE THIS CHANNEL ID ===`);
    console.log(`Channel ID for agent communication: ${channelId}`);
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

main().catch(error => console.error('Fatal error:', error));

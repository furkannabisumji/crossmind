# Zoya Agent Integration Documentation

## Overview

This document provides a comprehensive guide to the integration of the Zoya AI agent within the CrossMind application. Zoya operates as a financial advisor agent that interacts with users through the ElizaOS messaging platform.

## Architecture

The integration follows a client-server architecture with several key components:

- **ElizaOS Backend:** Centralized message bus (`00000000-0000-0000-0000-000000000000`) handling all message routing
- **Dynamic Channels:** Individual chat sessions between users and the Zoya agent
- **SocketIO:** Handles real-time message reception (subscribing to channels)
- **REST API:** Used for sending messages and managing agent-channel relationships
- **React Frontend:** User interface for interacting with the agent

## Integration Flow

### 1. User Authentication & Session Initialization

When a user accesses the strategy page, the application:

1. Authenticates the user via WalletConnect
2. Retrieves the user's wallet address
3. Initializes ElizaOS socket connection with user identity
4. Creates a dynamic channel specific to this session
5. Adds the Zoya agent to the dynamic channel
6. Sends an initial greeting message

### 2. Channel Management

Dynamic channels provide isolation between different user sessions:

- Each user session creates a unique channel: `Agent Channel {timestamp}`
- Channel creation occurs through REST API: `POST /messaging/channels`
- The agent is added to the channel via: `POST /messaging/central-channels/{channelId}/agents`
- User joins the channel through Socket.IO: `socketIOManager.joinChannel(channelId)`

### 3. Message Handling

#### Message Sending

Messages are sent to the agent through a REST-first approach with Socket.IO fallback:

1. REST API (`POST /api/messaging/submit`):
   - Primary message delivery method
   - Includes channel_id, server_id, author_id, content, and metadata
   - Returns success/error status

2. Socket.IO Fallback:
   - Used only if REST API fails
   - Emits to the same channel via Socket.IO connection
   - Does not provide reliable acknowledgements

#### Message Receiving

Incoming messages (including agent responses) are received exclusively through Socket.IO:

1. Connection established to `https://crossmind.reponchain.com` WebSocket
2. Frontend subscribes to the dynamic channel and central message bus
3. `messageBroadcast` events are filtered by channelId
4. Messages are processed and added to the UI

### 4. Agent Communication Lifecycle

1. **Initialization**
   ```typescript
   // Create unique session channel
   const response = await apiClient.addAgentToDynamicChannel(contextId);
   const dynamicChannelId = response?.data?.channelId;
   
   // Connect to channel via WebSocket
   socketIOManager.initialize(currentUserId);
   socketIOManager.joinChannel(dynamicChannelId);
   ```

2. **Sending User Message**
   ```typescript
   // Structured REST API call
   const restPayload = {
     channel_id: channelId,
     server_id: serverId,
     author_id: contextId,     // Agent ID required by backend validation
     content: text,
     source_type: "user",      // Source attribution for UI rendering
     raw_message: JSON.stringify({
       text: text,
       attachments: attachments || [],
       metadata: enhancedMetadata
     }),
     agentId: contextId
   };
   ```

3. **Receiving Agent Response**
   ```typescript
   // Socket.IO event handler
   socketIOManager.on('messageBroadcast', (data) => {
     // Filter by channel
     if (data.channelId === channelId) {
       // Process and display message
       onAddMessage({
         id: data.id,
         content: data.text,
         timestamp: data.createdAt,
         isAgent: data.senderId !== currentUserId,
         status: "delivered",
         // Additional message properties
       });
     }
   });
   ```

4. **Session Termination**
   ```typescript
   // Cleanup on component unmount
   socketIOManager.leaveChannel(channelId);
   ```

## Custom React Hooks

The Zoya integration uses the following React hooks to implement the agent communication flow:

### `useSocketChat` (`hooks/use-socket-chat.ts`)

Core communication hook that handles real-time messaging with agents.

**Responsibilities:**
- Manages WebSocket subscriptions to channels
- Handles message sending with REST API and Socket.IO fallback
- Processes incoming socket events (`messageBroadcast`, etc.)
- Maintains channel subscription state
- Classifies messages by sender type (agent vs user)

**Usage in StrategyPage:**
```tsx
const socketChat = useSocketChat({
  channelId: dynamicChannelId,
  currentUserId: address || "00000000-0000-0000-0000-000000000000",
  contextId: "2e7fded5-6c90-0786-93e9-40e713a5e19d" as const,
  chatType: ChannelType.DM,
  allAgents: [],
  messages,
  onAddMessage: (message: UiMessage) => { /* Add message to state */ },
  onUpdateMessage: (messageId: string, updates: Partial<Message>) => { /* Update message */ },
  onDeleteMessage: (messageId: string) => { /* Delete message */ },
  onClearMessages: () => setMessages([]),
  onInputDisabledChange: (disabled: boolean) => setIsInputDisabled(disabled),
});

const { sendMessage } = socketChat || {};
```

### API Client (`lib/api.ts`)

Provides direct access to backend API endpoints for agent communication.

**Responsibilities:**
- Creates dynamic channels for agent communication
- Adds agents to channels
- Verifies agent registration and status
- Submits messages via REST API

**Usage in StrategyPage:**
```tsx
// Create channel and add agent
apiClient.addAgentToDynamicChannel(contextId).then((result) => {
  const channelId = result.data.channelId as UUID;
  setDynamicChannelId(channelId);
  
  // Verify agent is in channel
  apiClient.getAgentsForChannel(channelId).then(result => {
    const isAgentActive = result?.data?.participants?.includes(contextId);
  });
  
  // Check agent status
  apiClient.getAgent(contextId).then(agentData => {
    console.log(`Agent status: ${agentData?.data?.status}`);
  });
});
```

### Financial Integration Hooks

**useTokenApproval** - Handles token approval for DeFi transactions
```tsx
const { checkAllowance, approveTokens } = useTokenApproval();
```

**useVault** - Manages vault interactions for deposits/withdrawals
```tsx
const { deposit } = useVault();
```

**useAccount** - Provides wallet connection state and address
```tsx
const { isConnected, address } = useAccount();
```
```

## Component Responsibilities

### Strategy Page (`app/dashboard/strategy/page.tsx`)
- Creates dynamic agent channel
- Adds Zoya agent to channel
- Initializes chat with greeting
- Handles user deposit/send actions
- Verifies agent channel registration

### SocketIO Manager (`lib/socketio-manager.ts`)
- Establishes WebSocket connection
- Joins/leaves channels
- Emits and receives message events
- Manages connection state

### API Client (`lib/api.ts`)
- Handles REST API communication
- Creates channels
- Adds agents to channels
- Submits messages via REST

## API Endpoint Reference

The integration with the ElizaOS backend relies on the following key API endpoints:

### Agent Communication Endpoints

| Endpoint | Method | Description | Required Parameters |
|----------|--------|-------------|--------------------|
| `/messaging/channels` | POST | Creates a new dynamic channel | `messageServerId`, `name`, `type`, `description` |
| `/messaging/central-channels/{channelId}/agents` | POST | Adds an agent to a channel | `agentId` |
| `/messaging/submit` | POST | Submits a message via REST API | `channel_id`, `server_id`, `author_id`, `content`, `source_type`, `raw_message` |
| `/messaging/central-channels/{channelId}/messages` | GET | Retrieves message history for a channel | `channelId`, `limit` |
| `/agents` | GET | Lists all available agents | none |
| `/agents/{agentId}` | GET | Gets status and details for a specific agent | `agentId` |

### API Request Examples

#### Creating a Dynamic Channel
```json
POST /messaging/channels
{
  "messageServerId": "00000000-0000-0000-0000-000000000000",
  "name": "Agent Channel 1687528904123",
  "type": "group",
  "description": "Dynamic channel created for agent 2e7fded5-6c90-0786-93e9-40e713a5e19d"
}
```

#### Adding Agent to Channel
```json
POST /messaging/central-channels/f8a7b6c5-d4e3-2f1g-0h9i-j8k7l6m5n4o3/agents
{
  "agentId": "2e7fded5-6c90-0786-93e9-40e713a5e19d"
}
```

#### Submitting a Message
```json
POST /messaging/submit
{
  "channel_id": "f8a7b6c5-d4e3-2f1g-0h9i-j8k7l6m5n4o3",
  "server_id": "00000000-0000-0000-0000-000000000000",
  "author_id": "2e7fded5-6c90-0786-93e9-40e713a5e19d",
  "content": "What investment strategy would you recommend?",
  "source_type": "user",
  "raw_message": "{\"text\":\"What investment strategy would you recommend?\",\"attachments\":[],\"metadata\":{\"actualAuthorId\":\"0x1a2b3c4d5e6f7g8h9i\"}}" 
}
```

## Message Flow Sequence Diagrams

### User Session Initialization

```
+---------+       +------------+       +----------------+      +----------+
|  User   |       |   React    |       |  ElizaOS API   |      |  Agent   |
|         |       |  Frontend  |       |                |      |          |
+---------+       +------------+       +----------------+      +----------+
     |                   |                     |                    |
     | Connect Wallet    |                     |                    |
     |------------------>|                     |                    |
     |                   | Create Dynamic      |                    |
     |                   | Channel             |                    |
     |                   |------------------->|                    |
     |                   |                     | Channel Created    |
     |                   |<-------------------|                    |
     |                   | Add Agent to       |                    |
     |                   | Channel            |                    |
     |                   |------------------->|                    |
     |                   |                     |------------------>|
     |                   |                     | Agent Added       |
     |                   |<-------------------|                    |
     |                   | Open Socket.IO     |                    |
     |                   | Connection         |                    |
     |                   |------------------->|                    |
     |                   | Join Channel       |                    |
     |                   |------------------->|                    |
     |                   |                     |                    |
     |                   | Send Greeting      |                    |
     |                   |------------------->|                    |
     |                   |                     |------------------>|
     |                   |                     |                    |
     |                   |                     | Process Message    |
     |                   |                     |<------------------|      
     |                   |                     | Agent Response    |      
     |                   |<-------------------|<------------------|
     |  Display Agent    |                     |                    |
     |  Response         |                     |                    |
     |<------------------|                     |                    |
     |                   |                     |                    |
```

### Message Exchange Flow

```
+---------+       +------------+       +----------------+      +----------+
|  User   |       |   React    |       |  ElizaOS API   |      |  Agent   |
|         |       |  Frontend  |       |                |      |          |
+---------+       +------------+       +----------------+      +----------+
     |                   |                     |                    |
     | Send Message      |                     |                    |
     |------------------>|                     |                    |
     |                   | Submit Message      |                    |
     |                   | via REST API        |                    |
     |                   |------------------->|                    |
     |                   |                     |------------------>|
     |                   |                     | Message Delivered |<---------+
     |                   |<-------------------|                    |         |
     |                   |                     |                    |         |
     |                   |                     | Process Message    |         |
     |                   |                     |<------------------|         |
     |                   |                     |                    |         |
     |                   |                     | Agent Response     |         |
     |                   |                     |<------------------|         |
     |                   |                     |                    |         |
     |                   |  messageBroadcast   |                    |         |
     |                   |<-------------------|------------------>|         |
     |                   |                     |                    |         |
     |  Display Agent    |                     |                    |         |
     |  Response         |                     |                    |         |
     |<------------------|                     |                    |         |
     |                   |                     |                    |         |
```

## Environment Configuration

The integration requires several environment variables:

```
ELIZA_API_URL=https://crossmind.reponchain.com
ELIZA_AGENT_ID=<zoya-agent-uuid>
ELIZA_SERVER_ID=00000000-0000-0000-0000-000000000000
```

## Troubleshooting

### Common Issues

#### Agent Does Not Respond to Messages

1. **Verify agent registration**
   - Check that the agent is added to the channel using `apiClient.getAgentsForChannel(channelId)`
   - Verify agent status using `apiClient.getAgent(agentId)` - status should be "available"
   - Look for 404/401 errors in the network logs which may indicate authentication issues

2. **Socket.IO connectivity issues**
   - Verify socket connection is established (look for connection logs)
   - Check if channel join succeeded ("Joined channel" message in logs)
   - Test if socket is actually receiving broadcasts with `socket.on('*', console.log)`
   - Try manually inspecting connection state via `socketIOManager.isConnected()`

3. **Message format problems**
   - Ensure all required message fields are included:
     ```js
     {
       channel_id: "uuid",
       server_id: "uuid",
       author_id: "uuid", // User ID
       content: "message content",
       source_type: "user",
       raw_message: JSON.stringify({
         text: "message content",
         attachments: [],
         metadata: { actualAuthorId: "wallet address" }
       })
     }
     ```
   - Check if `channelId` is defined when message is sent
   - Ensure user address is available and correctly formatted

4. **Backend errors**
   - Review server logs for error messages related to agent processing
   - Verify server response codes for message submission endpoints
   - Check if any rate limiting is being applied to requests
   - Look for timeout errors in processing lengthy requests

#### Socket.IO Connection Fails

1. **Connection configuration problems**
   - Verify correct Socket.IO URL: `https://crossmind.reponchain.com`
   - Ensure path is configured as `/socket.io` (not `/api/socket.io`)
   - Set `secure: true` for HTTPS connections
   - Check transport settings - try forcing websockets with `transports: ['websocket']`
  
2. **Network and CORS issues**
   - Check browser console for CORS errors 
   - Verify your origin is allowed by the backend
   - Try using a proxy server or Next.js API routes to bypass CORS
   - Ensure the client's network can access the Socket.IO endpoint (check firewalls)

3. **Advanced Diagnostics**
   - Enable Socket.IO debug logs: `localStorage.setItem('debug', '*');`
   - Use network inspection tools to verify connection establishment
   - Implement ping/pong health checks to verify connection stability
   - Test with a simple Socket.IO client outside your app to isolate issues

3. Confirm message filtering is correct:
   - Check if channelId is defined when filtering messages
   - Verify message.channelId matches the expected dynamic channel

## Security Considerations

1. **Authentication**: All messages contain user identification for proper attribution
2. **Channel Isolation**: Dynamic channels prevent cross-talk between user sessions
3. **Metadata Handling**: Sensitive information should not be included in message metadata

## Conclusion

The Zoya agent integration provides users with an interactive financial advisor through a robust messaging architecture. The combination of REST APIs for reliable message delivery and Socket.IO for real-time updates enables responsive conversations while maintaining consistent message state.

Future enhancements could include:
- Improved error handling and retry mechanisms
- Enhanced agent status monitoring
- Support for rich media attachments
- Persistent conversation history

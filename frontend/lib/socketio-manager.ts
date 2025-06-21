// Import safely for both client and server environments
import { io as ioImport, Socket } from "socket.io-client";

// Use the imported io function if we're in a browser environment
const io = typeof window !== "undefined" ? ioImport : null;

interface SocketIOEventListener {
  (data: any): void;
}

interface SocketIOEvents {
  [event: string]: Set<SocketIOEventListener>;
}

// Socket message types from ElizaOS core
// Using constants instead of enum for exact value matching
const SOCKET_MESSAGE_TYPE = {
  ROOM_JOINING: 1,
  SEND_MESSAGE: 2,
  MESSAGE: 3,
  ACK: 4,
  THINKING: 5,
  CONTROL: 6,
} as const;

// Direct connection to ElizaOS server for Socket.IO
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "https://crossmind.reponchain.com";

// Types for ElizaOS Socket.IO events
export type MessageBroadcastData = {
  senderId: string;
  senderName: string;
  text: string;
  channelId: string;
  roomId?: string;
  createdAt: number;
  source: string;
  name: string;
  attachments?: any[];
  thought?: string;
  actions?: string[];
  prompt?: string;
  [key: string]: any;
};

export type MessageCompleteData = {
  channelId: string;
  roomId?: string;
  [key: string]: any;
};

/**
 * SocketIOManager handles real-time communication with ElizaOS
 */
class SocketIOManager {
  private static instance: SocketIOManager | null = null;
  private socket: Socket | null = null;
  private isConnected = false;
  private activeRooms: Set<string> = new Set();
  private activeChannels: Set<string> = new Set(); // Added for channel-based messaging
  private entityId: string | null = null;
  private serverId: string | null = null;
  private activeSessionChannelId: string | null = null;
  private resolveConnect: (() => void) | null = null;
  private connectPromise: Promise<void> | null = null;
  private listeners: Record<string, Set<(data: any) => void>> = {};

  private constructor() {
    // Initialize listeners sets
    this.listeners.messageBroadcast = new Set();
    this.listeners.messageComplete = new Set();
  }

  public static getInstance(): SocketIOManager {
    if (!SocketIOManager.instance) {
      SocketIOManager.instance = new SocketIOManager();
    }
    return SocketIOManager.instance;
  }

  /**
   * Initialize the Socket.io connection to the server
   * @param entityId The client entity ID
   * @param serverId Server ID for channel-based messaging
   */
  public initialize(entityId: string, serverId?: string): void {
    this.entityId = entityId;
    this.serverId = serverId || "00000000-0000-0000-0000-000000000000";

    if (this.socket) {
      console.warn("[Socket.IO] Socket already initialized");
      return;
    }

    if (!io || typeof window === "undefined") {
      console.error("[Socket.IO] Cannot initialize: Socket.io not available");
      return;
    }

    console.info("[Socket.IO] Connecting to", SOCKET_URL);

    // Create a single socket connection
    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ["polling", "websocket"], // Try polling first
      forceNew: false,
      upgrade: true,
    });

    this.socket.on("connect", () => {
      console.log("[Socket.IO] Connected to server");
      console.log("[Socket.IO] Socket ID:", this.socket?.id);
      this.isConnected = true;

      // Rejoin any active rooms after reconnection
      this.activeRooms.forEach((roomId) => {
        this.joinRoom(roomId);
      });
    });

    // Add debugging for all incoming events
    // Using optional chaining to safely access socket
    this.socket?.onAny((eventName: string, ...args: unknown[]) => {
      console.log(`[Socket.IO] Received event '${eventName}':`, args);
    });

    // Listen for all possible message event names the server might use
    const messageEventNames = [
      "messageBroadcast",
      "message",
      "chat_message",
      "response",
      "agent_response",
      "chat_response",
    ];

    messageEventNames.forEach((eventName) => {
      this.socket?.on(eventName, (data: any) => {
        console.log(
          `[Socket.IO] Message received on '${eventName}' event:`,
          data
        );

        // Try to extract the roomId from various possible locations in the data structure
        const roomId =
          data.roomId ||
          data.room_id ||
          (data.payload && data.payload.roomId) ||
          (data.metadata && data.metadata.roomId);

        // Check if this message is for any of our joined rooms
        const isActiveRoom = roomId && this.activeRooms.has(roomId);

        // Also check if this is a broadcast to all
        const isBroadcast = !roomId; // If no roomId, assume it's a broadcast

        if (isActiveRoom || isBroadcast) {
          console.log(
            `[Socket.IO] Handling message for ${
              isActiveRoom ? "room " + roomId : "broadcast"
            }`
          );

          // Try to extract the text content from various possible locations
          const text =
            data.text ||
            data.content ||
            data.message ||
            (data.payload && data.payload.text) ||
            (data.payload && data.payload.message) ||
            (data.payload && data.payload.content) ||
            JSON.stringify(data);

          // Notify all message broadcast listeners
          this.listeners.messageBroadcast.forEach((listener) => {
            listener({
              text,
              senderId: data.senderId || "agent",
              senderName: data.senderName || "Agent",
              name: data.senderName || data.name || "Agent",
              roomId: roomId,
              createdAt: data.createdAt || Date.now(),
              source: data.source || "agent",
              ...data, // Include all original data as well
            });
          });
        }
      });
    });

    // Listen for completion events
    this.socket.on("messageComplete", (data: any) => {
      console.log(`[Socket.IO] Message complete:`, data);
      this.listeners.messageComplete.forEach((listener) => {
        listener(data);
      });
    });

    // Listen for generic message event
    this.socket.on("message", (data: any) => {
      console.log(`[Socket.IO] Generic message event:`, data);
      // Process only if it's a response (type 3 - MESSAGE)
      if (data && data.type === 3) {
        this.listeners.messageBroadcast.forEach((listener) => {
          const payload = data.payload || {};
          const text =
            payload.text ||
            payload.message ||
            payload.content ||
            JSON.stringify(payload);
          listener({
            text,
            senderId: payload.senderId || "agent",
            senderName: payload.senderName || "Agent",
            name: payload.senderName || payload.name || "Agent",
            createdAt: payload.createdAt || Date.now(),
            source: payload.source || "agent",
            ...payload,
          });
        });
      }
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log(`[Socket.IO] Disconnected. Reason: ${reason}`);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error: { message: string }) => {
      console.error("[Socket.IO] Connection error:", error.message);
    });

    // Listen for messageError events
    this.socket.on("messageError", (error: any) => {
      console.error(
        "[Socket.IO] Message error:",
        JSON.stringify(error, null, 2)
      );
    });
  }

  /**
   * Register a listener for message broadcast events
   */
  public onMessageBroadcast(
    callback: (data: MessageBroadcastData) => void
  ): () => void {
    this.listeners.messageBroadcast.add(callback);
    return () => {
      this.listeners.messageBroadcast.delete(callback);
    };
  }

  /**
   * Register a listener for message complete events
   */
  public onMessageComplete(
    callback: (data: MessageCompleteData) => void
  ): () => void {
    this.listeners.messageComplete.add(callback);
    return () => {
      this.listeners.messageComplete.delete(callback);
    };
  }

  /**
   * Join a room/channel to receive messages, with both channel and room support
   */
  public async joinRoom(roomId: string): Promise<void> {
    if (!this.socket) {
      console.error("[Socket.IO] Cannot join room: socket not initialized");
      return;
    }

    if (!this.isConnected) {
      console.warn("[Socket.IO] Not connected, will join after connection");
      this.activeRooms.add(roomId);
      return;
    }

    // Add to active rooms set
    this.activeRooms.add(roomId);

    // Add to active channels (using roomId as channelId)
    this.activeChannels.add(roomId);

    const serverId = "00000000-0000-0000-0000-000000000000";

    // First join as a channel (new style) - using literal number 1 instead of enum to avoid any issues
    this.socket.emit("message", {
      type: 1, // ROOM_JOINING
      payload: {
        channelId: roomId,
        serverId: serverId,
        entityId: this.entityId,
        metadata: { isDm: false },
      },
    });

    // Also join as a room (backward compatibility)
    this.socket.emit("message", {
      type: 1, // ROOM_JOINING literal number
      payload: {
        roomId,
        entityId: this.entityId,
      },
    });

    console.log(
      `[Socket.IO] Joined room/channel ${roomId} with server ID ${serverId}`
    );
  }

  /**
   * Send a message through Socket.IO, matching ElizaOS server expectations
   */
  public async sendMessage(
    message: string,
    channelId: string,
    agentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.socket) {
      console.error("[Socket.IO] Cannot send message: socket not initialized");
      throw new Error("Socket not initialized");
    }

    // Wait for connection if needed
    if (!this.isConnected) {
      console.info(
        "[Socket.IO] Waiting for connection before sending message..."
      );

      if (!this.connectPromise) {
        this.connectPromise = new Promise<void>((resolve) => {
          this.resolveConnect = resolve;
        });
      }

      try {
        await Promise.race([
          this.connectPromise,
          new Promise<void>((_, reject) => {
            setTimeout(
              () => reject(new Error("Socket connection timeout")),
              5000
            );
          }),
        ]);
      } catch (error) {
        console.error("[Socket.IO] Connection timeout:", error);
        throw new Error("Socket connection timeout");
      }
    }

    // Make sure we've joined the room/channel
    await this.joinRoom(channelId);

    console.info("[Socket.IO] Sending message to", channelId);

    // Using server ID from initialization or default
    const serverId = this.serverId || "00000000-0000-0000-0000-000000000000";

    // Basic approach - use parameters directly without manipulation
    console.log("[Socket.IO] Building message using standard structure");
    
    // Generate IDs
    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Get server ID from metadata if available (from useZoyaStrategy)
    const metadataServerId = metadata?.serverId || metadata?.server_id;
    const effectiveServerId = metadataServerId || serverId || "00000000-0000-0000-0000-000000000000";
    
    // Create the simplest possible message structure for SEND_MESSAGE
    // Structure each field exactly as required in the error message
    const simplifiedPayload = {
      // Required fields (mentioned in error message)
      channelId: channelId,
      serverId: effectiveServerId, 
      server_id: effectiveServerId,
      senderId: this.entityId, 
      author_id: this.entityId,
      message: message,
      
      // Optional fields
      agentId: agentId || null,
      messageId: messageId,
      type: 2, // SEND_MESSAGE type
    };
    
    // Log what we're sending
    console.log("=== DEBUGGING MESSAGE OBJECT ===");
    console.log("Socket connected:", this.socket.connected);
    console.log("Final message payload:", JSON.stringify(simplifiedPayload, null, 2));
    
    // Validate required fields are present
    if (!simplifiedPayload.channelId) {
      console.error("[Socket.IO] Missing channelId!");
      throw new Error("Missing channelId for Socket.IO message");
    }
    
    if (!simplifiedPayload.serverId) {
      console.error("[Socket.IO] Missing serverId!");
      throw new Error("Missing serverId for Socket.IO message");
    }
    
    if (!simplifiedPayload.senderId) {
      console.error("[Socket.IO] Missing senderId!");
      throw new Error("Missing senderId for Socket.IO message");
    }
    
    if (!simplifiedPayload.message) {
      console.error("[Socket.IO] Missing message content!");
      throw new Error("Missing message content for Socket.IO message");
    }
    
    // Try with the simplest approach first - just send the bare minimum required
    console.log("[Socket.IO] Emitting SEND_MESSAGE event");
    this.socket.emit("SEND_MESSAGE", simplifiedPayload);
    
    console.log("[Socket.IO] Emitting message event");
    this.socket.emit("message", simplifiedPayload);
    
    // Try with a wrapper format as a backup
    const wrappedPayload = {
      type: 2, // SEND_MESSAGE type
      payload: simplifiedPayload
    };
    
    console.log("[Socket.IO] Emitting with wrapped payload");
    this.socket.emit("message", wrappedPayload);

    // Emit a local event immediately for UI update
    if (
      this.listeners.messageBroadcast &&
      this.listeners.messageBroadcast.size > 0
    ) {
      const localMessage = {
        text: message,
        senderId: this.entityId || "",
        senderName: "User",
        name: "User",
        channelId: channelId,
        roomId: channelId, // For backward compatibility
        createdAt: Date.now(),
        source: "client_chat",
      };

      this.listeners.messageBroadcast.forEach((listener) => {
        listener(localMessage);
      });
    }
  }
}

export default SocketIOManager;

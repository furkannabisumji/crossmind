import { USER_NAME } from "@/constants";
import { SOCKET_MESSAGE_TYPE } from "@elizaos/core";
import { Evt } from "evt";
import { io, type Socket } from "socket.io-client";
import { randomUUID } from "./utils";
import clientLogger from "./logger";

// Define types for the events
export type MessageBroadcastData = {
  senderId: string;
  senderName: string;
  text: string;
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  createdAt: number;
  source: string;
  name: string; // Required for ContentWithUser compatibility
  attachments?: any[];
  thought?: string; // Agent's thought process
  actions?: string[]; // Actions taken by the agent
  prompt?: string; // The LLM prompt used to generate this message
  [key: string]: any;
};

export type MessageCompleteData = {
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

// Define type for control messages
export type ControlMessageData = {
  action: "enable_input" | "disable_input";
  target?: string;
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

// Define type for message deletion events
export type MessageDeletedData = {
  messageId: string;
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

// Define type for channel cleared events
export type ChannelClearedData = {
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

// Define type for channel deleted events
export type ChannelDeletedData = {
  channelId: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: any;
};

// Define type for log stream messages
export type LogStreamData = {
  level: number;
  time: number;
  msg: string;
  agentId?: string;
  agentName?: string;
  channelId?: string;
  roomId?: string; // Deprecated - for backward compatibility only
  [key: string]: string | number | boolean | null | undefined;
};

// A simple class that provides EventEmitter-like interface using Evt internally
class EventAdapter {
  private events: Record<string, Evt<any>> = {};

  constructor() {
    // Initialize common events
    this.events.messageBroadcast = Evt.create<MessageBroadcastData>();
    this.events.messageComplete = Evt.create<MessageCompleteData>();
    this.events.controlMessage = Evt.create<ControlMessageData>();
    this.events.messageDeleted = Evt.create<MessageDeletedData>();
    this.events.channelCleared = Evt.create<ChannelClearedData>();
    this.events.channelDeleted = Evt.create<ChannelDeletedData>();
    this.events.logStream = Evt.create<LogStreamData>();
  }

  on(eventName: string, listener: (...args: any[]) => void) {
    if (!this.events[eventName]) {
      this.events[eventName] = Evt.create();
    }

    this.events[eventName].attach(listener);
    return this;
  }

  off(eventName: string, listener: (...args: any[]) => void) {
    if (this.events[eventName]) {
      const handlers = this.events[eventName].getHandlers();
      for (const handler of handlers) {
        if (handler.callback === listener) {
          handler.detach();
        }
      }
    }
    return this;
  }

  emit(eventName: string, ...args: any[]) {
    if (this.events[eventName]) {
      this.events[eventName].post(args.length === 1 ? args[0] : args);
    }
    return this;
  }

  once(eventName: string, listener: (...args: any[]) => void) {
    if (!this.events[eventName]) {
      this.events[eventName] = Evt.create();
    }

    this.events[eventName].attachOnce(listener);
    return this;
  }

  // For checking if EventEmitter has listeners
  listenerCount(eventName: string): number {
    if (!this.events[eventName]) return 0;
    return this.events[eventName].getHandlers().length;
  }

  // Used only for internal access to the Evt instances
  _getEvt(eventName: string): Evt<any> | undefined {
    return this.events[eventName];
  }
}

/**
 * SocketIOManager handles real-time communication between the client and server
 * using Socket.io. It maintains a single connection to the server and allows
 * joining and messaging in multiple rooms.
 */
export class SocketIOManager extends EventAdapter {
  private static instance: SocketIOManager | null = null;
  private socket: Socket | null = null;
  private _connectionState = false; // Renamed from isConnected to avoid name clash
  private connectPromise: Promise<void> | null = null;
  private resolveConnect: (() => void) | null = null;
  private activeChannelIds: Set<string> = new Set();
  private clientEntityId: string | null = null;
  private logStreamSubscribed: boolean = false;

  // Public accessor for EVT instances (for advanced usage)
  public get evtMessageBroadcast() {
    return this._getEvt("messageBroadcast") as Evt<MessageBroadcastData>;
  }

  public get evtMessageComplete() {
    return this._getEvt("messageComplete") as Evt<MessageCompleteData>;
  }

  public get evtControlMessage() {
    return this._getEvt("controlMessage") as Evt<ControlMessageData>;
  }

  public get evtMessageDeleted() {
    return this._getEvt("messageDeleted") as Evt<MessageDeletedData>;
  }

  public get evtChannelCleared() {
    return this._getEvt("channelCleared") as Evt<ChannelClearedData>;
  }

  public get evtChannelDeleted() {
    return this._getEvt("channelDeleted") as Evt<ChannelDeletedData>;
  }

  public get evtLogStream() {
    return this._getEvt("logStream") as Evt<LogStreamData>;
  }

  private constructor() {
    super();
  }

  public static getInstance(): SocketIOManager {
    if (!SocketIOManager.instance) {
      SocketIOManager.instance = new SocketIOManager();
    }
    return SocketIOManager.instance;
  }

  public static isConnected(): boolean {
    return SocketIOManager.instance?._connectionState || false;
  }

  /**
   * Returns whether the socket is currently connected to the server
   * Can be called on an instance (preferred) or statically
   */
  public isConnected(): boolean {
    return this._connectionState;
  }

  public isChannelActive(channelId: string): boolean {
    return this.activeChannelIds.has(channelId);
  }

  /**
   * Initialize the Socket.io connection to the server
   * @param clientEntityId The client entity ID (central user ID)
   */
  public initialize(clientEntityId: string): void {
    this.clientEntityId = clientEntityId;

    if (this.socket) {
      clientLogger.debug("[SocketIO] Socket already initialized");
      return;
    }

    // Create a single socket connection to the ElizaOS backend
    const fullURL = "https://crossmind.reponchain.com";
    clientLogger.info("[SocketIO] Connecting to", fullURL);
    this.socket = io(fullURL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      path: "/socket.io",  // Standard Socket.IO path (without /api prefix)
      secure: true,  // Ensure secure connections
      rejectUnauthorized: true,  // Verify SSL certificate
    });
    
    clientLogger.debug("[SocketIO] Connection options:", {
      url: fullURL,
      path: "/socket.io",
      transports: ["websocket", "polling"]
    });

    // Set up connection promise for async operations that depend on connection
    this.connectPromise = new Promise<void>((resolve) => {
      this.resolveConnect = resolve;
    });

    this.socket.on("connect", () => {
      clientLogger.info(`[SocketIO] Connected to server - Socket ID: ${this.socket?.id}`);
      this._connectionState = true;
      this.resolveConnect?.();

      // Add debug listener for all incoming events - enable in all environments for debugging
      if (this.socket) {
        this.socket.onAny((event, ...args) => {
          clientLogger.debug(
            `[SocketIO DEBUG] Received event '${event}':`,
            args
          );
        });
      }

      // Log successful connection with socket ID
      clientLogger.info(`[SocketIO] Connection established with ID: ${this.socket?.id}`);
      
      this.emit("connect");

      // CRITICAL: Ensure this loop remains commented out or removed.
      // this.activeChannelIds.forEach((channelId) => {
      //   clientLogger.info(`[SocketIO] 'connect' event: Attempting to re-join active channel ${channelId} (THIS SHOULD NOT HAPPEN AUTOMATICALLY)`);
      //   this.joinChannel(channelId);
      // });
    });

    this.socket.on("unauthorized", (reason: string) => {
      this.emit("unauthorized", reason);
    });

    this.socket.on("messageBroadcast", (data: MessageBroadcastData) => {
      clientLogger.info(`[SocketIO] Message broadcast received:`, data);

      // Log the full data structure to understand formats
      clientLogger.debug("[SocketIO] Message broadcast data structure:", {
        keys: Object.keys(data),
        senderId: data.senderId,
        senderNameType: typeof data.senderName,
        textType: typeof data.text,
        textLength: data.text ? data.text.length : 0,
        hasThought: "thought" in data,
        hasActions: "actions" in data,
        additionalKeys: Object.keys(data).filter(
          (k) =>
            ![
              "senderId",
              "senderName",
              "text",
              "roomId",
              "createdAt",
              "source",
              "thought",
              "actions",
            ].includes(k)
        ),
      });

      // Check if this is a message for one of our active channels
      const channelId = data.channelId || data.roomId; // Handle both new and old message format
      if (channelId && this.activeChannelIds.has(channelId)) {
        clientLogger.info(
          `[SocketIO] Handling message for active channel ${channelId}`
        );
        // Post the message to the event for UI updates
        this.emit("messageBroadcast", {
          ...data,
          channelId: channelId, // Ensure channelId is always set
          roomId: channelId, // Keep roomId for backward compatibility
          name: data.senderName, // Required for ContentWithUser compatibility in some older UI parts
        });
      } else {
        clientLogger.warn(
          `[SocketIO] Received message for inactive channel ${channelId}, active channels:`,
          Array.from(this.activeChannelIds)
        );
      }
    });

    this.socket.on("messageComplete", (data) => {
      this.emit("messageComplete", data);
    });

    // Listen for control messages
    this.socket.on("controlMessage", (data) => {
      clientLogger.info(`[SocketIO] Control message received:`, data);

      // Check if this is for one of our active channels
      const channelId = data.channelId || data.roomId; // Handle both new and old message format
      if (channelId && this.activeChannelIds.has(channelId)) {
        clientLogger.info(
          `[SocketIO] Handling control message for active channel ${channelId}`
        );

        // Emit the control message event
        this.emit("controlMessage", {
          ...data,
          channelId: channelId, // Ensure channelId is always set
          roomId: channelId, // Keep roomId for backward compatibility
        });
      } else {
        clientLogger.warn(
          `[SocketIO] Received control message for inactive channel ${channelId}, active channels:`,
          Array.from(this.activeChannelIds)
        );
      }
    });

    // Listen for message deletion events
    this.socket.on("messageDeleted", (data) => {
      clientLogger.debug(`[SocketIO] Message deleted event received:`, data);

      // Check if this is for one of our active channels
      const channelId = data.channelId || data.roomId; // Handle both new and old message format
      if (channelId && this.activeChannelIds.has(channelId)) {
        clientLogger.info(
          `[SocketIO] Handling message deletion for active channel ${channelId}`
        );

        // Emit the message deleted event
        this.emit("messageDeleted", {
          ...data,
          channelId: channelId, // Ensure channelId is always set
          roomId: channelId, // Deprecated: Retained for backward compatibility with older clients
        });
      } else {
        clientLogger.warn(
          `[SocketIO] Received message deleted event for inactive channel ${channelId}, active channels:`,
          Array.from(this.activeChannelIds)
        );
      }
    });

    // Listen for channel cleared events
    this.socket.on("channelCleared", (data) => {
      clientLogger.info(`[SocketIO] Channel cleared event received:`, data);

      // Check if this is for one of our active channels
      const channelId = data.channelId || data.roomId; // Handle both new and old message format
      if (channelId && this.activeChannelIds.has(channelId)) {
        clientLogger.info(
          `[SocketIO] Handling channel cleared for active channel ${channelId}`
        );

        // Emit the channel cleared event
        this.emit("channelCleared", {
          ...data,
          channelId: channelId, // Ensure channelId is always set
          roomId: channelId, // Keep roomId for backward compatibility
        });
      } else {
        clientLogger.warn(
          `[SocketIO] Received channel cleared event for inactive channel ${channelId}, active channels:`,
          Array.from(this.activeChannelIds)
        );
      }
    });

    // Listen for channel deleted events
    this.socket.on("channelDeleted", (data) => {
      clientLogger.info(`[SocketIO] Channel deleted event received:`, data);

      // Check if this is for one of our active channels
      const channelId = data.channelId || data.roomId; // Handle both new and old message format
      if (channelId && this.activeChannelIds.has(channelId)) {
        clientLogger.info(
          `[SocketIO] Handling channel deleted for active channel ${channelId}`
        );

        // Emit the channel deleted event (same as cleared for now)
        this.emit("channelDeleted", {
          ...data,
          channelId: channelId, // Ensure channelId is always set
          roomId: channelId, // Keep roomId for backward compatibility
        });
      } else {
        clientLogger.warn(
          `[SocketIO] Received channel deleted event for inactive channel ${channelId}, active channels:`,
          Array.from(this.activeChannelIds)
        );
      }
    });

    this.socket.on("disconnect", (reason) => {
      clientLogger.info(`[SocketIO] Disconnected. Reason: ${reason}`);
      this._connectionState = false;

      this.emit("disconnect", reason);

      // Reset connect promise for next connection
      this.connectPromise = new Promise<void>((resolve) => {
        this.resolveConnect = resolve;
      });

      if (reason === "io server disconnect") {
        this.socket?.connect();
      }
    });

    this.socket.on("reconnect_attempt", (attempt) => {
      clientLogger.info("[SocketIO] Reconnect attempt", attempt);
      this.emit("reconnect_attempt", attempt);
    });

    this.socket.on("reconnect", (attempt) => {
      clientLogger.info(`[SocketIO] Reconnected after ${attempt} attempts`);
      this.emit("reconnect", attempt);
    });

    this.socket.on("connect_error", (error) => {
      clientLogger.error("[SocketIO] Connection error:", error);
      this.emit("connect_error", error);
    });

    // Handle log stream events
    this.socket.on("log_stream", (data) => {
      clientLogger.debug("[SocketIO] Log stream data received:", data);
      if (data.type === "log_entry" && data.payload) {
        this.emit("logStream", data.payload);
      }
    });

    this.socket.on("log_subscription_confirmed", (data) => {
      clientLogger.info("[SocketIO] Log subscription confirmed:", data);
      this.logStreamSubscribed = data.subscribed;
    });
  }

  /**
   * Join a channel to receive messages from it
   * @param channelId Channel ID to join
   */
  public async joinChannel(channelId: string): Promise<void> {
    console.log(`[SocketIOManager] Attempting to join channel: ${channelId}, socket exists: ${!!this.socket}, connected: ${this._connectionState}`);
    // Ensure we have a connection before trying to join
    if (this.connectPromise) {
      try {
        await this.connectPromise;
      } catch (error) {
        clientLogger.error(`[SocketIO] Connection error during joinChannel: ${error}`);
        // Continue anyway, the next check will handle the case if we're not connected
      }
    }

    if (!this.socket || !this._connectionState) {
      clientLogger.warn(
        `[SocketIO] Cannot join channel ${channelId}: not connected`
      );
      return;
    }

    clientLogger.info(
      `[SocketIO] joinChannel: Attempting to join ${channelId}. Current activeChannelIds before add:`,
      new Set(this.activeChannelIds)
    );
    this.activeChannelIds.add(channelId);
    clientLogger.info(
      `[SocketIO] joinChannel: Joined ${channelId}. Current activeChannelIds after add:`,
      new Set(this.activeChannelIds)
    );

    // At this point we know socket is not null due to the check above
    if (this.socket) {
      this.socket.emit("message", {
        type: SOCKET_MESSAGE_TYPE.ROOM_JOINING,
        payload: {
          channelId: channelId,
          roomId: channelId, // Keep for backward compatibility
          entityId: this.clientEntityId,
        },
      });
    }

    clientLogger.info(`[SocketIO] Emitted ROOM_JOINING for ${channelId}`);
  }

  /**
   * @deprecated Use joinChannel instead
   */
  public async joinRoom(channelId: string): Promise<void> {
    return this.joinChannel(channelId);
  }

  /**
   * Leave a channel to stop receiving messages from it
   * @param channelId Channel ID to leave
   */
  public leaveChannel(channelId: string): void {
    // For leaveChannel, we'll silently remove the channel from activeChannelIds even if not connected
    // This ensures cleanup happens regardless of connection state
    if (!this.socket || !this._connectionState) {
      // Just remove from active channels without showing error
      this.activeChannelIds.delete(channelId);
      return;
    }

    clientLogger.debug(
      `[SocketIO] leaveChannel: Attempting to leave ${channelId}. Current activeChannelIds before delete:`,
      new Set(this.activeChannelIds)
    );
    this.activeChannelIds.delete(channelId);
    clientLogger.debug(
      `[SocketIO] leaveChannel: Left ${channelId}. Current activeChannelIds after delete:`,
      new Set(this.activeChannelIds)
    );
    // No server-side message for leaving a room in this client's protocol,
    // client just stops listening / tracking.
  }

  /**
   * @deprecated Use leaveChannel instead
   */
  public leaveRoom(channelId: string): void {
    return this.leaveChannel(channelId);
  }

  /**
   * Send a message to a specific channel
   * @param message Message text to send
   * @param channelId Channel ID to send the message to
   * @param serverId Server ID to send the message to
   * @param source Source identifier (e.g., 'client_chat')
   * @param attachments Optional media attachments
   * @param messageId Optional message ID for tracking optimistic updates
   */
  public async sendMessage(
    message: string,
    channelId: string,
    serverId: string,
    source: string,
    attachments?: any[],
    messageId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.socket) {
      clientLogger.error(
        "[SocketIO] Cannot send message: socket not initialized"
      );
      return;
    }

    // Wait for connection if needed
    if (!this._connectionState) {
      await this.connectPromise;
    }

    // Use provided messageId or generate a new one
    const finalMessageId = messageId || randomUUID();

    clientLogger.info(
      `[SocketIO] Sending message to central channel ${channelId} on server ${serverId}`
    );

    // Debug connection state before sending
    clientLogger.info(`[SocketIO] Connection state before send: ${this.isConnected() ? 'CONNECTED' : 'NOT CONNECTED'}, Socket ID: ${this.socket?.id || 'none'}`);
    
    // Create message payload - using format 1 (complex object with type and payload)
    const messagePayload = {
      type: SOCKET_MESSAGE_TYPE.SEND_MESSAGE,
      payload: {
        senderId: this.clientEntityId,
        senderName: USER_NAME,
        message,
        channelId: channelId,
        roomId: channelId, // Keep for backward compatibility
        serverId: serverId, // Client uses serverId, not worldId
        messageId: finalMessageId,
        source,
        attachments,
        metadata,
      },
    };
    
    // Alternative message payload - using format 2 (direct message properties)
    const altMessagePayload = {
      senderId: this.clientEntityId,
      senderName: USER_NAME,
      text: message, // Note: using 'text' instead of 'message' based on observed response format
      channelId: channelId,
      roomId: channelId,
      serverId: serverId,
      id: finalMessageId, // Note: using 'id' instead of 'messageId' based on observed format
      source,
      attachments,
      metadata,
    };
    
    // Log full payloads (for debugging)
    clientLogger.debug(`[SocketIO] Emitting message payload (format 1):`, JSON.stringify(messagePayload));
    clientLogger.debug(`[SocketIO] Alternative payload (format 2):`, JSON.stringify(altMessagePayload));
    
    // Set a timeout to detect missing acknowledgements
    const ackTimeout = setTimeout(() => {
      clientLogger.warn(`[SocketIO] No acknowledgement received after 5s for message ${finalMessageId}`);
    }, 5000);

    // Try alternative event names and formats
    // First try with our standard format on 'message' event
    this.socket.emit("message", messagePayload, (ack1: any) => {
      clearTimeout(ackTimeout);
      clientLogger.debug(`[SocketIO] Ack received on 'message' event (format 1):`, ack1);
      if (ack1 && ack1.success) {
        clientLogger.info(`[SocketIO] MESSAGE CONFIRMED SENT - messageId: ${finalMessageId}`);
      }
    });
    
    // Then try with direct payload on 'messageBroadcast' event (as server might expect this format)
    this.socket.emit("messageBroadcast", altMessagePayload, (ack2: any) => {
      clearTimeout(ackTimeout);
      clientLogger.debug(`[SocketIO] Ack received on 'messageBroadcast' event:`, ack2);
      if (ack2 && ack2.success) {
        clientLogger.info(`[SocketIO] MESSAGE CONFIRMED SENT (format 2) - messageId: ${finalMessageId}`);
      }
    });
    
    // Also try direct format on 'message' event
    this.socket.emit("message", altMessagePayload, (ack3: any) => {
      clearTimeout(ackTimeout);
      clientLogger.debug(`[SocketIO] Ack received on 'message' event (format 2):`, ack3);
      if (ack3 && ack3.success) {
        clientLogger.info(`[SocketIO] MESSAGE CONFIRMED SENT (format 3) - messageId: ${finalMessageId}`);
      }
    });
    
    // Send a custom event to check if any acknowledgements work at all
    this.socket.emit("client_message_test", { test: "Testing acknowledgements", timestamp: Date.now() }, (testAck: any) => {
      clientLogger.debug(`[SocketIO] Test ack received:`, testAck);
    });

    // Note: We no longer broadcast locally - the server will send the message back with the proper ID
  }

  /**
   * Subscribe to log streaming
   */
  public async subscribeToLogStream(): Promise<void> {
    if (!this.socket) {
      clientLogger.error(
        "[SocketIO] Cannot subscribe to logs: socket not initialized"
      );
      return;
    }

    // Wait for connection if needed
    if (!this._connectionState) {
      await this.connectPromise;
    }

    this.socket.emit("subscribe_logs");
    clientLogger.info("[SocketIO] Subscribed to log stream");
  }

  /**
   * Unsubscribe from log streaming
   */
  public async unsubscribeFromLogStream(): Promise<void> {
    if (!this.socket) {
      clientLogger.error(
        "[SocketIO] Cannot unsubscribe from logs: socket not initialized"
      );
      return;
    }

    // Wait for connection if needed
    if (!this._connectionState) {
      await this.connectPromise;
    }

    this.socket.emit("unsubscribe_logs");
    clientLogger.info("[SocketIO] Unsubscribed from log stream");
  }

  /**
   * Update log stream filters
   */
  public async updateLogStreamFilters(filters: {
    agentName?: string;
    level?: string;
  }): Promise<void> {
    if (!this.socket) {
      clientLogger.error(
        "[SocketIO] Cannot update log filters: socket not initialized"
      );
      return;
    }

    // Wait for connection if needed
    if (!this._connectionState) {
      await this.connectPromise;
    }

    this.socket.emit("update_log_filters", filters);
    clientLogger.info("[SocketIO] Updated log stream filters:", filters);
  }

  /**
   * Check if subscribed to log streaming
   */
  public isLogStreamSubscribed(): boolean {
    return this.logStreamSubscribed;
  }

  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._connectionState = false;
      this.activeChannelIds.clear();
      this.logStreamSubscribed = false;
      clientLogger.info("[SocketIO] Disconnected from server");
    }
  }
}

export default SocketIOManager;

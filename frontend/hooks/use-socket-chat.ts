import { useEffect, useRef, useCallback, useMemo } from "react";
import { USER_NAME } from "@/constants";
import { SocketIOManager } from "@/lib/socketio-manager";
import type {
  MessageBroadcastData,
  MessageCompleteData,
  ControlMessageData,
  MessageDeletedData,
  ChannelClearedData,
  ChannelDeletedData,
} from "@/lib/socketio-manager";
import { UUID, Agent, ChannelType } from "@elizaos/core";
import type { UiMessage } from "./use-query-hooks";
import { randomUUID } from "@/lib/utils";
import clientLogger from "@/lib/logger";

/**
 * Socket.IO chat hook for handling communication with agents
 * Uses dynamic channels for agent communication rather than a fixed central bus
 * to enable better isolation between user sessions and prevent cross-talk
 */

interface UseSocketChatProps {
  channelId: UUID | undefined;
  currentUserId: string;
  contextId: UUID; // agentId for DM, channelId for GROUP
  chatType: ChannelType.DM | ChannelType.GROUP;
  allAgents: Agent[];
  messages: UiMessage[];
  onAddMessage: (message: UiMessage) => void;
  onUpdateMessage: (messageId: string, updates: Partial<UiMessage>) => void;
  onDeleteMessage: (messageId: string) => void;
  onClearMessages: () => void;
  onInputDisabledChange: (disabled: boolean) => void;
}

export function useSocketChat({
  channelId,
  currentUserId,
  contextId,
  chatType,
  allAgents,
  messages,
  onAddMessage,
  onUpdateMessage,
  onDeleteMessage,
  onClearMessages,
  onInputDisabledChange,
}: UseSocketChatProps) {
  const socketIOManager = SocketIOManager.getInstance();
  const animatedMessageIdRef = useRef<string | null>(null);
  const joinedChannelRef = useRef<string | null>(null); // Ref to track joined channel

  const sendMessage = useCallback(
    async (
      text: string,
      serverId: UUID,
      source: string,
      attachments?: any[],
      tempMessageId?: string,
      metadata?: Record<string, any>,
      overrideChannelId?: UUID
    ) => {
      const channelIdToUse = overrideChannelId || channelId;
      if (!channelIdToUse) {
        clientLogger.error(
          "[useSocketChat] Cannot send message: no channel ID available"
        );
        return;
      }

      // Add metadata for DM channels
      const messageMetadata = {
        ...metadata,
        channelType: chatType,
        ...(chatType === ChannelType.DM && {
          isDm: true,
          targetUserId: contextId, // The agent ID for DM channels
        }),
      };
      
      // Try both methods: REST API and Socket.IO
      try {
        // First, try the REST API endpoint
        clientLogger.info(`[useSocketChat] Sending message via REST API to channel ${channelIdToUse} for agent ${contextId}`);
        
        // Debug current values to ensure they're defined
        clientLogger.debug(`[useSocketChat] Payload values check: channel_id=${channelIdToUse}, server_id=${serverId}, author_id=${currentUserId}, content=${!!text}`);
        
        // Ensure all required fields are defined to avoid 400 errors
        // Convert any undefined values to empty strings to prevent missing field errors
        const safeChannelId = channelIdToUse || "";
        const safeServerId = serverId || "00000000-0000-0000-0000-000000000000";
        const safeContent = text || "";
        
        // API compatibility: Backend validation requires agent ID for author_id field
        // Enhanced metadata preserves actual user attribution information
        const enhancedMetadata = {
          ...messageMetadata,
          actualAuthorId: currentUserId, // Actual message creator
          isUserMessage: true,           // Attribution flag
          sendTime: Date.now(),          // Timestamp for message ordering/deduplication
        };
        
        // Construct payload matching ElizaOS backend API requirements
        const restPayload = {
          channel_id: safeChannelId,
          server_id: safeServerId,
          author_id: contextId,         // Agent ID required by backend validation
          content: safeContent,
          source_type: "user",          // Source attribution for UI rendering
          raw_message: JSON.stringify({
            text: safeContent,
            attachments: attachments || [],
            tempId: tempMessageId || `temp-${Date.now()}`,
            metadata: enhancedMetadata,
          }),
          // Keep these for backward compatibility
          message: safeContent,
          channelId: safeChannelId,
          agentId: contextId || "",
        };
        
        // Log request payload for diagnostic purposes
        clientLogger.debug(`[useSocketChat] REST request payload:`, JSON.stringify(restPayload));
        
        // Make the REST API call
        const response = await fetch('/api/messaging/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(restPayload)
        });
        
        if (response.ok) {
          const result = await response.json();
          clientLogger.info(`[useSocketChat] Message sent via REST API successfully:`, result);
        } else {
          const errorText = await response.text();
          clientLogger.warn(`[useSocketChat] REST API message send failed (${response.status}): ${errorText}`);
          
          // Attempt alternative transport method on REST failure
          clientLogger.info(`[useSocketChat] Initiating Socket.IO transport fallback`);
          await socketIOManager.sendMessage(
            text,
            channelIdToUse,
            serverId,
            source,
            attachments,
            tempMessageId,
            messageMetadata
          );
        }
      } catch (error) {
        clientLogger.error(`[useSocketChat] Error sending message:`, error);
        
        // Last-resort message delivery attempt via WebSocket
        try {
          await socketIOManager.sendMessage(
            text,
            channelIdToUse,
            serverId,
            source,
            attachments,
            tempMessageId,
            messageMetadata
          );
        } catch (socketError) {
          clientLogger.error(`[useSocketChat] Socket.IO fallback also failed:`, socketError);
        }
      }
    },
    [channelId, socketIOManager, chatType, contextId]
  );

  const eventHandlers = useMemo(() => {
    const handleMessageBroadcasting = (data: MessageBroadcastData) => {
      clientLogger.info(
        "[useSocketChat] Received raw messageBroadcast data:",
        JSON.stringify(data)
      );
      
      // Extract diagnostic message properties for monitoring
      try {
        const messageDetails = {
          id: data.id || 'undefined',
          senderId: data.senderId || 'undefined',
          senderName: data.senderName || 'undefined',
          channelId: data.channelId || 'undefined',
          roomId: data.roomId || 'undefined',
          createdAt: data.createdAt || 'undefined',
          textPreview: data.text ? (data.text.length > 50 ? data.text.substring(0, 50) + '...' : data.text) : 'undefined',
          source: data.source || 'undefined'
        };
        clientLogger.debug(`[useSocketChat] Message details:`, messageDetails);
      } catch (error) {
        clientLogger.error(`[useSocketChat] Error logging message details:`, error);
      }
      
      const msgChannelId = data.channelId || data.roomId;

      // Channel-based message filtering
      // During initialization: accept all messages to prevent missed communications
      // Post-initialization: filter to only active channel
      if (!channelId) {
        clientLogger.info(
          `[useSocketChat] Accepting initialization-phase message from channel ${msgChannelId}. ` +
          `senderId: ${data.senderId}, senderName: ${data.senderName}, source: ${data.source}`
        );
      } else {
        // Channel validation for established sessions
        const fromActiveChannel = msgChannelId === channelId;
        
        // Reject messages from inactive channels
        if (!fromActiveChannel) {
          clientLogger.warn(
            `[useSocketChat] Filtering out-of-scope message - target: ${msgChannelId}, active: ${channelId}. ` +
            `senderId: ${data.senderId}, senderName: ${data.senderName}, source: ${data.source}`
          );
          return;
        }
      }
      
      clientLogger.info(
        `[useSocketChat] Processing message for channel ${channelId} from ${data.senderId} (isAgent: ${data.senderId !== currentUserId})`
      );

      const isCurrentUser = data.senderId === currentUserId;

      // Unified message handling for both DM and GROUP
      const isTargetAgent =
        chatType === ChannelType.DM
          ? data.senderId === contextId
          : allAgents.some((agent) => agent.id === data.senderId);

      if (!isCurrentUser && isTargetAgent) onInputDisabledChange(false);

      const clientMessageId = (data as any).clientMessageId;
      if (clientMessageId && isCurrentUser) {
        // Update optimistic message with server response
        onUpdateMessage(clientMessageId, {
          id: data.id || randomUUID(),
          isLoading: false,
          createdAt:
            typeof data.createdAt === "number"
              ? data.createdAt
              : data.createdAt
              ? Date.parse(data.createdAt)
              : Date.now(),
          text: data.text || "",
          attachments: data.attachments || [],
          isAgent: false,
        });
      } else {
        // Add new message to the list
        // Determine if this is from an agent using multiple signals
        const isFromAgent = (
          // Primary check: Different sender ID from current user
          data.senderId !== currentUserId || 
          // Secondary checks to handle conflicting metadata
          data.senderName === "Agent" ||
          (contextId && data.senderId === contextId)
        );
        
        // Log detailed message classification for debugging
        clientLogger.info(
          `[useSocketChat] Message classification - isFromAgent: ${isFromAgent}, ` +
          `senderId: ${data.senderId}, currentUserId: ${currentUserId}, ` +
          `senderName: ${data.senderName}, source: ${data.source}`
        );
        
        const newMessage: UiMessage = {
          id: data.id || randomUUID(),
          text: data.text || "",
          isLoading: false,
          senderId: (data.senderId || randomUUID()) as UUID,
          // Use senderName if available, or set based on agent status
          name: data.senderName || (isFromAgent ? "Agent" : "user"),
          channelId: (msgChannelId ||
            channelId ||
            randomUUID()) as UUID,
          createdAt:
            typeof data.createdAt === "number"
              ? data.createdAt
              : data.createdAt
              ? Date.parse(data.createdAt)
              : Date.now(),
          attachments: data.attachments || [],
          isAgent: isFromAgent,
        };
        
        // Always log the full message being added
        clientLogger.info(`[useSocketChat] Adding message to UI:`, {
          id: newMessage.id,
          text: newMessage.text ? 
              (newMessage.text.substring(0, 30) + (newMessage.text.length > 30 ? '...' : '')) : 
              '[empty]',
          isAgent: newMessage.isAgent,
          name: newMessage.name,
          senderId: newMessage.senderId
        });

        onAddMessage(newMessage);
      }
    };

    const handleMessageComplete = (data: MessageCompleteData) => {
      clientLogger.info("Received messageComplete:", data);
      onInputDisabledChange(false);
    };

    const handleControlMessage = (data: ControlMessageData) => {
      clientLogger.info("Received controlMessage:", data);

      if (data.type === "heartbeat") {
        clientLogger.debug("Heartbeat message received");
        return;
      }

      const isCurrentUser = data.senderId === currentUserId;

      if (!isCurrentUser) {
        const newMessage: UiMessage = {
          id: data.id || randomUUID(),
          text: data.text || `[${data.type}]`,
          isLoading: false,
          senderId: (data.senderId || randomUUID()) as UUID,
          name: "user",
          channelId: (data.channelId ||
            data.roomId ||
            channelId ||
            randomUUID()) as UUID,
          createdAt:
            typeof data.createdAt === "number"
              ? data.createdAt
              : data.createdAt
              ? Date.parse(data.createdAt)
              : Date.now(),
          attachments: data.attachments || [],
          isAgent: false,
        };

        onAddMessage(newMessage);
      }
    };

    const handleMessageDeleted = (data: MessageDeletedData) => {
      clientLogger.info("Message deleted:", data);
      if (data.messageId) {
        onDeleteMessage(data.messageId);
      }
    };

    const handleChannelCleared = (data: ChannelClearedData) => {
      clientLogger.info("Channel cleared:", data);
      onClearMessages();
    };

    const handleChannelDeleted = (data: ChannelDeletedData) => {
      clientLogger.info("Channel deleted:", data);
      onClearMessages();
    };

    return {
      handleMessageBroadcasting,
      handleMessageComplete,
      handleControlMessage,
      handleMessageDeleted,
      handleChannelCleared,
      handleChannelDeleted,
    };
  }, [
    channelId,
    currentUserId,
    contextId,
    chatType,
    allAgents,
    messages,
    onAddMessage,
    onUpdateMessage,
    onDeleteMessage,
    onClearMessages,
    onInputDisabledChange,
  ]);

  // This ref tracks whether we've seen a valid channelId before
  const hadValidChannelIdRef = useRef<boolean>(false);

  // Channel transition state tracking for subscription management
  const prevChannelIdRef = useRef<string | null | undefined>(null);
  
  /**
   * Channel subscription management
   * Establishes and maintains connection to specified message channel when available
   */
  useEffect(() => {
    console.log(`[useSocketChat] Channel join effect running with channelId: ${channelId || 'undefined'}`);
    console.log(`[useSocketChat] Previous channel ID was: ${prevChannelIdRef.current || 'undefined'}`);
    
    // Track if we're transitioning from undefined to defined
    const isChannelIdBecomingDefined = prevChannelIdRef.current === undefined && channelId !== undefined;
    if (isChannelIdBecomingDefined) {
      console.log(`[useSocketChat] Channel ID transition: undefined → ${channelId}`);
    }
    
    // Persist channel transition state
    prevChannelIdRef.current = channelId;
    
    const joinChannel = async () => {
      if (!channelId) {
        clientLogger.warn('[useSocketChat] No channel ID available yet, waiting...');
        return; // Skip if no channel ID
      }
      
      // Log target channel for connection diagnostics
      clientLogger.info(`[useSocketChat] Initiating channel connection: ${channelId}`);
      
      try {
        // Initialize socket connection with identity information
        socketIOManager.initialize(currentUserId);
        
        // Connection readiness check with timeout
        if (!socketIOManager.isConnected()) {
          clientLogger.info('[useSocketChat] Socket connection pending - applying connection delay');
          // Connection establishment grace period
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Secondary connection verification after timeout
        if (!socketIOManager.isConnected()) {
          clientLogger.warn('[useSocketChat] Connection timeout exceeded - deferring to subsequent render cycle');
          return;
        }
        
        // Check if the channel is different from currently joined one
        if (joinedChannelRef.current !== channelId) {
          // Channel transition handling - unsubscribe from previous channel
          if (joinedChannelRef.current && joinedChannelRef.current !== channelId && socketIOManager?.isConnected()) {
            clientLogger.info(`[useSocketChat] Leaving previous channel: ${joinedChannelRef.current}`);
            socketIOManager.leaveChannel(joinedChannelRef.current);
          }
          
          // Join new channel
          clientLogger.info(`[useSocketChat] Joining channel: ${channelId}`);
          await socketIOManager.joinChannel(channelId);
          joinedChannelRef.current = channelId;
          clientLogger.info(`[useSocketChat] Successfully joined channel: ${channelId}`);
        }
      } catch (error) {
        clientLogger.error(`[useSocketChat] Error in channel join effect:`, error);
      }
    };

    joinChannel();

    // Subscription cleanup on unmount or channel transition
    return () => {
      if (joinedChannelRef.current) {
        clientLogger.info(`[useSocketChat] Terminating subscription to channel ${joinedChannelRef.current}`);
        socketIOManager.leaveChannel(joinedChannelRef.current);
        joinedChannelRef.current = null;
      }
    };
  }, [channelId, currentUserId, socketIOManager]);

  // Set up event subscriptions
  useEffect(() => {
    
    if (!currentUserId) {
      clientLogger.info(
        `[useSocketChat] useEffect: No currentUserId available, skipping initialization`
      );
      return;
    }

    clientLogger.info(`[useSocketChat] Initializing with userId: ${currentUserId}, channelId: ${channelId || 'undefined'}`);
    console.log(`[useSocketChat] EFFECT RUNNING - Initialize socket connection: userID=${currentUserId}, channelId=${channelId || 'undefined'}`);
    socketIOManager.initialize(currentUserId); // Initialize on user context

    // Track transition from undefined to defined channelId (dynamic channel creation completed)
    if (channelId && !hadValidChannelIdRef.current) {
      clientLogger.info(`[useSocketChat] IMPORTANT: First valid channelId detected: ${channelId}`);
      hadValidChannelIdRef.current = true;
    }

    // Log ALL incoming messages for debugging
    socketIOManager.evtMessageBroadcast.attach(
      () => true, // No filtering - catch everything
      (data: MessageBroadcastData) => {
        const msgChannelId = data.channelId || data.roomId;
        clientLogger.warn(
          `[useSocketChat] DEBUG: RAW MESSAGE, channelId=${msgChannelId}, our channelId=${channelId}, ` +
          `senderId=${data.senderId}, text=${data.text?.substring(0, 50)}...`
        );
      }
    );
    
    // Only accept messages from the active channel
    // With dynamic channels, we no longer need to monitor the central bus
    const msgSub = socketIOManager.evtMessageBroadcast.attach(
      (d: MessageBroadcastData) => {
        const msgChannel = d.channelId || d.roomId;
        const matches = msgChannel === channelId;
        if (!matches) {
          clientLogger.warn(`[useSocketChat] Message FILTERED OUT - from channel ${msgChannel}, we want ${channelId}`);
        } else {
          clientLogger.info(`[useSocketChat] Message ACCEPTED - from channel ${msgChannel}`);
        }
        return matches;
      },
      eventHandlers.handleMessageBroadcasting
    );
    // For non-message events, we still only care about the active channel
    const completeSub = socketIOManager.evtMessageComplete.attach(
      (d: MessageCompleteData) =>
        channelId ? (d.channelId || d.roomId) === channelId : false,
      eventHandlers.handleMessageComplete
    );
    const controlSub = socketIOManager.evtControlMessage.attach(
      (d: ControlMessageData) =>
        channelId ? (d.channelId || d.roomId) === channelId : false,
      eventHandlers.handleControlMessage
    );
    const deleteSub = socketIOManager.evtMessageDeleted.attach(
      (d: MessageDeletedData) =>
        channelId ? (d.channelId || d.roomId) === channelId : false,
      eventHandlers.handleMessageDeleted
    );
    const clearSub = socketIOManager.evtChannelCleared.attach(
      (d: ChannelClearedData) =>
        channelId ? (d.channelId || d.roomId) === channelId : false,
      eventHandlers.handleChannelCleared
    );
    const deletedSub = socketIOManager.evtChannelDeleted.attach(
      (d: ChannelDeletedData) =>
        channelId ? (d.channelId || d.roomId) === channelId : false,
      eventHandlers.handleChannelDeleted
    );

    // Helper function for detaching subscriptions
    const detachSubscriptions = (
      subscriptions: Array<{ detach: () => void } | undefined>
    ) => {
      subscriptions.forEach((sub) => sub?.detach());
    };
    
    return () => {
      // Leave the specific channel but DON'T leave the central bus channel
      // since other components might still need it
      if (channelId) {
        clientLogger.info(
          `[useSocketChat] useEffect cleanup: Leaving channel ${channelId}. Current joinedChannelRef: ${joinedChannelRef.current}`
        );
        socketIOManager.leaveChannel(channelId);
        // Reset ref when component unmounts or channelId changes leading to cleanup
        if (channelId === joinedChannelRef.current) {
          joinedChannelRef.current = null;
          clientLogger.info(
            `[useSocketChat] useEffect cleanup: Reset joinedChannelRef for ${channelId}`
          );
        }
      }
      detachSubscriptions([
        msgSub,
        completeSub,
        controlSub,
        deleteSub,
        clearSub,
        deletedSub,
      ]);
    };
  }, [channelId, currentUserId, socketIOManager, contextId, chatType]);

  return {
    sendMessage,
    animatedMessageId: animatedMessageIdRef.current,
  };
}

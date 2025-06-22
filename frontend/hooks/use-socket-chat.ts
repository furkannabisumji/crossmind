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

// We now use dynamic channels for agent communication rather than a fixed central bus
// This enables better isolation between user sessions and prevents cross-talk

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

      await socketIOManager.sendMessage(
        text,
        channelIdToUse,
        serverId,
        source,
        attachments,
        tempMessageId,
        messageMetadata
      );
    },
    [channelId, socketIOManager, chatType, contextId]
  );

  const eventHandlers = useMemo(() => {
    const handleMessageBroadcasting = (data: MessageBroadcastData) => {
      clientLogger.info(
        "[useSocketChat] Received raw messageBroadcast data:",
        JSON.stringify(data)
      );
      const msgChannelId = data.channelId || data.roomId;

      // Accept messages only from the active channel
      // With dynamic channels, we no longer need to monitor the central bus
      const fromActiveChannel = msgChannelId === channelId;
      
      // If this message isn't for our channel, ignore it
      if (!fromActiveChannel) return;
      
      clientLogger.debug(
        `[useSocketChat] Processing message for channel ${channelId}`
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
        const newMessage: UiMessage = {
          id: data.id || randomUUID(),
          text: data.text || "",
          isLoading: false,
          senderId: (data.senderId || randomUUID()) as UUID,
          name: "user",
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
          isAgent: data.senderId !== currentUserId,
        };

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

  useEffect(() => {
    if (!currentUserId) {
      clientLogger.info(
        `[useSocketChat] useEffect: No currentUserId available, skipping initialization`
      );
      return;
    }

    socketIOManager.initialize(currentUserId); // Initialize on user context

    // With dynamic channels, we no longer need to join the central bus
    // Each user session has its own dedicated channel for agent communication

    if (!channelId) {
      // If channelId becomes undefined (e.g., navigating away), ensure we reset the ref
      if (joinedChannelRef.current) {
        clientLogger.info(
          `[useSocketChat] useEffect: channelId is now null/undefined, resetting joinedChannelRef from ${joinedChannelRef.current}`
        );
        joinedChannelRef.current = null;
      }
      return;
    }

    // Only join the specific channel if it hasn't been joined by this hook instance yet,
    // or if the channelId has changed
    if (channelId !== joinedChannelRef.current) {
      clientLogger.info(
        `[useSocketChat] useEffect: Joining channel ${channelId}. Previous joinedChannelRef: ${joinedChannelRef.current}`
      );
      socketIOManager.joinChannel(channelId);
      joinedChannelRef.current = channelId; // Mark this channelId as joined by this instance
    } else {
      clientLogger.info(
        `[useSocketChat] useEffect: Channel ${channelId} already marked as joined by this instance. Skipping joinChannel call.`
      );
    }

    // Only accept messages from the active channel
    // With dynamic channels, we no longer need to monitor the central bus
    const msgSub = socketIOManager.evtMessageBroadcast.attach(
      (d: MessageBroadcastData) => {
        const msgChannel = d.channelId || d.roomId;
        return msgChannel === channelId;
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

    function detachSubscriptions(
      subscriptions: Array<{ detach: () => void } | undefined>
    ) {
      subscriptions.forEach((sub) => sub?.detach());
    }
  }, [channelId, currentUserId, socketIOManager, contextId, chatType]);

  return {
    sendMessage,
    animatedMessageId: animatedMessageIdRef.current,
  };
}

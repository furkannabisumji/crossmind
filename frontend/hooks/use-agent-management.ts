import type { Agent, UUID } from "@elizaos/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStartAgent, useStopAgent } from "./use-query-hooks";
import { useToast } from "./use-toast";
import { apiClient } from "@/lib/api";
import clientLogger from "@/lib/logger";

// Channel ID for agent communications
// This will be set when we create a channel
let AGENT_CHANNEL_ID: UUID | null = null;

// Default message server ID for creating channels
const MESSAGE_SERVER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Custom hook for agent management.
 * Allows starting and stopping agents with mutation operations.
 * Provides functions to check if an agent is currently starting or stopping.
 * Ensures agents are added as participants to the central bus channel.
 * @returns Object with functions for starting and stopping agents, checking agent status, and lists of agents in starting and stopping processes.
 */
export function useAgentManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutations for starting and stopping agents
  const startAgentMutation = useStartAgent();
  const stopAgentMutation = useStopAgent();

  // Track agents that are currently in the process of starting or stopping
  const [startingAgents, setStartingAgents] = useState<UUID[]>([]);
  const [stoppingAgents, setStoppingAgents] = useState<UUID[]>([]);

  /**
   * Create a channel for agent communication if needed
   */
  const ensureAgentChannel = async (): Promise<UUID> => {
    // Use existing channel ID if we have one
    if (AGENT_CHANNEL_ID) {
      return AGENT_CHANNEL_ID as UUID; // Type assertion since we've checked it's not null
    }

    try {
      clientLogger.info('Creating channel for agent communication');
      const result = await apiClient.createChannel({
        messageServerId: MESSAGE_SERVER_ID,
        name: 'Agent Communication Channel',
        type: 'group'
      });
      
      if (result?.data?.channel?.id) {
        AGENT_CHANNEL_ID = result.data.channel.id;
        clientLogger.info(`Created new channel for agents: ${AGENT_CHANNEL_ID}`);
        return AGENT_CHANNEL_ID;
      }
      
      // This will only happen if channel creation failed but didn't throw an error
      throw new Error('Channel creation failed: no ID returned');
    } catch (error) {
      clientLogger.error('Failed to create channel:', error);
      // We must have a channel ID to continue
      if (AGENT_CHANNEL_ID) {
        return AGENT_CHANNEL_ID as UUID;
      }
      throw new Error('No channel available for agent communication');
    }
  };

  /**
   * Add agent to a dynamic channel
   * This is required for the agent to receive and process messages
   */
  const addAgentToChannel = async (agentId: UUID): Promise<boolean> => {
    try {
      // Use the consolidated API endpoint that creates a channel and adds the agent
      clientLogger.info(`Adding agent ${agentId} to dynamic channel`);
      const result = await apiClient.addAgentToDynamicChannel(agentId);
      
      if (result?.data?.channelId) {
        // Store the channel ID for future use
        AGENT_CHANNEL_ID = result.data.channelId;
        clientLogger.info(`Successfully added agent ${agentId} to channel ${AGENT_CHANNEL_ID}`);
        return true;
      }
      
      clientLogger.error('Failed to add agent: no channel ID returned');
      return false;
    } catch (error) {
      clientLogger.error(`Failed to add agent to channel:`, error);
      return false;
    }
  };

  /**
   * Start an agent and navigate to its chat
   * Also ensures the agent is added as a participant to the central bus channel
   */
  const startAgent = async (agent: Agent) => {
    if (!agent.id) {
      toast({
        title: "Error",
        description: "Agent ID is missing",
        variant: "destructive",
      });
      return;
    }

    const agentId = agent.id as UUID;

    // Prevent starting if already in progress
    if (startingAgents.includes(agentId)) {
      return;
    }

    try {
      // Add agent to starting list
      setStartingAgents((prev) => [...prev, agentId]);

      // Start the agent
      await startAgentMutation.mutateAsync(agentId);
      
      // Ensure the agent is added as a participant to the agent channel
      // This is required for the agent to process messages
      const addedToChannel = await addAgentToChannel(agentId);
      if (!addedToChannel) {
        toast({
          title: "Warning",
          description: "Agent started but may not receive messages correctly. Could not add to communication channel.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to start agent:", error);

      toast({
        title: "Error Starting Agent",
        description:
          error instanceof Error ? error.message : "Failed to start agent",
        variant: "destructive",
      });
    } finally {
      // Remove agent from starting list regardless of success/failure
      setStartingAgents((prev) => prev.filter((id) => id !== agentId));
    }
  };

  /**
   * Stop an agent
   */
  const stopAgent = async (agent: Agent) => {
    if (!agent.id) {
      toast({
        title: "Error",
        description: "Agent ID is missing",
        variant: "destructive",
      });
      return;
    }

    const agentId = agent.id as UUID;

    // Prevent stopping if already in progress
    if (stoppingAgents.includes(agentId)) {
      return;
    }

    try {
      // Add agent to stopping list
      setStoppingAgents((prev) => [...prev, agentId]);

      // Stop the agent
      await stopAgentMutation.mutateAsync(agentId);

      toast({
        title: "Agent Stopped",
        description: `${agent.name} has been stopped`,
      });
    } catch (error) {
      console.error("Failed to stop agent:", error);

      toast({
        title: "Error Stopping Agent",
        description:
          error instanceof Error ? error.message : "Failed to stop agent",
        variant: "destructive",
      });
    } finally {
      // Remove agent from stopping list regardless of success/failure
      setStoppingAgents((prev) => prev.filter((id) => id !== agentId));
    }
  };

  /**
   * Check if an agent is currently starting
   */
  const isAgentStarting = (agentId: UUID | undefined | null) => {
    if (!agentId) return false;
    return startingAgents.includes(agentId);
  };

  /**
   * Check if an agent is currently stopping
   */
  const isAgentStopping = (agentId: UUID | undefined | null) => {
    if (!agentId) return false;
    return stoppingAgents.includes(agentId);
  };

  return {
    startingAgents,
    stoppingAgents,
    startAgent,
    stopAgent,
    isAgentStarting,
    isAgentStopping,
    addAgentToChannel,
  };
}

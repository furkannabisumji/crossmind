import type { Agent, UUID } from "@elizaos/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStartAgent, useStopAgent } from "./use-query-hooks";
import { useToast } from "./use-toast";
import { apiClient } from "@/lib/api";
import clientLogger from "@/lib/logger";

// ElizaOS uses a central message bus with this UUID for all message routing
const CENTRAL_BUS_CHANNEL_ID = "00000000-0000-0000-0000-000000000000";

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
   * Add an agent as a participant to the central bus channel
   * This is required for the agent to receive and process messages
   */
  const addAgentToCentralBus = async (agentId: UUID): Promise<boolean> => {
    try {
      clientLogger.info(`Adding agent ${agentId} to central bus channel`);
      await apiClient.addAgentToChannel(CENTRAL_BUS_CHANNEL_ID, agentId);
      clientLogger.info(`Successfully added agent ${agentId} to central bus channel`);
      return true;
    } catch (error) {
      clientLogger.error(`Failed to add agent ${agentId} to central bus channel:`, error);
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
      
      // Ensure the agent is added as a participant to the central bus channel
      // This is required for the agent to process messages
      const addedToCentralBus = await addAgentToCentralBus(agentId);
      if (!addedToCentralBus) {
        toast({
          title: "Warning",
          description: "Agent started but may not receive messages correctly. Could not add to central message bus.",
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
    startAgent,
    stopAgent,
    isAgentStarting,
    isAgentStopping,
    startingAgents,
    stoppingAgents,
    addAgentToCentralBus,  // Export this function so it can be called directly if needed
  };
}

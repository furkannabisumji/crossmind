"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@/components/wallet-provider";
import SocketIOManager from "@/lib/socketio-manager";
import { MessageBroadcastData } from "@/lib/socketio-manager";

// Types for strategy generation
export type ChainAllocation = {
  chainId: number;
  name: string;
  percentage: number;
  protocols: ProtocolAllocation[];
};

export type ProtocolAllocation = {
  name: string;
  adapter: string;
  percentage: number;
};

export type Strategy = {
  id: string;
  name: string;
  riskLevel: "Low" | "Medium" | "High";
  estimatedAPY: number;
  amount: number;
  chains: ChainAllocation[];
  status: "pending" | "registered" | "executed" | "rejected" | "exited";
};

export type Message = {
  role: "user" | "assistant";
  content: string;
};

interface MessageRequest {
  message: string;
  agentId: string;
  roomId: string;
  userId?: string;
  contextData?: Record<string, any>;
}

export function useZoyaStrategy() {
  // State for strategy generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { account: address } = useWallet();
  
  // Reference to Socket.IO manager
  const socketManagerRef = useRef<ReturnType<typeof SocketIOManager.getInstance> | null>(null);

  // Initialize messages after component mounts to prevent hydration mismatch
  useEffect(() => {
    if (!isInitialized) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm Zoya, your AI investment strategist. I can help you create a personalized investment strategy across multiple chains. Tell me about your investment goals or simply deposit funds to get started.",
        },
      ]);
      setIsInitialized(true);
    }
  }, [isInitialized]);
  
  // Chain names mapping - only using Avalanche Fuji testnet
  const chainNames: { [key: number]: string } = {
    43113: "Avalanche Fuji",
  };

  // Add a message to the chat
  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      setMessages((prev) => [...prev, { role, content }]);
    },
    []
  );
  
  // Initialize Socket.IO connection on component mount
  useEffect(() => {
    if (address && typeof window !== 'undefined') {
      console.log("[Socket.IO] Initializing connection for address:", address);
      
      // Lazy import Socket.IO manager
      import("../lib/socketio-manager").then(module => {
        const socketManager = module.default.getInstance();
        socketManagerRef.current = socketManager;
        
        // Initialize Socket.IO connection with wallet address as entity ID
        // and the fixed server ID as documented in the reference implementation
        socketManager.initialize(
          address, // entity ID (wallet address)
          "00000000-0000-0000-0000-000000000000" // server ID
        );
        
        // Register for message broadcasts
        const unsubscribe = socketManager.onMessageBroadcast((data) => {
          console.log("[Socket.IO] Received message broadcast:", data);
          
          // Extract text from various possible locations in the data structure
          const messageText = typeof data.text === 'string' ? data.text : 
                             (data.message || 
                             (data.payload && data.payload.message) || 
                             (data.payload && data.payload.text) || 
                             '');
          
          // Filter out temporary messages and our own echoed messages
          if (messageText && 
              messageText !== "Processing your request..." && 
              data.senderId !== address) { // Don't show our own messages twice
            console.log("[Socket.IO] Adding assistant message to chat:", messageText);
            addMessage("assistant", messageText);
          }
        });
        
        // Return cleanup function
        return () => {
          unsubscribe();
        };
      });
    }
  }, [address, addMessage]);

  // Send a message to Zoya agent using the hybrid approach (Socket.IO + REST API)
  const sendMessage = useCallback(
    async (content: string, contextData?: Record<string, any>) => {
      setIsLoading(true);

      try {
        if (!address) {
          throw new Error("Wallet not connected");
        }

        // Add user message to the local state immediately
        addMessage("user", content);

        // HYBRID APPROACH: Try Socket.IO first, then fallback to REST API if needed
        let responseData;
        let usedSocketIO = false;
        
        // Attempt to send via Socket.IO first
        if (socketManagerRef.current && typeof window !== 'undefined') {
          try {
            console.log("[Socket.IO] Attempting to send message via Socket.IO");
            
            // Add a temporary processing message for better UX
            addMessage("assistant", "Processing your request...");
            
            // Fixed values for Socket.IO parameters
            const channelId = address; // Using wallet address as channelId
            const agentId = "2e7fded5-6c90-0786-93e9-40e713a5e19d"; // Zoya agent ID
            
            // Add serverId and sender info to the contextData metadata
            const enhancedMetadata = {
              ...contextData,
              serverId: "00000000-0000-0000-0000-000000000000",
              senderId: address
            };
            
            // Send the message via Socket.IO - correct signature is:
            // sendMessage(message, channelId, agentId, metadata?)
            await socketManagerRef.current.sendMessage(
              content,          // message content
              channelId,        // channel ID (using wallet address)
              agentId,          // agent ID (Zoya agent)
              enhancedMetadata  // metadata with additional context
            );
            
            console.log("[Socket.IO] Message sent successfully with proper payload format");
            usedSocketIO = true;
            
            // The real response will come through the socket listener we set up earlier
            // The temporary message will be replaced by the real response when it arrives
          } catch (socketError) {
            console.error("[Socket.IO] Error sending message, falling back to REST API:", socketError);
            // Continue to REST API fallback
          }
        }
        
        // 2. Fallback to REST API if Socket.IO failed or is not available
        if (!usedSocketIO) {
          console.log("[REST API] Using REST API fallback");
          
          // Matching the Postman example - using a simple message structure
          interface ElizaMessageRequest {
            message: string;
            agentId: string;
            roomId: string;
            // Optional metadata field for context
            metadata?: Record<string, any>;
          }

          // Create a minimal request matching the Postman example
          const messageRequest: ElizaMessageRequest = {
            message: content,
            agentId: "2e7fded5-6c90-0786-93e9-40e713a5e19d", // Zoya agent ID
            roomId: address || "anonymous-room", // Use wallet address as room ID
          };

          // Add context data as metadata if provided
          if (contextData && Object.keys(contextData).length > 0) {
            messageRequest.metadata = contextData;
          }

          console.log(
            "[REST API] Sending message request:",
            JSON.stringify(messageRequest, null, 2)
          );

          const jsonBody = JSON.stringify(messageRequest);

          try {
            const response = await fetch(
              "https://crossmind.reponchain.com/api/messaging/submit",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: jsonBody,
              }
            );
            
            console.log("[REST API] Response status:", response.status);
            
            if (!response.ok) {
              // Try to parse the error response
              const errorText = await response.text();
              let errorData;

              try {
                errorData = JSON.parse(errorText);
                console.error(
                  "[REST API] Error response:",
                  JSON.stringify(errorData, null, 2)
                );
              } catch (e) {
                console.error("[REST API] Non-JSON error response:", errorText);
                errorData = { error: "Non-JSON error response", text: errorText };
              }

              throw new Error(
                `API request failed with status ${
                  response.status
                }: ${JSON.stringify(errorData)}`
              );
            }

            // Parse successful response
            responseData = await response.json();
            console.log("[REST API] Success response:", JSON.stringify(responseData, null, 2));
            
            // Since we're using REST API and not Socket.IO, we need to manually add
            // a temporary response message for better UX until a real response comes
            if (responseData && responseData.status === "success") {
              // Set a temporary processing message
              addMessage("assistant", "Processing your request...");
            }
          } catch (error) {
            console.error("[REST API] Error during request:", error);
            throw error;
          }
        }

        // Handle the response - ElizaOS messaging system response format
        // Only process responseData if it exists (it will be undefined when using Socket.IO path)
        if (responseData && (responseData.success || responseData.message)) {
          // Extract the assistant's response from various possible fields
          let assistantResponse = "";

          if (responseData.response) {
            assistantResponse = responseData.response;
          } else if (responseData.content) {
            assistantResponse = responseData.content;
          } else if (responseData.text) {
            assistantResponse = responseData.text;
          } else if (responseData.message?.content) {
            assistantResponse = responseData.message.content;
          } else if (responseData.reply) {
            assistantResponse = responseData.reply;
          } else {
            // If no immediate response, add a generic acknowledgment
            assistantResponse = "Message received. Processing your request...";
          }

          if (assistantResponse) {
            addMessage("assistant", assistantResponse);
          }
        } else if (responseData && responseData.error) {
          throw new Error(responseData.error);
        } else if (responseData) {
          // Fallback response handling
          const responseText =
            responseData.response?.text ||
            responseData.message?.text ||
            responseData.reply ||
            responseData.content ||
            "Message sent successfully.";
          addMessage("assistant", responseText);
        }

        // Check if the response contains strategy data
        if (responseData && responseData.strategyData) {
          setStrategy(responseData.strategyData);
        } else if (responseData && responseData.metadata?.strategyData) {
          setStrategy(responseData.metadata.strategyData);
        } else if (responseData && responseData.contextData?.strategyData) {
          setStrategy(responseData.contextData.strategyData);
        }
        
        // Successfully processed the message
        return responseData || true;
      } catch (error) {
        console.error("Failed to send message:", error);
        addMessage(
          "assistant",
          "I'm sorry, I encountered an error while processing your message. Please try again."
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, addMessage]
  );

  // Generate a strategy based on risk level and amount
  const generateStrategy = useCallback(
    async (
      amount: number,
      riskLevel: "Low" | "Medium" | "High",
      preferredChains?: number[]
    ) => {
      setIsGenerating(true);

      try {
        // Prepare context data with strategy parameters
        const contextData = {
          strategyRequest: {
            amount,
            riskLevel,
            preferredChains: preferredChains || [],
            walletAddress: address,
          },
        };

        // Send strategy generation request to Zoya
        const message = `I'd like to generate a ${riskLevel} risk investment strategy with ${amount} USDC across multiple chains.`;
        const response = await sendMessage(message, contextData);

        if (!response) {
          throw new Error("Failed to generate strategy: No response received");
        }

        // Try to extract strategy data from various possible response formats
        let strategyData = null;
        if (response.strategyData) {
          strategyData = response.strategyData;
        } else if (response.metadata?.strategyData) {
          strategyData = response.metadata.strategyData;
        } else if (Array.isArray(response)) {
          // Look for strategy data in the response array
          const strategyMessage = response.find((msg) => msg.strategyData);
          if (strategyMessage) {
            strategyData = strategyMessage.strategyData;
          }
        }

        if (strategyData) {
          setStrategy(strategyData);
          return strategyData as Strategy;
        } else {
          // If no structured strategy data, create a mock strategy based on the response
          const mockStrategy: Strategy = {
            id: `strategy_${Date.now()}`,
            name: `${riskLevel} Risk Strategy`,
            riskLevel,
            estimatedAPY:
              riskLevel === "Low" ? 5 : riskLevel === "Medium" ? 12 : 20,
            amount,
            chains: [
              {
                chainId: 43113,
                name: "Avalanche Fuji",
                percentage: 100,
                protocols: [
                  {
                    name: "AAVE",
                    adapter: "aave-v3",
                    percentage: 60,
                  },
                  {
                    name: "Compound",
                    adapter: "compound-v3",
                    percentage: 40,
                  },
                ],
              },
            ],
            status: "pending",
          };
          setStrategy(mockStrategy);
          return mockStrategy;
        }
      } catch (error) {
        console.error("Error generating strategy:", error);
        addMessage(
          "assistant",
          "I'm sorry, there was an error generating your investment strategy. Please try again."
        );
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [address, sendMessage, addMessage]
  );

  // Register a strategy with the blockchain
  const registerStrategy = useCallback(
    async (strategyToRegister: Strategy) => {
      try {
        // Send a message to register the strategy
        const message = `Please register my strategy with ID: ${strategyToRegister.id}`;
        const contextData = {
          action: "registerStrategy",
          strategyId: strategyToRegister.id,
          walletAddress: address,
        };

        const response = await sendMessage(message, contextData);

        if (response) {
          // Update strategy status
          const updatedStrategy = {
            ...strategyToRegister,
            status: "registered" as const,
          };
          setStrategy(updatedStrategy);
          return updatedStrategy;
        }

        return null;
      } catch (error) {
        console.error("Error registering strategy:", error);
        addMessage(
          "assistant",
          "I'm sorry, there was an error registering your strategy. Please try again."
        );
        return null;
      }
    },
    [address, sendMessage, addMessage]
  );

  // Execute a registered strategy
  const executeStrategy = useCallback(
    async (strategyToExecute: Strategy) => {
      try {
        // Send a message to execute the strategy
        const message = `Please execute my strategy with ID: ${strategyToExecute.id}`;
        const contextData = {
          action: "executeStrategy",
          strategyId: strategyToExecute.id,
          walletAddress: address,
        };

        const response = await sendMessage(message, contextData);

        if (response) {
          // Update strategy status
          const updatedStrategy = {
            ...strategyToExecute,
            status: "executed" as const,
          };
          setStrategy(updatedStrategy);
          return updatedStrategy;
        }

        return null;
      } catch (error) {
        console.error("Error executing strategy:", error);
        addMessage(
          "assistant",
          "I'm sorry, there was an error executing your strategy. Please try again."
        );
        return null;
      }
    },
    [address, sendMessage, addMessage]
  );

  // Process user message and determine if we need to take action
  const processMessage = useCallback(
    async (
      message: string,
      amount?: number,
      riskLevel?: "Low" | "Medium" | "High"
    ) => {
      // Check for strategy generation intent
      const lowerMessage = message.toLowerCase();
      if (
        (lowerMessage.includes("generat") ||
          lowerMessage.includes("creat") ||
          lowerMessage.includes("make")) &&
        (lowerMessage.includes("strateg") || lowerMessage.includes("invest"))
      ) {
        if (amount && riskLevel) {
          return await generateStrategy(amount, riskLevel);
        } else {
          // If requesting strategy but missing parameters, send a normal message
          await sendMessage(message);
        }
      } else {
        // For general messages, just send them normally
        await sendMessage(message);
      }

      return null;
    },
    [sendMessage, generateStrategy]
  );

  return {
    isGenerating,
    isLoading,
    strategy,
    messages,
    generateStrategy,
    registerStrategy,
    executeStrategy,
    processMessage,
    sendMessage,
    addMessage,
  };
}

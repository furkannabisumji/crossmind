"use client";

import { useState, useCallback } from 'react';
import { useWallet } from "@/components/wallet-provider";

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
  content: string;
  contextData?: Record<string, any>;
}

export function useZoyaStrategy() {
  // State for strategy generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm Zoya, your AI investment strategist. I can help you create a personalized investment strategy across multiple chains. Tell me about your investment goals or simply deposit funds to get started." 
    }
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { account: address } = useWallet();

  // Chain names mapping - only using Avalanche Fuji testnet
  const chainNames: {[key: number]: string} = {
    43113: "Avalanche Fuji",
  };
  
  // Initialize conversation with Zoya agent
  const initializeConversation = useCallback(async () => {
    if (!address) {
      console.error('Cannot initialize conversation: wallet not connected');
      return null;
    }
    
    // Try different API endpoints until one works
    // Based on ElizaOS structure, the most likely endpoints are:
    const endpoints = [
      'https://crossmind.reponchain.com/api/agent/chat', // Direct agent chat endpoint
      'https://crossmind.reponchain.com/api/agents/2e7fded5-6c90-0786-93e9-40e713a5e19d/conversations', // Agent-specific conversation
      'https://crossmind.reponchain.com/api/agents/conversations', // General agents conversation endpoint
      'https://crossmind.reponchain.com/api/agents/create-conversation', // Original endpoint
      'https://crossmind.reponchain.com/api/agents/conversation', // Singular form
      'https://crossmind.reponchain.com/api/conversations', // Core conversations endpoint
      'https://crossmind.reponchain.com/api/messaging/conversations' // Messaging namespace
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        // Create a new conversation with Zoya agent
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            address,
            agentId: '2e7fded5-6c90-0786-93e9-40e713a5e19d' // Zoya agent ID
          }),
          credentials: 'include',
        });
        
        if (response.ok) {
          console.log(`Success with endpoint: ${endpoint}`);
          const data = await response.json();
          console.log('Response data:', data);
          
          if (data.conversationId) {
            setConversationId(data.conversationId);
            return data.conversationId;
          } else if (data.id) {
            // Alternative response format
            setConversationId(data.id);
            return data.id;
          } else {
            console.error('Unexpected response format:', data);
          }
        } else {
          const errorText = await response.text();
          console.error(`Failed with endpoint ${endpoint}: ${response.status}`, errorText);
        }
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
        lastError = error;
      }
    }
    
    console.error('All endpoints failed. Last error:', lastError);
    return null;
  }, [address]);

  // Add a message to the chat
  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    setMessages(prev => [...prev, { role, content }]);
  }, []);

  // Send a message to Zoya agent
  const sendMessage = useCallback(async (content: string, contextData?: Record<string, any>) => {
    setIsLoading(true);
    
    try {
      let activeConversationId = conversationId;
      
      // Initialize conversation if it doesn't exist
      if (!activeConversationId) {
        activeConversationId = await initializeConversation();
        if (!activeConversationId) {
          throw new Error('Failed to initialize conversation');
        }
      }
      
      // Add user message to the local state immediately
      addMessage('user', content);
      
      // Prepare the message request
      const messageRequest: MessageRequest = {
        content,
      };
      
      // Add context data if provided
      if (contextData) {
        messageRequest.contextData = contextData;
      }
      
      // Try different message sending endpoints
      // Based on ElizaOS structure and the Zoya agent implementation
      const messageEndpoints = [
        `https://crossmind.reponchain.com/api/agent/chat`, // Direct agent chat endpoint
        `https://crossmind.reponchain.com/api/agents/send-message/${activeConversationId}`, // Original endpoint
        `https://crossmind.reponchain.com/api/agents/2e7fded5-6c90-0786-93e9-40e713a5e19d/conversations/${activeConversationId}/messages`, // Agent-specific conversation
        `https://crossmind.reponchain.com/api/agents/conversations/${activeConversationId}/messages`, // General agents conversation endpoint
        `https://crossmind.reponchain.com/api/conversations/${activeConversationId}/messages`, // Core conversations endpoint
        `https://crossmind.reponchain.com/api/messaging/conversations/${activeConversationId}/messages` // Messaging namespace
      ];
      
      let response = null;
      let responseData = null;
      let lastError = null;
      
      for (const endpoint of messageEndpoints) {
        try {
          console.log(`Trying to send message to endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...messageRequest,
              agentId: '2e7fded5-6c90-0786-93e9-40e713a5e19d' // Ensure the agent ID is included
            }),
            credentials: 'include',
          });
          
          if (response.ok) {
            console.log(`Success sending message to: ${endpoint}`);
            responseData = await response.json();
            console.log('Message response data:', responseData);
            break;
          } else {
            const errorText = await response.text();
            console.error(`Failed with message endpoint ${endpoint}: ${response.status}`, errorText);
          }
        } catch (error) {
          console.error(`Error with message endpoint ${endpoint}:`, error);
          lastError = error;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to send message: ${lastError || 'All endpoints failed'}`);
      }
      
      // Add Zoya's response to the local state
      if (responseData.response && responseData.response.content) {
        addMessage('assistant', responseData.response.content);
      } else if (responseData.content) {
        // Alternative response format
        addMessage('assistant', responseData.content);
      }
      
      // Check if the response contains strategy data
      if (responseData.response && responseData.response.strategyData) {
        setStrategy(responseData.response.strategyData);
      } else if (responseData.strategyData) {
        // Alternative response format
        setStrategy(responseData.strategyData);
      }
      
      return responseData;
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('assistant', "I'm sorry, I encountered an error while processing your message. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, initializeConversation, addMessage]);

  // Generate a strategy based on risk level and amount
  const generateStrategy = useCallback(async (
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
          walletAddress: address
        }
      };
      
      // Send strategy generation request to Zoya
      const message = `I'd like to generate a ${riskLevel} risk investment strategy with ${amount} USDC across multiple chains.`;
      const response = await sendMessage(message, contextData);
      
      if (!response || !response.response || !response.response.strategyData) {
        throw new Error('Failed to generate strategy: Invalid response');
      }
      
      return response.response.strategyData as Strategy;
    } catch (error) {
      console.error("Error generating strategy:", error);
      addMessage('assistant', "I'm sorry, there was an error generating your investment strategy. Please try again.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [address, sendMessage, addMessage]);
  
  // Register a strategy with the blockchain
  const registerStrategy = useCallback(async (strategyToRegister: Strategy) => {
    try {
      // Ensure we have an active conversation
      if (!conversationId) {
        await initializeConversation();
      }
      
      // Try different strategy registration endpoints
      // Based on the registerStrategy action in the Zoya agent
      const strategyEndpoints = [
        'https://crossmind.reponchain.com/api/agent/chat', // Direct agent chat endpoint for strategy registration
        'https://crossmind.reponchain.com/api/agents/strategy/register', // Original endpoint
        'https://crossmind.reponchain.com/api/agents/strategies/register', // Plural form
        'https://crossmind.reponchain.com/api/agents/2e7fded5-6c90-0786-93e9-40e713a5e19d/strategies/register', // Agent-specific
        'https://crossmind.reponchain.com/api/strategies/register' // Core strategies endpoint
      ];
      
      let response = null;
      let lastError = null;
      
      for (const endpoint of strategyEndpoints) {
        try {
          console.log(`Trying to register strategy with endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              strategyId: strategyToRegister.id,
              walletAddress: address,
              conversationId,
              agentId: '2e7fded5-6c90-0786-93e9-40e713a5e19d' // Ensure the agent ID is included
            }),
            credentials: 'include',
          });
          
          if (response.ok) {
            console.log(`Success registering strategy with: ${endpoint}`);
            break;
          } else {
            const errorText = await response.text();
            console.error(`Failed with strategy endpoint ${endpoint}: ${response.status}`, errorText);
          }
        } catch (error) {
          console.error(`Error with strategy endpoint ${endpoint}:`, error);
          lastError = error;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to register strategy: ${lastError || 'All endpoints failed'}`);
      }
      
      const data = await response.json();
      
      // Update strategy status
      const updatedStrategy = { ...strategyToRegister, status: "registered" as const };
      setStrategy(updatedStrategy);
      
      // Add message to chat if not already included in response
      if (!data.message) {
        addMessage('assistant', "Your strategy has been successfully registered! Would you like me to execute it now?");
      }
      
      return updatedStrategy;
    } catch (error) {
      console.error("Error registering strategy:", error);
      addMessage('assistant', "I'm sorry, there was an error registering your strategy. Please try again.");
      return null;
    }
  }, [conversationId, initializeConversation, address, addMessage]);
  
  // Execute a registered strategy
  const executeStrategy = useCallback(async (strategyToExecute: Strategy) => {
    try {
      // Ensure we have an active conversation
      if (!conversationId) {
        await initializeConversation();
      }
      
      // Try different strategy execution endpoints
      // Based on the Zoya agent implementation
      const executeEndpoints = [
        'https://crossmind.reponchain.com/api/agent/chat', // Direct agent chat endpoint for strategy execution
        'https://crossmind.reponchain.com/api/agents/strategy/execute', // Original endpoint
        'https://crossmind.reponchain.com/api/agents/strategies/execute', // Plural form
        'https://crossmind.reponchain.com/api/agents/2e7fded5-6c90-0786-93e9-40e713a5e19d/strategies/execute', // Agent-specific
        'https://crossmind.reponchain.com/api/strategies/execute' // Core strategies endpoint
      ];
      
      let response = null;
      let lastError = null;
      
      for (const endpoint of executeEndpoints) {
        try {
          console.log(`Trying to execute strategy with endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              strategyId: strategyToExecute.id,
              walletAddress: address,
              conversationId,
              agentId: '2e7fded5-6c90-0786-93e9-40e713a5e19d' // Ensure the agent ID is included
            }),
            credentials: 'include',
          });
          
          if (response.ok) {
            console.log(`Success executing strategy with: ${endpoint}`);
            break;
          } else {
            const errorText = await response.text();
            console.error(`Failed with execute endpoint ${endpoint}: ${response.status}`, errorText);
          }
        } catch (error) {
          console.error(`Error with execute endpoint ${endpoint}:`, error);
          lastError = error;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to execute strategy: ${lastError || 'All endpoints failed'}`);
      }
      
      const data = await response.json();
      
      // Update strategy status
      const updatedStrategy = { ...strategyToExecute, status: "executed" as const };
      setStrategy(updatedStrategy);
      
      // Add message to chat if not already included in response
      if (!data.message) {
        addMessage('assistant', "Great news! Your strategy has been successfully executed. Your funds have been distributed across multiple chains according to the optimized allocation. You can monitor your investments in the Portfolio section.");
      }
      
      return updatedStrategy;
    } catch (error) {
      console.error("Error executing strategy:", error);
      addMessage('assistant', "I'm sorry, there was an error executing your strategy. Please try again.");
      return null;
    }
  }, [conversationId, initializeConversation, address, addMessage]);
  
  // Process user message and determine if we need to take action
  const processMessage = useCallback(async (
    message: string,
    amount?: number,
    riskLevel?: "Low" | "Medium" | "High"
  ) => {
    // Check for strategy generation intent
    const lowerMessage = message.toLowerCase();
    if (
      (lowerMessage.includes('generat') || lowerMessage.includes('creat') || lowerMessage.includes('make')) && 
      (lowerMessage.includes('strateg') || lowerMessage.includes('invest'))
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
  }, [sendMessage, generateStrategy]);

  // Initialize conversation when hook is first used
  useCallback(async () => {
    if (!conversationId) {
      await initializeConversation();
    }
  }, [conversationId, initializeConversation])();

  return {
    isGenerating,
    isLoading,
    strategy,
    messages,
    conversationId,
    generateStrategy,
    registerStrategy,
    executeStrategy,
    processMessage,
    sendMessage,
    addMessage,
  };
}

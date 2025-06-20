import { useState, useCallback } from 'react';
import { useVault } from './use-vault';
import { useStrategy, type AIGeneratedStrategy } from './use-strategy';
import { useToast } from '@/components/ui/use-toast';

// Define message types for the AI chat interface
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  strategy?: AIGeneratedStrategy;
}

/**
 * Custom hook for the AI-driven investment journey
 * Combines vault and strategy functionality with AI chat interface
 */
export function useAIInvestment() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi there! I\'m Zoya, your AI investment assistant. I can help you deposit funds and create multi-chain investment strategies. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<AIGeneratedStrategy | null>(null);
  
  // Import vault and strategy hooks
  const vault = useVault();
  const strategy = useStrategy();

  // Generate a unique ID for messages
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add a user message to the chat
  const addUserMessage = useCallback((content: string) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  // Add an assistant message to the chat
  const addAssistantMessage = useCallback((content: string, strategy?: AIGeneratedStrategy) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      strategy,
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  // Update a message by ID
  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => 
      prev.map(message => 
        message.id === id ? { ...message, ...updates } : message
      )
    );
  }, []);

  // Handle user input submission
  const handleSubmit = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;
    
    // Add user message to chat
    addUserMessage(userInput);
    
    // Add loading message from assistant
    const loadingMsgId = addAssistantMessage('');
    updateMessage(loadingMsgId, { isLoading: true });
    
    try {
      // Process user input
      if (userInput.toLowerCase().includes('deposit')) {
        // Handle deposit-related queries
        updateMessage(loadingMsgId, { 
          content: 'To deposit funds, please go to the Deposit tab. You can specify the amount you want to deposit and I\'ll help you through the process.',
          isLoading: false,
        });
      } else if (userInput.toLowerCase().includes('strategy') || userInput.toLowerCase().includes('invest')) {
        // Handle strategy generation request
        setIsGeneratingStrategy(true);
        
        // Simulate AI strategy generation
        setTimeout(() => {
          // Example AI-generated strategy
          const generatedStrategy: AIGeneratedStrategy = {
            name: 'Multi-Chain Yield Optimizer',
            description: 'A balanced strategy across multiple chains focusing on stable yields with moderate risk.',
            chains: [
              {
                chainId: 1, // Ethereum
                deposits: [
                  { adapter: '0xA234567890123456789012345678901234567890' as `0x${string}`, percentage: 30 },
                  { adapter: '0xB234567890123456789012345678901234567890' as `0x${string}`, percentage: 20 },
                ],
              },
              {
                chainId: 137, // Polygon
                deposits: [
                  { adapter: '0xC234567890123456789012345678901234567890' as `0x${string}`, percentage: 25 },
                  { adapter: '0xD234567890123456789012345678901234567890' as `0x${string}`, percentage: 25 },
                ],
              },
            ],
            estimatedApy: 12.5,
            riskLevel: 'medium',
          };
          
          setCurrentStrategy(generatedStrategy);
          setIsGeneratingStrategy(false);
          
          updateMessage(loadingMsgId, { 
            content: `I've generated a multi-chain investment strategy for you: **${generatedStrategy.name}**\n\n${generatedStrategy.description}\n\nThis strategy has an estimated APY of ${generatedStrategy.estimatedApy}% with a ${generatedStrategy.riskLevel} risk level.\n\nWould you like to review the details or execute this strategy?`,
            isLoading: false,
            strategy: generatedStrategy,
          });
        }, 3000);
      } else if (userInput.toLowerCase().includes('balance')) {
        // Handle balance inquiry
        if (vault.balance) {
          updateMessage(loadingMsgId, { 
            content: `Your current vault balance is ${vault.balance.amount.toString()} tokens. ${vault.balance.locked ? 'Your funds are currently locked in a strategy.' : 'Your funds are available for withdrawal or strategy execution.'}`,
            isLoading: false,
          });
        } else {
          updateMessage(loadingMsgId, { 
            content: 'I don\'t see any deposits in your vault yet. Would you like to make a deposit?',
            isLoading: false,
          });
        }
      } else {
        // Handle general queries
        updateMessage(loadingMsgId, { 
          content: 'I can help you with deposits and investment strategies. Would you like to deposit funds or generate an investment strategy?',
          isLoading: false,
        });
      }
    } catch (error: any) {
      updateMessage(loadingMsgId, { 
        content: `I'm sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        isLoading: false,
      });
    }
    
    // Clear input field
    setInputValue('');
  }, [addUserMessage, addAssistantMessage, updateMessage, vault.balance]);

  // Execute the current strategy
  const executeCurrentStrategy = useCallback(async () => {
    if (!currentStrategy) {
      toast({
        title: 'No strategy to execute',
        description: 'Please generate a strategy first.',
        variant: 'destructive',
      });
      return;
    }
    
    // Add message indicating execution
    const executionMsgId = addAssistantMessage('Executing your strategy...');
    updateMessage(executionMsgId, { isLoading: true });
    
    try {
      // Execute the strategy
      const result = await strategy.executeStrategy(currentStrategy);
      
      if (result) {
        updateMessage(executionMsgId, { 
          content: `Your strategy "${currentStrategy.name}" has been successfully executed! Your funds are now being deployed across multiple chains according to the strategy.`,
          isLoading: false,
        });
      } else {
        updateMessage(executionMsgId, { 
          content: 'There was an issue executing your strategy. Please try again.',
          isLoading: false,
        });
      }
    } catch (error: any) {
      updateMessage(executionMsgId, { 
        content: `Strategy execution failed: ${error.message || 'Unknown error'}`,
        isLoading: false,
      });
    }
  }, [currentStrategy, addAssistantMessage, updateMessage, strategy, toast]);

  return {
    // Chat interface
    messages,
    inputValue,
    setInputValue,
    handleSubmit,
    isGeneratingStrategy,
    
    // Strategy management
    currentStrategy,
    setCurrentStrategy,
    executeCurrentStrategy,
    
    // Vault functionality
    ...vault,
    
    // Strategy functionality
    ...strategy,
  };
}

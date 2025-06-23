"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import type { UiMessage } from "@/hooks/use-query-hooks";
import { ChannelType, UUID } from "@elizaos/core";
import { apiClient } from "@/lib/api";

// Use UiMessage directly since it already has all required fields
type Message = UiMessage;
import { WalletConnectionWrapper } from "@/components/shared/wallet-connection-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Brain, ArrowRight, Loader2 } from "lucide-react";
import { useTokenApproval } from "@/hooks/use-token-approval";
import { useVault } from "@/hooks/use-vault";
import { useSocketChat } from "@/hooks/use-socket-chat";

export default function StrategyPage() {
  // UI state
  const [activeTab, setActiveTab] = useState<string>("deposit");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<
    "deposit" | "generate" | "approve" | "execute"
  >("deposit");
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High" | "">(
    ""
  );
  const [selectedToken, setSelectedToken] = useState<string>("usdc");
  const [userInput, setUserInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [balance, setBalance] = useState<string>("0");

  // Additional UI states for loading indicators
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Wallet hooks
  const { isConnected, address } = useAccount();
  const { checkAllowance, approveTokens: approveToken } = useTokenApproval();
  const { deposit } = useVault();

  // Use our Zoya strategy hook that integrates with the CrossMind API
  const contextId = "2e7fded5-6c90-0786-93e9-40e713a5e19d"; // Zoya agent id
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInputDisabled, setIsInputDisabled] = useState(false);

  // State to hold the dynamic channel ID created for this session
  const [dynamicChannelId, setDynamicChannelId] = useState<UUID | undefined>();

  // Always call hook unconditionally to avoid React hooks order error
  // Don't use empty string fallback - let hook properly handle undefined state
  const socketChat = useSocketChat({
    channelId: dynamicChannelId,
    currentUserId: address || "00000000-0000-0000-0000-000000000000",
    contextId: "2e7fded5-6c90-0786-93e9-40e713a5e19d" as const,
    chatType: ChannelType.DM,
    allAgents: [],
    messages,
    onAddMessage: (message: UiMessage) => {
      const newMessage: Message = {
        ...message,
        content: message.content || "",
        isAgent: message.isAgent || false,
        id: message.id,
        channelId: message.channelId,
        senderId: message.senderId,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    onUpdateMessage: (messageId: string, updates: Partial<Message>) =>
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      ),
    onDeleteMessage: (messageId: string) =>
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId)),
    onClearMessages: () => setMessages([]),
    onInputDisabledChange: (disabled: boolean) => setIsInputDisabled(disabled),
  });

  const { sendMessage } = socketChat || {};

  // Hydration handling
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Use messages from state for rendering
  const displayMessages = messages;

  // Render a single message
  const renderMessage = (message: Message, idx: number) => {
    const isUser = !message.isAgent;
    const content =
      "content" in message
        ? String(message.content)
        : "text" in message
        ? String(message.text)
        : "";
    const messageId = "id" in message ? String(message.id) : `msg-${idx}`;
    const isLoading =
      "isLoading" in message ? Boolean(message.isLoading) : false;
    const error = "error" in message ? String(message.error) : undefined;

    return (
      <div
        key={messageId}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          <p className="text-sm">{content}</p>
          {isLoading && (
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-pulse bg-primary/50"></div>
            </div>
          )}
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    );
  };

  // Render messages
  const renderMessages = () => {
    if (displayMessages.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <p>Start a conversation with Zoya to generate a strategy</p>
        </div>
      );
    }

    return (
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {displayMessages.map((message, idx) => renderMessage(message, idx))}
      </div>
    );
  };

  // Ensure agent is added to a dynamic channel before chat starts
  useEffect(() => {
    if (!address) {
      console.log('[StrategyPage] No wallet address available, waiting before creating channel');
      return;
    }
    
    console.log('[StrategyPage] Getting dynamic channel for agent', contextId);
    
    let isMounted = true; // Flag to handle component unmount
    
    // Get a dynamic channel ID for this session
    apiClient.addAgentToDynamicChannel(contextId).then((result) => {
      if (!isMounted) return; // Don't update state if component unmounted
      
      if (result?.data?.channelId) {
        const channelId = result.data.channelId as UUID;
        console.log(`[StrategyPage] SUCCESS! Created dynamic channel: ${channelId} for agent ${contextId}`);
        
        // Update state with the new channel ID
        console.log(`[StrategyPage] BEFORE setting dynamicChannelId state to: ${channelId}`);
        // Set state and force re-render
        setDynamicChannelId(channelId);
        
        // State update is asynchronous
        console.log(`[StrategyPage] AFTER setting dynamicChannelId state to: ${channelId}, current value:`, dynamicChannelId);
        
        // We need to log after the next render to verify the state was updated
        setTimeout(() => {
          console.log(`[StrategyPage] NEXT TICK: dynamicChannelId is now:`, dynamicChannelId);
        }, 0);
        
        // Verify agent was added to the channel
        console.log(`[StrategyPage] Agent ${contextId} should now be listening on channel ${channelId}`);
        
        // Additional debug information
        console.log(`[StrategyPage] Current User Address: ${address}`);
        
        // VERIFICATION: Check if agent is really in the channel
        apiClient.getAgentsForChannel(channelId).then(result => {
          console.log(`[StrategyPage] Agents active in channel ${channelId}:`, result?.data?.participants);
          
          // Is our agent in the list?
          const isAgentActive = result?.data?.participants?.includes(contextId);
          console.log(`[StrategyPage] Is agent ${contextId} active in channel? ${isAgentActive}`);
          
          if (!isAgentActive) {
            console.error(`[StrategyPage] AGENT NOT FOUND IN CHANNEL! This would explain missing responses`);
          }
        }).catch(error => {
          console.error(`[StrategyPage] Error verifying agents in channel:`, error);
        });
        
        // VERIFICATION: Check agent's runtime status
        apiClient.getAgent(contextId).then(agentData => {
          console.log(`[StrategyPage] Agent ${contextId} status:`, agentData?.data?.status);
          
          // Log the agent status without direct string comparison to avoid type errors
          console.log(`[StrategyPage] AGENT STATUS: ${agentData?.data?.status} - should be "running" to respond`);
          
          // Just check if it's not truthy or contains 'running' string to detect issues
          if (!agentData?.data?.status || !String(agentData?.data?.status).toLowerCase().includes('running')) {
            console.error(`[StrategyPage] AGENT MAY NOT BE RUNNING! Status: ${agentData?.data?.status}`);
          }
        }).catch(error => {
          console.error(`[StrategyPage] Error getting agent status:`, error);
        });
      } else {
        console.error('[StrategyPage] Failed to get dynamic channel ID from API response', result);
      }
    }).catch(error => {
      if (!isMounted) return; // Don't process errors if component unmounted
      console.error('[StrategyPage] Error adding agent to dynamic channel:', error);
    });
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [address, contextId]);

  // Initialize conversation with Zoya when component mounts
  useEffect(() => {
    if (mounted && isConnected && address && dynamicChannelId && sendMessage) {
      // Initialize conversation with Zoya when component mounts
      if (displayMessages.length === 0) {
        const serverId = "00000000-0000-0000-0000-000000000000" as const;
        const message =
          "Hi Zoya! I'm interested in creating an investment strategy.";

        sendMessage(
          message,
          serverId,
          "user",
          undefined,
          `temp-${Date.now()}`,
          {
            channel_id: dynamicChannelId,
            server_id: serverId,
            author_id: address,
            content: message,
            source_type: "user",
            raw_message: message,
          },
          dynamicChannelId // Use the dynamic channel ID for the message
        );
      }
    }
  }, [
    mounted,
    isConnected,
    address,
    displayMessages.length,
    sendMessage,
    dynamicChannelId,
  ]);

  // Scroll chat to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayMessages]);

  // if (!mounted) return null;

  // Handle deposit and move to strategy generation
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !dynamicChannelId) return;

    try {
      // First check and approve tokens if needed
      const needsApproval = await checkAllowance(depositAmount);

      if (needsApproval) {
        await approveToken(depositAmount);
      }

      // Then deposit
      await deposit(depositAmount);

      // Move to next step
      setCurrentStep("generate");

      // Send message to Zoya about successful deposit
      // Define channel and server IDs with proper UUID format
     
      const serverId =
        "00000000-0000-0000-0000-000000000000" as `${string}-${string}-${string}-${string}-${string}`;
      const message = `I've deposited ${depositAmount} USDC. I'd like a ${riskLevel} risk strategy. Can you help me create one?`;
      // Generate a UUID v4 compliant ID
      const generateUuid =
        (): `${string}-${string}-${string}-${string}-${string}` => {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            }
          ) as `${string}-${string}-${string}-${string}-${string}`;
        };

      const tempId = generateUuid();

      // Convert address to UUID format if it's an Ethereum address
      const getSenderId = (
        addr: string | undefined
      ): `${string}-${string}-${string}-${string}-${string}` => {
        if (!addr) return "00000000-0000-0000-0000-000000000000";
        if (addr.startsWith("0x")) {
          // Convert first 32 chars of hash to UUID format
          const hash = addr.slice(2).padEnd(32, "0");
          return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(
            12,
            16
          )}-${hash.slice(16, 20)}-${hash.slice(20, 32)}` as const;
        }
        return addr as `${string}-${string}-${string}-${string}-${string}`;
      };

      const senderId = getSenderId(address);

      // Add the message to the UI immediately
      // Create message with proper typing
      const userMessage: Message = {
        id: tempId as `${string}-${string}-${string}-${string}-${string}`,
        content: message,
        isAgent: false,
        name: "You",
        senderId: senderId,
        channelId: dynamicChannelId,
        serverId: serverId,
        createdAt: Date.now(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage]);

      // Send the message via socket
      if (sendMessage) {
        sendMessage(
          message,
          serverId,
          "user",
          undefined,
          tempId,
          {
            channel_id: dynamicChannelId,
            server_id: serverId,
            author_id: senderId,
            content: message,
            source_type: "user",
            raw_message: message,
          },
          dynamicChannelId
        ).catch((error) => {
          console.error("Error sending deposit message:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? { ...msg, error: "Failed to send message", isLoading: false }
                : msg
            )
          );
        });
      }
    } catch (error: unknown) {
      console.error("Deposit error:", error);
      if (error instanceof Error) {
        handleSendErrorMessage(error);
      } else {
        handleUnknownError();
      }
    }
  };

  // Handle error message sending
  const handleSendErrorMessage = (error: Error) => {
    const serverId = "00000000-0000-0000-0000-000000000000" as const;
    const errorMessage = `I'm having trouble with my deposit. Error: ${error.message}`;

    if (address && dynamicChannelId && sendMessage) {
      sendMessage(
        errorMessage,
        serverId,
        "user",
        undefined,
        `temp-${Date.now()}`,
        {
          channel_id: dynamicChannelId,
          server_id: serverId,
          author_id: address,
          content: errorMessage,
          source_type: "user",
          raw_message: errorMessage,
        },
        dynamicChannelId
      );
    }
  };

  // Handle unknown error
  const handleUnknownError = () => {
    const serverId = "00000000-0000-0000-0000-000000000000" as const;
    const errorMessage = "I'm having trouble with my deposit. Unknown error.";

    if (address && dynamicChannelId && sendMessage) {
      sendMessage(
        errorMessage,
        serverId,
        "user",
        undefined,
        `temp-${Date.now()}`,
        {
          channel_id: dynamicChannelId,
          server_id: serverId,
          author_id: address,
          content: errorMessage,
          source_type: "user",
          raw_message: errorMessage,
        },
        dynamicChannelId
      );
    }
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!userInput.trim() || !address || !dynamicChannelId || !sendMessage)
      return;

    // Create a temporary message ID in UUID format
    const tempId = `00000000-0000-0000-0000-${Date.now()
      .toString()
      .padStart(12, "0")}` as const;
    const serverId = "00000000-0000-0000-0000-000000000000" as const;
    const senderId = (
      address.startsWith("0x")
        ? `00000000-0000-0000-0000-${address.slice(2).padStart(12, "0")}`
        : address
    ) as `${string}-${string}-${string}-${string}-${string}`;

    // Add the message to the UI immediately
    const userMessage: Message = {
      id: tempId,
      content: userInput,
      isAgent: false,
      name: "You",
      senderId: senderId,
      channelId: dynamicChannelId,
      serverId: serverId,
      createdAt: Date.now(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");

    try {
      // Send the message via socket
      await sendMessage(
        userInput,
        serverId,
        "user",
        undefined,
        tempId,
        {
          channel_id: dynamicChannelId,
          server_id: serverId,
          author_id: senderId,
          content: userInput,
          source_type: "user",
          raw_message: userInput,
        },
        dynamicChannelId
      ); // Pass the dynamicChannelId as override

      // If we're in generate step, check if user is requesting strategy generation
      if (
        currentStep === "generate" &&
        (userInput.toLowerCase().includes("generate") ||
          userInput.toLowerCase().includes("create") ||
          userInput.toLowerCase().includes("strategy"))
      ) {
        // handleGenerateStrategy();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Update the message to show error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, error: "Failed to send message", isLoading: false }
            : msg
        )
      );
    }
  };

  // Risk level options with descriptions
  const riskLevels = [
    {
      value: "Low",
      description:
        "Prioritizes capital preservation with conservative allocation",
    },
    {
      value: "Medium",
      description: "Balanced approach with moderate yield potential",
    },
    {
      value: "High",
      description: "Focuses on maximizing returns with higher volatility",
    },
  ];

  // Handle risk level change
  const handleRiskChange = (level: "Low" | "Medium" | "High") => {
    setRiskLevel(level);
    if (
      currentStep === "generate" &&
      address &&
      dynamicChannelId &&
      sendMessage
    ) {
      const serverId = "00000000-0000-0000-0000-000000000000" as const;
      const tempId = `temp-${Date.now()}`;
      sendMessage(
        `I'd like to adjust my risk profile to ${level} for my investment strategy.`,
        serverId,
        "user",
        undefined,
        tempId,
        {
          channel_id: dynamicChannelId,
          server_id: serverId,
          author_id: address,
          content: `I'd like to adjust my risk profile to ${level} for my investment strategy.`,
          source_type: "user",
          raw_message: `I'd like to adjust my risk profile to ${level} for my investment strategy.`,
        },
        dynamicChannelId
      );
    }
  };

  // Render the chat interface with Zoya
  function renderZoyaChat() {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Zoya - AI Strategy Advisor</CardTitle>
            <CardDescription>
              Ask Zoya to generate an investment strategy
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">{renderMessages()}</CardContent>
        <CardFooter>
          <div className="flex w-full gap-2">
            <Input
              placeholder="Ask Zoya about investment strategies..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Render the deposit step
  const renderDepositStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deposit Funds</CardTitle>
          <CardDescription>
            Deposit the amount you want to invest across multiple chains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium mb-2"
              >
                Deposit Amount (USDC)
              </label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => setDepositAmount(balance)}>Max</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available Balance: {balance || 0} USDC
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Risk Preference
              </label>
              <Tabs
                value={riskLevel}
                onValueChange={(v) =>
                  handleRiskChange(v as "Low" | "Medium" | "High")
                }
              >
                <TabsList className="grid grid-cols-3 mb-2">
                  <TabsTrigger value="Low">Low</TabsTrigger>
                  <TabsTrigger value="Medium">Medium</TabsTrigger>
                  <TabsTrigger value="High">High</TabsTrigger>
                </TabsList>
                {riskLevels.map((level) => (
                  <TabsContent key={level.value} value={level.value}>
                    <p className="text-sm text-muted-foreground">
                      {level.description}
                    </p>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleDeposit}
            disabled={
              !depositAmount ||
              parseFloat(depositAmount) <= 0 ||
              !riskLevel ||
              isDepositing
            }
            className="w-full mt-4"
          >
            {isDepositing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Depositing...
              </>
            ) : (
              <>
                Deposit & Continue <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Render main content based on current step
  function renderContent() {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-1">Strategy Creation</h1>
        <p className="text-muted-foreground mb-6">
          Deposit funds and let Zoya generate an optimized cross-chain
          investment strategy
        </p>

        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center">
            <div
              className={`rounded-full ${
                currentStep === "deposit" ? "bg-primary text-white" : "bg-muted"
              } h-8 w-8 flex items-center justify-center text-sm`}
            >
              1
            </div>
            <div className="h-[2px] w-8 bg-muted mx-1"></div>
            <div
              className={`rounded-full ${
                currentStep === "generate"
                  ? "bg-primary text-white"
                  : "bg-muted"
              } h-8 w-8 flex items-center justify-center text-sm`}
            >
              2
            </div>
            <div className="h-[2px] w-8 bg-muted mx-1"></div>
            <div
              className={`rounded-full ${
                currentStep === "approve" ? "bg-primary text-white" : "bg-muted"
              } h-8 w-8 flex items-center justify-center text-sm`}
            >
              3
            </div>
          </div>
          <div className="flex text-xs">
            <span className="w-8 text-center">Deposit</span>
            <span className="w-8"></span>
            <span className="w-8 text-center">Chat</span>
            <span className="w-8"></span>
            <span className="w-8 text-center">Approve</span>
          </div>
        </div>

        {currentStep === "deposit" && renderDepositStep()}
        {(currentStep === "generate" ||
          currentStep === "approve" ||
          currentStep === "execute") &&
          renderZoyaChat()}
      </div>
    );
  }

  return (
    <WalletConnectionWrapper>
      <div className="animate-in fade-in duration-300">{renderContent()}</div>
    </WalletConnectionWrapper>
  );
}

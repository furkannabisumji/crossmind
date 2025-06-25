"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useChainId,
  useReadContract,
  usePublicClient,
} from "wagmi";
import { decodeEventLog, formatEther, parseUnits } from "viem";
import type { UiMessage } from "@/hooks/use-query-hooks";
import { ChannelType, UUID } from "@elizaos/core";
import { apiClient } from "@/lib/api";
import { safeAddressToUuid } from "@/lib/address-to-uuid";
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
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

// Use UiMessage directly since it already has all required fields
type Message = UiMessage;

import { Brain, ArrowRight, Loader2 } from "lucide-react";
import { ERC20_ABI, useTokenApproval } from "@/hooks/use-token-approval";
import { useSocketChat } from "@/hooks/use-socket-chat";
import { getContractAddress } from "@/lib/contracts/addresses";

import { ABIS } from "@/lib/contracts/abis";

export default function StrategyPage() {
  // UI state
  const [activeTab, setActiveTab] = useState<string>("deposit");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<
    "deposit" | "generate" | "confirm"
  >("deposit");
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High" | "">(
    ""
  );
  const [selectedToken, setSelectedToken] = useState<string>("usdc");
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [balance, setBalance] = useState<string>("0");

  // Strategy management state
  const [pendingStrategies, setPendingStrategies] = useState<
    Array<{
      id: number;
      index: number;
      amount: string;
      txHash: string;
      chains: Array<{
        name: string;
        protocols: Array<{
          name: string;
          percentage: number;
          apy: string;
        }>;
      }>;
      totalApy: string;
      risk: string;
    }>
  >([]);
  const [activeStrategies, setActiveStrategies] = useState<
    Array<{
      id: number;
      index: number;
      amount: string;
      status: string;
    }>
  >([]);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [showActiveStrategies, setShowActiveStrategies] = useState(false);

  // Additional UI states for loading indicators
  const [isDepositing, setIsDepositing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Main web3 hooks
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { checkAllowance } = useTokenApproval(
    getContractAddress("USDC", chainId)
  );

  // Strategy Manager contract hooks
  const strategyManagerAddress = getContractAddress(
    "StrategyManager",
    chainId
  ) as `0x${string}`;

  const { data: userStrategies, isLoading: loadingStrategies } =
    useReadContract({
      address: strategyManagerAddress,
      abi: ABIS.StrategyManager,
      functionName: "getVaults", // Using getVaults instead of getUserStrategies
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
        refetchOnMount: true,
        refetchInterval: 10000, // Refetch every 10 seconds
      },
    });

  // Use our Zoya strategy hook that integrates with the CrossMind API
  const contextId = "2e7fded5-6c90-0786-93e9-40e713a5e19d"; // Zoya agent id
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInputDisabled, setIsInputDisabled] = useState(false);

  // Map strategy status to readable format
  const mapStatusToString = (statusCode: number): string => {
    const statusMap = {
      0: "PENDING",
      1: "REGISTERED",
      2: "EXECUTED",
      3: "REJECTED",
      4: "EXITED",
    };
    return statusMap[statusCode as keyof typeof statusMap] || "UNKNOWN";
  };

  // Process user strategies data from contract
  const processUserStrategies = useCallback(() => {
    if (!userStrategies || !Array.isArray(userStrategies)) {
      return;
    }

    const processedStrategies = userStrategies.map((strategy, index) => ({
      id: index,
      index: Number(strategy.index),
      amount: formatEther(strategy.amount),
      status: mapStatusToString(Number(strategy.status)),
    }));

    // Filter to only include active strategies (REGISTERED or EXECUTED)
    const active = processedStrategies.filter(
      (s) => s.status === "REGISTERED" || s.status === "EXECUTED"
    );

    setActiveStrategies(active);
  }, [userStrategies]);

  // State to hold the dynamic channel ID created for this session
  const [dynamicChannelId, setDynamicChannelId] = useState<UUID | undefined>();

  const { toast } = useToast();

  // Always call hook unconditionally to avoid React hooks order error
  // Don't use empty string fallback - let hook properly handle undefined state
  const socketChat = useSocketChat({
    channelId: dynamicChannelId,
    currentUserId: safeAddressToUuid(address) as UUID,
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
        prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
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

  //transactions
  const {
    writeContract: approve,
    isSuccess: approvalSuccess,
    isError: approvalError,
  } = useWriteContract();
  const {
    writeContract: deposit,
    isSuccess: depositSuccess,
    isError: depositError,
  } = useWriteContract();
  const {
    writeContract: confirmStrategy,
    isSuccess: confirmSuccess,
    isError: confirmError,
  } = useWriteContract();
  const {
    writeContract: exitStrategy,
    isSuccess: exitSuccess,
    isError: exitError,
  } = useWriteContract();

  // Extract transaction hash from Zoya's message
  const extractTransactionHash = (message: string): string | null => {
    const txHashRegex = /Transaction Hash: (0x[a-fA-F0-9]{64})/;
    const match = message.match(txHashRegex);
    return match ? match[1] : null;
  };

  // Parse strategy details from Zoya's message
  const parseStrategyDetails = (message: string) => {
    // Extract chain, protocol, percentage information
    const chains: Array<{
      name: string;
      protocols: Array<{
        name: string;
        percentage: number;
        apy: string;
      }>;
    }> = [];

    // Parse chains and protocols
    const chainRegex = /\*\*(.*?):\*\*\s*((?:\n?•[^•]*)+)/g;
    let chainMatch;

    while ((chainMatch = chainRegex.exec(message)) !== null) {
      const chainName = chainMatch[1].trim();
      const protocolsText = chainMatch[2];

      const protocols: Array<{
        name: string;
        percentage: number;
        apy: string;
      }> = [];

      // Parse protocols within this chain
      const protocolRegex = /•\s*([0-9]+)%\s*([^(]+)\s*\(([^)]+)\)/g;
      let protocolMatch;

      while ((protocolMatch = protocolRegex.exec(protocolsText)) !== null) {
        protocols.push({
          percentage: parseInt(protocolMatch[1], 10),
          name: protocolMatch[2].trim(),
          apy: protocolMatch[3].trim(),
        });
      }

      chains.push({
        name: chainName,
        protocols,
      });
    }

    // Extract risk level
    const riskRegex = /Risk Level:\s*([^\n\*]+)/;
    const riskMatch = message.match(riskRegex);
    const risk = riskMatch ? riskMatch[1].trim() : "";

    // Extract total APY
    const apyRegex = /Expected Total APY:\s*([^%\n\*]+)%/;
    const apyMatch = message.match(apyRegex);
    const totalApy = apyMatch ? `${apyMatch[1].trim()}%` : "";

    return { chains, risk, totalApy };
  };

  // Get strategy ID from transaction receipt
  const getStrategyIdFromTxHash = async (
    txHash: string
  ): Promise<number | null> => {
    if (!publicClient) {
      console.error("Public client not available");
      return null;
    }

    try {
      console.log("Fetching transaction receipt for:", txHash);
      // Wait for receipt - transaction might still be pending
      let receipt = null;
      let attempts = 0;

      // Try multiple times in case transaction is still pending
      while (!receipt && attempts < 5) {
        try {
          receipt = await publicClient.getTransactionReceipt({
            hash: txHash as `0x${string}`,
          });
          console.log("Got transaction receipt:", receipt ? "yes" : "no");
        } catch (err) {
          console.log(`Attempt ${attempts + 1} failed:`, err);
        }

        if (!receipt) {
          console.log("Transaction receipt not found, waiting...");
          // Wait 2 seconds before trying again
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        }
      }

      if (!receipt) {
        console.error(
          "Failed to get transaction receipt after multiple attempts"
        );
        return 0; // Return 0 as a default index for demo purposes
      }

      console.log("Transaction receipt logs:", receipt.logs.length);

      // Find StrategyRegistered event in logs
      const log = receipt.logs.find(
        (log: { address: string; data: string; topics: string[] }) => {
          const addressMatches =
            log.address.toLowerCase() === strategyManagerAddress.toLowerCase();
          console.log("Log address match check:", {
            logAddress: log.address.toLowerCase(),
            contractAddress: strategyManagerAddress.toLowerCase(),
            matches: addressMatches,
          });
          return addressMatches;
        }
      );

      console.log("Found matching log:", log ? "yes" : "no");

      if (log) {
        try {
          // Decode the event log
          const decoded = decodeEventLog({
            abi: ABIS.StrategyManager,
            data: log.data,
            topics: log.topics,
          });

          console.log("Decoded event:", decoded);

          if (decoded.eventName === "StrategyRegistered") {
            console.log(
              "Found StrategyRegistered event with index:",
              Number(decoded.args.index)
            );
            return Number(decoded.args.index);
          }
        } catch (decodeError) {
          console.error("Error decoding event log:", decodeError);
        }
      }

      // If we couldn't get a real index, return a hardcoded index for testing
      console.log("Using hardcoded index 0 for testing");
      return 0;
    } catch (error) {
      console.error("Error getting strategy ID from transaction:", error);
      // Return a hardcoded index for testing
      return 0;
    }
  };

  // Handle strategy confirmation
  const handleConfirmStrategy = (strategyId: number, index: number) => {
    if (!address) return;

    setIsConfirming(true);
    setSelectedStrategy(strategyId);

    try {
      confirmStrategy({
        address: strategyManagerAddress,
        abi: ABIS.StrategyManager,
        functionName: "confirmStrategy",
        args: [BigInt(index), true],
      } as any);
    } catch (error) {
      console.error("Error confirming strategy:", error);
      setIsConfirming(false);
      toast({
        title: "Confirmation Error",
        description: "There was an error confirming your strategy.",
        variant: "destructive",
      });
    }
  };

  // Handle strategy rejection
  const handleRejectStrategy = (strategyId: number, strategyIndex: number) => {
    console.log("Rejecting strategy:", strategyId, strategyIndex);

    try {
  
      try {
        confirmStrategy({
          address: strategyManagerAddress,
          abi: ABIS.StrategyManager,
          functionName: "confirmStrategy",
          args: [BigInt(strategyIndex), false],
        } as any);

            // Remove from pending strategies
      setPendingStrategies((prev) => prev.filter((s) => s.id !== strategyId));

      } catch (error) {
        console.error("Error rejecting strategy:", error);
        setIsConfirming(false);
        toast({
          title: "Rejection Error",
          description: "There was an error rejecting your strategy.",
          variant: "destructive",
        });
      }

      // Stay in current step (don't change to generate if we're already in generate)
      // Focus the input field after a brief delay to ensure render is complete
      setTimeout(() => {
        inputRef.current?.focus();
        // Scroll input into view if needed
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    } catch (error) {
      console.error("Error rejecting strategy:", error);
      toast({
        title: "Rejection Error",
        description: "There was an error rejecting your strategy.",
        variant: "destructive",
      });
    }
  };

  // Handle strategy exit
  const [isExiting, setIsExiting] = useState(false);
  const [exitingStrategyId, setExitingStrategyId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (exitError) {
      toast({
        title: "Exit Error",
        description: "There was an error exiting your strategy.",
        variant: "destructive",
      });
    }
  }, [exitError]);

  const handleExitStrategy = (index: number) => {
    if (!address) return;

    setIsExiting(true);
    setExitingStrategyId(index);

    try {
      exitStrategy({
        address: strategyManagerAddress,
        abi: ABIS.StrategyManager,
        functionName: "exitStrategy",
        args: [BigInt(index)],
      } as any);
    } catch (error) {
      console.error("Error exiting strategy:", error);
      setIsExiting(false);
      toast({
        title: "Exit Error",
        description: "There was an error exiting your strategy.",
        variant: "destructive",
      });
    }
  };

  // Render a single message
  const renderMessage = (message: Message, idx: number) => {
    const isUser = !message.isAgent;

    // Debug message properties to identify issues
    console.log(`Rendering message ${idx}:`, {
      id: message.id,
      isAgent: message.isAgent,
      hasContent: "content" in message,
      hasText: "text" in message,
      contentValue: "content" in message ? message.content : null,
      textValue: "text" in message ? message.text : null,
      keys: Object.keys(message),
    });

    // Extract content from either content or text property
    const content =
      "content" in message && message.content
        ? String(message.content)
        : "text" in message && message.text
        ? String(message.text)
        : message.contentValue
        ? String(message.contentValue)
        : "";

    if (!content) {
      console.warn(`Message ${idx} has no content:`, message);
      return null;
    }

    // Check if this message contains a transaction hash (strategy proposal)
    const txHash = extractTransactionHash(content);
    const hasStrategy = txHash && !isUser;

    // If this is a strategy message, find the corresponding pending strategy
    let strategyData = null;
    if (hasStrategy) {
      strategyData = pendingStrategies.find((s) => s.txHash === txHash);
    }

    const messageId = message.id || `message-${idx}`;
    const isLoading = "isLoading" in message ? message.isLoading : false;
    const error =
      "error" in message && message.error ? String(message.error) : null;

    // Simple markdown renderer for agent messages
    const renderContent = (text: string, isAgent: boolean) => {
      if (!isAgent) {
        // User messages - plain text
        return <p className="text-sm">{text}</p>;
      }

      // Agent messages - render markdown
      const processedText = text
        // Convert **bold** to <strong>
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Convert • bullet points to proper list items
        .replace(/^• (.+)$/gm, "<li>$1</li>")
        // Convert checkmarks with better spacing
        .replace(/✅/g, '<span class="text-green-500 mr-2">✅</span>')
        // Convert targets with better spacing
        .replace(/🎯/g, '<span class="mr-2">🎯</span>')
        // Convert line breaks to <br>
        .replace(/\n/g, "<br>");

      // Wrap any <li> elements in <ul>
      const finalText = processedText.includes("<li>")
        ? processedText.replace(
            /(<li>.*<\/li>)/g,
            '<ul class="list-disc list-inside ml-4 space-y-1">$1</ul>'
          )
        : processedText;

      return (
        <div
          className="text-sm space-y-2"
          dangerouslySetInnerHTML={{ __html: finalText }}
        />
      );
    };

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
          {renderContent(content, message.isAgent)}
          {isLoading && (
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-pulse bg-primary/50"></div>
            </div>
          )}
          {error && (
            <p className="mt-1 text-xs text-red-500">{String(error)}</p>
          )}

          {/* Inline strategy confirmation buttons */}
          {hasStrategy && strategyData && (
            <div className="mt-4 p-3 bg-background/50 rounded-lg border">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Strategy Proposal
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Amount:</span>{" "}
                    {strategyData.amount} USDC
                  </div>
                  <div>
                    <span className="font-medium">APY:</span>{" "}
                    {strategyData.totalApy}
                  </div>
                  <div>
                    <span className="font-medium">Risk:</span>{" "}
                    {strategyData.risk}
                  </div>
                  <div>
                    <span className="font-medium">Chains:</span>{" "}
                    {strategyData.chains.length}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleRejectStrategy(strategyData.id, strategyData.index)
                    }
                    disabled={isConfirming}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleConfirmStrategy(strategyData.id, strategyData.index)
                    }
                    disabled={isConfirming}
                    className="flex-1"
                  >
                    {isConfirming && selectedStrategy === strategyData.id ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
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
        <div ref={messagesEndRef} />
      </div>
    );
  };

  // Ensure agent is added to a dynamic channel before chat starts
  useEffect(() => {
    if (!address) {
      console.log(
        "[StrategyPage] No wallet address available, waiting before creating channel"
      );
      return;
    }

    let isMounted = true; // Flag to handle component unmount

    // Get a dynamic channel ID for this session
    apiClient
      .addAgentToDynamicChannel(contextId, safeAddressToUuid(address) as UUID)
      .then((result) => {
        if (!isMounted) return; // Don't update state if component unmounted

        if (result?.data?.channelId) {
          const channelId = result.data.channelId as UUID;

          // Set state and force re-render
          setDynamicChannelId(channelId);

          // We need to log after the next render to verify the state was updated
          setTimeout(() => {
            console.log(
              `[StrategyPage] NEXT TICK: dynamicChannelId is now:`,
              dynamicChannelId
            );
          }, 0);

          // VERIFICATION: Check if agent is really in the channel
          apiClient
            .getAgentsForChannel(channelId)
            .then((result) => {
              console.log(
                `[StrategyPage] Agents active in channel ${channelId}:`,
                result?.data?.participants
              );

              // Is our agent in the list?
              const isAgentActive =
                result?.data?.participants?.includes(contextId);
              console.log(
                `[StrategyPage] Is agent ${contextId} active in channel? ${isAgentActive}`
              );

              if (!isAgentActive) {
                console.error(
                  `[StrategyPage] AGENT NOT FOUND IN CHANNEL! This would explain missing responses`
                );
              }
            })
            .catch((error) => {
              console.error(
                `[StrategyPage] Error verifying agents in channel:`,
                error
              );
            });

          // VERIFICATION: Check agent's runtime status
          apiClient
            .getAgent(contextId)
            .then((agentData) => {
              console.log(
                `[StrategyPage] Agent ${contextId} status:`,
                agentData?.data?.status
              );

              // Log the agent status without direct string comparison to avoid type errors
              console.log(
                `[StrategyPage] AGENT STATUS: ${agentData?.data?.status} - should be "running" to respond`
              );

              // Just check if it's not truthy or contains 'running' string to detect issues
              if (
                !agentData?.data?.status ||
                !String(agentData?.data?.status)
                  .toLowerCase()
                  .includes("running")
              ) {
                console.error(
                  `[StrategyPage] AGENT MAY NOT BE RUNNING! Status: ${agentData?.data?.status}`
                );
              }
            })
            .catch((error) => {
              console.error(
                `[StrategyPage] Error getting agent status:`,
                error
              );
            });
        } else {
          console.error(
            "[StrategyPage] Failed to get dynamic channel ID from API response",
            result
          );
        }
      })
      .catch((error) => {
        if (!isMounted) return; // Don't process errors if component unmounted
        console.error(
          "[StrategyPage] Error adding agent to dynamic channel:",
          error
        );
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
            author_id: safeAddressToUuid(address),
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

  // Handle typing indicator and auto-scrolling
  useEffect(() => {
    // When new message arrives, scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // If the last message is from the user, show typing indicator
    const lastMessage = displayMessages[displayMessages.length - 1];
    if (lastMessage && !lastMessage.isAgent) {
      setIsAgentTyping(true);

      // Auto-hide typing indicator after 30 seconds if no response
      const timeout = setTimeout(() => {
        setIsAgentTyping(false);
      }, 30000);

      return () => clearTimeout(timeout);
    } else if (lastMessage && lastMessage.isAgent) {
      // When agent responds, hide the typing indicator
      setIsAgentTyping(false);
    }
  }, [displayMessages]);

  useEffect(() => {
    approvalSuccess && proceedToDeposit();
  }, [approvalSuccess]);
  useEffect(() => {
    depositSuccess && trxDone();
  }, [depositSuccess]);
  useEffect(() => {
    if (confirmSuccess) {
      // Update UI after successful confirmation
      setIsConfirming(false);
      toast({
        title: "Strategy Confirmed",
        description:
          "Your strategy has been confirmed and is now being executed.",
        variant: "default",
      });

      // Remove from pending strategies
      if (selectedStrategy !== null) {
        setPendingStrategies((prev) =>
          prev.filter((strategy) => strategy.id !== selectedStrategy)
        );
        setSelectedStrategy(null);
      }

      // Return to generate step if no more pending strategies
      if (pendingStrategies.length <= 1) {
        setCurrentStep("generate");
      }
    }
  }, [confirmSuccess]);

  useEffect(() => {
    approvalError &&
      toast({
        title: "Approval Error",
        description: "An error occurred while approving the transaction.",
        variant: "destructive",
      });
    depositError &&
      toast({
        title: "Deposit Error",
        description: "An error occurred while depositing funds.",
        variant: "destructive",
      });
    confirmError &&
      toast({
        title: "Confirmation Error",
        description: "An error occurred while confirming the strategy.",
        variant: "destructive",
      });

    if (approvalError || depositError) setIsDepositing(false);
    if (confirmError) setIsConfirming(false);
  }, [approvalError, depositError, confirmError]);

  const mapRiskLevel = (level: string | null): number => {
    const riskLevelMap: Record<string, number> = {
      Low: 0,
      Medium: 1,
      High: 2,
    };
    return level && level in riskLevelMap ? riskLevelMap[level] : 1; // Default to Medium
  };

  // Handle token approval process
  const handleTokenApproval = async (amount: string): Promise<boolean> => {
    const parsedAmount = parseUnits(amount, 6);
    try {
      approve({
        abi: ERC20_ABI,
        address: getContractAddress("USDC", chainId) as `0x${string}`,
        functionName: "approve",
        args: [
          getContractAddress("CrossMindVault", chainId) as `0x${string}`,
          parsedAmount,
        ],
      });

      return true;
    } catch (error) {
      console.error("Token approval error:", error);
      return false;
      setIsDepositing(false);
    }
  };

  // Send chat message about deposit
  const sendDepositChatMessage = async (
    amount: string,
    riskLevelStr: string | null
  ): Promise<void> => {
    const serverId =
      "00000000-0000-0000-0000-000000000000" as `${string}-${string}-${string}-${string}-${string}`;
    const message = `I've deposited ${amount} USDC from address ${address}. I'd like a ${riskLevelStr} risk strategy. Can you help me create one?`;
    const tempId = `temp-${Date.now()}`;
    const senderId = safeAddressToUuid(address);

    // Send via socket
    if (sendMessage) {
      try {
        await sendMessage(
          message,
          serverId,
          "user",
          undefined,
          tempId,
          {
            channel_id: dynamicChannelId!,
            server_id: serverId,
            author_id: senderId,
            content: message,
            source_type: "user",
            raw_message: message,
          },
          dynamicChannelId!
        );
      } catch (error) {
        console.error("Error sending deposit message:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  error: "Failed to send message",
                  isLoading: false,
                }
              : msg
          )
        );
      }
    }
  };

  const proceedToDeposit = async () => {
    // Process deposit with mapped risk level
    const numericRiskLevel = mapRiskLevel(riskLevel);

    const parsedAmount = parseUnits(depositAmount, 6);
    console.log("Depositing", parsedAmount, "with risk level", riskLevel);

    deposit({
      abi: ABIS.CrossMindVault,
      address: getContractAddress("CrossMindVault", chainId) as `0x${string}`,
      functionName: "deposit",
      args: [parsedAmount, numericRiskLevel],
    });
  };

  const trxDone = async () => {
    try {
      // Deposit successful - move to next step
      setCurrentStep("generate");

      // Send chat message about successful deposit
      await sendDepositChatMessage(depositAmount, riskLevel);
    } catch (error) {
      console.error("Deposit error:", error);
      if (error instanceof Error) {
        handleSendErrorMessage(error);
      } else {
        handleUnknownError();
      }
    }
  };

  // Main deposit handler function - optimized with extracted utilities
  const handleDeposit = async () => {
    // Early validation
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !dynamicChannelId) {
      return;
    }
    try {
      setIsDepositing(true);
      // Check if token approval is needed
      const hasEnoughAllowance = await checkAllowance(depositAmount, 6);
      const needsApproval = !hasEnoughAllowance;

      console.log(
        "Has enough allowance:",
        hasEnoughAllowance,
        "Needs approval:",
        needsApproval
      );
      // Handle approval if needed
      if (needsApproval) {
        await handleTokenApproval(depositAmount);
      } else {
        proceedToDeposit();
      }
    } catch (error) {
      setIsDepositing(false);
    }
  };

  // Handle error message sending
  const handleSendErrorMessage = (error: Error) => {
    const serverId = "00000000-0000-0000-0000-000000000000" as const;
    const errorMessage = `I'm having trouble with my deposit. Error: ${error.message}`;

    if (address && dynamicChannelId && sendMessage) {
      const senderId = safeAddressToUuid(address) as UUID;
      const tempId = `temp-${Date.now()}`;

      sendMessage(
        errorMessage,
        serverId,
        "user",
        undefined,
        tempId,
        {
          channel_id: dynamicChannelId!,
          server_id: serverId,
          author_id: senderId,
          content: errorMessage,
          source_type: "user",
          raw_message: errorMessage,
        },
        dynamicChannelId!
      ).catch((error) => {
        console.error("Error sending error message:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  error: "Failed to send message",
                  isLoading: false,
                }
              : msg
          )
        );
      });
    }
  };

  // Handle unknown error
  const handleUnknownError = () => {
    const serverId = "00000000-0000-0000-0000-000000000000" as const;
    const errorMessage = "I'm having trouble with my deposit. Unknown error.";

    if (address && dynamicChannelId && sendMessage) {
      const senderId = safeAddressToUuid(address) as UUID;
      const tempId = `temp-${Date.now()}`;

      sendMessage(
        errorMessage,
        serverId,
        "user",
        undefined,
        tempId,
        {
          channel_id: dynamicChannelId!,
          server_id: serverId,
          author_id: senderId,
          content: errorMessage,
          source_type: "user",
          raw_message: errorMessage,
        },
        dynamicChannelId!
      ).catch((error) => {
        console.error("Error sending unknown error message:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, error: "Failed to send message", isLoading: false }
              : msg
          )
        );
      });
    }
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!userInput.trim() || !address || !dynamicChannelId || !sendMessage)
      return;

    // Create a temporary message ID in UUID format
    const tempId = `temp-${Date.now()}`;
    const serverId = "00000000-0000-0000-0000-000000000000" as const;
    const senderId = safeAddressToUuid(address) as UUID;

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
        dynamicChannelId // Use the dynamic channel ID for the message
      ); // Pass the dynamicChannelId as override
      setUserInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      // Update the message to show error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                error: "Failed to send message",
                isLoading: false,
              }
            : msg
        )
      );
    }
  };

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
      const senderId = safeAddressToUuid(address);

      sendMessage(
        `I'd like to adjust my risk profile to ${level} for my investment strategy.`,
        serverId,
        "user",
        undefined,
        tempId,
        {
          channel_id: dynamicChannelId,
          server_id: serverId,
          author_id: senderId,
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
      <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-center gap-2 flex-shrink-0">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Zoya - AI Strategy Advisor</CardTitle>
            <CardDescription>
              Ask Zoya to generate an investment strategy
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
          <div
            className="h-full overflow-y-auto space-y-4 p-4"
            ref={chatContainerRef}
          >
            {renderMessages()}
            {isAgentTyping && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-2 w-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-2 w-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                    <div
                      className="h-2 w-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "600ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter className="flex-shrink-0 bg-background border-t p-4 sticky bottom-0">
          <div className="flex w-full gap-2">
            <Input
              ref={inputRef}
              placeholder="Ask Zoya about investment strategies..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="resize-none"
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isAgentTyping}
              size="sm"
            >
              {isAgentTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Render the confirm strategy step
  const renderConfirmStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Confirm Strategy</CardTitle>
          <CardDescription>
            Review and confirm the strategy generated by Zoya
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingStrategies.length > 0 ? (
            <div className="space-y-6">
              {pendingStrategies.map((strategy) => (
                <Card key={strategy.id} className="border border-primary/20">
                  <CardHeader>
                    <CardTitle>Investment Strategy</CardTitle>
                    <CardDescription>
                      <div className="flex justify-between">
                        <span>Amount: {strategy.amount} USDC</span>
                        <span>Risk Level: {strategy.risk}</span>
                      </div>
                      <div className="mt-1">
                        <span>Expected APY: {strategy.totalApy}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {strategy.chains.map((chain, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <h4 className="text-sm font-semibold">
                            {chain.name}
                          </h4>
                          <div className="mt-2 space-y-1">
                            {chain.protocols.map((protocol, pidx) => (
                              <div
                                key={pidx}
                                className="flex justify-between text-xs"
                              >
                                <span>{protocol.name}</span>
                                <div>
                                  <span className="font-medium">
                                    {protocol.percentage}%
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    ({protocol.apy})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex w-full justify-between">
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleRejectStrategy(strategy.id, strategy.index)
                        }
                        disabled={isConfirming}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() =>
                          handleConfirmStrategy(strategy.id, strategy.index)
                        }
                        disabled={isConfirming}
                      >
                        {isConfirming && selectedStrategy === strategy.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          "Confirm Strategy"
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p>No pending strategies to confirm.</p>
              <Button
                className="mt-4"
                onClick={() => setCurrentStep("generate")}
              >
                Return to Strategy Generation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

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
                {[
                  {
                    value: "Low",
                    description:
                      "Prioritizes capital preservation with conservative allocation",
                  },
                  {
                    value: "Medium",
                    description:
                      "Balanced approach with moderate yield potential",
                  },
                  {
                    value: "High",
                    description:
                      "Focuses on maximizing returns with higher volatility",
                  },
                ].map((level) => (
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

  // Render active strategies tab
  const renderActiveStrategies = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Strategies</CardTitle>
          <CardDescription>
            Manage your active investment strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeStrategies.length > 0 ? (
            <div className="space-y-4">
              {activeStrategies.map((strategy) => (
                <Card key={strategy.id} className="border border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Strategy #{strategy.index}
                      </CardTitle>
                      <Badge
                        variant={
                          strategy.status === "EXECUTED" ? "default" : "outline"
                        }
                      >
                        {strategy.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Amount:</span>{" "}
                        {strategy.amount} USDC
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleExitStrategy(strategy.index)}
                      disabled={
                        isExiting && exitingStrategyId === strategy.index
                      }
                    >
                      {isExiting && exitingStrategyId === strategy.index ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exiting...
                        </>
                      ) : (
                        "Exit Strategy"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p>No active strategies found.</p>
              <Button className="mt-4" onClick={() => setActiveTab("deposit")}>
                Create Your First Strategy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render main content based on current step
  function renderContent() {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit">Deposit & Generate</TabsTrigger>
              <TabsTrigger value="active">Active Strategies</TabsTrigger>
            </TabsList>
            <TabsContent value="deposit" className="h-full mt-6">
              {currentStep === "deposit" && renderDepositStep()}
              {currentStep === "generate" && renderZoyaChat()}
            </TabsContent>
            <TabsContent value="active" className="h-full mt-6">
              {renderActiveStrategies()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Check for new strategy registration in messages
  useEffect(() => {
    const checkForStrategyRegistration = async () => {
      if (displayMessages.length > 0) {
        const lastMessage = displayMessages[displayMessages.length - 1];

        // Extract content from different possible message formats
        let content = "";
        if ("content" in lastMessage && lastMessage.content) {
          content = String(lastMessage.content);
        } else if ("text" in lastMessage && lastMessage.text) {
          content = String(lastMessage.text);
        } else if (lastMessage.contentValue) {
          content = String(lastMessage.contentValue);
        }

        // Log to help debugging
        console.log("Checking last message for strategy:", {
          isAgent: lastMessage.isAgent,
          content: content.substring(0, 100) + "...",
          includesStrategy: content.includes("Transaction Hash:"),
          strategyLoading,
          messageKeys: Object.keys(lastMessage),
        });

        // Check if this is a strategy registration message
        if (lastMessage.isAgent && content.includes("Transaction Hash:")) {
          console.log("Found strategy registration message!");
          // Extract transaction hash
          const txHash = extractTransactionHash(content);
          console.log("Extracted transaction hash:", txHash);

          if (txHash) {
            // Parse strategy details
            const strategyDetails = parseStrategyDetails(content);
            console.log("Parsed strategy details:", strategyDetails);

            try {
              setStrategyLoading(true);
              // Get strategy ID from transaction
              const strategyId = await getStrategyIdFromTxHash(txHash);
              console.log("Retrieved strategy ID:", strategyId);

              if (strategyId !== null) {
                // Match strategy amount from the message
                const amountRegex = /Based on your ([0-9.]+) USDC balance/;
                // If the regex doesn't match, try to fallback to a simpler pattern
                let amountMatch = content.match(amountRegex);

                if (!amountMatch) {
                  // Try alternative pattern that just looks for numbers before "USDC"
                  const altRegex = /([0-9.]+)\s*USDC/;
                  amountMatch = content.match(altRegex);
                }

                const amount = amountMatch ? amountMatch[1] : "0";
                console.log("Extracted amount with regex:", {
                  amountMatch,
                  amount,
                });

                // Add to pending strategies
                const newStrategy = {
                  id: Date.now(),
                  index: strategyId,
                  amount: amount,
                  txHash,
                  chains: strategyDetails.chains,
                  totalApy: strategyDetails.totalApy,
                  risk: strategyDetails.risk,
                };

                console.log("Adding new pending strategy:", newStrategy);
                setPendingStrategies((prev) => [...prev, newStrategy]);
              }
            } catch (error) {
              console.error("Error processing strategy:", error);
            } finally {
              setStrategyLoading(false);
            }
          }
        }
      }
    };

    checkForStrategyRegistration();
  }, [displayMessages]);

  return (
    <WalletConnectionWrapper>
      <div className="h-screen flex flex-col animate-in fade-in duration-300">
        {renderContent()}
      </div>
    </WalletConnectionWrapper>
  );
}

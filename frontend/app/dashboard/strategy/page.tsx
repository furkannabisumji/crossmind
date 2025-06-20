"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/components/wallet-provider";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  ArrowRight,
  ChevronRight,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useTokenApproval } from "@/hooks/use-token-approval";
import { useVault } from "@/hooks/use-vault";
import { useZoyaStrategy } from "@/hooks/use-zoya-strategy";
import { ErrorBoundary } from "@/components/error-boundary";

// Chain options for multi-chain investment
const chainOptions = [
  { id: 1, name: "Ethereum" },
  { id: 137, name: "Polygon" },
  { id: 43114, name: "Avalanche" },
  { id: 42161, name: "Arbitrum" },
  { id: 10, name: "Optimism" },
  { id: 56, name: "BNB Chain" },
];

export default function StrategyPage() {
  // UI state
  const [activeTab, setActiveTab] = useState<string>("deposit");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<
    "deposit" | "generate" | "approve" | "execute"
  >("deposit");
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High">(
    "Medium"
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
  const { isConnected, account: address } = useWallet();
  const { checkAllowance, approveTokens: approveToken } = useTokenApproval();
  const { deposit } = useVault();

  // Use our Zoya strategy hook that integrates with the CrossMind API
  const {
    isGenerating,
    isLoading,
    strategy: generatedStrategy,
    messages,
    generateStrategy,
    registerStrategy,
    executeStrategy,
    sendMessage,
  } = useZoyaStrategy();

  // Hydration handling
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Initialize conversation with Zoya when component mounts
  useEffect(() => {
    if (mounted && isConnected && address) {
      // Initialize conversation with Zoya when component mounts
      if (!messages.length) {
        sendMessage(
          "Hi Zoya! I'm interested in creating an investment strategy."
        );
      }
    }
  }, [mounted, isConnected, address, messages.length, sendMessage]);

  // Scroll chat to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle deposit and move to strategy generation
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

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
      sendMessage(
        `I've deposited ${depositAmount} USDC. I'd like a ${riskLevel} risk strategy. Can you help me create one?`
      );
    } catch (error: unknown) {
      console.error("Deposit error:", error);
      if (error instanceof Error) {
        sendMessage(`I'm having trouble with my deposit. Error: ${error.message}`);
      } else {
        sendMessage("I'm having trouble with my deposit. Unknown error.");
      }
    }
  };

  // Handle user message submission
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Send user message using the hook's method
    await sendMessage(userInput);
    setUserInput("");

    // If we're in generate step, check if user is requesting strategy generation
    if (
      currentStep === "generate" &&
      (userInput.toLowerCase().includes("generate") ||
        userInput.toLowerCase().includes("create") ||
        userInput.toLowerCase().includes("strategy"))
    ) {
      handleGenerateStrategy();
    }
  };

  // Generate investment strategy using the Zoya hook
  const handleGenerateStrategy = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please deposit funds first");
      return;
    }

    try {
      // Use the hook's generateStrategy method with our parameters
      await generateStrategy(
        parseFloat(depositAmount),
        riskLevel
        // Optionally pass preferred chains
        // chainOptions.map(chain => chain.id)
      );

      // Move to approve step once strategy is generated
      setCurrentStep("approve");
    } catch (error: unknown) {
      console.error("Strategy generation error:", error);
      if (error instanceof Error) {
        sendMessage(`I'm having trouble generating a strategy. Error: ${error.message}`);
      } else {
        sendMessage("I'm having trouble generating a strategy. Unknown error.");
      }
    }
  };

  // Handle strategy approval using the hook
  const handleApproveStrategy = async () => {
    if (!generatedStrategy) return;

    try {
      setIsApproving(true);
      // Use the hook's registerStrategy method
      await registerStrategy(generatedStrategy);

      // Move to execute step after registration
      setCurrentStep("execute");

      // Send message to confirm registration
      sendMessage(
        "I'd like to execute this strategy now. Please proceed with execution."
      );
    } catch (error: unknown) {
      console.error("Strategy registration error:", error);
      if (error instanceof Error) {
        sendMessage(`I'm having trouble registering the strategy. Error: ${error.message}`);
      } else {
        sendMessage("I'm having trouble registering the strategy. Unknown error.");
      }
    } finally {
      setIsApproving(false);
    }
  };

  // Handle strategy execution using the hook
  const handleExecuteStrategy = async () => {
    if (!generatedStrategy) return;

    try {
      setIsExecuting(true);
      // Use the hook's executeStrategy method
      await executeStrategy(generatedStrategy);

      // Send message to confirm execution
      sendMessage(
        "Great! Thanks for executing my strategy. How can I monitor it?"
      );
    } catch (error: unknown) {
      console.error("Strategy execution error:", error);
      if (error instanceof Error) {
        sendMessage(`I'm having trouble executing the strategy. Error: ${error.message}`);
      } else {
        sendMessage("I'm having trouble executing the strategy. Unknown error.");
      }
    } finally {
      setIsExecuting(false);
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
    if (currentStep === "generate") {
      sendMessage(
        `I'd like to adjust my risk profile to ${level} for my investment strategy.`
      );
    }
  };

  // Render strategy card
  const renderStrategyCard = () => {
    if (!generatedStrategy) return null;

    return (
      <Card className="border-primary/20 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {generatedStrategy.name}
            <span className="text-sm font-normal px-3 py-1 rounded-full bg-primary/10 text-primary">
              {generatedStrategy.status === "pending" && "Pending Approval"}
              {generatedStrategy.status === "registered" && "Approved"}
              {generatedStrategy.status === "executed" && "Executed"}
              {generatedStrategy.status === "rejected" && "Rejected"}
              {generatedStrategy.status === "exited" && "Exited"}
            </span>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Estimated APY: {generatedStrategy.estimatedAPY}%</span>
            <span>Risk Level: {generatedStrategy.riskLevel}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Chain Distribution</h4>
              <div className="space-y-2">
                {generatedStrategy.chains.map((chain) => (
                  <div key={chain.chainId}>
                    <div className="flex justify-between items-center text-sm">
                      <span>{chain.name}</span>
                      <span>{chain.percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary mt-1">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${chain.percentage}%` }}
                      />
                    </div>
                    <div className="pl-4 mt-2 space-y-1">
                      {chain.protocols.map((protocol, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs text-muted-foreground"
                        >
                          <span>{protocol.name}</span>
                          <span>{protocol.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {generatedStrategy.status === "pending" && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  sendMessage("I don't want to proceed with this strategy.")
                }
              >
                Decline
              </Button>
              <Button onClick={handleApproveStrategy} disabled={isApproving}>
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving
                  </>
                ) : (
                  "Approve Strategy"
                )}
              </Button>
            </>
          )}
          {generatedStrategy.status === "registered" && (
            <Button onClick={handleExecuteStrategy} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing
                </>
              ) : (
                "Execute Strategy"
              )}
            </Button>
          )}
          {generatedStrategy.status === "executed" && (
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard/portfolio")}
            >
              View in Portfolio
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

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
              !depositAmount || parseFloat(depositAmount) <= 0 || isDepositing
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

  // Render chat messages
  function renderMessages() {
    return (
      <ScrollArea className="h-[320px] pr-4">
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-2 rounded-lg bg-muted flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating strategy...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }

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
        <CardContent className="space-y-4">
          {renderMessages()}

          {generatedStrategy && renderStrategyCard()}
        </CardContent>
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

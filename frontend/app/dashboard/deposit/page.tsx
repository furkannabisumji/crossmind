"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet-provider";
import { WalletConnectionWrapper } from "@/components/shared/wallet-connection-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Wallet, Shield, ArrowRight, X } from "lucide-react";

export default function DepositPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [amount, setAmount] = useState("100");
  const [riskLevel, setRiskLevel] = useState("moderate");
  const [depositStep, setDepositStep] = useState(1);

  // Wallet connection is now handled by the WalletConnectionWrapper

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleRiskChange = (value: string) => {
    setRiskLevel(value);
  };

  const handleNextStep = () => {
    setDepositStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setDepositStep(prev => prev - 1);
  };

  const handleClose = () => {
    router.push('/dashboard');
  };

  return (
    <WalletConnectionWrapper>
      <div className="container py-8">
        <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Deposit Funds</h1>
            <p className="text-muted-foreground">
              Fund your CrossMind account to start AI-managed investments
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative mb-8">
          <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-border" />
          <ol className="relative flex justify-between">
            {[1, 2, 3].map((step) => (
              <li key={step} className="flex items-center justify-center">
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                    step === depositStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : step < depositStep
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-muted bg-card text-muted-foreground"
                  }`}
                >
                  {step}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {depositStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Amount</CardTitle>
              <CardDescription>
                Enter the amount you want to deposit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDC)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    className="pl-8"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-sm">
                  <span>Recommended</span>
                </div>
                <div className="flex gap-2">
                  {["100", "500", "1000", "5000"].map((preset) => (
                    <Button
                      key={preset}
                      variant={amount === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(preset)}
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNextStep}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {depositStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Set Risk Profile</CardTitle>
              <CardDescription>
                Choose your risk tolerance for AI-managed investments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={riskLevel}
                onValueChange={handleRiskChange}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent">
                  <RadioGroupItem value="conservative" id="conservative" />
                  <Label
                    htmlFor="conservative"
                    className="flex-1 cursor-pointer font-medium"
                  >
                    Conservative
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    ~5-8% APY
                  </span>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label
                    htmlFor="moderate"
                    className="flex-1 cursor-pointer font-medium"
                  >
                    Moderate
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    ~10-15% APY
                  </span>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent">
                  <RadioGroupItem value="aggressive" id="aggressive" />
                  <Label
                    htmlFor="aggressive"
                    className="flex-1 cursor-pointer font-medium"
                  >
                    Aggressive
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    ~18-25% APY
                  </span>
                </div>
              </RadioGroup>

              <div>
                <h4 className="mb-2 text-sm font-medium">
                  Protocol Diversification
                </h4>
                <Slider defaultValue={[3]} max={5} step={1} />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Concentrated</span>
                  <span>Highly Diversified</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {depositStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Deposit</CardTitle>
              <CardDescription>
                Review your deposit details and confirm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">${amount} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Profile</span>
                    <span className="font-medium capitalize">{riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated APY</span>
                    <span className="font-medium">
                      {riskLevel === "conservative"
                        ? "5-8%"
                        : riskLevel === "moderate"
                        ? "10-15%"
                        : "18-25%"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span className="font-medium">~$2.50</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">AI Strategy Generation</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      After deposit, CrossMind will generate an optimal investment strategy for your approval.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Secure Deployment</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your funds will be securely deployed across multiple chains via Chainlink CCIP.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button>
                <Wallet className="mr-2 h-4 w-4" /> Deposit Now
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
    </WalletConnectionWrapper>
  );
}
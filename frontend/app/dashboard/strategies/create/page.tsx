"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet-provider";
import { ConnectWallet } from "@/components/connect-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Minus, Brain, ArrowLeft } from "lucide-react";

export default function CreateStrategyPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("moderate");
  const [chains, setChains] = useState([{ chain: "", percentage: 0, protocols: [""] }]);

  if (!isConnected) {
    return <ConnectWallet />;
  }

  const handleAddChain = () => {
    setChains([...chains, { chain: "", percentage: 0, protocols: [""] }]);
  };

  const handleRemoveChain = (index: number) => {
    setChains(chains.filter((_, i) => i !== index));
  };

  const handleChainChange = (index: number, value: string) => {
    const newChains = [...chains];
    newChains[index].chain = value;
    setChains(newChains);
  };

  const handlePercentageChange = (index: number, value: string) => {
    const newChains = [...chains];
    newChains[index].percentage = parseInt(value) || 0;
    setChains(newChains);
  };

  const handleAddProtocol = (chainIndex: number) => {
    const newChains = [...chains];
    newChains[chainIndex].protocols.push("");
    setChains(newChains);
  };

  const handleRemoveProtocol = (chainIndex: number, protocolIndex: number) => {
    const newChains = [...chains];
    newChains[chainIndex].protocols = newChains[chainIndex].protocols.filter(
      (_, i) => i !== protocolIndex
    );
    setChains(newChains);
  };

  const handleProtocolChange = (
    chainIndex: number,
    protocolIndex: number,
    value: string
  ) => {
    const newChains = [...chains];
    newChains[chainIndex].protocols[protocolIndex] = value;
    setChains(newChains);
  };

  const handleSubmit = () => {
    // Here you would typically save the strategy
    router.push("/dashboard/strategies");
  };

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/strategies")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Strategies
      </Button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Strategy</h1>
            <p className="text-muted-foreground">
              Design a custom investment strategy
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Define the core parameters of your strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Strategy Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Multi-Chain Yield Optimizer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your investment strategy..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Risk Level</Label>
                <RadioGroup
                  value={riskLevel}
                  onValueChange={setRiskLevel}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent">
                    <RadioGroupItem value="conservative" id="conservative" />
                    <Label htmlFor="conservative">Conservative</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-accent">
                    <RadioGroupItem value="aggressive" id="aggressive" />
                    <Label htmlFor="aggressive">Aggressive</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chain Allocation</CardTitle>
              <CardDescription>
                Define how your assets will be distributed across chains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {chains.map((chain, chainIndex) => (
                <div
                  key={chainIndex}
                  className="rounded-lg border p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Chain {chainIndex + 1}</h4>
                    {chainIndex > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveChain(chainIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Select Chain</Label>
                      <Select
                        value={chain.chain}
                        onValueChange={(value) =>
                          handleChainChange(chainIndex, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a chain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ethereum">Ethereum</SelectItem>
                          <SelectItem value="arbitrum">Arbitrum</SelectItem>
                          <SelectItem value="optimism">Optimism</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                          <SelectItem value="avalanche">Avalanche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Allocation Percentage</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={chain.percentage}
                        onChange={(e) =>
                          handlePercentageChange(chainIndex, e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Protocols</Label>
                    <div className="space-y-2">
                      {chain.protocols.map((protocol, protocolIndex) => (
                        <div
                          key={protocolIndex}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={protocol}
                            onChange={(e) =>
                              handleProtocolChange(
                                chainIndex,
                                protocolIndex,
                                e.target.value
                              )
                            }
                            placeholder="Enter protocol name"
                          />
                          {protocolIndex > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveProtocol(chainIndex, protocolIndex)
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddProtocol(chainIndex)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Protocol
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={handleAddChain}>
                <Plus className="mr-2 h-4 w-4" />
                Add Chain
              </Button>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard/strategies")}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Brain className="mr-2 h-4 w-4" />
                Create Strategy
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
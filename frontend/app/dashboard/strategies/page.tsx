"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet-provider";
import { ConnectWallet } from "@/components/connect-wallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategyCard } from "@/components/strategies/strategy-card";
import { StrategyDetail } from "@/components/strategies/strategy-detail";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Mock strategies data
const strategies = [
  {
    id: "1",
    name: "Multi-Chain Yield Optimizer",
    description: "Balanced yield strategy across major DeFi protocols",
    riskLevel: "Moderate",
    estimatedApy: "12.4%",
    status: "active",
    chains: ["Avalanche", "Base", "Arbitrum"],
    allocation: [
      { chain: "Avalanche", percentage: 50, protocols: ["Aave", "Trader Joe"] },
      { chain: "Base", percentage: 30, protocols: ["Aerodrome", "Balancer"] },
      { chain: "Arbitrum", percentage: 20, protocols: ["GMX", "Radiant"] },
    ],
    createdAt: "2025-05-02T10:30:00Z",
  },
  {
    id: "2",
    name: "Stablecoin Yield Maximizer",
    description: "Focus on stable returns with USDC",
    riskLevel: "Conservative",
    estimatedApy: "8.5%",
    status: "pending",
    chains: ["Ethereum", "Polygon"],
    allocation: [
      { chain: "Ethereum", percentage: 40, protocols: ["Compound", "Aave"] },
      { chain: "Polygon", percentage: 60, protocols: ["Aave", "Quickswap"] },
    ],
    createdAt: "2025-05-06T14:45:00Z",
  },
  {
    id: "3",
    name: "High Yield Seeker",
    description: "Aggressive strategy focused on maximizing returns",
    riskLevel: "Aggressive",
    estimatedApy: "24.7%",
    status: "draft",
    chains: ["Avalanche", "Arbitrum", "Base", "Optimism"],
    allocation: [
      { chain: "Avalanche", percentage: 25, protocols: ["Trader Joe", "Vector"] },
      { chain: "Arbitrum", percentage: 35, protocols: ["GMX", "Camelot"] },
      { chain: "Base", percentage: 20, protocols: ["Aerodrome", "BaseX"] },
      { chain: "Optimism", percentage: 20, protocols: ["Velodrome", "Lyra"] },
    ],
    createdAt: "2025-05-05T09:15:00Z",
  },
];

export default function StrategiesPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  if (!isConnected) {
    return <ConnectWallet />;
  }

  const filteredStrategies = activeTab === "all" 
    ? strategies 
    : strategies.filter(strategy => strategy.status === activeTab);

  const handleCreateStrategy = () => {
    router.push("/dashboard/strategies/create");
  };

  return (
    <div className="container py-8">
      {selectedStrategy ? (
        <div>
          <Button 
            variant="ghost" 
            onClick={() => setSelectedStrategy(null)}
            className="mb-4"
          >
            ← Back to strategies
          </Button>
          <StrategyDetail 
            strategy={strategies.find(s => s.id === selectedStrategy)!} 
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Strategies</h1>
              <p className="text-muted-foreground">
                Manage your AI-generated investment strategies
              </p>
            </div>
            <Button onClick={handleCreateStrategy}>
              <Plus className="mr-2 h-4 w-4" /> Create Custom Strategy
            </Button>
          </div>

          <div className="mt-8">
            <Tabs defaultValue="all" onValueChange={setActiveTab} value={activeTab}>
              <TabsList>
                <TabsTrigger value="all">All Strategies</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStrategies.map((strategy) => (
                    <StrategyCard 
                      key={strategy.id} 
                      strategy={strategy}
                      onClick={() => setSelectedStrategy(strategy.id)}
                    />
                  ))}
                  
                  {filteredStrategies.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="flex flex-col items-center justify-center py-10">
                        <p className="text-muted-foreground mb-4">
                          No strategies found in this category
                        </p>
                        <Button onClick={handleCreateStrategy}>
                          <Plus className="mr-2 h-4 w-4" /> Create Strategy
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="active" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStrategies.map((strategy) => (
                    <StrategyCard 
                      key={strategy.id} 
                      strategy={strategy}
                      onClick={() => setSelectedStrategy(strategy.id)}
                    />
                  ))}
                  
                  {filteredStrategies.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="flex flex-col items-center justify-center py-10">
                        <p className="text-muted-foreground mb-4">
                          No active strategies found
                        </p>
                        <Button onClick={handleCreateStrategy}>
                          <Plus className="mr-2 h-4 w-4" /> Create Strategy
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="pending" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStrategies.map((strategy) => (
                    <StrategyCard 
                      key={strategy.id} 
                      strategy={strategy}
                      onClick={() => setSelectedStrategy(strategy.id)}
                    />
                  ))}
                  
                  {filteredStrategies.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="flex flex-col items-center justify-center py-10">
                        <p className="text-muted-foreground mb-4">
                          No pending strategies found
                        </p>
                        <Button onClick={handleCreateStrategy}>
                          <Plus className="mr-2 h-4 w-4" /> Create Strategy
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="draft" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStrategies.map((strategy) => (
                    <StrategyCard 
                      key={strategy.id} 
                      strategy={strategy}
                      onClick={() => setSelectedStrategy(strategy.id)}
                    />
                  ))}
                  
                  {filteredStrategies.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="flex flex-col items-center justify-center py-10">
                        <p className="text-muted-foreground mb-4">
                          No draft strategies found
                        </p>
                        <Button onClick={handleCreateStrategy}>
                          <Plus className="mr-2 h-4 w-4" /> Create Strategy
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}
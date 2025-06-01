"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet-provider";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, ArrowUpRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ConnectWallet } from "@/components/connect-wallet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Client error caught:", error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          There was an error loading this component. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return children;
}

// Dynamically import components that use browser APIs to prevent SSR issues
// Component loaders with fallbacks
const PortfolioOverview = dynamic(
  () =>
    import("@/components/dashboard/portfolio-overview").then(
      (mod) => mod.PortfolioOverview
    ),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />
  }
);

const StrategyPreview = dynamic(
  () =>
    import("@/components/dashboard/strategy-preview").then(
      (mod) => mod.StrategyPreview
    ),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full rounded-lg" />
  }
);

const TransactionHistory = dynamic(
  () =>
    import("@/components/dashboard/transaction-history").then(
      (mod) => mod.TransactionHistory
    ),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />
  }
);

const ChainDistribution = dynamic(
  () =>
    import("@/components/dashboard/chain-distribution").then(
      (mod) => mod.ChainDistribution
    ),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />
  }
);

const ChatInterface = dynamic(
  () =>
    import("@/components/chat/chat-interface").then((mod) => mod.ChatInterface),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function DashboardPage() {
  const [isClientSide, setIsClientSide] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Safe access to wallet context with client-side check
  const walletContext = useWallet();
  const isConnected = walletContext?.isConnected;

  // Handle client-side hydration
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  // Show a minimal UI during SSR
  if (!isClientSide) {
    return (
      <div className="container py-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <ConnectWallet />;
  }

  return (
    <>
      <div className="container py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Your AI-managed portfolio overview
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/deposit">
              <PlusCircle className="mr-2 h-4 w-4" /> Deposit Funds
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          <Tabs
            defaultValue="overview"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$1,245.33</div>
                      <p className="text-xs text-muted-foreground">
                        +2.5% from last week
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Current APY
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12.4%</div>
                      <p className="text-xs text-muted-foreground">
                        Across all chains
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Risk Level
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">Moderate</div>
                      <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                        <div className="h-2 w-1/2 rounded-full bg-chart-4"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <ErrorBoundary>
                    <PortfolioOverview />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <ChainDistribution />
                  </ErrorBoundary>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Strategy</CardTitle>
                    <CardDescription>
                      Your current AI-managed investment strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ErrorBoundary>
                      <StrategyPreview />
                    </ErrorBoundary>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="strategies" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Generated Strategies</CardTitle>
                    <CardDescription>
                      Review and approve investment strategies generated by
                      CrossMind
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              Yield Optimizer v2
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Estimated APY: 14.2%
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            View Details{" "}
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Avalanche</p>
                            <p className="font-medium">50%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Base</p>
                            <p className="font-medium">30%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Arbitrum</p>
                            <p className="font-medium">20%</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Stablecoin Yield</h3>
                            <p className="text-sm text-muted-foreground">
                              Estimated APY: 8.5%
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            View Details{" "}
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Ethereum</p>
                            <p className="font-medium">40%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Polygon</p>
                            <p className="font-medium">60%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <ErrorBoundary>
                  <TransactionHistory />
                </ErrorBoundary>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      <ErrorBoundary>
        <ChatInterface />
      </ErrorBoundary>
    </>
  );
}

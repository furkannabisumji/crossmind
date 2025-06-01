"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/components/wallet-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ConnectWallet } from "@/components/connect-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { useDebounce } from "@/hooks/use-debounce";

// Import components directly instead of using dynamic imports
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import { StrategyPreview } from "@/components/dashboard/strategy-preview";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { ChainDistribution } from "@/components/dashboard/chain-distribution";
import { ChatInterface } from "@/components/chat/chat-interface";

/**
 * Dashboard page component with optimized rendering and error handling
 */
export default function DashboardPage() {
  // Track component mount state for hydration safety
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Use memo to cache expensive calculations
  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "portfolio", label: "Portfolio" },
      { id: "transactions", label: "Transactions" },
    ],
    []
  );

  // Safely access wallet context with proper type handling
  const { isConnected, isLoading } = useWallet();

  // Use debounced connection state to prevent UI flicker
  const debouncedConnectionState = useDebounce(isConnected, 150);

  // Handle client-side hydration with proper cleanup
  useEffect(() => {
    // Set a short timeout to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Track page views for analytics
  useEffect(() => {
    if (mounted) {
      // In a real app, this would track page views
      // analyticsService.trackPageView('dashboard');
    }
  }, [mounted]);

  // Optimized rendering logic with proper loading states
  const renderContent = () => {
    // Show skeleton during initial load or when hydrating
    if (!mounted || isLoading) {
      return (
        <div className="container py-8 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="mt-8">
              <div className="grid w-full grid-cols-3 lg:w-auto gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="mt-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show connect wallet when not connected
    if (!debouncedConnectionState) {
      return (
        <div className="container py-8 animate-in fade-in duration-300">
          <ConnectWallet />
        </div>
      );
    }

    // Show dashboard content when connected
    return (
      <div className="container py-8 animate-in fade-in duration-300">
        {/* Dashboard content */}
        <DashboardContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />
      </div>
    );
  };

  return renderContent();
}

/**
 * Extracted Dashboard Content component for better code organization
 */
function DashboardContent({
  activeTab,
  setActiveTab,
  tabs,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back! Here's an overview of your portfolio and recent activity.
      </p>

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 ">
              <ErrorBoundary>
                <PortfolioOverview />
              </ErrorBoundary>
              <ErrorBoundary>
                <ChainDistribution />
              </ErrorBoundary>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
                <CardDescription>
                  Overview of your holdings across chains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$24,512.63</div>
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

          <TabsContent value="portfolio" className="mt-6 space-y-6">
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
                        <h3 className="font-semibold">Yield Optimizer v2</h3>
                        <p className="text-sm text-muted-foreground">
                          Estimated APY: 14.2%
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
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
                        View Details
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

          <TabsContent value="transactions" className="mt-6 space-y-6">
            <ErrorBoundary>
              <TransactionHistory />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-8">
        <ErrorBoundary>
          <ChatInterface />
        </ErrorBoundary>
      </div>
    </div>
  );
}

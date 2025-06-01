"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * ConnectWallet component with optimized performance and better UX
 * Includes loading states, error handling, and analytics tracking
 */
export function ConnectWallet() {
  const { connect, isLoading: providerLoading } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use debounced loading state to prevent flickering
  const isLoading = useDebounce(isConnecting || providerLoading, 100);

  // Clear error after 5 seconds
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  const handleConnect = async () => {
    // Prevent multiple connection attempts
    if (isConnecting) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Track connection attempt (for analytics in a real app)
      if (typeof window !== "undefined") {
        // analyticsService.trackEvent('wallet_connect_attempt');
      }

      // Call the connect function from the wallet provider
      const success = await connect();

      if (!success) {
        setError("Failed to connect wallet. Please try again.");
        // analyticsService.trackEvent('wallet_connect_failed');
      } else {
        // analyticsService.trackEvent('wallet_connect_success');
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("An unexpected error occurred. Please try again.");
      // analyticsService.trackEvent('wallet_connect_error', { error: String(err) });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md shadow-lg border-opacity-50 transition-all duration-200 hover:shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Connect Your Wallet
          </CardTitle>
          <CardDescription className="text-base">
            Connect your wallet to access the CrossMind dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm animate-in fade-in slide-in-from-top-5 duration-300">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            className="w-full transition-all duration-200"
            size="lg"
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                <span>Connect Wallet</span>
              </>
            )}
          </Button>

          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-3 transition-all duration-200 hover:translate-x-1">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Secure and Non-Custodial</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  CrossMind never takes custody of your funds. You maintain full
                  control of your assets at all times.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 transition-all duration-200 hover:translate-x-1">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Powered by AI</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Our advanced AI algorithm analyzes market conditions in
                  real-time to optimize your investments across chains.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

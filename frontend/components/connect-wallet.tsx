"use client";

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
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";

/**
 * ConnectWallet component with optimized performance and better UX
 * Uses RainbowKit for wallet connection UI
 */
export function ConnectWallet() {
  const { connect, isLoading, error } = useWallet();
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    // Prevent multiple connection attempts
    if (isLoading) return;

    // Track connection attempt (for analytics in a real app)
    if (typeof window !== "undefined") {
      // analyticsService.trackEvent('wallet_connect_attempt');
    }

    // Open the RainbowKit modal
    if (openConnectModal) {
      openConnectModal();
    } else {
      // Fallback to our custom connect method
      await connect();
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  return (
    <div className="flex justify-center items-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to access your crypto portfolio dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {isConnected ? (
            <Button
              className="w-full transition-all duration-200"
              size="lg"
              onClick={handleDisconnect}
              variant="outline"
            >
              <span>Disconnect Wallet</span>
            </Button>
          ) : (
            <Button
              className="w-full transition-all duration-200"
              size="lg"
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Connect Wallet</span>
                </>
              )}
            </Button>
          )}

          {!isConnected && (
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
                  <h4 className="font-medium">AI-Powered Portfolio Optimization</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our advanced AI algorithm analyzes market conditions in
                    real-time to optimize your investments across chains.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

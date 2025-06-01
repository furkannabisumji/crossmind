"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ShieldCheck, Zap } from "lucide-react";

export function ConnectWallet() {
  const { connect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Call the connect function from the wallet provider
      const success = await connect();
      
      if (!success) {
        setError("Failed to connect wallet. Please try again.");
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to access the CrossMind dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
              </>
            )}
          </Button>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Secure and Non-Custodial</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  CrossMind never takes custody of your funds. You maintain full control of your assets at all times.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Powered by AI</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Our advanced AI algorithm analyzes market conditions in real-time to optimize your investments across chains.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
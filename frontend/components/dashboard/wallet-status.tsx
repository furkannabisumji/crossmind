'use client';

import { useWallet } from '@/components/wallet-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ConnectWallet } from '@/components/connect-wallet';

/**
 * WalletStatus component displays wallet connection status and balance
 * Shows different UI based on connection state
 */
export function WalletStatus() {
  const { isConnected, account, balance, error } = useWallet();

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Wallet Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-2">
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              <span>Connected</span>
            </div>
            
            <div className="mt-2">
              <div className="text-sm text-muted-foreground">Account</div>
              <div className="font-mono text-sm truncate">{account}</div>
            </div>
            
            <div className="mt-2">
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="font-medium">{balance}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="mr-1 h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Connect your wallet to view your portfolio
              </div>
            )}
            
            <ConnectWallet />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

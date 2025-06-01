"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";

type Transaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'rebalance';
  amount?: string;
  token?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
  chain: string;
};

const transactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: '500',
    token: 'USDC',
    timestamp: '2025-05-06T10:30:00Z',
    status: 'completed',
    txHash: '0x1234...5678',
    chain: 'Ethereum',
  },
  {
    id: '2',
    type: 'rebalance',
    timestamp: '2025-05-04T15:45:00Z',
    status: 'completed',
    txHash: '0xabcd...efgh',
    chain: 'Multiple',
  },
  {
    id: '3',
    type: 'deposit',
    amount: '750',
    token: 'USDC',
    timestamp: '2025-05-01T09:15:00Z',
    status: 'completed',
    txHash: '0x8765...4321',
    chain: 'Ethereum',
  },
  {
    id: '4',
    type: 'withdraw',
    amount: '100',
    token: 'USDC',
    timestamp: '2025-04-28T14:20:00Z',
    status: 'completed',
    txHash: '0xijkl...mnop',
    chain: 'Ethereum',
  },
  {
    id: '5',
    type: 'rebalance',
    timestamp: '2025-04-25T11:10:00Z',
    status: 'completed',
    txHash: '0xqrst...uvwx',
    chain: 'Multiple',
  },
];

export function TransactionHistory() {
  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdraw':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'rebalance':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Your recent transactions and rebalances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full p-2 bg-muted">
                  {getIcon(tx.type)}
                </div>
                <div>
                  <div className="font-medium capitalize">
                    {tx.type === 'rebalance' ? 'AI Rebalance' : `${tx.type} ${tx.token}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(tx.timestamp)} • {tx.chain}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {tx.type !== 'rebalance' && (
                  <div className={`font-medium ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}${tx.amount}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {tx.txHash.substring(0, 6)}...{tx.txHash.substring(tx.txHash.length - 4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import { usePortfolioData } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';

// Example portfolio data type
interface PortfolioData {
  totalValue: number;
  assets: {
    symbol: string;
    amount: number;
    value: number;
    change24h: number;
  }[];
}

interface PortfolioDataExampleProps {
  walletAddress: string;
}

export function PortfolioDataExample({ walletAddress }: PortfolioDataExampleProps) {
  // Using the custom hook with React Query
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching
  } = usePortfolioData<PortfolioData>(walletAddress);

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <Card className="border-red-300 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Loading Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error?.response?.data?.message || error?.message || 'Failed to load portfolio data'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render data
  return (
    <ErrorBoundary>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Portfolio Overview</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {data?.data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Value</span>
                <span className="text-xl font-bold">
                  ${data.data.totalValue.toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-2">
                {data.data.assets.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {asset.amount.toFixed(4)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div>${asset.value.toLocaleString()}</div>
                      <div className={`text-xs ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No portfolio data available</p>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}

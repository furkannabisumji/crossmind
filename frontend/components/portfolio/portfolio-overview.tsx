import { usePortfolioData, usePortfolioPerformance, useSyncPortfolio } from '@/hooks/use-portfolio-contract';
import { useContractChainSupport } from '@/hooks/use-contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatEther } from 'viem';
import { useToast } from '@/components/ui/use-toast';

/**
 * Component to display portfolio overview from on-chain data
 */
export function PortfolioOverview() {
  const { toast } = useToast();
  
  // Check if the Portfolio contract is supported on the current chain
  const { isSupported, currentChainName } = useContractChainSupport('Portfolio');
  
  // Fetch portfolio data
  const { 
    data: portfolioData, 
    isLoading: isLoadingPortfolio,
    error: portfolioError,
    refetch: refetchPortfolio
  } = usePortfolioData({
    watch: true,
    onError: (error) => {
      toast({
        title: 'Error loading portfolio',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Fetch performance history
  const {
    data: performanceData,
    isLoading: isLoadingPerformance
  } = usePortfolioPerformance();
  
  // Hook for syncing portfolio data
  const {
    syncPortfolio,
    isPending: isSyncing,
    transaction: syncTransaction,
    error: syncError
  } = useSyncPortfolio({
    onSuccess: () => {
      toast({
        title: 'Portfolio synced',
        description: 'Your portfolio data has been updated on-chain.',
      });
      refetchPortfolio();
    },
    onError: (error) => {
      toast({
        title: 'Error syncing portfolio',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleSync = async () => {
    try {
      await syncPortfolio();
    } catch (err) {
      console.error('Error syncing portfolio:', err);
    }
  };
  
  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unsupported Network</AlertTitle>
        <AlertDescription>
          The Portfolio contract is not deployed on {currentChainName || 'the current network'}.
          Please switch to a supported network.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (portfolioError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{portfolioError.message}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio Overview</h2>
        <Button 
          onClick={handleSync} 
          disabled={isSyncing || isLoadingPortfolio}
        >
          {isSyncing ? 'Syncing...' : 'Sync Portfolio'}
        </Button>
      </div>
      
      {/* Portfolio Value Card */}
      <Card>
        <CardHeader>
          <CardTitle>Total Portfolio Value</CardTitle>
          <CardDescription>Last updated: {portfolioData ? new Date(Number(portfolioData.lastUpdated) * 1000).toLocaleString() : 'Loading...'}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPortfolio ? (
            <Skeleton className="h-12 w-32" />
          ) : (
            <div className="text-4xl font-bold">
              {portfolioData ? `$${(Number(formatEther(portfolioData.totalValue)) * 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0.00'}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>Your portfolio holdings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPortfolio ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : portfolioData && portfolioData.assets.length > 0 ? (
            <div className="space-y-4">
              {portfolioData.assets.map((asset) => (
                <div key={asset.tokenAddress} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm text-muted-foreground">{asset.tokenAddress}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${(Number(formatEther(asset.value)) * 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-sm text-muted-foreground">{formatEther(asset.amount)} {asset.symbol}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No assets found in your portfolio
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={() => refetchPortfolio()}>
            Refresh
          </Button>
        </CardFooter>
      </Card>
      
      {/* Performance History */}
      {performanceData && performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
            <CardDescription>Your portfolio value over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPerformance ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                {/* You could add a chart component here to visualize the performance data */}
                <div className="text-center py-6 text-muted-foreground">
                  Performance chart would be displayed here
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

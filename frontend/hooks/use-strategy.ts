import { useAccount } from 'wagmi';
import { useState, useCallback } from 'react';
import { useContractData, useContractTransaction } from './use-contract';
import { useToast } from '@/components/ui/use-toast';

// Define types for strategy data
export interface Protocol {
  name: string;
  adapter: `0x${string}`;
}

export interface DepositAllocation {
  adapter: `0x${string}`;
  percentage: number;
}

export interface ChainStrategy {
  chainId: number;
  deposits: DepositAllocation[];
}

export interface AIGeneratedStrategy {
  name: string;
  description: string;
  chains: ChainStrategy[];
  estimatedApy: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Custom hook for interacting with the StrategyManager contract
 * Provides functionality for strategy execution and chain/protocol data
 */
export function useStrategy() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isStrategyExecuted, setIsStrategyExecuted] = useState(false);
  
  // Get supported chain IDs
  const {
    data: supportedChainIds,
    isLoading: isChainIdsLoading,
  } = useContractData<number[]>(
    'StrategyManager',
    'getSupportedChainIds',
    [],
    { enabled: !!address }
  );

  // Function to get protocols for a specific chain
  const getProtocolsForChain = (chainId: number) => {
    return useContractData<Protocol[]>(
      'StrategyManager',
      'getProtocols',
      [chainId],
      { enabled: !!address && !!chainId }
    );
  };

  // Setup strategy execution transaction
  const {
    writeAsync: executeStrategyAsync,
    isPending: isExecutePending,
    transaction: executeTransaction,
  } = useContractTransaction(
    'StrategyManager',
    'executeStrategy',
    {
      onSuccess: () => {
        toast({
          title: 'Strategy execution initiated',
          description: 'Your strategy execution transaction has been submitted.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Strategy execution failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    }
  );

  // Format AI-generated strategy for contract execution
  const formatStrategyForExecution = (strategy: AIGeneratedStrategy): ChainStrategy[] => {
    return strategy.chains.map(chain => ({
      chainId: chain.chainId,
      deposits: chain.deposits.map(deposit => ({
        adapter: deposit.adapter,
        percentage: deposit.percentage,
      })),
    }));
  };

  // Execute an AI-generated strategy
  const executeStrategy = useCallback(
    async (strategy: AIGeneratedStrategy) => {
      if (!address) {
        toast({
          title: 'Wallet not connected',
          description: 'Please connect your wallet to execute a strategy.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const formattedStrategy = formatStrategyForExecution(strategy);
        const tx = await executeStrategyAsync({ args: [formattedStrategy] });
        
        // Wait for transaction confirmation
        if (executeTransaction.isSuccess) {
          setIsStrategyExecuted(true);
          
          toast({
            title: 'Strategy executed successfully',
            description: 'Your investment strategy has been executed.',
          });
          
          return tx;
        }
      } catch (error: any) {
        toast({
          title: 'Strategy execution failed',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
        return null;
      }
    },
    [address, executeStrategyAsync, executeTransaction.isSuccess, toast]
  );

  // Reset strategy execution state
  const resetStrategyExecution = useCallback(() => {
    setIsStrategyExecuted(false);
  }, []);

  return {
    // Chain and protocol data
    supportedChainIds,
    isChainIdsLoading,
    getProtocolsForChain,
    
    // Strategy execution
    executeStrategy,
    isExecutePending,
    isStrategyExecuted,
    resetStrategyExecution,
    executeTransaction,
    
    // Helper functions
    formatStrategyForExecution,
  };
}

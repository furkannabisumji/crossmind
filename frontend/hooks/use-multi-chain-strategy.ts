import { useState, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { useStrategy, type AIGeneratedStrategy, type ChainStrategy } from './use-strategy';
import { useVault } from './use-vault';

// Define types for strategy execution state
export type StrategyStatus = 'idle' | 'pending' | 'executing' | 'success' | 'failed';

export interface ChainProtocolInfo {
  chainId: number;
  chainName: string;
  protocols: {
    name: string;
    adapter: `0x${string}`;
    apy: number;
    tvl: string;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
}

/**
 * Custom hook for managing multi-chain investment strategies
 * Provides functionality for strategy generation, execution, and tracking
 */
export function useMultiChainStrategy() {
  const { address } = useAccount();
  const { toast } = useToast();
  const strategy = useStrategy();
  const vault = useVault();
  
  const [generatedStrategies, setGeneratedStrategies] = useState<AIGeneratedStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<AIGeneratedStrategy | null>(null);
  const [strategyStatus, setStrategyStatus] = useState<StrategyStatus>('idle');
  const [executionError, setExecutionError] = useState<string | null>(null);
  
  // Mock data for supported chains and protocols
  const supportedChains = useMemo<ChainProtocolInfo[]>(() => [
    {
      chainId: 1,
      chainName: 'Ethereum',
      protocols: [
        { 
          name: 'Aave V3', 
          adapter: '0xA234567890123456789012345678901234567890' as `0x${string}`, 
          apy: 3.5, 
          tvl: '$2.8B',
          riskLevel: 'low'
        },
        { 
          name: 'Compound V3', 
          adapter: '0xB234567890123456789012345678901234567890' as `0x${string}`, 
          apy: 4.2, 
          tvl: '$1.7B',
          riskLevel: 'low'
        },
        { 
          name: 'Lido', 
          adapter: '0xC234567890123456789012345678901234567890' as `0x${string}`, 
          apy: 3.8, 
          tvl: '$14.5B',
          riskLevel: 'low'
        }
      ]
    },
    {
      chainId: 137,
      chainName: 'Polygon',
      protocols: [
        { 
          name: 'Aave V3', 
          adapter: '0xD234567890123456789012345678901234567890' as `0x${string}`, 
          apy: 5.2, 
          tvl: '$450M',
          riskLevel: 'low'
        },
        { 
          name: 'Balancer', 
          adapter: '0xE234567890123456789012345678901234567890' as `0x${string}`, 
          apy: 7.8, 
          tvl: '$320M',
          riskLevel: 'medium'
        },
        { 
          name: 'Quickswap', 
          adapter: '0xF234567890123456789012345678901234567890' as `0x${string}`, 
          apy: 12.5, 
          tvl: '$180M',
          riskLevel: 'medium'
        }
      ]
    },
    {
      chainId: 10,
      chainName: 'Optimism',
      protocols: [
        { 
          name: 'Aave V3', 
          adapter: '0x1234567890123456789012345678901234567891' as `0x${string}`, 
          apy: 4.8, 
          tvl: '$280M',
          riskLevel: 'low'
        },
        { 
          name: 'Velodrome', 
          adapter: '0x2234567890123456789012345678901234567891' as `0x${string}`, 
          apy: 15.2, 
          tvl: '$150M',
          riskLevel: 'high'
        }
      ]
    },
    {
      chainId: 42161,
      chainName: 'Arbitrum',
      protocols: [
        { 
          name: 'GMX', 
          adapter: '0x3234567890123456789012345678901234567891' as `0x${string}`, 
          apy: 14.5, 
          tvl: '$410M',
          riskLevel: 'medium'
        },
        { 
          name: 'Radiant', 
          adapter: '0x4234567890123456789012345678901234567891' as `0x${string}`, 
          apy: 8.7, 
          tvl: '$220M',
          riskLevel: 'medium'
        },
        { 
          name: 'Camelot', 
          adapter: '0x5234567890123456789012345678901234567891' as `0x${string}`, 
          apy: 18.3, 
          tvl: '$95M',
          riskLevel: 'high'
        }
      ]
    }
  ], []);

  // Generate a strategy based on user preferences
  const generateStrategy = useCallback((
    amount: string,
    riskLevel: 'low' | 'medium' | 'high',
    preferences: {
      preferredChains?: number[];
      preferredProtocols?: string[];
      yieldFocus?: boolean;
      stableFocus?: boolean;
    } = {}
  ) => {
    if (!address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to generate a strategy.',
        variant: 'destructive',
      });
      return null;
    }

    // Filter chains based on preferences
    let availableChains = [...supportedChains];
    if (preferences.preferredChains && preferences.preferredChains.length > 0) {
      availableChains = availableChains.filter(chain => 
        preferences.preferredChains?.includes(chain.chainId)
      );
    }

    // Generate a strategy based on risk level
    let strategy: AIGeneratedStrategy;
    
    if (riskLevel === 'low') {
      // Conservative strategy with focus on established protocols
      strategy = {
        name: 'Conservative Yield Strategy',
        description: 'A low-risk strategy focused on established lending protocols across multiple chains for stable yields.',
        chains: [
          {
            chainId: 1, // Ethereum
            deposits: [
              { adapter: '0xA234567890123456789012345678901234567890' as `0x${string}`, percentage: 40 }, // Aave
              { adapter: '0xC234567890123456789012345678901234567890' as `0x${string}`, percentage: 30 }, // Lido
            ],
          },
          {
            chainId: 137, // Polygon
            deposits: [
              { adapter: '0xD234567890123456789012345678901234567890' as `0x${string}`, percentage: 30 }, // Aave
            ],
          },
        ],
        estimatedApy: 3.8,
        riskLevel: 'low',
      };
    } else if (riskLevel === 'medium') {
      // Balanced strategy with mix of established and higher yield protocols
      strategy = {
        name: 'Balanced Multi-Chain Yield',
        description: 'A balanced strategy combining established lending protocols with select higher-yield opportunities.',
        chains: [
          {
            chainId: 1, // Ethereum
            deposits: [
              { adapter: '0xA234567890123456789012345678901234567890' as `0x${string}`, percentage: 25 }, // Aave
            ],
          },
          {
            chainId: 137, // Polygon
            deposits: [
              { adapter: '0xE234567890123456789012345678901234567890' as `0x${string}`, percentage: 35 }, // Balancer
            ],
          },
          {
            chainId: 42161, // Arbitrum
            deposits: [
              { adapter: '0x3234567890123456789012345678901234567891' as `0x${string}`, percentage: 40 }, // GMX
            ],
          },
        ],
        estimatedApy: 8.5,
        riskLevel: 'medium',
      };
    } else {
      // Aggressive strategy focusing on highest yields
      strategy = {
        name: 'High Yield Maximizer',
        description: 'An aggressive strategy targeting maximum yields across emerging protocols and newer chains.',
        chains: [
          {
            chainId: 10, // Optimism
            deposits: [
              { adapter: '0x2234567890123456789012345678901234567891' as `0x${string}`, percentage: 35 }, // Velodrome
            ],
          },
          {
            chainId: 42161, // Arbitrum
            deposits: [
              { adapter: '0x3234567890123456789012345678901234567891' as `0x${string}`, percentage: 30 }, // GMX
              { adapter: '0x5234567890123456789012345678901234567891' as `0x${string}`, percentage: 35 }, // Camelot
            ],
          },
        ],
        estimatedApy: 15.8,
        riskLevel: 'high',
      };
    }
    
    // Add the generated strategy to our list
    setGeneratedStrategies(prev => [...prev, strategy]);
    setSelectedStrategy(strategy);
    
    return strategy;
  }, [address, supportedChains, toast]);

  // Execute the selected strategy
  const executeSelectedStrategy = useCallback(async () => {
    if (!address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to execute a strategy.',
        variant: 'destructive',
      });
      return null;
    }

    if (!selectedStrategy) {
      toast({
        title: 'No strategy selected',
        description: 'Please generate or select a strategy first.',
        variant: 'destructive',
      });
      return null;
    }

    if (!vault.balance || vault.balance.amount <= BigInt(0)) {
      toast({
        title: 'Insufficient funds',
        description: 'Please deposit funds before executing a strategy.',
        variant: 'destructive',
      });
      return null;
    }

    setStrategyStatus('pending');
    setExecutionError(null);

    try {
      // Execute the strategy using the strategy hook
      const result = await strategy.executeStrategy(selectedStrategy);
      
      // Set executing status while waiting for confirmation
      setStrategyStatus('executing');
      
      // Monitor transaction status
      if (result) {
        setStrategyStatus('success');
        toast({
          title: 'Strategy executed successfully',
          description: `Your "${selectedStrategy.name}" strategy is now active.`,
        });
        return result;
      } else {
        setStrategyStatus('failed');
        setExecutionError('Strategy execution failed');
        toast({
          title: 'Strategy execution failed',
          description: 'Failed to execute the investment strategy',
          variant: 'destructive',
        });
        return null;
      }
      
      return result;
    } catch (error: any) {
      setStrategyStatus('failed');
      setExecutionError(error.message || 'Unknown error');
      toast({
        title: 'Strategy execution failed',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
      return null;
    }
  }, [address, selectedStrategy, vault.balance, strategy, toast]);

  // Get details about a specific protocol
  const getProtocolDetails = useCallback((chainId: number, adapterAddress: `0x${string}`) => {
    const chain = supportedChains.find(c => c.chainId === chainId);
    if (!chain) return null;
    
    const protocol = chain.protocols.find(p => p.adapter === adapterAddress);
    return protocol || null;
  }, [supportedChains]);

  // Calculate the weighted APY for a strategy
  const calculateWeightedApy = useCallback((strategy: AIGeneratedStrategy) => {
    let totalWeightedApy = 0;
    let totalPercentage = 0;
    
    strategy.chains.forEach(chain => {
      chain.deposits.forEach(deposit => {
        const protocol = getProtocolDetails(chain.chainId, deposit.adapter);
        if (protocol) {
          totalWeightedApy += protocol.apy * (deposit.percentage / 100);
          totalPercentage += deposit.percentage;
        }
      });
    });
    
    return totalPercentage > 0 ? totalWeightedApy : 0;
  }, [getProtocolDetails]);

  return {
    // Strategy data
    generatedStrategies,
    selectedStrategy,
    setSelectedStrategy,
    supportedChains,
    
    // Strategy status
    strategyStatus,
    executionError,
    
    // Strategy functions
    generateStrategy,
    executeStrategy: executeSelectedStrategy,
    getProtocolDetails,
    calculateWeightedApy,
    
    // Reset functions
    resetStatus: () => setStrategyStatus('idle'),
    
    // Vault integration
    vaultBalance: vault.balance,
    isVaultLocked: vault.isBalanceLocked,
    
    // Strategy execution from base hook - excluding executeStrategy which we've renamed
    supportedChainIds: strategy.supportedChainIds,
    isChainIdsLoading: strategy.isChainIdsLoading,
    getProtocolsForChain: strategy.getProtocolsForChain,
    // Additional strategy properties if needed can be added here
  };
}

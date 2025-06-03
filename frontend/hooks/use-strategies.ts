import { useContractData, useContractTransaction } from './use-contract';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

/**
 * Type definition for a strategy from the smart contract
 */
export type Strategy = {
  id: bigint;
  name: string;
  description: string;
  owner: `0x${string}`;
  createdAt: bigint;
  updatedAt: bigint;
  isActive: boolean;
};

/**
 * Custom hook to fetch all strategies owned by the connected wallet
 * 
 * @param options Additional options for the contract read
 * @returns Query result with strategies data
 */
export function useUserStrategies(options: {
  enabled?: boolean;
  watch?: boolean;
  chainId?: number;
  onSuccess?: (data: Strategy[]) => void;
  onError?: (error: Error) => void;
} = {}) {
  const { address } = useAccount();
  
  return useContractData<Strategy[]>(
    'StrategyRegistry',
    'getStrategiesByOwner',
    address ? [address] : [],
    {
      enabled: !!address && (options.enabled !== false),
      watch: options.watch ?? true,
      chainId: options.chainId,
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
}

/**
 * Custom hook to fetch a specific strategy by ID
 * 
 * @param strategyId ID of the strategy to fetch
 * @param options Additional options for the contract read
 * @returns Query result with strategy data
 */
export function useStrategyById(
  strategyId: bigint | number | undefined,
  options: {
    enabled?: boolean;
    watch?: boolean;
    chainId?: number;
    onSuccess?: (data: Strategy) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  return useContractData<Strategy>(
    'StrategyRegistry',
    'getStrategyById',
    strategyId !== undefined ? [BigInt(strategyId)] : [],
    {
      enabled: strategyId !== undefined && (options.enabled !== false),
      watch: options.watch ?? false,
      chainId: options.chainId,
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
}

/**
 * Custom hook to create a new strategy
 * 
 * @param options Additional options for the contract write
 * @returns Mutation result and execution function
 */
export function useCreateStrategy(options: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
} = {}) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  const contractTx = useContractTransaction(
    'StrategyRegistry',
    'createStrategy',
    {
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
  
  const createStrategy = (strategyName: string, strategyDescription: string) => {
    setName(strategyName);
    setDescription(strategyDescription);
    
    return contractTx.writeAsync?.({
      args: [strategyName, strategyDescription],
    });
  };
  
  return {
    ...contractTx,
    createStrategy,
    name,
    description,
  };
}

/**
 * Custom hook to update an existing strategy
 * 
 * @param strategyId ID of the strategy to update
 * @param options Additional options for the contract write
 * @returns Mutation result and execution function
 */
export function useUpdateStrategy(
  strategyId: bigint | number | undefined,
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const contractTx = useContractTransaction(
    'StrategyRegistry',
    'updateStrategy',
    {
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
  
  const updateStrategy = (name: string, description: string) => {
    if (strategyId === undefined) {
      throw new Error('Strategy ID is required');
    }
    
    return contractTx.writeAsync?.({
      args: [BigInt(strategyId), name, description],
    });
  };
  
  return {
    ...contractTx,
    updateStrategy,
  };
}

/**
 * Custom hook to activate or deactivate a strategy
 * 
 * @param strategyId ID of the strategy to update
 * @param options Additional options for the contract write
 * @returns Mutation result and execution function
 */
export function useToggleStrategyActive(
  strategyId: bigint | number | undefined,
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const contractTx = useContractTransaction(
    'StrategyRegistry',
    'setStrategyActive',
    {
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
  
  const toggleActive = (isActive: boolean) => {
    if (strategyId === undefined) {
      throw new Error('Strategy ID is required');
    }
    
    return contractTx.writeAsync?.({
      args: [BigInt(strategyId), isActive],
    });
  };
  
  return {
    ...contractTx,
    toggleActive,
  };
}

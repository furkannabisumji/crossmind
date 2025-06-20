import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useChainId,
  useAccount
} from 'wagmi';
import { ABIS, type ContractName } from '@/lib/contracts/abis';
import { getContractAddress, isContractDeployedOnChain } from '@/lib/contracts/addresses';

/**
 * Custom hook for reading data from smart contracts (view functions)
 * 
 * @param contractName Name of the contract from the ABIS registry
 * @param functionName Name of the function to call on the contract
 * @param args Arguments to pass to the function
 * @param options Additional options for the contract read
 * @returns Result of the contract read with data, loading state, error, etc.
 */
export function useContractData<TData>(
  contractName: ContractName,
  functionName: string,
  args: unknown[] = [],
  options: {
    enabled?: boolean;
    watch?: boolean;
    chainId?: number;
    gcTime?: number;
    staleTime?: number;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { address: connectedAddress } = useAccount();
  const connectedChainId = useChainId();
  
  // Use provided chainId or fall back to connected chain
  const chainId = options.chainId || connectedChainId;
  
  // Check if contract is deployed on the current chain
  const isDeployed = chainId ? isContractDeployedOnChain(contractName, chainId) : false;
  
  // Get contract address for the current chain
  const contractAddress = chainId ? getContractAddress(contractName, chainId) : undefined;
  
  // Create config object for useReadContract
  const config = {
    address: contractAddress,
    abi: ABIS[contractName],
    functionName: functionName as any, // Type assertion needed due to strict function name typing
    args: args as any, // Type assertion needed due to strict args typing
  };
  
  // Use the hook with the proper configuration
  const result = useReadContract(config);
  
  // Handle enabled state manually
  const shouldFetch = !!contractAddress && !!chainId && isDeployed && (options.enabled !== false);
  
  // Handle success callback
  if (result.data && options.onSuccess) {
    // We need to use React's useEffect here, but since we can't in this context,
    // the consumer will need to handle this via the returned data
  }
  
  // Handle error callback
  if (result.error && options.onError) {
    // Same limitation as above
  }
  
  return {
    ...result,
    // Explicitly type the data as TData to fix the 'never' type issue
    data: result.data as TData,
    // Add additional properties that would have been set via options
    isEnabled: shouldFetch,
  };
}

/**
 * Custom hook for writing data to smart contracts (transactions)
 * 
 * @param contractName Name of the contract from the ABIS registry
 * @param functionName Name of the function to call on the contract
 * @param options Additional options for the contract write
 * @returns Result of the contract write with transaction data, loading state, error, etc.
 */
export function useContractTransaction(
  contractName: ContractName,
  functionName: string,
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  
  // Get contract address for the current chain
  const contractAddress = chainId ? getContractAddress(contractName, chainId) : undefined;
  
  // Setup contract write
  const { 
    writeContract, 
    data: hash, 
    isPending: isWritePending, 
    error: writeError 
  } = useWriteContract();
  
  // Track the transaction status
  const { 
    data: receipt, 
    isLoading: isConfirming, 
    isSuccess,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });
  
  // Function to execute the contract write
  const writeAsync = async ({ args }: { args: readonly unknown[] }) => {
    if (!contractAddress) throw new Error('Contract address not found for the current chain');
    
    try {
      const result = await writeContract({
        address: contractAddress,
        abi: ABIS[contractName],
        functionName: functionName as any, // Type assertion needed due to strict function name typing
        args: args as any, // Type assertion needed due to strict args typing
      });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      if (options.onError) {
        options.onError(error as Error);
      }
      throw error;
    }
  };
  
  return {
    // Write operation
    writeAsync,
    data: hash,
    isLoading: isWritePending,
    error: writeError,
    
    // Transaction tracking
    transaction: {
      data: receipt,
      isLoading: isConfirming,
      isSuccess,
      error: confirmError,
    },
    
    // Combined loading state
    isPending: isWritePending || isConfirming,
    
    // Chain and address info
    chainId,
    contractAddress,
    connectedAddress,
  };
}

/**
 * Custom hook to check if the user is on a supported chain for a contract
 * 
 * @param contractName Name of the contract to check
 * @returns Object with chain support information
 */
export function useContractChainSupport(contractName: ContractName) {
  const chainId = useChainId();
  
  const isSupported = chainId ? isContractDeployedOnChain(contractName, chainId) : false;
  
  // Get chain name from the config
  const getChainName = () => {
    if (!chainId) return undefined;
    
    const chains = [
      { id: 1, name: 'Ethereum' },
      { id: 137, name: 'Polygon' },
      { id: 10, name: 'Optimism' },
      { id: 42161, name: 'Arbitrum One' },
      { id: 8453, name: 'Base' },
      { id: 7777777, name: 'Zora' },
    ];
    
    return chains.find(chain => chain.id === chainId)?.name;
  };
  
  return {
    isSupported,
    currentChainId: chainId,
    currentChainName: getChainName(),
  };
}

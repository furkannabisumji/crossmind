import { useContractData, useContractTransaction } from "./use-contract";
import { useAccount } from "wagmi";

/**
 * Type definitions for portfolio data from the smart contract
 */
export type Asset = {
  tokenAddress: `0x${string}`;
  symbol: string;
  amount: bigint;
  value: bigint;
};

export type PortfolioData = {
  totalValue: bigint;
  lastUpdated: bigint;
  assets: Asset[];
};

export type PerformanceData = {
  timestamp: bigint;
  value: bigint;
};

/**
 * Custom hook to fetch portfolio data for the connected wallet
 *
 * @param options Additional options for the contract read
 * @returns Query result with portfolio data
 */
export function usePortfolioData(
  options: {
    enabled?: boolean;
    watch?: boolean;
    chainId?: number;
    walletAddress?: `0x${string}`;
    onSuccess?: (data: PortfolioData) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { address } = useAccount();
  const walletAddress = options.walletAddress || address;

  return useContractData<PortfolioData>(
    "Portfolio",
    "getPortfolio",
    walletAddress ? [walletAddress] : [],
    {
      enabled: !!walletAddress && options.enabled !== false,
      watch: options.watch ?? true,
      chainId: options.chainId,
      // Refresh more frequently for portfolio data
      staleTime: 60 * 1000, // 1 minute
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
}

/**
 * Custom hook to fetch portfolio performance history
 *
 * @param options Additional options for the contract read
 * @returns Query result with performance data
 */
export function usePortfolioPerformance(
  options: {
    enabled?: boolean;
    watch?: boolean;
    chainId?: number;
    walletAddress?: `0x${string}`;
    onSuccess?: (data: PerformanceData[]) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { address } = useAccount();
  const walletAddress = options.walletAddress || address;

  return useContractData<PerformanceData[]>(
    "Portfolio",
    "getPortfolioPerformance",
    walletAddress ? [walletAddress] : [],
    {
      enabled: !!walletAddress && options.enabled !== false,
      watch: options.watch ?? false,
      chainId: options.chainId,
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
}

/**
 * Custom hook to fetch balance of a specific asset
 *
 * @param tokenAddress Address of the token to check balance for
 * @param options Additional options for the contract read
 * @returns Query result with asset balance
 */
export function useAssetBalance(
  tokenAddress: `0x${string}` | undefined,
  options: {
    enabled?: boolean;
    watch?: boolean;
    chainId?: number;
    walletAddress?: `0x${string}`;
    onSuccess?: (data: bigint) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { address } = useAccount();
  const walletAddress = options.walletAddress || address;

  return useContractData<bigint>(
    "Portfolio",
    "getAssetBalance",
    walletAddress && tokenAddress ? [walletAddress, tokenAddress] : [],
    {
      enabled: !!walletAddress && !!tokenAddress && options.enabled !== false,
      watch: options.watch ?? true,
      chainId: options.chainId,
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );
}

/**
 * Custom hook to sync portfolio data on-chain
 *
 * @param options Additional options for the contract write
 * @returns Mutation result and execution function
 */
export function useSyncPortfolio(
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const contractTx = useContractTransaction("Portfolio", "syncPortfolio", {
    onSuccess: options.onSuccess,
    onError: options.onError,
  });

  const syncPortfolio = () => {
    return contractTx.writeAsync?.({
      args: [],
    });
  };

  return {
    ...contractTx,
    syncPortfolio,
  };
}

/**
 * Custom hook to add an asset to portfolio tracking
 *
 * @param options Additional options for the contract write
 * @returns Mutation result and execution function
 */
export function useAddAssetToTracking(
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const contractTx = useContractTransaction("Portfolio", "addAssetToTracking", {
    onSuccess: options.onSuccess,
    onError: options.onError,
  });

  const addAsset = (tokenAddress: `0x${string}`) => {
    return contractTx.writeAsync?.({
      args: [tokenAddress],
    });
  };

  return {
    ...contractTx,
    addAsset,
  };
}

/**
 * Custom hook to remove an asset from portfolio tracking
 *
 * @param options Additional options for the contract write
 * @returns Mutation result and execution function
 */
export function useRemoveAssetFromTracking(
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const contractTx = useContractTransaction(
    "Portfolio",
    "removeAssetFromTracking",
    {
      onSuccess: options.onSuccess,
      onError: options.onError,
    }
  );

  const removeAsset = (tokenAddress: `0x${string}`) => {
    return contractTx.writeAsync?.({
      args: [tokenAddress],
    });
  };

  return {
    ...contractTx,
    removeAsset,
  };
}

import { 
  useQuery, 
  useMutation, 
  UseQueryOptions,
  UseMutationOptions,
  QueryKey
} from '@tanstack/react-query';
import axiosClient from '@/lib/axios-client';
import { AxiosError, AxiosResponse } from 'axios';

// Type definitions for API responses
export type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

export type ApiError = {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
};

/**
 * Custom hook for fetching data with React Query and Axios
 * 
 * @param queryKey Unique key for the query (for caching)
 * @param url API endpoint to fetch data from
 * @param options Additional React Query options
 * @returns Query result with data, loading state, error, etc.
 */
export function useApiQuery<TData>(
  queryKey: QueryKey,
  url: string,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<TData>, AxiosError<ApiError>>({
    queryKey,
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<TData>>(url);
      return response.data;
    },
    ...options,
  });
}

/**
 * Custom hook for fetching crypto market data with appropriate caching
 * Uses shorter stale times for price data that changes frequently
 * 
 * @param symbol Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param options Additional React Query options
 * @returns Query result with market data
 */
export function useMarketData<TData>(
  symbol: string,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>
) {
  return useApiQuery<TData>(
    ['market-data', symbol],
    `/market/price/${symbol}`,
    {
      // Override defaults for market data which changes more frequently
      staleTime: 15 * 1000, // 15 seconds
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
      ...options,
    }
  );
}

/**
 * Custom hook for fetching portfolio data
 * 
 * @param walletAddress Wallet address to fetch portfolio for
 * @param options Additional React Query options
 * @returns Query result with portfolio data
 */
export function usePortfolioData<TData>(
  walletAddress: string,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>
) {
  return useApiQuery<TData>(
    ['portfolio', walletAddress],
    `/portfolio/${walletAddress}`,
    {
      // Don't fetch if no wallet address is provided
      enabled: !!walletAddress,
      ...options,
    }
  );
}

/**
 * Custom hook for fetching transaction history
 * 
 * @param walletAddress Wallet address to fetch transactions for
 * @param options Additional React Query options
 * @returns Query result with transaction data
 */
export function useTransactionHistory<TData>(
  walletAddress: string,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>
) {
  return useApiQuery<TData>(
    ['transactions', walletAddress],
    `/transactions/${walletAddress}`,
    {
      // Don't fetch if no wallet address is provided
      enabled: !!walletAddress,
      ...options,
    }
  );
}

/**
 * Custom hook for executing mutations (POST, PUT, DELETE requests)
 * 
 * @param url API endpoint for the mutation
 * @param method HTTP method (post, put, delete)
 * @param options Additional React Query mutation options
 * @returns Mutation result and execution function
 */
export function useApiMutation<TData, TVariables>(
  url: string,
  method: 'post' | 'put' | 'delete' = 'post',
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AxiosError<ApiError>, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AxiosError<ApiError>, TVariables>({
    mutationFn: async (variables) => {
      const response = await axiosClient[method]<ApiResponse<TData>>(url, variables);
      return response.data;
    },
    ...options,
  });
}

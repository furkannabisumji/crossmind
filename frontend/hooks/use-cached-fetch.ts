import { useState, useEffect } from 'react';

// Simple in-memory cache
const cache: Record<string, { data: any; timestamp: number }> = {};

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseCachedFetchOptions {
  /** Cache expiration time in milliseconds */
  cacheTime?: number;
  /** Whether to skip the fetch */
  skip?: boolean;
  /** Whether to use the cache */
  useCache?: boolean;
}

/**
 * Custom hook for data fetching with caching and error handling
 * @param url URL to fetch data from
 * @param options Fetch options
 * @returns Fetch state with data, loading state, error, and refetch function
 */
export function useCachedFetch<T>(
  url: string,
  options: UseCachedFetchOptions = {}
): FetchState<T> {
  const { 
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache time
    skip = false,
    useCache = true
  } = options;
  
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: !skip,
    error: null,
    refetch: async () => {}
  });
  
  const fetchData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check cache first if enabled
      if (useCache && cache[url] && Date.now() - cache[url].timestamp < cacheTime) {
        setState({
          data: cache[url].data,
          isLoading: false,
          error: null,
          refetch: fetchData
        });
        return;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update cache
      if (useCache) {
        cache[url] = { data, timestamp: Date.now() };
      }
      
      setState({
        data,
        isLoading: false,
        error: null,
        refetch: fetchData
      });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
        refetch: fetchData
      });
    }
  };
  
  useEffect(() => {
    // Set refetch function immediately
    setState(prev => ({ ...prev, refetch: fetchData }));
    
    if (skip) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    fetchData();
  }, [url, skip]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return state;
}

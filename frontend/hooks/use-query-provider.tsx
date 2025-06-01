'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Create a client for each session to avoid shared state across users
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Global defaults for crypto data which may change frequently
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

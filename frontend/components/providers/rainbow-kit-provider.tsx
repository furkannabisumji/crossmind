'use client';

import { ReactNode } from 'react';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi-config';
import { useTheme } from 'next-themes';

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

interface RainbowKitWrapperProps {
  children: ReactNode;
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

/**
 * RainbowKit provider with theme integration
 * Provides wallet connection functionality to the entire app
 */
export function RainbowKitWrapper({ children }: RainbowKitWrapperProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={isDarkMode ? darkTheme() : lightTheme()}
          modalSize="compact"
          appInfo={{
            appName: 'CrossMind Portfolio Dashboard',
            learnMoreUrl: 'https://crossmind.example.com/about',
          }}
        >
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

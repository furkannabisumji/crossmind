"use client";

import { ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { useTheme } from "next-themes";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi-config";

// Import RainbowKit styles
import "@rainbow-me/rainbowkit/styles.css";

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

interface WagmiConfigProps {
  children: ReactNode;
}

// Export the component as WagmiConfig for backward compatibility
export function WagmiConfig({ children }: WagmiConfigProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Only execute this effect on the client
  useEffect(() => {
    setMounted(true);
    setIsDarkMode(resolvedTheme === "dark");
  }, [resolvedTheme]);

  // Prevent hydration errors by only rendering once mounted
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={isDarkMode ? darkTheme() : lightTheme()}
          modalSize="compact"
          appInfo={{
            appName: "CrossMind Portfolio Dashboard",
            learnMoreUrl: "https://crossmind.example.com/about",
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

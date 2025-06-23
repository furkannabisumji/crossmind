"use client";

import { ReactNode, useState, useEffect } from "react";

/**
 * IMPORTANT: This component is DEPRECATED and should not be used directly.
 * Instead, use <ClientRainbowKitWrapper> from client-only-rainbow-kit.tsx
 * 
 * This wrapper is now just a pass-through to prevent double initialization issues.
 * It does NOT initialize WagmiProvider to avoid double initialization with RainbowKit.
 */
interface WagmiConfigProps {
  children: ReactNode;
}

// Export the component as WagmiConfig for backward compatibility only
// This is now just a pass-through to prevent WalletConnect double initialization
export function WagmiConfig({ children }: WagmiConfigProps) {
  const [mounted, setMounted] = useState(false);
  
  // Only execute this effect on the client
  useEffect(() => {
    setMounted(true);
    console.warn(
      "The WagmiConfig component is deprecated. Please use ClientRainbowKitWrapper instead. " +
      "This is now a pass-through component with no wallet initialization."
    );
  }, []);

  // Prevent hydration errors by only rendering once mounted
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  // Just render children without initializing any providers
  // as they should be initialized in ClientRainbowKitWrapper
  return <>{children}</>;
}

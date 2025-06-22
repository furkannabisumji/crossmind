'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Import the actual RainbowKitWrapper but with SSR disabled
const ClientOnlyRainbowKit = dynamic(
  () => import('./rainbow-kit-provider').then((mod) => mod.RainbowKitWrapper),
  { ssr: false }
);

interface ClientRainbowKitWrapperProps {
  children: ReactNode;
}

/**
 * Client-only wrapper for RainbowKitProvider to prevent hydration mismatches
 * This prevents server rendering of the Rainbow Kit provider entirely
 */
export function ClientRainbowKitWrapper({ children }: ClientRainbowKitWrapperProps) {
  return <ClientOnlyRainbowKit>{children}</ClientOnlyRainbowKit>;
}

'use client';

import { ReactNode } from 'react';
import { useWallet } from '@/components/wallet-provider';
import { ConnectWallet } from '@/components/connect-wallet';
import { useDebounce } from '@/hooks/use-debounce';

interface WalletConnectionWrapperProps {
  children: ReactNode;
}

/**
 * A wrapper component that shows either the wallet connection UI or the children
 * based on the wallet connection state.
 * 
 * This provides consistent wallet connection UI across all pages.
 */
export function WalletConnectionWrapper({ children }: WalletConnectionWrapperProps) {
  const { isConnected } = useWallet();
  
  // Use debounced connection state to prevent UI flicker
  const debouncedConnectionState = useDebounce(isConnected, 150);

  // If not connected, show the wallet connection UI
  if (!debouncedConnectionState) {
    return (
      <div className="fixed inset-0 flex items-center justify-center animate-in fade-in duration-300" style={{ paddingTop: '4rem' }}>
        <ConnectWallet />
      </div>
    );
  }

  // If connected, show the children
  return <>{children}</>;
}

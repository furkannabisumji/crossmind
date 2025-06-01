"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useWalletConnection } from '@/hooks/use-wallet-connection';

type WalletContextType = {
  isConnected: boolean;
  account: string | null;
  balance: string;
  chainId: number | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
};

const defaultContext: WalletContextType = {
  isConnected: false,
  account: null,
  balance: '0',
  chainId: null,
  connect: async () => false,
  disconnect: async () => false,
  isLoading: false,
  error: null,
};

const WalletContext = createContext<WalletContextType>(defaultContext);

/**
 * Custom hook to access wallet context
 * @returns Wallet context with connection state and methods
 */
export const useWallet = () => useContext(WalletContext);

/**
 * Wallet provider component that manages wallet connection state
 * Uses wagmi and RainbowKit for wallet connections
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Use our custom hook that wraps wagmi functionality
  const {
    address,
    isConnected,
    balance,
    status,
    connect,
    disconnect,
    isLoading,
    error
  } = useWalletConnection();

  // Convert wagmi state to our app's wallet context format
  const contextValue = useMemo(() => ({
    isConnected,
    account: address || null,
    balance,
    // Default to Ethereum mainnet if connected but no chain detected
    chainId: isConnected ? 1 : null,
    connect,
    disconnect,
    isLoading,
    error,
  }), [address, isConnected, balance, connect, disconnect, isLoading, error]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}
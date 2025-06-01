"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type WalletContextType = {
  isConnected: boolean;
  account: string | null;
  balance: string;
  chainId: number | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  isLoading: boolean;
};

const defaultContext: WalletContextType = {
  isConnected: false,
  account: null,
  balance: '0',
  chainId: null,
  connect: async () => false,
  disconnect: () => {},
  isLoading: false,
};

const STORAGE_KEY = 'crossmind_wallet_state';
const WalletContext = createContext<WalletContextType>(defaultContext);

/**
 * Custom hook to access wallet context
 * @returns Wallet context with connection state and methods
 */
export const useWallet = () => useContext(WalletContext);

/**
 * Wallet provider component that manages wallet connection state
 * Uses localStorage for persistence and implements performance optimizations
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Initialize from localStorage if available (for persistence)
  useEffect(() => {
    if (!isBrowser) return;
    
    const initializeWallet = () => {
      try {
        setIsLoading(true);
        const savedWalletState = localStorage.getItem(STORAGE_KEY);
        
        if (savedWalletState) {
          const { isConnected, account, balance, chainId } = JSON.parse(savedWalletState);
          setIsConnected(isConnected);
          setAccount(account);
          setBalance(balance);
          setChainId(chainId);
        }
      } catch (error) {
        console.error('Error restoring wallet state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Small timeout to ensure hydration is complete
    const timer = setTimeout(initializeWallet, 100);
    return () => clearTimeout(timer);
  }, [isBrowser]);
  
  // Save state changes to localStorage - memoized to prevent unnecessary re-renders
  const saveWalletState = useCallback(() => {
    if (!isBrowser || !isConnected) return;
    
    try {
      const stateToSave = { isConnected, account, balance, chainId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving wallet state:', error);
    }
  }, [isBrowser, isConnected, account, balance, chainId]);
  
  // Save state when it changes
  useEffect(() => {
    if (isConnected) {
      saveWalletState();
    }
  }, [isConnected, saveWalletState]);

  // Mock wallet connection for demo purposes - memoized with useCallback
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      // In a real app, this would use something like wagmi or rainbowkit
      // Add a slight delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsConnected(true);
      setAccount('0x1234...5678');
      setBalance('1,250.45 USDC');
      setChainId(1); // Ethereum Mainnet
      
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect function - memoized with useCallback
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setBalance('0');
    setChainId(null);
    
    // Clear from localStorage
    if (isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isBrowser]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isConnected,
    account,
    balance,
    chainId,
    connect,
    disconnect,
    isLoading,
  }), [isConnected, account, balance, chainId, connect, disconnect, isLoading]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type WalletContextType = {
  isConnected: boolean;
  account: string | null;
  balance: string;
  chainId: number | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
};

const defaultContext: WalletContextType = {
  isConnected: false,
  account: null,
  balance: '0',
  chainId: null,
  connect: async () => false,
  disconnect: () => {},
};

const WalletContext = createContext<WalletContextType>(defaultContext);

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState<number | null>(null);

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Initialize from localStorage if available (for persistence)
  useEffect(() => {
    if (isBrowser) {
      try {
        const savedWalletState = localStorage.getItem('walletState');
        if (savedWalletState) {
          const { isConnected, account, balance, chainId } = JSON.parse(savedWalletState);
          setIsConnected(isConnected);
          setAccount(account);
          setBalance(balance);
          setChainId(chainId);
        }
      } catch (error) {
        console.error('Error restoring wallet state:', error);
      }
    }
  }, [isBrowser]);
  
  // Save state changes to localStorage
  useEffect(() => {
    if (isBrowser && isConnected) {
      try {
        localStorage.setItem('walletState', JSON.stringify({ isConnected, account, balance, chainId }));
      } catch (error) {
        console.error('Error saving wallet state:', error);
      }
    }
  }, [isBrowser, isConnected, account, balance, chainId]);

  // Mock wallet connection for demo purposes
  const connect = async () => {
    try {
      // In a real app, this would use something like wagmi or rainbowkit
      // Add a slight delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsConnected(true);
      setAccount('0x1234...5678');
      setBalance('1,250.45 USDC');
      setChainId(1); // Ethereum Mainnet
      
      // Save to localStorage for persistence
      if (isBrowser) {
        localStorage.setItem('walletState', JSON.stringify({
          isConnected: true,
          account: '0x1234...5678',
          balance: '1,250.45 USDC',
          chainId: 1
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setBalance('0');
    setChainId(null);
    
    // Clear from localStorage
    if (isBrowser) {
      localStorage.removeItem('walletState');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        account,
        balance,
        chainId,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
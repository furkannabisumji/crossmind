"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type WalletContextType = {
  isConnected: boolean;
  account: string | null;
  balance: string;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const defaultContext: WalletContextType = {
  isConnected: false,
  account: null,
  balance: '0',
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
};

const WalletContext = createContext<WalletContextType>(defaultContext);

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState<number | null>(null);

  // Mock wallet connection for demo purposes
  const connect = async () => {
    // In a real app, this would use something like wagmi or rainbowkit
    setIsConnected(true);
    setAccount('0x1234...5678');
    setBalance('1,250.45 USDC');
    setChainId(1); // Ethereum Mainnet
  };

  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setBalance('0');
    setChainId(null);
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
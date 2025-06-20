import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useState, useEffect, useCallback } from 'react';
import { formatEther } from 'viem';
import { config } from '@/lib/wagmi-config';

/**
 * Custom hook for wallet connection functionality
 * Provides a simplified interface for wallet connection and state
 */
export function useWalletConnection() {
  const { address, isConnected, status } = useAccount();
  const { connectors, connectAsync: connect } = useConnect();
  const { disconnectAsync: disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { data: balanceData } = useBalance({
    address,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  // Connect wallet using RainbowKit modal
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Open RainbowKit modal
      if (openConnectModal) {
        openConnectModal();
        return true;
      } else {
        // Fallback if modal is not available
        const connector = connectors[0];
        if (connector) {
          await connect({ connector });
          return true;
        }
      }
      
      setError("No wallet connectors available");
      return false;
    } catch (err) {
      setError("Failed to connect wallet. Please try again.");
      console.error("Wallet connection error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [openConnectModal, connectors, connect]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      await disconnect();
      return true;
    } catch (err) {
      console.error("Wallet disconnection error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [disconnect]);

  return {
    address,
    isConnected,
    isLoading,
    error,
    balance: balanceData ? formatEther(balanceData.value) : "0",
    status,
    connect: connectWallet,
    disconnect: disconnectWallet,
  };
}

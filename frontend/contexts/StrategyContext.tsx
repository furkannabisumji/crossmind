"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";

export interface ConfirmedStrategy {
  id: number;
  index: number;
  amount: string;
  status: "REGISTERED" | "EXECUTED" | "EXITING";
  chains: Array<{
    name: string;
    protocols: Array<{
      name: string;
      percentage: number;
      apy: string;
    }>;
  }>;
  totalApy: string;
  risk: "Low" | "Medium" | "High";
  confirmedAt: string;
  originalZoyaStrategy: boolean;
  txHash?: string;
  chainId?: number;
}

interface StrategyContextType {
  confirmedStrategies: ConfirmedStrategy[];
  addConfirmedStrategy: (strategy: ConfirmedStrategy) => void;
  updateStrategyStatus: (id: number, status: ConfirmedStrategy["status"]) => void;
  removeStrategy: (id: number) => void;
  clearAllStrategies: () => void;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

const STORAGE_KEY = "crossmind_confirmed_strategies";

export const StrategyProvider = ({ children }: { children: ReactNode }) => {
  const [confirmedStrategies, setConfirmedStrategies] = useState<ConfirmedStrategy[]>([]);

  // Load strategies from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfirmedStrategies(parsed);
      } catch (error) {
        console.error("Failed to parse stored strategies:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Persist strategies to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(confirmedStrategies));
  }, [confirmedStrategies]);

  const addConfirmedStrategy = useCallback((strategy: ConfirmedStrategy) => {
    setConfirmedStrategies(prev => {
      // Avoid duplicates based on ID
      const exists = prev.find(s => s.id === strategy.id);
      if (exists) {
        return prev.map(s => s.id === strategy.id ? strategy : s);
      }
      return [...prev, strategy];
    });
  }, []);

  const updateStrategyStatus = useCallback((id: number, status: ConfirmedStrategy["status"]) => {
    setConfirmedStrategies(prev =>
      prev.map(strategy =>
        strategy.id === id ? { ...strategy, status } : strategy
      )
    );
  }, []);

  const removeStrategy = useCallback((id: number) => {
    setConfirmedStrategies(prev => {
      const filtered = prev.filter(strategy => strategy.id !== id);
      // Explicitly persist to localStorage after removal
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  const clearAllStrategies = useCallback(() => {
    setConfirmedStrategies([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: StrategyContextType = {
    confirmedStrategies,
    addConfirmedStrategy,
    updateStrategyStatus,
    removeStrategy,
    clearAllStrategies,
  };

  return (
    <StrategyContext.Provider value={value}>
      {children}
    </StrategyContext.Provider>
  );
};

export const useStrategy = () => {
  const context = useContext(StrategyContext);
  if (context === undefined) {
    throw new Error("useStrategy must be used within a StrategyProvider");
  }
  return context;
};

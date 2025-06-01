import { useState, useEffect, useCallback } from 'react';

type StorageType = 'localStorage' | 'sessionStorage';

interface PersistOptions {
  storage?: StorageType;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

/**
 * Custom hook for persistent state management
 * Automatically saves and restores state from browser storage
 * 
 * @param key Storage key
 * @param initialValue Initial state value
 * @param options Configuration options
 * @returns [state, setState, resetState]
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options: PersistOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    storage = 'localStorage',
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;
  
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Get stored value from browser storage
  const getStoredValue = useCallback((): T => {
    if (!isBrowser) return initialValue;
    
    try {
      const storageObj = window[storage];
      const storedValue = storageObj.getItem(key);
      
      if (storedValue === null) {
        return initialValue;
      }
      
      return deserialize(storedValue);
    } catch (error) {
      console.error(`Error reading from ${storage}:`, error);
      return initialValue;
    }
  }, [isBrowser, initialValue, key, storage, deserialize]);
  
  // State to store our value
  const [state, setState] = useState<T>(getStoredValue);
  
  // Update browser storage when state changes
  useEffect(() => {
    if (!isBrowser) return;
    
    try {
      const storageObj = window[storage];
      const serializedValue = serialize(state);
      
      storageObj.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error writing to ${storage}:`, error);
    }
  }, [isBrowser, key, state, storage, serialize]);
  
  // Reset state to initial value
  const resetState = useCallback(() => {
    if (!isBrowser) return;
    
    try {
      const storageObj = window[storage];
      storageObj.removeItem(key);
      setState(initialValue);
    } catch (error) {
      console.error(`Error removing from ${storage}:`, error);
    }
  }, [isBrowser, initialValue, key, storage]);
  
  // Listen for storage events (for multi-tab synchronization)
  useEffect(() => {
    if (!isBrowser) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === window[storage]) {
        try {
          const newValue = e.newValue ? deserialize(e.newValue) : initialValue;
          setState(newValue);
        } catch (error) {
          console.error(`Error handling storage event:`, error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isBrowser, key, storage, initialValue, deserialize]);
  
  return [state, setState, resetState];
}

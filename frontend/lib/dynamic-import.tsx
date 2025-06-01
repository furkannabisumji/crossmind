import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { RetryErrorBoundary } from '@/components/ui/retry-error-boundary';
import { trackError, ErrorSeverity } from '@/lib/error-tracking';

// Type definition for Next.js dynamic loading props
type DynamicOptionsLoadingProps = {
  error?: Error | null;
  isLoading?: boolean;
  pastDelay?: boolean;
};

interface DynamicImportOptions {
  ssr?: boolean;
  loading?: (loadingProps: DynamicOptionsLoadingProps) => JSX.Element | null;
  componentName?: string;
  withErrorBoundary?: boolean;
  retry?: boolean;
}

/**
 * Enhanced dynamic import utility with error handling and retry functionality
 * 
 * @param importFunc Function that returns a dynamic import
 * @param options Configuration options
 * @returns Dynamically imported component with proper loading and error states
 */
export function createDynamicComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | T>,
  options: DynamicImportOptions = {}
) {
  const {
    ssr = false,
    loading = () => <Skeleton className="h-[200px] w-full rounded-lg" />,
    componentName = 'Component',
    withErrorBoundary = true,
    retry = true,
  } = options;

  // Create the dynamic component with proper error handling
  const DynamicComponent = dynamic(
    () => importFunc()
      .then(mod => {
        // Handle both default and named exports
        const Component = 'default' in mod ? mod.default : mod;
        return Component;
      })
      .catch(error => {
        // Track the error for monitoring
        trackError(error, ErrorSeverity.MEDIUM, {
          componentName,
          additionalData: { type: 'dynamicImportError' }
        });
        
        // Re-throw to let Next.js handle the error
        throw error;
      }),
    { 
      ssr,
      loading,
    }
  );

  // Wrap with error boundary if requested
  if (withErrorBoundary) {
    return function WrappedDynamicComponent(props: any) {
      return (
        <RetryErrorBoundary componentName={componentName}>
          <DynamicComponent {...props} />
        </RetryErrorBoundary>
      );
    };
  }

  return DynamicComponent;
}

/**
 * Hook to dynamically load a module with proper error handling
 * Useful for non-React modules or utilities
 * 
 * @param importFunc Function that returns a dynamic import
 * @param options Configuration options
 * @returns [module, loading, error, retry]
 */
export function useDynamicImport<T>(
  importFunc: () => Promise<T>,
  options: { 
    onError?: (error: Error) => void;
    componentName?: string;
  } = {}
): [T | null, boolean, Error | null, () => void] {
  const [module, setModule] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const { onError, componentName = 'Module' } = options;
  
  const loadModule = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const mod = await importFunc();
      setModule(mod);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load module');
      setError(error);
      
      // Track the error
      trackError(error, ErrorSeverity.MEDIUM, {
        componentName,
        additionalData: { type: 'dynamicModuleError', retryCount }
      });
      
      // Call custom error handler if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load the module on mount or when retry is triggered
  useEffect(() => {
    loadModule();
  }, [retryCount]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Function to retry loading the module
  const retry = () => setRetryCount(count => count + 1);
  
  return [module, loading, error, retry];
}

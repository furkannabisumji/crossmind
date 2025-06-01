"use client";

import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RetryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}

/**
 * Enhanced error boundary with retry functionality
 * Provides a better user experience when components fail to load
 */
export function RetryErrorBoundary({ 
  children, 
  fallback, 
  componentName = "Component" 
}: RetryErrorBoundaryProps) {
  const [key, setKey] = useState(0);
  
  // Force re-render of children by changing the key
  const handleRetry = () => {
    setKey(prevKey => prevKey + 1);
  };
  
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <Alert variant="destructive" className="animate-in fade-in duration-300">
            <RefreshCw className="h-4 w-4" />
            <AlertTitle>Failed to load {componentName}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>There was an error loading this component.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-fit" 
                onClick={handleRetry}
              >
                <RefreshCw className="mr-2 h-3 w-3" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        )
      }
    >
      <div key={key}>{children}</div>
    </ErrorBoundary>
  );
}

"use client";

import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Report to analytics or monitoring service if available
    // analyticsService.reportError(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Check if this is a chunk loading error
      const isChunkLoadError = this.state.error?.message?.includes('ChunkLoadError') || 
                              this.state.error?.message?.includes('Loading chunk');
      
      return (
        <Alert variant="default" className={`my-4 ${isChunkLoadError ? 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400' : ''}`}>
          <AlertTitle>
            {isChunkLoadError ? "Resource Loading Error" : "Something went wrong"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="text-sm">
              {isChunkLoadError 
                ? "A required component failed to load. This could be due to a network issue or a temporary problem." 
                : this.state.error?.message || "An unknown error occurred"}
            </div>
            <div className="mt-2 flex gap-2">
              <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="text-xs underline"
              >
                Try again
              </button>
              
              {isChunkLoadError && (
                <button 
                  onClick={() => window.location.reload()}
                  className="text-xs underline"
                >
                  Reload page
                </button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

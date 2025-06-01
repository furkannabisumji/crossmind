/**
 * Error tracking and reporting utility
 * In a production app, this would integrate with services like Sentry or LogRocket
 */

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error context information
interface ErrorContext {
  componentName?: string;
  userId?: string;
  route?: string;
  additionalData?: Record<string, any>;
}

// Error tracking configuration
interface ErrorTrackingConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of errors to track
  ignorePatterns: RegExp[];
}

// Default configuration
const defaultConfig: ErrorTrackingConfig = {
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 1.0, // Track all errors in production
  ignorePatterns: [
    /^Network request failed$/i, // Ignore common network errors
    /^Loading chunk [0-9]+ failed/i, // Ignore chunk loading errors (we handle these separately)
    /^ResizeObserver loop limit exceeded$/i, // Ignore common browser warnings
  ],
};

let currentConfig: ErrorTrackingConfig = { ...defaultConfig };

/**
 * Configure the error tracking system
 */
export function configureErrorTracking(config: Partial<ErrorTrackingConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Determine if an error should be tracked based on configuration
 */
function shouldTrackError(error: Error): boolean {
  if (!currentConfig.enabled) return false;
  
  // Check if error matches any ignore patterns
  for (const pattern of currentConfig.ignorePatterns) {
    if (pattern.test(error.message)) {
      return false;
    }
  }
  
  // Apply sampling rate
  return Math.random() <= currentConfig.sampleRate;
}

/**
 * Get current page/route information
 */
function getCurrentRoute(): string {
  if (typeof window === 'undefined') return 'server';
  return window.location.pathname;
}

/**
 * Track and report an error
 */
export function trackError(
  error: Error,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context: ErrorContext = {}
): void {
  if (!shouldTrackError(error)) return;
  
  const errorData = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    severity,
    timestamp: new Date().toISOString(),
    route: context.route || getCurrentRoute(),
    componentName: context.componentName,
    userId: context.userId,
    ...context.additionalData,
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('Error Tracked:');
    console.error(error);
    console.info('Context:', errorData);
    console.groupEnd();
  }
  
  // In a real app, send to error tracking service
  // Example: sendToErrorTrackingService(errorData);
}

/**
 * Track and report an unhandled promise rejection
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    trackError(error, ErrorSeverity.HIGH, {
      additionalData: { type: 'unhandledrejection' }
    });
  });
  
  // Handle uncaught exceptions
  window.addEventListener('error', (event) => {
    // Avoid duplicate reporting for errors already handled by React error boundary
    if (event.error && event.error._reactErrorHandled) return;
    
    trackError(event.error || new Error(event.message), ErrorSeverity.HIGH, {
      additionalData: { 
        type: 'uncaughtexception',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    });
  });
}

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
}

/**
 * Custom hook to monitor component performance metrics
 * @param componentName Name of the component being monitored
 * @returns void
 */
export function usePerformanceMonitor(componentName: string): void {
  const startTimeRef = useRef<number>(performance.now());
  const isClient = typeof window !== 'undefined';
  
  useEffect(() => {
    if (!isClient) return;
    
    // Basic render time measurement
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    // Only log in development to avoid cluttering production logs
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
    
    // In a real app, you might send this to an analytics service
    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
    };
    
    // Collect Web Vitals if available
    if ('PerformanceObserver' in window) {
      try {
        // Observe paint timing
        const paintObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const metricName = entry.name;
            
            if (metricName === 'first-paint') {
              metrics.firstPaint = entry.startTime;
            } else if (metricName === 'first-contentful-paint') {
              metrics.firstContentfulPaint = entry.startTime;
            }
          }
        });
        
        paintObserver.observe({ type: 'paint', buffered: true });
        
        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.largestContentfulPaint = lastEntry.startTime;
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        
        return () => {
          paintObserver.disconnect();
          lcpObserver.disconnect();
        };
      } catch (e) {
        console.error('Performance monitoring error:', e);
      }
    }
  }, [componentName, isClient]);
}

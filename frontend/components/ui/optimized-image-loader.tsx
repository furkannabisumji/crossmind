"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageLoaderProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Enhanced image component with blur-up loading effect and error handling
 * Provides better user experience during image loading
 */
export function OptimizedImageLoader({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  sizes,
  objectFit = 'cover',
  ...props
}: OptimizedImageLoaderProps & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height' | 'objectFit'>) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  
  // Reset state when src changes
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setImageSrc(src);
  }, [src]);
  
  // Handle image load error
  const handleError = () => {
    setError(true);
    setIsLoading(false);
    // You could set a fallback image here
    // setImageSrc('/images/fallback.png');
  };
  
  return (
    <div 
      className={cn(
        "overflow-hidden relative",
        className
      )}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    >
      {isLoading && (
        <Skeleton 
          className="absolute inset-0 z-10" 
          style={{ 
            width: '100%',
            height: '100%'
          }} 
        />
      )}
      
      {error ? (
        <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground text-sm">
          Failed to load image
        </div>
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          sizes={sizes}
          priority={priority}
          className={cn(
            "duration-700 ease-in-out",
            isLoading ? "scale-110 blur-sm" : "scale-100 blur-0"
          )}
          style={{
            objectFit,
          }}
          onLoadingComplete={() => setIsLoading(false)}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}

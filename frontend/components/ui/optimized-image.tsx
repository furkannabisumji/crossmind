"use client";

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type OptimizedImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

/**
 * Optimized image component with blur-up loading effect
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  ...props
}: OptimizedImageProps & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'>) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn("overflow-hidden relative", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "duration-700 ease-in-out",
          isLoading ? "scale-110 blur-sm" : "scale-100 blur-0"
        )}
        onLoadingComplete={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
}

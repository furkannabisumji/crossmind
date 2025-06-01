"use client";

import { useEffect, useState } from "react";

/**
 * CSSStabilizer component - Simplified version
 * 
 * This component helps prevent CSS flashing during development by:
 * 1. Using a fade-in animation for smoother transitions
 * 2. Compatible with React 19 and Next.js 15
 */
export function CSSStabilizer({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted immediately to prevent black screen
    setMounted(true);
    
    // Add CSS stabilization class to body
    document.body.classList.add("css-stabilized");

    return () => {
      document.body.classList.remove("css-stabilized");
    };
  }, []);

  // Render children immediately with a fade-in effect
  return (
    <div className={`transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}

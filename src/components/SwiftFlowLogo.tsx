
import React from 'react';

export function SwiftFlowLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <rect 
        x="10" 
        y="10" 
        width="80" 
        height="80" 
        rx="24" 
        fill="#0f172a"
        stroke="#2dd4bf" 
        strokeWidth="4" 
      />
      <path 
        d="M50 32C50 32 38 37 38 48V60C38 68 44 72 50 72C56 72 62 68 62 60V48C62 37 50 32 50 32Z" 
        stroke="#2dd4bf" 
        strokeWidth="5" 
        strokeLinejoin="round" 
      />
      <path 
        d="M44 56L48 60L56 51" 
        stroke="#2dd4bf" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

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
        rx="20" 
        className="stroke-accent" 
        strokeWidth="6" 
      />
      <path 
        d="M50 30C50 30 40 35 40 45V58C40 65 44 70 50 70C56 70 60 65 60 58V45C60 35 50 30 50 30Z" 
        className="stroke-accent" 
        strokeWidth="6" 
        strokeLinejoin="round" 
      />
      <path 
        d="M45 53L49 57L56 48" 
        className="stroke-accent" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

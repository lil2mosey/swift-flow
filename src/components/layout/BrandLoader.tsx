'use client';

import { ShieldCheck, Loader2 } from 'lucide-react';

export function BrandLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a]">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#2dd4bf]/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0f172a] border-2 border-[#2dd4bf] shadow-[0_0_20px_rgba(45,212,191,0.3)]">
          <ShieldCheck className="h-10 w-10 text-[#2dd4bf]" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
        Swift<span className="text-[#2dd4bf]">Flow</span>
      </h1>
      
      <div className="flex items-center gap-2 text-[#2dd4bf]/60 font-medium text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Synchronizing Order Flow...
      </div>

      <div className="absolute bottom-10 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
        Enterprise Secure Environment
      </div>
    </div>
  );
}

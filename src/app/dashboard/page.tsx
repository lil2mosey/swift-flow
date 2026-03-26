'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/layout/Shell';
import { useUser, useAuth } from '@/firebase';
import { BrandLoader } from '@/components/layout/BrandLoader';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { LogOut, RefreshCcw } from 'lucide-react';

// Decoupled Views using Lazy Loading (next/dynamic)
const SellerView = dynamic(() => import('./SellerView'), { 
  loading: () => <BrandLoader />,
  ssr: false 
});

const CustomerView = dynamic(() => import('./CustomerView'), { 
  loading: () => <BrandLoader />,
  ssr: false 
});

export default function DashboardPage() {
  const { profile, isProfileLoading, isUserLoading, user } = useUser();
  const auth = useAuth();

  // If initial auth or profile fetch is happening, show the loader
  if (isUserLoading || (user && isProfileLoading)) {
    return <BrandLoader />;
  }

  // Choose the view based on the confirmed role
  // If no role is found yet (e.g. profile doc still creating or missing), show a recovery screen
  if (!profile || !profile.role) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center max-w-md mx-auto">
          <div className="p-4 bg-amber-50 rounded-2xl">
            <RefreshCcw className="h-10 w-10 text-amber-600 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Setting up your profile...</h2>
            <p className="text-slate-500 mt-2">We're finalizing your account details. This usually takes just a few seconds.</p>
          </div>
          <div className="flex gap-4 w-full">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="flex-1 rounded-xl h-11 border-slate-200"
            >
              Retry Sync
            </Button>
            <Button 
              onClick={() => signOut(auth)} 
              variant="ghost" 
              className="flex-1 rounded-xl h-11 text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell userRole={profile.role}>
      <Suspense fallback={<BrandLoader />}>
        {profile.role === 'seller' ? (
          <SellerView />
        ) : (
          <CustomerView />
        )}
      </Suspense>
    </Shell>
  );
}
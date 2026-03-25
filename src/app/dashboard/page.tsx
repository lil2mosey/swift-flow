'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/layout/Shell';
import { useUser } from '@/firebase';
import { BrandLoader } from '@/components/layout/BrandLoader';

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

  if (isUserLoading || isProfileLoading) {
    return <BrandLoader />;
  }

  // Choose the view based on the confirmed role
  // If no role is found yet (e.g. profile doc still creating), show a minimal loader within the shell
  if (!profile || !profile.role) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BrandLoader />
          <p className="text-slate-400 font-medium">Initializing your workspace...</p>
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

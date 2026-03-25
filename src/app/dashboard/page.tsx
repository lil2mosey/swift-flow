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
  const { profile, isProfileLoading } = useUser();

  if (isProfileLoading) {
    return <BrandLoader />;
  }

  // Choose the view based on the confirmed role
  return (
    <Shell userRole={profile?.role}>
      <Suspense fallback={<BrandLoader />}>
        {profile?.role === 'seller' ? (
          <SellerView />
        ) : (
          <CustomerView />
        )}
      </Suspense>
    </Shell>
  );
}

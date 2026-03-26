'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/layout/Shell';
import { useUser } from '@/firebase';
import { BrandLoader } from '@/components/layout/BrandLoader';
import { RoleGuard } from '@/components/RoleGuard';

// Decoupled Views using Lazy Loading (next/dynamic)
const SellerView = dynamic(() => import('./SellerView'), { 
  loading: () => <BrandLoader />,
  ssr: false 
});

const CustomerView = dynamic(() => import('./CustomerView'), { 
  loading: () => <BrandLoader />,
  ssr: false 
});

/**
 * Step 5: Applied RoleGuard to DashboardPage.
 */
export default function DashboardPage() {
  const { profile } = useUser();

  return (
    <RoleGuard allowedRoles={['seller', 'customer']}>
      <Shell userRole={profile?.role}>
        <Suspense fallback={<BrandLoader />}>
          {profile?.role === 'seller' ? (
            <SellerView />
          ) : (
            <CustomerView />
          )}
        </Suspense>
      </Shell>
    </RoleGuard>
  );
}
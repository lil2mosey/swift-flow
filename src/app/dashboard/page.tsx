'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/layout/Shell';
import { useUser } from '@/firebase';
import { BrandLoader } from '@/components/layout/BrandLoader';
import { RoleGuard } from '@/components/RoleGuard';

// Lazily load role-specific views for better bundle splitting
const SellerView = dynamic(() => import('./SellerView'), { 
  loading: () => <BrandLoader />,
  ssr: false 
});

const CustomerView = dynamic(() => import('./CustomerView'), { 
  loading: () => <BrandLoader />,
  ssr: false 
});

/**
 * Enterprise Dashboard Entry Point.
 * Synchronizes with the user's role to display the appropriate command center.
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

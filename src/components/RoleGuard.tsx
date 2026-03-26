'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { BrandLoader } from '@/components/layout/BrandLoader';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'seller' | 'customer'>;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Step 4: Role-Based Access Wrapper Component.
 * Ensures the user has the correct role before rendering children.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback, 
  redirectTo = '/login' 
}: RoleGuardProps) {
  const { user, isUserLoading, profile, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is complete
    if (isUserLoading || isProfileLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Redirect to appropriate dashboard if role is incorrect
    if (profile && !allowedRoles.includes(profile.role)) {
      if (profile.role === 'seller') {
        router.push('/dashboard');
      } else {
        router.push('/shop');
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading, allowedRoles, router, redirectTo]);

  // Show a full-screen loader while checking auth/profile
  if (isUserLoading || isProfileLoading) {
    return <BrandLoader />;
  }

  // If no user or no profile document yet, don't show anything
  if (!user || !profile) {
    return fallback || null;
  }

  // Final check: Does the profile role match the allowed roles?
  if (!allowedRoles.includes(profile.role)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="p-4 bg-rose-50 rounded-2xl mb-4">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          You don't have the required permissions to view this section. 
          Please contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
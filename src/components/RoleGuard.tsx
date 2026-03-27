'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { BrandLoader } from '@/components/layout/BrandLoader';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'seller' | 'customer'>;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Enhanced RoleGuard to handle registration race conditions and loading states.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback, 
  redirectTo = '/login' 
}: RoleGuardProps) {
  const { user, isUserLoading, profile, isProfileLoading } = useUser();
  const router = useRouter();
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Safety timeout: If we are stuck in "Finalizing" for more than 5 seconds, 
  // we might have a sync issue or permission error that didn't throw.
  useEffect(() => {
    if (user && !profile && !isProfileLoading) {
      const timer = setTimeout(() => {
        setIsTimedOut(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
    setIsTimedOut(false);
  }, [user, profile, isProfileLoading]);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (!user) {
      router.push(redirectTo);
      return;
    }

    if (profile && !allowedRoles.includes(profile.role)) {
      if (profile.role === 'seller') {
        router.push('/dashboard');
      } else {
        router.push('/shop');
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading, allowedRoles, router, redirectTo]);

  if (isUserLoading || isProfileLoading) {
    return <BrandLoader />;
  }

  // If auth is done but profile doesn't exist yet
  if (user && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
        <h3 className="font-bold text-slate-900 text-xl">
          {isTimedOut ? "Profile Not Found" : "Finalizing your workspace..."}
        </h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          {isTimedOut 
            ? "We're having trouble locating your profile document. Try refreshing the page or logging in again." 
            : "We're synchronizing your role permissions. This should only take a moment."}
        </p>
        {isTimedOut && (
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-xl"
          >
            Refresh Page
          </button>
        )}
      </div>
    );
  }

  if (!user || !profile || !allowedRoles.includes(profile.role)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="p-4 bg-rose-50 rounded-2xl mb-4">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          You don't have the required permissions to view this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
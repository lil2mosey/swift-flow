'use client';

import React from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionAwareCollectionProps {
  isLoading: boolean;
  error: any;
  data: any[] | null;
  collectionName: string;
  children: (data: any[]) => React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Step 2: Graceful Permission Handling Component.
 * Wraps collection data rendering to handle loading and permission errors.
 */
export function PermissionAwareCollection({
  isLoading,
  error,
  data,
  collectionName,
  children,
  fallback
}: PermissionAwareCollectionProps) {
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        <p className="text-sm font-medium text-slate-400 italic">Syncing {collectionName}...</p>
      </div>
    );
  }

  if (error) {
    // Check if it's a permission error (either by code or custom error structure)
    const isPermissionError = 
      error.code === 'permission-denied' || 
      error.message?.includes('permission') ||
      error.name === 'FirebaseError';

    if (isPermissionError) {
      return fallback || (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-2xl mb-4">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
            You don't have permission to view the {collectionName} collection. 
            If you just registered, please wait a moment while we synchronize your profile.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-6 border-slate-200 text-slate-600 font-bold h-9 rounded-xl"
            onClick={() => window.location.reload()}
          >
            Retry Sync
          </Button>
        </div>
      );
    }

    return (
      <div className="py-20 text-center text-rose-500 font-medium italic">
        An error occurred while loading {collectionName}.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400 font-medium italic">
        No records found in {collectionName}.
      </div>
    );
  }

  return <>{children(data)}</>;
}

"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, ShieldCheck, BarChart3, Package, MessageSquare } from 'lucide-react';
import { useUser } from '@/firebase';
import { BrandLoader } from '@/components/layout/BrandLoader';
import Link from 'next/link';

export default function Home() {
  const { user, profile, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && user && profile) {
      if (profile.role === 'seller') {
        router.push('/dashboard');
      } else {
        router.push('/shop');
      }
    }
  }, [user, profile, isUserLoading, isProfileLoading, router]);

  if (isUserLoading || isProfileLoading) {
    return <BrandLoader />;
  }

  return (
    <Shell>
      <div className="max-w-4xl mx-auto py-12">
        <PageHeader 
          title="SwiftFlow Logistics" 
          description="A shared ecosystem for sellers and shoppers."
        />

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-xl transition-all duration-300 border-none shadow-sm group">
            <CardHeader>
              <div className="h-12 w-12 bg-teal-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
              <CardDescription className="text-slate-500">
                Manage your store, inventory, and finances in dark-mode dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-[#0f172a] hover:bg-slate-800 text-white gap-2 font-bold h-12 rounded-xl">
                <Link href="/login">
                  Enter Seller Command Center <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-none shadow-sm group">
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Client Storefront</CardTitle>
              <CardDescription className="text-slate-500">
                Mobile-first shopping experience optimized for social media traffic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-slate-200 gap-2 font-bold h-12 rounded-xl text-slate-700">
                <Link href="/login">
                  Visit Customer Portal <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-50">
            <div className="p-4 bg-teal-50 rounded-2xl mb-4">
              <BarChart3 className="h-6 w-6 text-teal-500" />
            </div>
            <h3 className="font-bold text-slate-800">Real-time Core</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Shared order pool with instantaneous status synchronization.</p>
          </div>
          <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-50">
            <div className="p-4 bg-teal-50 rounded-2xl mb-4">
              <Package className="h-6 w-6 text-teal-500" />
            </div>
            <h3 className="font-bold text-slate-800">Smart Logistics</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">AI-powered inventory analysis embedded directly in your admin panel.</p>
          </div>
          <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-50">
            <div className="p-4 bg-teal-50 rounded-2xl mb-4">
              <MessageSquare className="h-6 w-6 text-teal-500" />
            </div>
            <h3 className="font-bold text-slate-800">Direct Bridge</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Secure communication channel connecting buyers and sellers.</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

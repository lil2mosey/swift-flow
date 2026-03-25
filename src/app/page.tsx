
"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, ShieldCheck, BarChart3, Package, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <Shell userRole="seller">
      <PageHeader 
        title="Welcome to SwiftFlow" 
        description="Select a portal to manage your business or start shopping."
      />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="hover:shadow-md transition-shadow border-none shadow-sm">
          <CardHeader>
            <div className="h-12 w-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Seller Dashboard</CardTitle>
            <CardDescription className="text-slate-500">
              Manage inventory, process orders, and view performance metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#0f172a] hover:bg-slate-800 text-white gap-2 font-bold h-12">
              <Link href="/dashboard">
                Enter Seller Portal <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-none shadow-sm">
          <CardHeader>
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Customer Storefront</CardTitle>
            <CardDescription className="text-slate-500">
              Browse the catalog, place orders, and track your history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-slate-200 gap-2 font-bold h-12">
              <Link href="/shop">
                Go to Storefront <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <BarChart3 className="h-8 w-8 text-teal-500 mb-3" />
          <h3 className="font-bold text-slate-800">Real-time Analytics</h3>
          <p className="text-sm text-slate-500 mt-2">Track your sales and inventory health as it happens.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <Package className="h-8 w-8 text-teal-500 mb-3" />
          <h3 className="font-bold text-slate-800">Smart Inventory</h3>
          <p className="text-sm text-slate-500 mt-2">AI-powered reorder recommendations to prevent stockouts.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <MessageSquare className="h-8 w-8 text-teal-500 mb-3" />
          <h3 className="font-bold text-slate-800">Direct Messaging</h3>
          <p className="text-sm text-slate-500 mt-2">Secure channel for buyer-seller communication.</p>
        </div>
      </div>
    </Shell>
  );
}

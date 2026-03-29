
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  ShoppingBag, 
  ClipboardList, 
  MessageSquare,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerProducts, useCustomerOrders } from '@/hooks/use-customer-data';
import { cn } from '@/lib/utils';

export default function CustomerView() {
  const { profile } = useUser();

  const { products, isLoading: isProductsLoading } = useCustomerProducts(6);
  const { orders, isLoading: isOrdersLoading } = useCustomerOrders();

  const activeOrdersCount = orders?.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length || 0;

  const quickActions = [
    { 
      title: 'Browse Shop', 
      desc: 'Explore our latest unique jewelry pieces.', 
      icon: ShoppingBag, 
      href: '/shop', 
      color: 'bg-teal-50 text-teal-600' 
    },
    { 
      title: 'Track Orders', 
      desc: 'View your delivery status and history.', 
      icon: ClipboardList, 
      href: '/orders', 
      color: 'bg-blue-50 text-blue-600' 
    },
    { 
      title: 'Message Workshop', 
      desc: 'Connect directly with our craftsmen.', 
      icon: MessageSquare, 
      href: '/messages', 
      color: 'bg-amber-50 text-amber-600' 
    }
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            Welcome, {profile?.firstName || profile?.fullName?.split(' ')[0] || 'Valued Customer'}! <TrendingUp className="h-6 w-6 text-teal-500" />
          </h1>
          <p className="text-slate-500 font-medium italic">Synchronizing your shopping experience with our workshop ✨</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Total Orders</CardTitle>
            <div className="p-2 bg-slate-50 rounded-lg"><Package className="h-4 w-4 text-slate-400" /></div>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">{orders?.length || 0}</div>
            )}
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Lifetime Purchase History</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-teal-600">Active Shipments</CardTitle>
            <div className="p-2 bg-teal-50 rounded-lg"><Clock className="h-4 w-4 text-teal-500" /></div>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-teal-600">{activeOrdersCount}</div>
            )}
            <p className="text-[10px] text-teal-400 mt-1 uppercase font-bold">In Processing or Transit</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#0f172a] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Available Shop</CardTitle>
            <div className="p-2 bg-slate-800 rounded-lg"><ShoppingCart className="h-4 w-4 text-teal-400" /></div>
          </CardHeader>
          <CardContent>
            {isProductsLoading ? (
              <Skeleton className="h-8 w-20 bg-slate-800" />
            ) : (
              <div className="text-2xl font-bold text-white">{products?.length || 0}+</div>
            )}
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">New arrivals in catalog</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Your SwiftFlow Hub</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className="group">
              <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group-active:scale-[0.98]">
                <CardContent className="p-6">
                  <div className={cn("p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform", action.color)}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{action.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 font-medium italic">{action.desc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

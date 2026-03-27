'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Package, Clock, ShoppingBag } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Product } from '@/lib/types';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerProducts, useCustomerOrders } from '@/hooks/use-customer-data';

export default function CustomerView() {
  const { profile, user } = useUser();
  const db = useFirestore();

  // Step 3: Using optimized data hooks for dashboard
  const { products, isLoading: isProductsLoading } = useCustomerProducts(6);
  const { orders, isLoading: isOrdersLoading } = useCustomerOrders();

  const handlePlaceOrder = (product: Product) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to place an order." });
      return;
    }
    FirebaseService.placeOrder(db, user.uid, profile?.fullName || user.email?.split('@')[0] || 'Customer', product);
    toast({ title: "Order Placed!", description: `Successfully ordered ${product.name}.` });
  };

  const activeOrdersCount = orders?.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length || 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {profile?.firstName || profile?.fullName?.split(' ')[0] || 'Valued Customer'}!
        </h1>
        <p className="text-slate-500 font-medium italic">Synchronizing your shopping experience ✨</p>
      </div>

      {/* Step 3: Stats Cards with proper loading states */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</CardTitle>
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

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-600">Active Shipments</CardTitle>
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

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Shop</CardTitle>
            <div className="p-2 bg-slate-800 rounded-lg"><ShoppingBag className="h-4 w-4 text-teal-400" /></div>
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

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Recommended for You</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isProductsLoading && (!products || products.length === 0) ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)
        ) : products?.map((product) => (
          <Card key={product.id} className="border-none shadow-sm overflow-hidden group bg-white rounded-2xl">
            <div className="relative h-64 w-full">
              <Image 
                src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                alt={product.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3">
                <Button size="icon" variant="ghost" className="bg-white/90 rounded-full h-9 w-9 shadow-sm">
                  <Heart className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{product.category}</span>
                <span className="text-xs font-bold text-slate-900">KES {product.price.toLocaleString()}</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handlePlaceOrder(product)}
                className="w-full bg-primary hover:bg-slate-800 text-white font-bold h-12 rounded-xl gap-2 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
              >
                <ShoppingCart className="h-4 w-4" /> Quick Order
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

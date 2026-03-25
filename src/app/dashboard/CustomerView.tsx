'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Product } from '@/lib/types';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerView() {
  const { profile, user } = useUser();
  const db = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    return FirebaseService.getProductsQuery(db);
  }, [db]);

  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

  const handlePlaceOrder = (product: Product) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to place an order." });
      return;
    }
    FirebaseService.placeOrder(db, user.uid, profile, product);
    toast({ title: "Order Placed!", description: `Successfully ordered ${product.name}.` });
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">SwiftFlow Shop</h1>
        <p className="text-slate-500 font-medium italic">Curated trends, delivered fast ✨</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isProductsLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)
        ) : products?.map((product) => (
          <Card key={product.id} className="border-none shadow-sm overflow-hidden group bg-white">
            <div className="relative h-64 w-full">
              <Image 
                src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                alt={product.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3">
                <Button size="icon" variant="ghost" className="bg-white/90 rounded-full h-9 w-9 shadow-sm hover: Rose-500">
                  <Heart className="h-4 w-4" />
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
                <ShoppingCart className="h-4 w-4" /> Place Order
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

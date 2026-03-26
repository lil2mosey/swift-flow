
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Smartphone, Loader2, X, ShoppingBag, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShopPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  
  const [cart, setCart] = useState<{ id: string, name: string, price: number, quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('0712345678');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch real products from Firestore
  const productsQuery = useMemoFirebase(() => {
    return FirebaseService.getProductsQuery(db);
  }, [db]);

  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} ready for checkout.`,
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleMpesaCheckout = async () => {
    if (cart.length === 0 || !user) {
      toast({ variant: "destructive", title: "Error", description: "Cart is empty or you are not logged in." });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Shared logic: write order to Firestore
      await FirebaseService.placeOrder(db, user.uid, profile, {
        id: cart[0].id,
        name: cart.length > 1 ? `${cart[0].name} & others` : cart[0].name,
        price: cartTotal,
        category: 'Mixed',
        currentStock: 0,
        averageDailySales: 0,
        leadTimeDays: 0,
        sku: 'SHOP-ORDER'
      } as any);

      // Simulate STK Push delay
      setTimeout(() => {
        setIsProcessing(false);
        setIsCheckoutOpen(false);
        setCart([]);
        toast({
          title: "Order Submitted!",
          description: "Syncing with seller dashboard. Awaiting payment.",
        });
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      toast({ variant: "destructive", title: "Checkout Failed", description: "Please try again later." });
    }
  };

  return (
    <Shell userRole="customer">
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader 
          title="SwiftFlow Store" 
          description="Your exclusive collection, instantly available."
          action={
            <Button 
              className="relative gap-2 bg-primary text-white font-bold rounded-xl h-11 px-6 shadow-md"
              onClick={() => setIsCheckoutOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              Checkout
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {isProductsLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </Card>
            ))
          ) : !products || products.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <Package className="h-12 w-12 opacity-20" />
                <p className="font-medium italic">Our catalog is being updated. Check back soon!</p>
              </div>
            </div>
          ) : products.map((product) => (
            <Card key={product.id} className="border-none shadow-sm overflow-hidden group bg-white rounded-2xl transition-all hover:shadow-md">
              <div className="relative aspect-square w-full">
                <Image 
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <Button size="icon" variant="ghost" className="bg-white/90 rounded-full h-8 w-8 shadow-sm">
                    <Heart className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                   <span className="text-[10px] font-bold bg-white/90 text-teal-600 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                    {product.category}
                  </span>
                </div>
              </div>
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-teal-600 transition-colors">
                  {product.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg font-bold text-slate-900">
                  KES {product.price.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">SKU: {product.sku}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button 
                  onClick={() => addToCart(product)}
                  className="w-full bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-900 text-xs font-bold gap-2 h-10 border-none shadow-none rounded-xl transition-all"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-teal-50/50 p-8 border-b border-teal-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <ShoppingBag className="h-6 w-6 text-teal-600" />
                Your Selection
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Orders sync instantly with our logistics team.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8">
            <ScrollArea className="max-h-[280px] pr-4 mb-6">
              <div className="space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium italic">
                    Your cart is empty
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Qty: {item.quantity} × KES {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-teal-600">KES {(item.price * item.quantity).toLocaleString()}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-full" onClick={() => removeFromCart(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {cart.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="text-2xl font-bold text-slate-900">KES {cartTotal.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="checkout-phone" className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">M-Pesa Number for STK Push</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500" />
                    <Input 
                      id="checkout-phone" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)} 
                      placeholder="07XXXXXXXX"
                      className="pl-12 bg-slate-50/70 border-none h-12 rounded-xl text-slate-900 font-bold focus-visible:ring-1 focus-visible:ring-teal-300"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-slate-800 text-white font-bold h-14 gap-2 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                  onClick={handleMpesaCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Submit Order • KES {cartTotal.toLocaleString()}</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

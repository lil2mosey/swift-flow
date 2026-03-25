
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Search, Smartphone, Loader2, X, ShoppingBag } from 'lucide-react';
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
import { useUser, useFirestore } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';

const catalog = [
  { id: 'H001', name: 'Signature Heavyweight Hoodie', price: 2500, stock: 45, category: 'Apparel', image: 'https://picsum.photos/seed/hoodie/400/400' },
  { id: 'P001', name: 'Classic Piqué Polo', price: 1800, stock: 120, category: 'Apparel', image: 'https://picsum.photos/seed/polo/400/400' },
  { id: 'H002', name: 'Summer Breeze Hoodie', price: 2200, stock: 15, category: 'Apparel', image: 'https://picsum.photos/seed/hoodie2/400/400' },
  { id: 'P002', name: 'Premium Oxford Polo', price: 2100, stock: 8, category: 'Apparel', image: 'https://picsum.photos/seed/polo2/400/400' },
  { id: 'A001', name: 'SwiftFlow Cotton Tote', price: 500, stock: 200, category: 'Accessories', image: 'https://picsum.photos/seed/tote/400/400' },
  { id: 'A002', name: 'Minimalist Snapback', price: 1200, stock: 32, category: 'Accessories', image: 'https://picsum.photos/seed/cap/400/400' },
];

export default function ShopPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const [cart, setCart] = useState<{ id: string, name: string, price: number, quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('0712345678');
  const [isProcessing, setIsProcessing] = useState(false);

  const addToCart = (product: typeof catalog[0]) => {
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
      const ordersRef = await FirebaseService.placeOrder(db, user.uid, profile, {
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
          description="Curated apparel, instantly synced."
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {catalog.map((product) => (
            <Card key={product.id} className="border-none shadow-sm overflow-hidden group bg-white rounded-2xl">
              <div className="relative aspect-square w-full">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <Button size="icon" variant="ghost" className="bg-white/90 rounded-full h-8 w-8 shadow-sm">
                    <Heart className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </div>
              <CardHeader className="p-3 pb-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">{product.category}</span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 line-clamp-1">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-sm font-bold text-slate-900">
                  KES {product.price.toLocaleString()}
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Button 
                  onClick={() => addToCart(product)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold gap-2 h-9 border-none shadow-none"
                >
                  <ShoppingBag className="h-3 w-3" /> Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-teal-600" />
              Your Selection
            </DialogTitle>
            <DialogDescription>
              Orders sync instantly to our admin dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[300px] pr-4 my-2">
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium italic">
                  Your cart is empty
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Qty: {item.quantity} × KES {item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-teal-600">KES {(item.price * item.quantity).toLocaleString()}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500" onClick={() => removeFromCart(item.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {cart.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center font-bold text-slate-900">
                <span className="text-sm text-slate-500 uppercase tracking-widest">Grand Total</span>
                <span className="text-xl">KES {cartTotal.toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="checkout-phone" className="text-[10px] font-bold uppercase text-slate-400">M-Pesa Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="checkout-phone" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)} 
                    placeholder="07XXXXXXXX"
                    className="pl-9 bg-slate-50 border-none h-11 rounded-xl"
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 gap-2 rounded-xl shadow-lg shadow-slate-200"
                onClick={handleMpesaCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Submit Order (Ksh {cartTotal.toLocaleString()})</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

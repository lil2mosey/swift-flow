
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Search, Smartphone, Loader2, X } from 'lucide-react';
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

const catalog = [
  { id: '1', name: 'Premium Espresso Beans', price: 2500, stock: 120, category: 'Coffee', image: 'https://picsum.photos/seed/coffee/400/300' },
  { id: '2', name: 'Ceramic Pour Over Set', price: 4500, stock: 15, category: 'Accessories', image: 'https://picsum.photos/seed/pour/400/300' },
  { id: '3', name: 'Stainless Steel Tamper', price: 3200, stock: 8, category: 'Accessories', image: 'https://picsum.photos/seed/tamper/400/300' },
  { id: '4', name: 'Gooseneck Kettle', price: 8900, stock: 45, category: 'Electronics', image: 'https://picsum.photos/seed/kettle/400/300' },
  { id: '5', name: 'Cold Brew Filter Pack', price: 1800, stock: 200, category: 'Coffee', image: 'https://picsum.photos/seed/filter/400/300' },
  { id: '6', name: 'Hand Coffee Grinder', price: 6500, stock: 12, category: 'Accessories', image: 'https://picsum.photos/seed/grinder/400/300' },
];

export default function ShopPage() {
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
      description: `${product.name} has been added to your shopping cart.`,
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleMpesaPrompt = () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    
    // Simulate STK Push
    setTimeout(() => {
      setIsProcessing(false);
      setIsCheckoutOpen(false);
      setCart([]);
      toast({
        title: "Order Placed Successfully",
        description: `Payment confirmed via M-Pesa. Your order is being processed.`,
      });
    }, 2500);
  };

  return (
    <Shell userRole="customer">
      <PageHeader 
        title="Storefront" 
        description="Browse our curated selection of coffee and brewing equipment."
        action={
          <Button 
            variant="outline" 
            className="relative gap-2 border-slate-200"
            onClick={() => setIsCheckoutOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9 bg-white border-slate-200" placeholder="Search catalog..." />
        </div>
        <div className="flex gap-2">
          {['All', 'Coffee', 'Accessories', 'Electronics'].map(cat => (
            <Button key={cat} variant="ghost" size="sm" className="text-slate-500 hover:text-teal-600 font-bold">
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {catalog.map((product) => (
          <Card key={product.id} className="border-none shadow-sm overflow-hidden group">
            <div className="relative h-48 w-full">
              <Image 
                src={product.image} 
                alt={product.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 bg-white/80 hover:bg-white text-slate-800 rounded-full h-8 w-8">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">{product.category}</span>
                <span className="text-xs font-medium text-slate-400">{product.stock} in stock</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900">
                KES {product.price.toLocaleString()}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => addToCart(product)}
                className="w-full bg-primary hover:bg-slate-800 text-white font-bold gap-2"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-teal-600" />
              Checkout Summary
            </DialogTitle>
            <DialogDescription>
              Review your items and complete payment via M-Pesa.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[300px] pr-4 my-2">
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-medium italic">
                  Your cart is empty
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} × KES {item.price.toLocaleString()}</p>
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
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-xl">KES {cartTotal.toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="checkout-phone" className="text-xs font-bold uppercase text-slate-500">M-Pesa Phone Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="checkout-phone" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)} 
                    placeholder="07XXXXXXXX"
                    className="pl-9 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 gap-2"
                onClick={handleMpesaPrompt}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-5 w-5" />
                    Pay KES {cartTotal.toLocaleString()} via M-Pesa
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

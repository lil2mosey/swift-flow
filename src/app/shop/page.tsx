
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

const catalog = [
  { id: '1', name: 'Premium Espresso Beans', price: 2500, stock: 120, category: 'Coffee', image: 'https://picsum.photos/seed/coffee/400/300' },
  { id: '2', name: 'Ceramic Pour Over Set', price: 4500, stock: 15, category: 'Accessories', image: 'https://picsum.photos/seed/pour/400/300' },
  { id: '3', name: 'Stainless Steel Tamper', price: 3200, stock: 8, category: 'Accessories', image: 'https://picsum.photos/seed/tamper/400/300' },
  { id: '4', name: 'Gooseneck Kettle', price: 8900, stock: 45, category: 'Electronics', image: 'https://picsum.photos/seed/kettle/400/300' },
  { id: '5', name: 'Cold Brew Filter Pack', price: 1800, stock: 200, category: 'Coffee', image: 'https://picsum.photos/seed/filter/400/300' },
  { id: '6', name: 'Hand Coffee Grinder', price: 6500, stock: 12, category: 'Accessories', image: 'https://picsum.photos/seed/grinder/400/300' },
];

export default function ShopPage() {
  const [cartCount, setCartCount] = useState(0);

  const addToCart = (productName: string) => {
    setCartCount(prev => prev + 1);
    toast({
      title: "Added to Cart",
      description: `${productName} has been added to your shopping cart.`,
    });
  };

  return (
    <Shell userRole="customer">
      <PageHeader 
        title="Storefront" 
        description="Browse our curated selection of coffee and brewing equipment."
        action={
          <Button variant="outline" className="relative gap-2 border-slate-200">
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
                onClick={() => addToCart(product.name)}
                className="w-full bg-primary hover:bg-slate-800 text-white font-bold gap-2"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </Shell>
  );
}

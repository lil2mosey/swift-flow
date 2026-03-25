"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  PlusCircle,
  Package,
  Activity,
  ShoppingCart,
  Heart
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { useUser, useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Order, Product } from '@/lib/types';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const statusData = [
  { name: 'Mon', value: 30 },
  { name: 'Tue', value: 45 },
  { name: 'Wed', value: 20 },
  { name: 'Thu', value: 55 },
  { name: 'Fri', value: 40 },
];

export default function DashboardPage() {
  const { profile, user, isProfileLoading } = useUser();
  const db = useFirestore();

  // Seller Queries
  const sellerOrdersQuery = useMemoFirebase(() => {
    if (!user || profile?.role !== 'seller') return null;
    return query(
      collection(db, 'orders'), 
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [db, user, profile]);

  const { data: sellerOrders, isLoading: isOrdersLoading } = useCollection<Order>(sellerOrdersQuery);

  // Customer Queries
  const productsQuery = useMemoFirebase(() => {
    return query(collection(db, 'products'), limit(6));
  }, [db]);

  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

  const stats = [
    { label: 'Total Revenue', value: 'KES 45,200', sub: 'CONFIRMED', icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Pending Orders', value: sellerOrders?.filter(o => o.status === 'pending').length || 0, sub: 'PENDING', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Completed', value: sellerOrders?.filter(o => o.status === 'completed').length || 0, sub: 'SUCCESS', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Unread', value: '3', sub: 'MESSAGES', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  const handleQuickAddOrder = () => {
    if (!user) return;
    const ordersRef = collection(db, 'orders');
    addDocumentNonBlocking(ordersRef, {
      sellerId: user.uid,
      customerId: 'manual-dm',
      customerName: 'Instagram DM Customer',
      totalAmount: 500,
      status: 'pending',
      paymentStatus: 'unpaid',
      items: [{ productName: 'Hoodie', quantity: 1, priceAtOrder: 500 }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Order Added", description: "Manual DM order created successfully." });
  };

  const placeOrder = (product: Product) => {
    if (!user) return;
    const ordersRef = collection(db, 'orders');
    addDocumentNonBlocking(ordersRef, {
      customerId: user.uid,
      customerName: profile?.fullName || user.email?.split('@')[0],
      sellerId: 'system-seller', 
      items: [{ productId: product.id, productName: product.name, quantity: 1, priceAtOrder: product.price }],
      totalAmount: product.price,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Order Placed!", description: `Successfully ordered ${product.name}.` });
  };

  if (isProfileLoading) {
    return (
      <Shell>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </Shell>
    );
  }

  if (profile?.role === 'seller') {
    return (
      <Shell userRole="seller">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              Seller Command Center <span className="animate-pulse">🚀</span>
            </h1>
            <p className="text-slate-500 font-medium">Monitoring Instagram & Store traffic</p>
          </div>
          <Button onClick={handleQuickAddOrder} className="bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-11">
            <PlusCircle className="h-4 w-4" /> Quick Add DM Order
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.sub}</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-[10px] text-slate-500 font-medium mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Recent Live Orders</CardTitle>
                <CardDescription>Real-time sync enabled</CardDescription>
              </div>
              <Activity className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
                    <TableHead className="font-bold pl-6">Order ID</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isOrdersLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-6"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right pr-6"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : sellerOrders?.map((order) => (
                    <TableRow key={order.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold pl-6">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="font-medium text-slate-600">{order.customerName}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          order.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"
                        )}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold pr-6">KES {order.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Sales Volume</CardTitle>
              </CardHeader>
              <CardContent className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statusData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Area type="monotone" dataKey="value" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-primary text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Package className="h-6 w-6 text-teal-400" />
                  <span className="text-[10px] font-bold text-slate-400">INVENTORY HEALTH</span>
                </div>
                <h3 className="text-lg font-bold">Stable</h3>
                <p className="text-xs text-slate-400 mt-1">All hot products in stock</p>
                <Button variant="outline" className="w-full mt-4 border-slate-700 text-xs text-teal-400 hover:bg-slate-800">
                  Manage Inventory
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell userRole="customer">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">SwiftFlow Shop</h1>
        <p className="text-slate-500 font-medium italic">Handpicked trends for you ✨</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isProductsLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)
        ) : products?.map((product) => (
          <Card key={product.id} className="border-none shadow-sm overflow-hidden group">
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
              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => placeOrder(product)}
                className="w-full bg-primary hover:bg-slate-800 text-white font-bold h-12 rounded-xl gap-2 shadow-lg shadow-slate-200"
              >
                <ShoppingCart className="h-4 w-4" /> Place Order
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  );
}

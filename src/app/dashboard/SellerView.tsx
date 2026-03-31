
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  CheckCircle2, 
  MessageSquare,
  Activity,
  Package,
  TrendingUp,
  Printer,
  Smartphone,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Order, Product } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SellerView() {
  const { user, profile } = useUser();
  const db = useFirestore();

  const sellerOrdersQuery = useMemoFirebase(() => {
    if (!user || profile?.role !== 'seller') return null;
    return FirebaseService.getSellerOrdersQuery(db);
  }, [db, user, profile]);

  const productsQuery = useMemoFirebase(() => {
    if (!user || profile?.role !== 'seller') return null;
    return FirebaseService.getProductsQuery(db, user?.uid);
  }, [db, user, profile]);

  const { data: sellerOrders, isLoading: isOrdersLoading } = useCollection<Order>(sellerOrdersQuery);
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

  const lowStockItems = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.currentStock <= (p.lowStockThreshold || 20));
  }, [products]);

  const formatDate = (date: any) => {
    if (!date) return 'Recently joined';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return isNaN(d.getTime()) ? 'Recently joined' : `Managing since ${format(d, 'MMM d, yyyy')}`;
  };

  const processedChartData = useMemo(() => {
    if (!sellerOrders || sellerOrders.length === 0) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const dataMap = last7Days.reduce((acc, date) => {
      acc[date] = 0;
      return acc;
    }, {} as Record<string, number>);

    sellerOrders.forEach(order => {
      if (order.paymentStatus === 'paid' && order.createdAt) {
        const orderDate = typeof order.createdAt === 'string' 
          ? order.createdAt.split('T')[0] 
          : new Date(order.createdAt?.seconds * 1000 || order.createdAt).toISOString().split('T')[0];

        if (dataMap[orderDate] !== undefined) {
          dataMap[orderDate] += order.totalAmount || order.total || 0;
        }
      }
    });

    return last7Days.map(date => ({
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: dataMap[date]
    }));
  }, [sellerOrders]);

  const stats = useMemo(() => {
    const pending = sellerOrders?.filter(o => o.status === 'pending').length || 0;
    const completed = sellerOrders?.filter(o => o.status === 'completed').length || 0;
    const revenue = sellerOrders?.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0) || 0;

    return [
      { label: 'Total Revenue', value: `KES ${revenue.toLocaleString()}`, sub: 'CONFIRMED', icon: DollarSign, color: 'text-teal-400', bg: 'bg-teal-500/10' },
      { label: 'Pending Orders', value: pending, sub: 'LIVE', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { label: 'Completed', value: completed, sub: 'SUCCESS', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
      { label: 'Customer Chat', value: '0', sub: 'UNREAD', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    ];
  }, [sellerOrders]);

  const handleTriggerPayment = (order: Order) => {
    FirebaseService.requestPayment(db, order.id);
    toast({ 
      title: "Payment Request Sent", 
      description: `Requested KES ${order.totalAmount.toLocaleString()} from ${order.customerName}.` 
    });
  };

  const handlePrintReceipt = (order: Order) => {
    toast({ title: "Printing...", description: `Formatting receipt for ${order.customerName}.` });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-[#0f172a] rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white">
          <TrendingUp className="h-7 w-7 text-teal-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">
            Seller Command Center
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
            {formatDate(profile?.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-[#0f172a] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.sub}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Live Order Synchronization</CardTitle>
                <CardDescription>Real-time updates from Instagram & Storefront</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                <span className="h-2 w-2 bg-teal-500 rounded-full animate-pulse" /> ACTIVE
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
                    <TableHead className="font-bold pl-6">Ref</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right pr-6">Action / Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isOrdersLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-6"><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : sellerOrders?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-medium italic">
                        No active orders found.
                      </TableCell>
                    </TableRow>
                  ) : sellerOrders?.slice(0, 8).map((order) => (
                    <TableRow key={order.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="font-bold pl-6 text-xs text-slate-400">{order.id.slice(0, 5).toUpperCase()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{order.customerName}</span>
                          <span className="text-[10px] text-slate-400">{order.items?.[0]?.productName || 'Direct Order'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          order.paymentStatus === 'paid' ? "bg-teal-100 text-teal-700" : 
                          order.paymentStatus === 'pending_approval' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {order.paymentStatus.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-3">
                          {order.paymentStatus === 'unpaid' ? (
                            <Button 
                              onClick={() => handleTriggerPayment(order)}
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-teal-200 text-teal-700 hover:bg-teal-50 font-bold px-3 gap-1.5"
                            >
                              <Smartphone className="h-3.5 w-3.5" />
                              Pay
                            </Button>
                          ) : order.paymentStatus === 'paid' ? (
                            <Button 
                              onClick={() => handlePrintReceipt(order)}
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-slate-400 hover:text-teal-600 px-2"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-[10px] font-bold text-blue-600 animate-pulse uppercase">Awaiting Client</span>
                          )}
                          <span className="font-bold text-slate-900">KES {(order.totalAmount || order.total || 0).toLocaleString()}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-[#0f172a] text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Package className="h-6 w-6 text-teal-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Inventory Health</span>
              </div>
              <h3 className="text-lg font-bold">Stock Management</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Keep track of your goods and materials to ensure smooth business operations.</p>
              <Button asChild variant="outline" className="w-full mt-6 border-slate-700 text-xs text-teal-400 hover:bg-slate-800 font-bold h-10">
                <Link href="/inventory">View Inventory</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

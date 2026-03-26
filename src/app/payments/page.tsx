'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  Download, 
  Wallet,
  Clock,
  CreditCard,
  Loader2
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Order } from '@/lib/types';
import { RoleGuard } from '@/components/RoleGuard';

export default function PaymentsPage() {
  const db = useFirestore();
  const { user } = useUser();
  
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return FirebaseService.getSellerOrdersQuery(db);
  }, [db, user]);
  
  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const totalRevenue = orders?.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + o.totalAmount, 0) || 0;
  const pendingClearance = orders?.filter(o => o.paymentStatus !== 'paid').reduce((acc, o) => acc + o.totalAmount, 0) || 0;

  return (
    <RoleGuard allowedRoles={['seller']}>
      <Shell userRole="seller">
        <PageHeader 
          title="Payments & Finances" 
          description="Monitor your platform earnings and track payment compliance."
          action={
            <Button className="bg-primary text-white font-bold gap-2 rounded-xl h-11">
              <Download className="h-4 w-4" /> Export
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-primary text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-800 rounded-lg"><Wallet className="h-5 w-5 text-teal-400" /></div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Revenue</span>
              </div>
              <div className="text-3xl font-bold">KES {totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-500" /></div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Pending</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">KES {pendingClearance.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-teal-50 rounded-lg"><CreditCard className="h-5 w-5 text-teal-600" /></div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Net Profit</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">KES {(totalRevenue * 0.95).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6 font-bold">Order Ref</TableHead>
                  <TableHead className="font-bold">Customer</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right pr-6 font-bold">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isOrdersLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading...</TableCell></TableRow>
                ) : orders?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">No payment records found.</TableCell></TableRow>
                ) : orders?.map((order) => (
                  <TableRow key={order.id} className="border-slate-100">
                    <TableCell className="pl-6 font-bold">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                        order.paymentStatus === 'paid' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-teal-accent">KES {order.totalAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Shell>
    </RoleGuard>
  );
}

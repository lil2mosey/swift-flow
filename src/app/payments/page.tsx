'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Wallet,
  Clock,
  CreditCard,
  Loader2,
  Calendar
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
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const db = useFirestore();
  const { user } = useUser();
  
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return FirebaseService.getSellerOrdersQuery(db);
  }, [db, user]);
  
  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const totalRevenue = orders?.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0) || 0;
  const pendingClearance = orders?.filter(o => o.paymentStatus !== 'paid').reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0) || 0;

  const formatDate = (date: any) => {
    if (!date) return 'Syncing...';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return isNaN(d.getTime()) ? 'Syncing...' : format(d, 'MMM d, yyyy');
  };

  const handleExport = () => {
    if (!orders || orders.length === 0) {
      toast({ 
        variant: "destructive", 
        title: "No Data", 
        description: "There are no payment records to export." 
      });
      return;
    }

    const headers = ["Order ID", "Customer Name", "Payment Status", "Total Amount (KES)", "Created At"];
    const csvContent = [
      headers.join(","),
      ...orders.map(order => {
        const date = order.createdAt 
          ? (typeof order.createdAt === 'string' ? new Date(order.createdAt) : new Date(order.createdAt.seconds * 1000)).toLocaleDateString()
          : 'N/A';
        
        return [
          order.id.slice(0, 8).toUpperCase(),
          `"${order.customerName || 'Anonymous'}"`,
          order.paymentStatus,
          (order.totalAmount || order.total || 0),
          date
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `swiftflow_payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: "Export Complete", 
      description: "Your payment records have been downloaded as CSV." 
    });
  };

  return (
    <RoleGuard allowedRoles={['seller']}>
      <Shell userRole="seller">
        <PageHeader 
          title="Payments & Finances" 
          description="Monitor your platform earnings and track payment compliance."
          action={
            <Button 
              onClick={handleExport}
              disabled={isOrdersLoading || !orders || orders.length === 0}
              className="bg-primary text-white font-bold gap-2 rounded-xl h-11"
            >
              <Download className="h-4 w-4" /> Export CSV
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
                <span className="text-[10px] font-bold uppercase text-slate-400">Net (95%)</span>
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
                  <TableHead className="pl-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Order Ref</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Date</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Customer</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isOrdersLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                ) : !orders || orders.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 font-medium italic">No payment records found.</TableCell></TableRow>
                ) : orders.map((order) => (
                  <TableRow key={order.id} className="border-slate-100">
                    <TableCell className="pl-6 font-bold text-slate-900">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-xs text-slate-400 font-bold flex items-center gap-1.5 py-4">
                      <Calendar className="h-3 w-3" /> {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">{order.customerName || 'Anonymous'}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                        order.paymentStatus === 'paid' ? "bg-teal-100 text-teal-700" : 
                        order.paymentStatus === 'pending_approval' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {order.paymentStatus.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-teal-accent">KES {(order.totalAmount || order.total || 0).toLocaleString()}</TableCell>
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

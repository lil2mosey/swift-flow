
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  ChevronRight,
  TrendingUp,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Send,
  Loader2
} from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerOrders } from '@/hooks/use-customer-data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FirebaseService } from '@/services/firebase-service';
import { toast } from '@/hooks/use-toast';

export default function CustomerView() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const { orders, isLoading: isOrdersLoading } = useCustomerOrders();
  const [quickMessage, setQuickMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const stats = useMemo(() => {
    if (!orders) return {
      totalOrders: 0,
      totalSpent: 0,
      avgOrder: 0,
      paidAmount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      completedCount: 0,
      successRate: 0,
      statusCounts: { pending: 0, processing: 0, completed: 0, cancelled: 0, unpaid: 0 }
    };

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const paidAmount = orders.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const pendingAmount = orders.filter(o => o.paymentStatus !== 'paid').reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const pendingCount = orders.filter(o => o.paymentStatus !== 'paid').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    const successRate = totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0;

    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: completedCount,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      unpaid: orders.filter(o => o.paymentStatus === 'unpaid').length
    };

    return { totalOrders, totalSpent, avgOrder, paidAmount, pendingAmount, pendingCount, completedCount, successRate, statusCounts };
  }, [orders]);

  const formatDate = (date: any) => {
    if (!date) return 'Recently';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return isNaN(d.getTime()) ? 'Recently' : format(d, 'MMMM d, yyyy');
  };

  const handleSendQuickMessage = async () => {
    if (!user || !quickMessage.trim()) return;
    setIsSending(true);
    try {
      const customerName = profile?.fullName || profile?.firstName || user.email?.split('@')[0] || 'Customer';
      const convId = await FirebaseService.findOrCreateGeneralConversation(db, user.uid, 'system-seller', customerName);
      await FirebaseService.sendChatMessage(db, convId, user.uid, customerName, quickMessage, false);
      setQuickMessage('');
      toast({ title: "Message Sent", description: "Workshop will respond shortly." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <div className="h-16 w-16 bg-[#0f172a] rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-white">
          <Package className="h-8 w-8 text-teal-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Welcome back, {profile?.firstName || profile?.fullName?.split(' ')[0] || 'Member'}!
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest mr-2">Member since</span>
            {formatDate(profile?.createdAt)}
          </p>
          <p className="text-slate-400 text-sm font-medium mt-1 italic">Here's what's happening with your account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Orders</p>
                <div className="text-3xl font-bold text-slate-900 mt-1">{isOrdersLoading ? <Skeleton className="h-8 w-12" /> : stats.totalOrders}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform"><Package className="h-5 w-5 text-slate-400" /></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avg: KES {stats.avgOrder.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Spent</p>
                <div className="text-3xl font-bold text-slate-900 mt-1">KES {isOrdersLoading ? <Skeleton className="h-8 w-24" /> : stats.totalSpent.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform"><DollarSign className="h-5 w-5 text-slate-400" /></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Paid: KES {stats.paidAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Pending Payment</p>
                <div className="text-3xl font-bold text-amber-500 mt-1">KES {isOrdersLoading ? <Skeleton className="h-8 w-20" /> : stats.pendingAmount.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl group-hover:scale-110 transition-transform"><Clock className="h-5 w-5 text-amber-500" /></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{stats.pendingCount} orders pending</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Completed</p>
                <div className="text-3xl font-bold text-teal-600 mt-1">{isOrdersLoading ? <Skeleton className="h-8 w-12" /> : stats.completedCount}</div>
              </div>
              <div className="p-3 bg-teal-50 rounded-2xl group-hover:scale-110 transition-transform"><CheckCircle2 className="h-5 w-5 text-teal-500" /></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{stats.successRate.toFixed(0)}% success rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Pending', value: stats.statusCounts.pending, color: 'text-amber-500' },
          { label: 'Processing', value: stats.statusCounts.processing, color: 'text-blue-500' },
          { label: 'Completed', value: stats.statusCounts.completed, color: 'text-teal-600' },
          { label: 'Cancelled', value: stats.statusCounts.cancelled, color: 'text-rose-500' },
          { label: 'Unpaid', value: stats.statusCounts.unpaid === 0 ? 'No' : stats.statusCounts.unpaid, color: 'text-orange-600' }
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-white text-center p-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <div className={cn("text-xl font-bold", item.color)}>{isOrdersLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : item.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 bg-[#0f172a] text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-teal-400" />
              <h2 className="font-bold text-lg">Recent Orders</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-teal-400 hover:text-white hover:bg-slate-800 gap-1 font-bold text-xs uppercase">
              <Link href="/orders">View All <ArrowUpRight className="h-3 w-3" /></Link>
            </Button>
          </div>
          <CardContent className="p-0 flex-1">
            {isOrdersLoading ? (
              <div className="p-6 space-y-4">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : orders?.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic font-medium">No order history found.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {orders?.slice(0, 4).map((order) => (
                  <div key={order.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">Order #{order.id.slice(0, 8).toUpperCase()}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                          {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm:ss') : 'Just now'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded-full", order.status === 'completed' ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700")}>
                          {order.status}
                        </span>
                        <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded-full", order.paymentStatus === 'paid' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700")}>
                          {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                      <div>
                        <span className="text-slate-400 text-[9px] block uppercase font-bold tracking-widest mb-0.5">Item</span>
                        {order.items?.[0]?.productName || 'Direct Order'}
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] block uppercase font-bold tracking-widest mb-0.5">Qty</span>
                        {order.items?.reduce((acc, i) => acc + i.quantity, 0) || 1}
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] block uppercase font-bold tracking-widest mb-0.5">Price</span>
                        KES {(order.items?.[0]?.priceAtOrder || 0).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] block uppercase font-bold tracking-widest mb-0.5">Total</span>
                        KES {(order.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 bg-[#0f172a] text-white flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-teal-400" />
            <h2 className="font-bold text-lg">Messages</h2>
          </div>
          <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
            <div className="flex-1 bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <MessageSquare className="h-10 w-10 text-slate-200 mb-4" />
              <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                Need help with an order or a custom request?<br />Start a synchronized conversation with our craftsmen.
              </p>
              <Button asChild variant="outline" className="mt-6 border-slate-200 text-teal-600 hover:bg-teal-50 font-bold h-10 rounded-xl">
                <Link href="/messages">View Conversation History</Link>
              </Button>
            </div>
            
            <div className="space-y-4">
              <Textarea 
                placeholder="Type your message to the seller..." 
                className="min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus-visible:ring-teal-400 resize-none shadow-inner"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
              />
              <Button 
                onClick={handleSendQuickMessage}
                disabled={isSending || !quickMessage.trim()}
                className="w-full h-12 bg-primary text-white font-bold rounded-xl gap-2 shadow-lg group"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                Send Direct Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


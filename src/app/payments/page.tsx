'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  Download, 
  Search,
  Filter,
  CreditCard,
  Wallet,
  Clock,
  Smartphone,
  Loader2
} from 'lucide-react';
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Order } from '@/lib/types';

export default function PaymentsPage() {
  const db = useFirestore();
  const { user, profile, isProfileLoading } = useUser();
  
  const ordersQuery = useMemoFirebase(() => {
    // Only fetch if profile is loaded and the user is a seller to prevent permission errors
    if (!db || !user || profile?.role !== 'seller') return null;
    return FirebaseService.getSellerOrdersQuery(db, user.uid);
  }, [db, user, profile]);
  
  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);
  const isLoading = isProfileLoading || isOrdersLoading;

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('0712345678');
  const [isProcessing, setIsProcessing] = useState(false);

  const openPaymentDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentDialogOpen(true);
  };

  const handleMpesaPrompt = () => {
    if (!selectedOrder) return;
    
    setIsProcessing(true);
    
    // Simulate STK Push Confirmation
    setTimeout(async () => {
      FirebaseService.processPayment(db, selectedOrder.id);
      setIsProcessing(false);
      setIsPaymentDialogOpen(false);
      toast({
        title: "M-Pesa Payment Confirmed",
        description: `Order ${selectedOrder.id.slice(0,8).toUpperCase()} is now marked as Completed.`,
      });
    }, 2500);
  };

  const totalRevenue = orders?.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + o.totalAmount, 0) || 0;
  const pendingClearance = orders?.filter(o => o.paymentStatus === 'unpaid').reduce((acc, o) => acc + o.totalAmount, 0) || 0;

  return (
    <Shell userRole="seller">
      <PageHeader 
        title="Payments & Finances" 
        description="Monitor your earnings, process pending payments, and view history."
        action={
          <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Wallet className="h-5 w-5 text-teal-400" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Confirmed Revenue</span>
            </div>
            <div className="text-3xl font-bold">KES {totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-2 text-teal-400 text-xs font-bold">
              <ArrowUpRight className="h-3 w-3" /> Real-time balance
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Awaiting Payment</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">KES {pendingClearance.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Potential revenue from unpaid orders</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-teal-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-teal-600" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Next Payout</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">KES {(totalRevenue * 0.9).toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Estimated net after fees</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold">Payment Log</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9 h-9 w-[250px] bg-slate-50 border-none" placeholder="Search orders..." />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                <p className="text-sm font-medium text-slate-400">Loading payment data...</p>
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-medium italic">No payment history found.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
                    <TableHead className="font-bold text-slate-800 pl-6">Order Reference</TableHead>
                    <TableHead className="font-bold text-slate-800">Customer</TableHead>
                    <TableHead className="font-bold text-slate-800">Payment Status</TableHead>
                    <TableHead className="font-bold text-slate-800">Order Status</TableHead>
                    <TableHead className="font-bold text-slate-800 text-right pr-6">Action / Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50 border-slate-100 transition-colors group">
                      <TableCell className="font-bold text-slate-900 pl-6">
                        {order.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">{order.customerName || 'Anonymous'}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                          order.paymentStatus === 'paid' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {order.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-3">
                          {order.paymentStatus === 'unpaid' && (
                            <Button 
                              onClick={() => openPaymentDialog(order)}
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-teal-200 text-teal-700 hover:bg-teal-50 font-bold px-4"
                            >
                              Pay
                            </Button>
                          )}
                          <span className="font-bold text-teal-accent">
                            KES {order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-teal-600" />
              M-Pesa Payment Prompt
            </DialogTitle>
            <DialogDescription>
              Confirm payment for order {selectedOrder?.id.slice(0,8).toUpperCase()}. A simulated STK push will be triggered.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Customer Phone Number</Label>
              <Input 
                id="phone" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                placeholder="07XXXXXXXX"
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
              <div className="flex justify-between items-center text-sm font-bold text-teal-900">
                <span>Amount Due:</span>
                <span>KES {selectedOrder?.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-11"
              onClick={handleMpesaPrompt}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Confirming Payment...
                </>
              ) : (
                "Trigger Payment Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

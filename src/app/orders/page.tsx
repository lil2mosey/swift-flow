
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { Printer, Eye, Loader2, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const mockOrders = [
  { id: 'ORD-101', date: 'Oct 24, 2023', customer: 'Alice Johnson', amount: 15400, status: 'processing', payment: 'paid' },
  { id: 'ORD-102', date: 'Oct 25, 2023', customer: 'Bob Smith', amount: 8200, status: 'pending', payment: 'unpaid' },
  { id: 'ORD-103', date: 'Oct 26, 2023', customer: 'Charlie Davis', amount: 12100, status: 'shipped', payment: 'paid' },
  { id: 'ORD-104', date: 'Oct 27, 2023', customer: 'Diana Ross', amount: 4500, status: 'pending', payment: 'unpaid' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('0712345678');
  const [isProcessing, setIsProcessing] = useState(false);

  const openPaymentDialog = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
    setIsPaymentDialogOpen(true);
  };

  const handleMpesaPrompt = () => {
    if (!selectedOrder) return;
    
    setIsProcessing(true);
    
    // Simulate STK Push
    setTimeout(() => {
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, payment: 'paid' as const, status: 'processing' as const } : o));
      setIsProcessing(false);
      setIsPaymentDialogOpen(false);
      toast({
        title: "M-Pesa Payment Received",
        description: `Payment for ${selectedOrder.id} has been confirmed.`,
      });
    }, 2500);
  };

  return (
    <Shell userRole="seller">
      <PageHeader 
        title="Order Management" 
        description="Process transactions and track fulfillment status."
      />

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100">
                <TableHead className="font-bold text-slate-800 pl-6">Order ID</TableHead>
                <TableHead className="font-bold text-slate-800">Date</TableHead>
                <TableHead className="font-bold text-slate-800">Customer</TableHead>
                <TableHead className="font-bold text-slate-800">Status</TableHead>
                <TableHead className="font-bold text-slate-800">Payment</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Total</TableHead>
                <TableHead className="pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50 border-slate-100 group">
                  <TableCell className="font-bold text-slate-900 pl-6">{order.id}</TableCell>
                  <TableCell className="text-slate-500 font-medium">{order.date}</TableCell>
                  <TableCell className="font-medium text-slate-900">{order.customer}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                      order.status === 'processing' ? "bg-blue-100 text-blue-700" : 
                      order.status === 'pending' ? "bg-slate-100 text-slate-600" :
                      "bg-teal-100 text-teal-700"
                    )}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded inline-flex items-center",
                      order.payment === 'paid' ? "bg-teal-100 text-teal-700" : "bg-[#fef3c7] text-[#92400e]"
                    )}>
                      {order.payment}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-teal-accent">
                    KES {order.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {order.payment === 'unpaid' && (
                        <Button 
                          onClick={() => openPaymentDialog(order)}
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-teal-200 text-teal-700 hover:bg-teal-50"
                        >
                          Pay
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              A STK push notification will be sent to the phone number below for {selectedOrder?.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
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
                <span>Total Amount:</span>
                <span>KES {selectedOrder?.amount.toLocaleString()}</span>
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
                  Sending Prompt...
                </>
              ) : (
                "Send M-Pesa Prompt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

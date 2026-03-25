
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
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

const initialTransactions = [
  { id: 'TXN-001', orderId: 'ORD-101', date: 'Oct 24, 2023', customer: 'Alice Johnson', amount: 15400, method: 'M-Pesa', status: 'completed' },
  { id: 'TXN-002', orderId: 'ORD-102', date: 'Oct 25, 2023', customer: 'Bob Smith', amount: 8200, method: 'Card', status: 'pending' },
  { id: 'TXN-003', orderId: 'ORD-103', date: 'Oct 26, 2023', customer: 'Charlie Davis', amount: 12100, method: 'M-Pesa', status: 'completed' },
  { id: 'TXN-004', orderId: 'ORD-104', date: 'Oct 27, 2023', customer: 'Diana Ross', amount: 4500, method: 'Bank Transfer', status: 'pending' },
  { id: 'TXN-005', orderId: 'ORD-105', date: 'Oct 28, 2023', customer: 'Edward Kenway', amount: 22000, method: 'Card', status: 'completed' },
];

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<typeof initialTransactions[0] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('0712345678');
  const [isProcessing, setIsProcessing] = useState(false);

  const openPaymentDialog = (txn: typeof initialTransactions[0]) => {
    setSelectedTxn(txn);
    setIsPaymentDialogOpen(true);
  };

  const handleMpesaPrompt = () => {
    if (!selectedTxn) return;
    
    setIsProcessing(true);
    
    // Simulate STK Push
    setTimeout(() => {
      setTransactions(prev => prev.map(t => t.id === selectedTxn.id ? { ...t, status: 'completed' } : t));
      setIsProcessing(false);
      setIsPaymentDialogOpen(false);
      toast({
        title: "M-Pesa Payment Received",
        description: `Payment for ${selectedTxn.orderId} has been confirmed.`,
      });
    }, 2500);
  };

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
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Revenue</span>
            </div>
            <div className="text-3xl font-bold">KES 142,500</div>
            <div className="flex items-center gap-1 mt-2 text-teal-400 text-xs font-bold">
              <ArrowUpRight className="h-3 w-3" /> +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Pending Clearance</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">KES 12,700</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">To be cleared in 2-3 business days</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-teal-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-teal-600" />
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Next Payout</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">KES 45,000</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Scheduled for Oct 31, 2023</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9 h-9 w-[250px] bg-slate-50 border-none" placeholder="Search transactions..." />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100">
                  <TableHead className="font-bold text-slate-800 pl-6">ID / Order</TableHead>
                  <TableHead className="font-bold text-slate-800">Date</TableHead>
                  <TableHead className="font-bold text-slate-800">Customer</TableHead>
                  <TableHead className="font-bold text-slate-800">Status</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right pr-6">Action / Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-slate-50 border-slate-100 transition-colors group">
                    <TableCell className="font-bold text-slate-900 pl-6">
                      <div className="flex flex-col">
                        <span>{txn.id}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Order: {txn.orderId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium">{txn.date}</TableCell>
                    <TableCell className="font-medium text-slate-900">{txn.customer}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                        txn.status === 'completed' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {txn.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-3">
                        {txn.status === 'pending' && (
                          <Button 
                            onClick={() => openPaymentDialog(txn)}
                            size="sm" 
                            variant="outline" 
                            className="h-8 border-teal-200 text-teal-700 hover:bg-teal-50 font-bold px-4"
                          >
                            Pay
                          </Button>
                        )}
                        <span className="font-bold text-teal-accent">
                          KES {txn.amount.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              Process payment for transaction {selectedTxn?.id}. A STK push will be sent to the customer.
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
                <span>KES {selectedTxn?.amount.toLocaleString()}</span>
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
                "Trigger Payment Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

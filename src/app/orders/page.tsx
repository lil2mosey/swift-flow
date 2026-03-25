
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Printer, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const mockOrders = [
  { id: 'ORD-101', date: 'Oct 24, 2023', customer: 'Alice Johnson', amount: 15400, status: 'processing', payment: 'paid' },
  { id: 'ORD-102', date: 'Oct 25, 2023', customer: 'Bob Smith', amount: 8200, status: 'pending', payment: 'unpaid' },
  { id: 'ORD-103', date: 'Oct 26, 2023', customer: 'Charlie Davis', amount: 12100, status: 'shipped', payment: 'paid' },
  { id: 'ORD-104', date: 'Oct 27, 2023', customer: 'Diana Ross', amount: 4500, status: 'pending', payment: 'unpaid' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState(mockOrders);

  const unpaidCount = orders.filter(o => o.payment === 'unpaid').length;

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
  };

  return (
    <Shell userRole="seller">
      <PageHeader 
        title="Order Management" 
        description="Update fulfillment status and track payment compliance."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Unpaid Orders</p>
              <p className="text-2xl font-bold text-slate-900">{unpaidCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Fulfillment</p>
              <p className="text-2xl font-bold text-slate-900">
                {orders.filter(o => o.status === 'pending' || o.status === 'processing').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Completed Today</p>
              <p className="text-2xl font-bold text-slate-900">
                {orders.filter(o => o.status === 'shipped').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100">
                <TableHead className="font-bold text-slate-800 pl-6">Order ID</TableHead>
                <TableHead className="font-bold text-slate-800">Customer</TableHead>
                <TableHead className="font-bold text-slate-800">Payment</TableHead>
                <TableHead className="font-bold text-slate-800">Status Action</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Total</TableHead>
                <TableHead className="pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50 border-slate-100 group">
                  <TableCell className="font-bold text-slate-900 pl-6">{order.id}</TableCell>
                  <TableCell className="font-medium text-slate-900">{order.customer}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded inline-flex items-center",
                      order.payment === 'paid' ? "bg-teal-100 text-teal-700" : "bg-[#fef3c7] text-[#92400e]"
                    )}>
                      {order.payment}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={order.status} 
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs font-bold border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-bold text-teal-accent">
                    KES {order.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </Shell>
  );
}

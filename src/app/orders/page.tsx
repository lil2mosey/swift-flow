'use client';

import React from 'react';
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
import { Printer, Eye, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Order, OrderStatus } from '@/lib/types';
import { FirebaseService } from '@/services/firebase-service';

export default function OrdersPage() {
  const db = useFirestore();
  const { user, profile, isProfileLoading } = useUser();
  
  const ordersQuery = useMemoFirebase(() => {
    // CRITICAL: Guard the query. Firestore rules will REJECT any query 
    // that doesn't include the required filters (sellerId/customerId).
    if (!db || !user || !profile?.role) return null;
    
    return profile.role === 'seller' 
      ? FirebaseService.getSellerOrdersQuery(db, user.uid)
      : FirebaseService.getCustomerOrdersQuery(db, user.uid);
  }, [db, user, profile]);
  
  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);
  const isLoading = isProfileLoading || isOrdersLoading;

  const unpaidCount = orders?.filter(o => o.paymentStatus === 'unpaid').length || 0;
  const pendingFulfillment = orders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;
  const completedToday = orders?.filter(o => o.status === 'completed').length || 0;

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const isSeller = profile?.role === 'seller';

  return (
    <Shell userRole={isSeller ? "seller" : "customer"}>
      <PageHeader 
        title={isSeller ? "Order Management" : "My Order History"} 
        description={isSeller ? "Update fulfillment status and track payment compliance." : "Track your recent purchases and delivery status."}
      />

      {isSeller && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Unpaid Orders</p>
                <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : unpaidCount}</p>
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
                <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : pendingFulfillment}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-teal-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : completedToday}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-none shadow-sm overflow-hidden min-h-[400px]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              <p className="text-sm font-medium text-slate-400">Loading orders...</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 font-medium italic">No orders found in your history.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-primary">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="font-bold text-teal-400 pl-6 uppercase text-[10px] tracking-widest">Order ID</TableHead>
                  <TableHead className="font-bold text-slate-200 uppercase text-[10px] tracking-widest">{isSeller ? "Customer" : "Items"}</TableHead>
                  <TableHead className="font-bold text-slate-200 uppercase text-[10px] tracking-widest">Payment</TableHead>
                  <TableHead className="font-bold text-slate-200 uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="font-bold text-slate-200 text-right pr-6 uppercase text-[10px] tracking-widest">Total</TableHead>
                  <TableHead className="pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-slate-100 group">
                    <TableCell className="font-bold text-slate-900 pl-6">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-slate-600">
                      {isSeller ? (order.customerName || 'Anonymous') : `${order.items?.length || 0} items`}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded inline-flex items-center",
                        order.paymentStatus === 'paid' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isSeller ? (
                        <Select 
                          value={order.status} 
                          onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs font-bold border-slate-200 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {order.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-teal-accent pr-6">
                      KES {order.totalAmount.toLocaleString()}
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
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}

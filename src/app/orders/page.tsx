
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { 
  Printer, 
  Loader2, 
  PlusCircle, 
  Calendar,
  Lock,
  ShoppingBag,
  DollarSign,
  Clock,
  TrendingUp,
  Settings2,
  ChevronRight,
  MapPin,
  Smartphone
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  useUser 
} from '@/firebase';
import { Order, Product, PaymentStatus, OrderStatus } from '@/lib/types';
import { FirebaseService } from '@/services/firebase-service';
import { toast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/RoleGuard';
import { PermissionAwareCollection } from '@/components/PermissionAwareCollection';
import Link from 'next/link';
import { format } from 'date-fns';
import { SwiftFlowLogo } from '@/components/SwiftFlowLogo';

const ReceiptPrintView = ({ order }: { order: Order }) => {
  const orderTotal = order.totalAmount || order.total || 0;
  const formattedDate = order.createdAt 
    ? (order.createdAt.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMMM d, yyyy HH:mm') : format(new Date(order.createdAt), 'MMMM d, yyyy HH:mm'))
    : format(new Date(), 'MMMM d, yyyy HH:mm');

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white text-slate-900 font-sans border border-slate-200">
      <div className="text-center border-b pb-6 mb-6">
        <div className="flex justify-center items-center gap-4 mb-2">
          <SwiftFlowLogo className="h-10 w-10" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">SwiftFlow</h1>
        </div>
        <p className="text-slate-600 font-bold italic text-xs uppercase tracking-widest leading-relaxed">Fulfillment & Logistics Summary</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Details</p>
          <p className="text-sm font-bold">{order.customerName || 'Anonymous'}</p>
          <p className="text-xs text-slate-700 font-medium">{order.customerPhone || 'N/A'}</p>
          <p className="text-xs text-slate-700 italic font-medium">{order.deliveryLocation || 'Delivery not specified'}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order Reference</p>
          <p className="text-sm font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-slate-700 font-medium">{formattedDate}</p>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
              <th className="py-2">Item Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-medium">{item.productName}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right font-bold">KES {(item.priceAtOrder * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-sm font-bold uppercase tracking-widest text-teal-600">Total Value</span>
          <span className="text-xl font-bold text-slate-900">KES {orderTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default function OrdersPage() {
  const db = useFirestore();
  const { user, profile, isProfileLoading } = useUser();
  
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [pin, setPin] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    deliveryLocation: '',
    productId: '',
    quantity: 1,
    amount: 0,
    paymentStatus: 'unpaid' as PaymentStatus
  });

  const isSeller = profile?.role === 'seller';

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user || !profile) return null;
    if (isSeller) {
      return FirebaseService.getSellerOrdersQuery(db);
    } else {
      return FirebaseService.getCustomerOrdersQuery(db, user.uid);
    }
  }, [db, user, profile, isSeller]);
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return FirebaseService.getProductsQuery(db);
  }, [db]);

  const { data: orders, isLoading: isOrdersLoading, error: ordersError } = useCollection<Order>(ordersQuery);
  const { data: products } = useCollection<Product>(productsQuery);
  
  const isInitialLoading = isProfileLoading || (user && !profile) || (ordersQuery && isOrdersLoading);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    const data = [...orders].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return data.filter(order => 
      !searchTerm ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const stats = useMemo(() => {
    if (!orders) return { totalSpent: 0, pendingAmount: 0, totalOrders: 0 };
    const paid = orders.filter(o => o.paymentStatus === 'paid');
    const unpaid = orders.filter(o => o.paymentStatus !== 'paid');
    
    return {
      totalSpent: paid.reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0),
      pendingAmount: unpaid.reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0),
      totalOrders: orders.length
    };
  }, [orders]);

  useEffect(() => {
    if (orderToPrint) {
      const timer = setTimeout(() => {
        window.print();
        setOrderToPrint(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [orderToPrint]);

  const formatDate = (date: any) => {
    if (!date) return 'Recently';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return isNaN(d.getTime()) ? 'Recently' : format(d, 'MMM d, yyyy');
  };

  const handlePrintReceipt = (order: Order) => {
    setOrderToPrint(order);
    toast({ title: "Receipt Ready", description: "Formatting for professional output." });
  };

  const handleOpenPinDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsPinDialogOpen(true);
  };

  const handleOpenStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      FirebaseService.confirmPayment(db, selectedOrder);
      setIsProcessingPayment(false);
      setIsPinDialogOpen(false);
      setPin('');
      toast({ title: "Authorized", description: "Payment recorded and stock updated." });
    }, 1500);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      await FirebaseService.updateOrderStatus(db, selectedOrder.id, newStatus);
      toast({ title: "Status Updated", description: `Order is now marked as ${newStatus}.` });
      setIsStatusDialogOpen(false);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      setNewOrder(prev => ({ ...prev, productId, amount: product.price * prev.quantity }));
    }
  };

  const handleCreateOrder = async () => {
    if (!user) return;
    const selectedProduct = products?.find(p => p.id === newOrder.productId);
    
    try {
      await FirebaseService.addManualOrder(db, user.uid, {
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        deliveryLocation: newOrder.deliveryLocation,
        totalAmount: newOrder.amount,
        paymentStatus: newOrder.paymentStatus,
        status: newOrder.paymentStatus === 'paid' ? 'processing' : 'pending',
        items: [{
          productId: newOrder.productId,
          productName: selectedProduct?.name || 'Manual Item',
          quantity: newOrder.quantity,
          priceAtOrder: selectedProduct?.price || 0
        }]
      });
      setIsOrderDialogOpen(false);
      setNewOrder({
        customerName: '',
        customerPhone: '',
        deliveryLocation: '',
        productId: '',
        quantity: 1,
        amount: 0,
        paymentStatus: 'unpaid'
      });
      toast({ title: "Order Recorded", description: "The sale has been successfully registered." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Order Failed", description: e.message });
    }
  };

  return (
    <RoleGuard allowedRoles={['seller', 'customer']}>
      <Shell userRole={isSeller ? "seller" : "customer"}>
        <PageHeader 
          title={isSeller ? "Order Management" : "My Orders"} 
          description={isSeller ? "Track workshop fulfillment and direct sales." : "Track your jewelry pieces from the workshop to delivery."}
          action={isSeller && (
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-11">
                  <PlusCircle className="h-4 w-4" /> Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white">
                <div className="bg-[#0f172a] p-8 pb-6 text-white border-b border-slate-800">
                  <DialogTitle className="text-3xl font-bold">New <span className="text-accent">Order</span></DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium">Record sales with FCFS stock validation.</DialogDescription>
                </div>
                <div className="px-8 py-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-700 ml-1">Customer Details</Label>
                    <Input placeholder="Full Name" value={newOrder.customerName || ''} onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})} className="h-11 bg-slate-50 border-none rounded-xl" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-700 ml-1">Phone Number</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input placeholder="07XX XXX XXX" value={newOrder.customerPhone || ''} onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})} className="h-11 pl-9 bg-slate-50 border-none rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-700 ml-1">Delivery Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input placeholder="City / Area" value={newOrder.deliveryLocation || ''} onChange={(e) => setNewOrder({...newOrder, deliveryLocation: e.target.value})} className="h-11 pl-9 bg-slate-50 border-none rounded-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-700 ml-1">Selection</Label>
                      <Select onValueChange={handleProductSelect}>
                        <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select Item" /></SelectTrigger>
                        <SelectContent className="rounded-xl">{products?.map(p => <SelectItem key={p.id} value={p.id} disabled={p.currentStock <= 0}>{p.name} ({p.currentStock})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-700 ml-1">Payment</Label>
                      <Select value={newOrder.paymentStatus} onValueChange={(v) => setNewOrder({...newOrder, paymentStatus: v as PaymentStatus})}>
                        <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl"><SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="paid">Paid (Cash)</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newOrder.amount > 0 && (
                    <div className="p-4 bg-teal-50 rounded-2xl flex justify-between items-center border border-teal-100 mt-2">
                      <span className="text-[10px] font-bold text-teal-600 uppercase">Grand Total</span>
                      <span className="text-xl font-bold text-slate-900">KES {newOrder.amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <DialogFooter className="p-8 pt-0">
                  <Button onClick={handleCreateOrder} disabled={!newOrder.productId || !newOrder.customerName} className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl transition-all hover:bg-slate-800">Finalize Order</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        />

        {!isInitialLoading && sortedOrders && sortedOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-sm bg-[#0f172a] text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-accent/10 rounded-xl">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Investment</span>
                </div>
                <div className="text-3xl font-bold">KES {stats.totalSpent.toLocaleString()}</div>
                <p className="text-[10px] text-accent font-bold uppercase mt-1 tracking-tighter">Lifetime Total Spent</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Pending Balance</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">KES {stats.pendingAmount.toLocaleString()}</div>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-tighter">Awaiting Payment</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Order History</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{stats.totalOrders}</div>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-tighter">Total Items Ordered</p>
              </CardContent>
            </Card>
          </div>
        )}

        <PermissionAwareCollection 
          isLoading={isInitialLoading} 
          error={ordersError} 
          data={sortedOrders} 
          collectionName="orders"
          fallback={!isSeller && (
            <div className="py-32 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <ShoppingBag className="h-10 w-10 mx-auto text-teal-200 mb-4" />
              <h3 className="font-bold text-slate-900">No Orders Yet</h3>
              <Button asChild className="mt-6 bg-primary text-white font-bold h-11 rounded-xl"><Link href="/shop">Go to Shop</Link></Button>
            </div>
          )}
        >
          {(data) => (
            <div className="space-y-4">
              <Card className="border-none shadow-sm overflow-hidden min-h-[400px]">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-primary text-white">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="font-bold pl-6 uppercase text-[10px] text-accent">Order Ref</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] text-slate-200">Date</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] text-slate-200">Customer</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] text-slate-200">Payment</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] text-slate-200">Status</TableHead>
                        <TableHead className="text-right pr-6 font-bold uppercase text-[10px] text-slate-200">Total</TableHead>
                        <TableHead className="pr-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((order: Order) => (
                        <TableRow key={order.id} className="border-slate-100 hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-900 pl-6 text-xs">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                          <TableCell className="text-xs text-slate-600 font-bold">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" /> {formatDate(order.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                               <span className="font-bold text-slate-900 text-xs">{order.customerName}</span>
                               <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">{order.customerPhone || 'Direct'}</span>
                             </div>
                          </TableCell>
                          <TableCell><span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm", order.paymentStatus === 'paid' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700")}>{order.paymentStatus}</span></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded border">{order.status}</span>
                              {isSeller && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-slate-400 hover:text-primary"
                                  onClick={() => handleOpenStatusDialog(order)}
                                >
                                  <Settings2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-accent pr-6 text-xs">KES {(order.totalAmount || order.total || 0).toLocaleString()}</TableCell>
                          <TableCell className="pr-6 text-right">
                             {order.paymentStatus === 'paid' && <Button size="sm" variant="ghost" className="h-8 text-slate-500 hover:text-accent" onClick={() => handlePrintReceipt(order)}><Printer className="h-4 w-4" /></Button>}
                             {order.paymentStatus === 'pending_approval' && !isSeller && <Button size="sm" className="h-8 bg-teal-500 text-white font-bold" onClick={() => handleOpenPinDialog(order)}>Pay Now</Button>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </PermissionAwareCollection>

        <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl">
            <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-bold"><Lock className="h-5 w-5 text-teal-600" /> Secure Authorization</DialogTitle></DialogHeader>
            <div className="py-6 space-y-4 text-center">
              <Label className="text-xs font-bold uppercase text-slate-600">Enter PIN to Complete Payment</Label>
              <Input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="****" className="h-14 text-center text-3xl tracking-[1em] bg-slate-50 border-none rounded-2xl font-bold" />
            </div>
            <DialogFooter><Button className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg" onClick={handleConfirmPayment} disabled={isProcessingPayment}>{isProcessingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirm Secure Payment"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-[#0f172a] p-8 pb-6 text-white">
              <DialogTitle className="text-2xl font-bold">Manage <span className="text-teal-400">Status</span></DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">Update order fulfillment stage.</DialogDescription>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-600 ml-1">Current Order Ref</Label>
                <div className="p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border border-slate-100 flex justify-between items-center shadow-inner">
                  <span>#{selectedOrder?.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-slate-200 uppercase border border-slate-300">{selectedOrder?.status}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-600 ml-1">New Selection</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                  <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="p-8 pt-0">
              <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus} className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg gap-2">
                {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Confirm Status Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="hidden print:block fixed inset-0 z-[9999] bg-white">{orderToPrint && <ReceiptPrintView order={orderToPrint} />}</div>
      </Shell>
    </RoleGuard>
  );
}

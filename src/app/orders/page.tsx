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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { 
  Printer, 
  CheckCircle2, 
  Loader2, 
  PlusCircle, 
  User as UserIcon, 
  Phone, 
  MapPin,
  Smartphone,
  Lock,
  X,
  ShieldCheck,
  CreditCard,
  Search
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  useUser 
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Order, OrderStatus, Product, PaymentStatus } from '@/lib/types';
import { FirebaseService } from '@/services/firebase-service';
import { toast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/RoleGuard';
import { PermissionAwareCollection } from '@/components/PermissionAwareCollection';

/**
 * Receipt Layout for Printing
 */
const ReceiptPrintView = ({ order }: { order: Order }) => {
  const itemsSubtotal = order.items?.reduce((acc, item) => acc + (item.priceAtOrder * item.quantity), 0) || 0;
  const orderTotal = order.totalAmount || order.total || 0;
  const deliveryFee = orderTotal - itemsSubtotal;
  const formattedDate = order.createdAt 
    ? (typeof order.createdAt === 'string' ? new Date(order.createdAt) : new Date(order.createdAt.seconds * 1000)).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white text-slate-900 font-sans border border-slate-200">
      <div className="text-center border-b pb-6 mb-6">
        <div className="flex justify-center items-center gap-2 mb-2">
          <ShieldCheck className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">SwiftFlow</h1>
        </div>
        <p className="text-slate-500 font-medium italic">Synchronized Logistics & Receipts</p>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Official Business Receipt</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</p>
          <p className="text-sm font-bold">{order.customerName || 'Anonymous'}</p>
          <p className="text-xs text-slate-600">{order.customerPhone || 'N/A'}</p>
          <p className="text-xs text-slate-600 italic">{order.deliveryLocation || 'Standard Delivery'}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Reference</p>
          <p className="text-sm font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-slate-600">{formattedDate}</p>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
              <th className="py-2">Item Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-medium">{item.productName}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">KES {item.priceAtOrder.toLocaleString()}</td>
                <td className="py-3 text-right font-bold">KES {(item.priceAtOrder * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium uppercase tracking-wider">Subtotal (Worth)</span>
          <span className="font-bold text-slate-700">KES {itemsSubtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium uppercase tracking-wider">Delivery Fees</span>
          <span className="font-bold text-slate-700">KES {deliveryFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-sm font-bold uppercase tracking-widest text-teal-600">Total Paid</span>
          <span className="text-xl font-bold text-slate-900">KES {orderTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Thank you for your business!</p>
        <div className="flex justify-center items-center gap-1.5 opacity-50">
          <div className="h-1 w-1 bg-teal-500 rounded-full" />
          <div className="h-1 w-1 bg-teal-500 rounded-full" />
          <div className="h-1 w-1 bg-teal-500 rounded-full" />
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [pin, setPin] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    deliveryLocation: '',
    productId: '',
    quantity: 1,
    amount: 0,
    paymentStatus: 'unpaid' as PaymentStatus
  });

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user || !profile) return null;
    if (profile.role === 'seller') return FirebaseService.getSellerOrdersQuery(db);
    return FirebaseService.getCustomerOrdersQuery(db, user.uid);
  }, [db, user, profile]);
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return FirebaseService.getProductsQuery(db);
  }, [db]);

  const { data: orders, isLoading: isOrdersLoading, error: ordersError } = useCollection<Order>(ordersQuery);
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);
  
  const isInitialLoading = isProfileLoading || (user && !profile) || (ordersQuery && isOrdersLoading);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => 
      !searchTerm ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  useEffect(() => {
    if (orderToPrint) {
      const timer = setTimeout(() => {
        window.print();
        setOrderToPrint(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [orderToPrint]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const handlePrintReceipt = (order: Order) => {
    setOrderToPrint(order);
    toast({
      title: "Preparing Print",
      description: `Generating formatted receipt for Order #${order.id.slice(0,8).toUpperCase()}...`,
    });
  };

  const handleMarkAsPaid = (order: Order) => {
    FirebaseService.confirmPayment(db, order.id);
    toast({ 
      title: "Sync Success", 
      description: `Manual order for ${order.customerName} marked as PAID.` 
    });
  };

  const handleOpenPinDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsPinDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    if (pin.length < 4) {
      toast({ variant: "destructive", title: "Invalid PIN", description: "PIN must be 4 digits." });
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      FirebaseService.confirmPayment(db, selectedOrder.id);
      setIsProcessingPayment(false);
      setIsPinDialogOpen(false);
      setPin('');
      toast({ title: "Authorized", description: "Payment confirmation synced successfully." });
    }, 1500);
  };

  const handleProductSelect = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      setNewOrder(prev => ({
        ...prev,
        productId,
        amount: product.price * prev.quantity
      }));
    }
  };

  const handleQuantityChange = (qty: string) => {
    const q = parseInt(qty) || 1;
    const product = products?.find(p => p.id === newOrder.productId);
    setNewOrder(prev => ({
      ...prev,
      quantity: q,
      amount: product ? product.price * q : 0
    }));
  };

  const handleCreateOrder = () => {
    if (!user) return;
    if (!newOrder.customerName || !newOrder.productId) {
      toast({ variant: "destructive", title: "Incomplete", description: "Name and Item are required." });
      return;
    }

    const selectedProduct = products?.find(p => p.id === newOrder.productId);
    
    FirebaseService.addManualOrder(db, user.uid, {
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
    setNewOrder({ customerName: '', customerPhone: '', deliveryLocation: '', productId: '', quantity: 1, amount: 0, paymentStatus: 'unpaid' });
    toast({ title: "Order Synced", description: "Direct order successfully recorded." });
  };

  const isSeller = profile?.role === 'seller';

  return (
    <RoleGuard allowedRoles={['seller', 'customer']}>
      <Shell userRole={isSeller ? "seller" : "customer"}>
        <PageHeader 
          title={isSeller ? "Logistics Command" : "My Orders"} 
          description={isSeller ? "Synchronize manual DM sales and track platform fulfillment." : "Track your order history and synchronization status."}
          action={isSeller && (
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-11 shadow-lg shadow-slate-200">
                  <PlusCircle className="h-4 w-4" /> Create Direct Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white">
                <div className="bg-[#0f172a] p-8 pb-6 border-b border-slate-800 text-white">
                  <div className="flex justify-between items-start mb-2">
                    <DialogTitle className="text-3xl font-bold tracking-tight">
                      Manual <span className="text-teal-400">Order Entry</span>
                    </DialogTitle>
                    <DialogClose className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm bg-slate-700/50">
                      <X className="h-4 w-4 text-slate-300" />
                    </DialogClose>
                  </div>
                  <DialogDescription className="text-slate-400 font-medium italic">Record DM, Instagram, or direct shop sales.</DialogDescription>
                </div>

                <div className="px-8 py-6 space-y-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-widest">Customer Details</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Customer Full Name" 
                        className="pl-9 h-11 bg-slate-50 border-none rounded-xl font-bold"
                        value={newOrder.customerName}
                        onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Phone Number" 
                        className="pl-9 h-11 bg-slate-50 border-none rounded-xl font-bold"
                        value={newOrder.customerPhone}
                        onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Location" 
                        className="pl-9 h-11 bg-slate-50 border-none rounded-xl font-bold"
                        value={newOrder.deliveryLocation}
                        onChange={(e) => setNewOrder({...newOrder, deliveryLocation: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-widest">Select Item</Label>
                      <Select onValueChange={handleProductSelect}>
                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold">
                          <SelectValue placeholder={isProductsLoading ? "Syncing catalog..." : "-- Choose Item --"} />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map(p => (
                            <SelectItem key={p.id} value={p.id} className="py-3">
                              <div className="flex flex-col">
                                <span className="font-bold">{p.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase">KES {p.price.toLocaleString()}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-widest">Payment Status</Label>
                      <Select value={newOrder.paymentStatus} onValueChange={(v) => setNewOrder({...newOrder, paymentStatus: v as PaymentStatus})}>
                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid (Awaiting)</SelectItem>
                          <SelectItem value="paid">Paid (Cash/DM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-widest">Quantity</Label>
                      <Input 
                        type="number" min="1"
                        className="h-11 bg-slate-50 border-none rounded-xl font-bold"
                        value={newOrder.quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-widest">Total KES</Label>
                      <div className="h-11 flex items-center px-4 bg-teal-50 border border-teal-100 rounded-xl font-bold text-teal-600">
                        KES {newOrder.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="p-8 pt-0 bg-slate-50/30">
                  <Button onClick={handleCreateOrder} className="w-full h-14 bg-primary hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                    Sync & Finalize Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        />

        <div className="mb-6 relative w-full max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by Order ID or Customer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm font-medium"
          />
        </div>

        <PermissionAwareCollection 
          isLoading={isInitialLoading} 
          error={ordersError} 
          data={filteredOrders} 
          collectionName="orders"
        >
          {(data) => (
            <Card className="border-none shadow-sm overflow-hidden min-h-[400px]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-primary text-white">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="font-bold pl-6 uppercase text-[10px] tracking-widest text-teal-400">Order ID</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">{isSeller ? "Client" : "Summary"}</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">Payment</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">Fulfillment</TableHead>
                      <TableHead className="font-bold text-right pr-6 uppercase text-[10px] tracking-widest text-slate-200">Total</TableHead>
                      <TableHead className="pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((order: Order) => (
                      <TableRow key={order.id} className="border-slate-100 group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-900 pl-6 text-xs">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell className="font-medium text-slate-600">
                          {isSeller ? (order.customerName || 'Anonymous') : `${order.items?.length || 0} items`}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded inline-flex items-center",
                            order.paymentStatus === 'paid' ? "bg-teal-100 text-teal-700" : 
                            order.paymentStatus === 'pending_approval' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {order.paymentStatus.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isSeller ? (
                            <Select value={order.status} onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus)}>
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
                          KES {(order.totalAmount || order.total || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center justify-end gap-2">
                            {isSeller ? (
                               order.paymentStatus === 'unpaid' ? (
                                 <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 border-teal-200 text-teal-700 bg-teal-50 font-bold px-3 text-[10px]" 
                                  onClick={() => handleMarkAsPaid(order)}
                                 >
                                   <CreditCard className="h-3 w-3 mr-1.5" /> Mark Paid
                                 </Button>
                               ) : order.paymentStatus === 'paid' ? (
                                 <Button size="sm" variant="ghost" className="h-8 text-slate-400 hover:text-teal-600 font-bold px-2" onClick={() => handlePrintReceipt(order)}>
                                   <Printer className="h-4 w-4" />
                                 </Button>
                               ) : <span className="text-[10px] font-bold text-blue-600 animate-pulse uppercase">Syncing...</span>
                            ) : (
                              order.paymentStatus === 'pending_approval' ? (
                                <Button size="sm" className="h-8 bg-teal-500 text-white font-bold px-3 gap-2" onClick={() => handleOpenPinDialog(order)}>
                                  <Smartphone className="h-3.5 w-3.5" /> Pay Now
                                </Button>
                              ) : order.paymentStatus === 'paid' && <CheckCircle2 className="h-4 w-4 text-teal-500" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </PermissionAwareCollection>

        <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Lock className="h-5 w-5 text-teal-600" /> M-Pesa Security
              </DialogTitle>
              <DialogDescription>Authorize payment of <strong>KES {(selectedOrder?.totalAmount || selectedOrder?.total || 0).toLocaleString()}</strong>.</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4 text-center">
              <Label className="text-xs font-bold uppercase text-slate-400 tracking-widest block">Enter PIN to Complete Sync</Label>
              <Input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="****" className="h-14 text-center text-3xl tracking-[1em] bg-slate-50 border-none rounded-2xl font-bold" />
            </div>
            <DialogFooter>
              <Button className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg" onClick={handleConfirmPayment} disabled={isProcessingPayment}>
                {isProcessingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirm Secure Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
          {orderToPrint && <ReceiptPrintView order={orderToPrint} />}
        </div>
      </Shell>
    </RoleGuard>
  );
}
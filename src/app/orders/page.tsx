'use client';

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
  CheckCircle2, 
  Loader2, 
  PlusCircle, 
  User as UserIcon, 
  Phone, 
  MapPin,
  Smartphone,
  Lock
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  useUser 
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Order, OrderStatus, Product } from '@/lib/types';
import { FirebaseService } from '@/services/firebase-service';
import { toast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/RoleGuard';
import { PermissionAwareCollection } from '@/components/PermissionAwareCollection';

export default function OrdersPage() {
  const db = useFirestore();
  const { user, profile, isProfileLoading } = useUser();
  
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pin, setPin] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    deliveryLocation: '',
    productId: '',
    quantity: 1,
    amount: 0
  });

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user || !profile) return null;
    
    if (profile.role === 'seller') {
      return FirebaseService.getSellerOrdersQuery(db);
    }
    
    return FirebaseService.getCustomerOrdersQuery(db, user.uid);
  }, [db, user, profile]);
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return FirebaseService.getProductsQuery(db);
  }, [db]);

  const { data: orders, isLoading: isOrdersLoading, error: ordersError } = useCollection<Order>(ordersQuery);
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);
  
  const isInitialLoading = isProfileLoading || (user && !profile) || (ordersQuery && isOrdersLoading);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const handlePrintReceipt = (order: Order) => {
    toast({
      title: "Printing Receipt",
      description: `Generating document for Order #${order.id.slice(0,8).toUpperCase()}...`,
    });
  };

  const handleTriggerPayment = (order: Order) => {
    FirebaseService.requestPayment(db, order.id);
    toast({ 
      title: "Payment Requested", 
      description: `A prompt has been sent to ${order.customerName}. Status is now 'Pending Approval'.` 
    });
  };

  const handleOpenPinDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsPinDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    if (pin.length < 4) {
      toast({ variant: "destructive", title: "Invalid PIN", description: "Please enter your 4-digit M-Pesa PIN." });
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      FirebaseService.confirmPayment(db, selectedOrder.id);
      setIsProcessingPayment(false);
      setIsPinDialogOpen(false);
      setPin('');
      toast({ title: "Payment Successful", description: `You have successfully paid KES ${(selectedOrder.total || selectedOrder.totalAmount).toLocaleString()}.` });
    }, 2000);
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
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields." });
      return;
    }

    const selectedProduct = products?.find(p => p.id === newOrder.productId);
    
    FirebaseService.addManualOrder(db, user.uid, {
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      deliveryLocation: newOrder.deliveryLocation,
      totalAmount: newOrder.amount,
      items: [{
        productId: newOrder.productId,
        productName: selectedProduct?.name || 'Manual Item',
        quantity: newOrder.quantity,
        priceAtOrder: selectedProduct?.price || 0
      }]
    });

    setIsOrderDialogOpen(false);
    setNewOrder({ customerName: '', customerPhone: '', deliveryLocation: '', productId: '', quantity: 1, amount: 0 });
    toast({ title: "Order Created", description: `Order for ${newOrder.customerName} has been recorded.` });
  };

  const isSeller = profile?.role === 'seller';

  return (
    <RoleGuard allowedRoles={['seller', 'customer']}>
      <Shell userRole={isSeller ? "seller" : "customer"}>
        <PageHeader 
          title={isSeller ? "Order Management" : "My Order History"} 
          description={isSeller ? "Update fulfillment status and track payment compliance." : "Track your recent purchases and delivery status."}
          action={isSeller && (
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-11 shadow-lg shadow-slate-200">
                  <PlusCircle className="h-4 w-4" /> Create New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">New Direct Order</DialogTitle>
                  <DialogDescription>Quickly record manual DM or direct sales into your logs.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-500">Customer Info</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="name" 
                        placeholder="Full Name" 
                        className="pl-9 h-11 bg-slate-50 border-slate-100 rounded-xl"
                        value={newOrder.customerName}
                        onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Phone (07...)" 
                        className="pl-9 h-11 bg-slate-50 border-slate-100 rounded-xl"
                        value={newOrder.customerPhone}
                        onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Delivery Location" 
                        className="pl-9 h-11 bg-slate-50 border-slate-100 rounded-xl"
                        value={newOrder.deliveryLocation}
                        onChange={(e) => setNewOrder({...newOrder, deliveryLocation: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Select Item</Label>
                    <Select onValueChange={handleProductSelect}>
                      <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl">
                        <SelectValue placeholder={isProductsLoading ? "Loading inventory..." : "-- Select an item --"} />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id} className="py-3">
                            <div className="flex flex-col">
                              <span className="font-bold">{p.name}</span>
                              <span className="text-[10px] text-slate-400 uppercase">Stock: {p.currentStock} • KES {p.price.toLocaleString()}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase text-slate-500">Quantity</Label>
                      <Input 
                        type="number" min="1"
                        className="h-11 bg-slate-50 border-slate-100 rounded-xl"
                        value={newOrder.quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase text-slate-500">Total KES</Label>
                      <div className="h-11 flex items-center px-4 bg-teal-50 border border-teal-100 rounded-xl font-bold text-teal-600">
                        KES {newOrder.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateOrder} className="w-full h-12 bg-primary hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200">
                    Confirm & Sync Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        />

        <PermissionAwareCollection 
          isLoading={isInitialLoading} 
          error={ordersError} 
          data={orders || []} 
          collectionName="orders"
        >
          {(data) => (
            <Card className="border-none shadow-sm overflow-hidden min-h-[400px]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-primary text-white">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="font-bold pl-6 uppercase text-[10px] tracking-widest text-teal-400">Order ID</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">{isSeller ? "Customer" : "Items"}</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">Payment</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">Status</TableHead>
                      <TableHead className="font-bold text-right pr-6 uppercase text-[10px] tracking-widest text-slate-200">Total</TableHead>
                      <TableHead className="pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((order: Order) => (
                      <TableRow key={order.id} className="border-slate-100 group">
                        <TableCell className="font-bold text-slate-900 pl-6">{order.id.slice(0, 8).toUpperCase()}</TableCell>
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
                          KES {(order.total || order.totalAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center justify-end gap-2">
                            {isSeller ? (
                               order.paymentStatus === 'unpaid' ? (
                                 <Button size="sm" variant="outline" className="h-8 border-teal-200 text-teal-700 bg-teal-50 font-bold px-3" onClick={() => handleTriggerPayment(order)}>
                                   <Smartphone className="h-3.5 w-3.5 mr-2" /> Pay
                                 </Button>
                               ) : order.paymentStatus === 'paid' ? (
                                 <Button size="sm" variant="outline" className="h-8 border-teal-200 text-teal-700 font-bold px-3" onClick={() => handlePrintReceipt(order)}>
                                   <Printer className="h-3.5 w-3.5" /> Receipt
                                 </Button>
                               ) : <span className="text-[10px] font-bold text-blue-600 animate-pulse uppercase">Awaiting Client</span>
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
          <DialogContent className="sm:max-w-[400px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Lock className="h-5 w-5 text-teal-600" /> M-Pesa Auth
              </DialogTitle>
              <DialogDescription>Confirm payment of <strong>KES {(selectedOrder?.total || selectedOrder?.totalAmount || 0).toLocaleString()}</strong>.</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <Label className="text-xs font-bold uppercase text-slate-400 tracking-widest block text-center">Enter M-Pesa PIN</Label>
              <Input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="****" className="h-14 text-center text-2xl tracking-[1em] bg-slate-50 border-none rounded-2xl" />
            </div>
            <DialogFooter>
              <Button className="w-full h-12 bg-primary text-white font-bold rounded-2xl" onClick={handleConfirmPayment} disabled={isProcessingPayment}>
                {isProcessingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Authorize & Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Shell>
    </RoleGuard>
  );
}
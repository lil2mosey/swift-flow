'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Smartphone, 
  Loader2, 
  ShoppingBag, 
  CreditCard, 
  AlertCircle,
  Plus,
  Minus,
  MessageSquare,
  Send
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerProducts } from '@/hooks/use-customer-data';
import { cn } from '@/lib/utils';
import { ChatMessage, Product } from '@/lib/types';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function ShopPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [cart, setCart] = useState<{ id: string, name: string, price: number, quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatQuery = useMemoFirebase(() => {
    if (!activeConvId) return null;
    return FirebaseService.getChatMessagesQuery(db, activeConvId);
  }, [db, activeConvId]);

  const { data: messages } = useCollection<ChatMessage>(chatQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const { products, isLoading: isProductsLoading } = useCustomerProducts(24);

  const updateItemQty = (id: string, delta: number, max: number) => {
    if (max <= 0) {
       toast({ variant: "destructive", title: "Out of Stock", description: "This item is currently unavailable." });
       return;
    }
    setItemQuantities(prev => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(max, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const addToCart = (product: any) => {
    const qty = itemQuantities[product.id] || 1;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = Math.min(product.currentStock, existing.quantity + qty);
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQty } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: qty }];
    });

    toast({ title: "Added to Cart", description: `${qty}x ${product.name} added.` });
  };

  const handleChatWithSeller = async (product: Product) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to chat with the workshop." });
      return;
    }
    setChatProduct(product);
    setIsChatOpen(true);
    const convId = await FirebaseService.findOrCreateConversation(
      db, 
      user.uid, 
      product.sellerId || 'system-seller', 
      product,
      profile?.fullName || user.email?.split('@')[0] || 'Customer'
    );
    setActiveConvId(convId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !user || !newMessage.trim()) return;
    const senderName = profile?.fullName || user.email?.split('@')[0] || 'Customer';
    FirebaseService.sendChatMessage(db, activeConvId, user.uid, senderName, newMessage, false);
    setNewMessage('');
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleMpesaCheckout = async () => {
    if (cart.length === 0) return;

    if (!user) {
      // Synchronized Guest Flow: Save order intent and redirect to login
      const pendingOrder = {
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          priceAtOrder: item.price
        })),
        totalAmount: cartTotal,
        customerPhone: phoneNumber,
      };
      
      localStorage.setItem('swiftflow_pending_order', JSON.stringify(pendingOrder));
      toast({ 
        title: "Account Required", 
        description: "Please sign in to complete your synchronization." 
      });
      router.push('/login');
      return;
    }

    setIsProcessing(true);
    try {
      await FirebaseService.addManualOrder(db, 'system-seller', {
        customerId: user.uid,
        customerName: profile?.fullName || user.email?.split('@')[0] || 'Customer',
        customerPhone: phoneNumber,
        deliveryLocation: 'Online Storefront',
        totalAmount: cartTotal,
        paymentStatus: 'unpaid',
        status: 'pending',
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          priceAtOrder: item.price
        }))
      });
      setCart([]);
      setIsCheckoutOpen(false);
      toast({ title: "Order Submitted!", description: "Synchronized with your portal." });
      router.push('/orders');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Shell userRole={profile?.role || 'customer'}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <PageHeader 
          title="SwiftFlow Store" 
          description="Exclusive jewelry catalog."
          action={
            <Button 
              className="relative gap-2 bg-primary text-white font-bold rounded-xl h-11 px-4 sm:px-6 shadow-md"
              onClick={() => setIsCheckoutOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Checkout</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {isProductsLoading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)
          ) : products.map((product) => {
            const isLowStock = product.currentStock <= (product.lowStockThreshold || 5);
            const selectedQty = itemQuantities[product.id] || 1;
            
            return (
              <Card key={product.id} className="border-none shadow-sm overflow-hidden group bg-white rounded-2xl transition-all hover:shadow-md relative">
                {isLowStock && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-rose-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg animate-pulse">
                      <AlertCircle className="h-3 w-3" />
                      Low Stock
                    </div>
                  </div>
                )}
                <div className="relative aspect-square w-full">
                  <Image 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    data-ai-hint="jewelry diamond"
                  />
                  <div className="absolute top-2 right-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleChatWithSeller(product)}
                      className="bg-white/90 rounded-full h-8 w-8 sm:h-9 sm:w-9 shadow-sm hover:text-teal-600"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardHeader className="p-4 pb-1">
                  <CardTitle className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <div className="text-base sm:text-lg font-bold text-slate-900">KES {product.price.toLocaleString()}</div>
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateItemQty(product.id, -1, product.currentStock)} disabled={selectedQty <= 1}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-bold w-4 text-center">{selectedQty}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateItemQty(product.id, 1, product.currentStock)} disabled={selectedQty >= product.currentStock}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    onClick={() => addToCart(product)}
                    className="w-full bg-primary hover:bg-slate-800 text-white text-xs font-bold gap-2 h-10 rounded-xl"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[450px] p-0 border-none bg-slate-50 flex flex-col h-full shadow-2xl">
          <div className="bg-[#0f172a] p-6 sm:p-8 pb-4 sm:pb-6 text-white border-b border-slate-800">
            <SheetHeader>
              <div className="flex items-center gap-3 mb-1 sm:mb-2">
                <div className="p-2 bg-teal-400/10 rounded-xl">
                  <MessageSquare className="h-5 w-5 text-teal-400" />
                </div>
                <SheetTitle className="text-xl sm:text-2xl font-bold text-white">Workshop Chat</SheetTitle>
              </div>
              <SheetDescription className="text-slate-400 text-xs sm:text-sm font-medium">
                Ask about <span className="text-teal-400 font-bold">{chatProduct?.name}</span>
              </SheetDescription>
            </SheetHeader>
          </div>

          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {messages?.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[85%] sm:max-w-[80%]",
                  msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                )}>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-widest px-1">
                    {msg.senderName}
                  </span>
                  <div className={cn(
                    "p-3 sm:p-4 rounded-2xl text-xs sm:text-sm font-medium shadow-sm",
                    msg.senderId === user?.uid 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                    {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : 'Syncing...'}
                  </span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type question..."
                className="flex-1 h-11 sm:h-12 bg-slate-50 border-none rounded-xl font-medium px-4 sm:px-6 text-sm"
              />
              <Button type="submit" disabled={!newMessage.trim()} className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-primary text-white shadow-lg shadow-slate-200">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="w-[95%] sm:max-w-[450px] p-0 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-2xl mx-auto">
          <div className="bg-[#0f172a] p-6 sm:p-8 pb-4 sm:pb-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl sm:text-3xl font-bold">Checkout</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs sm:text-sm font-medium">Verify your jewelry selection.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 sm:px-8 py-4 sm:py-6 max-h-[300px] overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl mb-2">
                <div>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{item.name}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-teal-600 text-xs sm:text-sm">KES {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <DialogFooter className="p-6 sm:p-8 pt-0 bg-white">
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center px-4 py-3 bg-teal-50 rounded-xl border border-teal-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
                <span className="text-lg sm:text-xl font-bold text-teal-600">KES {cartTotal.toLocaleString()}</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">M-Pesa Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500" />
                  <Input 
                    placeholder="07XX XXX XXX" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 sm:h-14 bg-slate-50 border-none rounded-2xl pl-12 text-base sm:text-lg font-bold" 
                  />
                </div>
              </div>
              <Button 
                onClick={handleMpesaCheckout}
                disabled={isProcessing || cart.length === 0}
                className="w-full h-12 sm:h-14 bg-primary text-white font-bold rounded-2xl shadow-xl"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : user ? "Confirm Order" : "Login to Place Order"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

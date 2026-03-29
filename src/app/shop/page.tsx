
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Heart, 
  Smartphone, 
  Loader2, 
  X, 
  ShoppingBag, 
  Package, 
  UserPlus, 
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
import { useUser, useFirestore, useAuth, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Skeleton } from '@/components/ui/skeleton';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useCustomerProducts } from '@/hooks/use-customer-data';
import { cn } from '@/lib/utils';
import { ChatMessage, Product } from '@/lib/types';
import { format } from 'date-fns';

export default function ShopPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [cart, setCart] = useState<{ id: string, name: string, price: number, quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Real-time chat messages
  const chatQuery = useMemoFirebase(() => {
    if (!activeConvId) return null;
    return FirebaseService.getChatMessagesQuery(db, activeConvId);
  }, [db, activeConvId]);

  const { data: messages } = useCollection<ChatMessage>(chatQuery);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const { products, isLoading: isProductsLoading, error: productsError } = useCustomerProducts(24);

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
    if (qty > product.currentStock) {
      toast({ variant: "destructive", title: "Quantity Restricted", description: `Only ${product.currentStock} units available.` });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = Math.min(product.currentStock, existing.quantity + qty);
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQty } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: qty }];
    });

    toast({ title: "Added to Cart", description: `${qty}x ${product.name} ready for checkout.` });
    setItemQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const handleChatWithSeller = async (product: Product) => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }

    setChatProduct(product);
    setIsChatOpen(true);
    
    try {
      const convId = await FirebaseService.findOrCreateConversation(
        db, 
        user.uid, 
        product.sellerId || 'system-seller', 
        product,
        profile?.fullName || user.email?.split('@')[0] || 'Customer'
      );
      setActiveConvId(convId);
    } catch (e) {
      toast({ variant: "destructive", title: "Chat Error", description: "Could not connect to the workshop." });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !user || !newMessage.trim()) return;

    FirebaseService.sendChatMessage(db, activeConvId, user.uid, newMessage);
    setNewMessage('');
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleMpesaCheckout = async () => {
    if (!user) { setIsAuthDialogOpen(true); return; }
    if (!phoneNumber) { toast({ variant: "destructive", title: "Phone Required", description: "Please enter your M-Pesa number." }); return; }
    
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
      toast({ title: "Order Submitted!", description: "Check your orders to complete payment." });
    } catch (error) {
      toast({ variant: "destructive", title: "Checkout Failed", description: "Please try again later." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Shell userRole={profile?.role || 'customer'}>
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader 
          title="SwiftFlow Store" 
          description="Your exclusive collection, instantly available."
          action={
            <Button 
              className="relative gap-2 bg-primary text-white font-bold rounded-xl h-11 px-6 shadow-md"
              onClick={() => setIsCheckoutOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              Checkout
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isProductsLoading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)
          ) : products.map((product) => {
            const isLowStock = product.currentStock <= (product.lowStockThreshold || 5);
            const selectedQty = itemQuantities[product.id] || 1;
            
            return (
              <Card key={product.id} className="border-none shadow-sm overflow-hidden group bg-white rounded-2xl transition-all hover:shadow-md relative">
                {isLowStock && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg animate-pulse">
                      <AlertCircle className="h-3 w-3" />
                      Low Stock: {product.currentStock} left!
                    </div>
                  </div>
                )}
                <div className="relative aspect-square w-full">
                  <Image 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleChatWithSeller(product)}
                      className="bg-white/90 rounded-full h-9 w-9 shadow-sm hover:text-teal-600"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardHeader className="p-4 pb-1">
                  <CardTitle className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-teal-600">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-lg font-bold text-slate-900">KES {product.price.toLocaleString()}</div>
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
                    className="w-full bg-primary hover:bg-slate-800 text-white text-xs font-bold gap-2 h-10 rounded-xl transition-all"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Slide-out Chat Drawer */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent side="right" className="sm:max-w-[450px] p-0 border-none bg-slate-50 flex flex-col h-full shadow-2xl">
          <div className="bg-[#0f172a] p-8 pb-6 text-white border-b border-slate-800">
            <SheetHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-400/10 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-teal-400" />
                </div>
                <SheetTitle className="text-2xl font-bold text-white">Inquiry Bridge</SheetTitle>
              </div>
              <SheetDescription className="text-slate-400 font-medium">
                Ask about <span className="text-teal-400 font-bold">{chatProduct?.name}</span>
              </SheetDescription>
            </SheetHeader>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {!messages || messages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic text-sm">
                  Start the conversation! The workshop will respond shortly.
                </div>
              ) : messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium shadow-sm",
                    msg.senderId === user?.uid 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                    {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : 'Syncing...'}
                  </span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 h-12 bg-slate-50 border-none rounded-xl font-medium px-6 focus-visible:ring-1 focus-visible:ring-teal-400"
              />
              <Button type="submit" disabled={!newMessage.trim()} className="h-12 w-12 rounded-xl bg-primary text-white shadow-lg shadow-slate-200">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Standard Modals (Checkout & Auth) - Omitted for brevity but assumed present */}
    </Shell>
  );
}

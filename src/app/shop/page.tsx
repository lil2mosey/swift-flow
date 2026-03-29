'use client';

import React, { useState } from 'react';
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
  Minus
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
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useAuth, setDocumentNonBlocking } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Skeleton } from '@/components/ui/skeleton';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useCustomerProducts } from '@/hooks/use-customer-data';
import { cn } from '@/lib/utils';

export default function ShopPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [cart, setCart] = useState<{ id: string, name: string, price: number, quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Local state for quantities per product card
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // Real-time jewelry catalog from inventory
  const { products, isLoading: isProductsLoading, error: productsError } = useCustomerProducts(24);

  const updateItemQty = (id: string, delta: number, max: number) => {
    if (max <= 0) {
       toast({ variant: "destructive", title: "Out of Stock", description: "This item is currently unavailable." });
       return;
    }
    setItemQuantities(prev => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(max, current + delta));
      
      if (current + delta > max) {
        toast({ 
          title: "Stock Limit Reached", 
          description: `We only have ${max} units available. This is the maximum you can order.`,
          variant: "destructive"
        });
      }
      
      return { ...prev, [id]: next };
    });
  };

  const addToCart = (product: any) => {
    const qty = itemQuantities[product.id] || 1;
    
    // Safety check against inventory
    if (qty > product.currentStock) {
      toast({ 
        variant: "destructive", 
        title: "Quantity Restricted", 
        description: `Only ${product.currentStock} units available. Adjusting to max.` 
      });
      const validQty = product.currentStock;
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item => item.id === product.id ? { ...item, quantity: validQty } : item);
        }
        return [...prev, { id: product.id, name: product.name, price: product.price, quantity: validQty }];
      });
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

    toast({
      title: "Added to Cart",
      description: `${qty}x ${product.name} ready for checkout.`,
    });
    // Reset local quantity counter
    setItemQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const handleQuickBuy = async (product: any) => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    const qty = itemQuantities[product.id] || 1;

    // Safety check against inventory
    if (qty > product.currentStock) {
      toast({ 
        variant: "destructive", 
        title: "Quantity Restricted", 
        description: `Maximum available quantity for this item is ${product.currentStock}.` 
      });
      return;
    }

    setIsProcessing(true);
    try {
      await FirebaseService.placeOrder(db, user.uid, profile?.fullName || user.email?.split('@')[0] || 'Customer', product, qty);
      toast({
        title: "Order Placed!",
        description: `Your order for ${qty}x ${product.name} has been synchronized.`,
      });
      setItemQuantities(prev => ({ ...prev, [product.id]: 1 }));
    } catch (error) {
      toast({ variant: "destructive", title: "Order Failed", description: "Could not process order." });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleMpesaCheckout = async () => {
    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Cart is empty." });
      return;
    }

    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Phone Required", description: "Please enter your M-Pesa number." });
      return;
    }

    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    await proceedWithOrder(user.uid, profile?.fullName || user.email?.split('@')[0] || 'Customer');
  };

  const handleGuestRegistrationAndOrder = async () => {
    if (!authData.email || !authData.password || !authData.fullName) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please fill in all details to continue." });
      return;
    }

    setIsProcessing(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
      const uid = userCredential.user.uid;
      
      const nameParts = authData.fullName.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Member';

      const newProfile = {
        id: uid,
        authSystemId: uid,
        email: authData.email,
        firstName,
        lastName,
        fullName: authData.fullName,
        role: 'customer' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const profileRef = doc(db, 'userProfiles', uid);
      await setDocumentNonBlocking(profileRef, newProfile, { merge: true });

      setIsAuthDialogOpen(false);
      await proceedWithOrder(uid, authData.fullName);
      
    } catch (error: any) {
      setIsProcessing(false);
      toast({ variant: "destructive", title: "Registration Failed", description: error.message || "Could not create account." });
    }
  };

  const proceedWithOrder = async (uid: string, customerName: string) => {
    setIsProcessing(true);
    try {
      await FirebaseService.addManualOrder(db, 'system-seller', {
        customerId: uid,
        customerName: customerName,
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

      setTimeout(() => {
        setIsProcessing(false);
        setIsCheckoutOpen(false);
        setCart([]);
        toast({
          title: "Order Submitted!",
          description: "Syncing with seller dashboard. Awaiting payment notification.",
        });
      }, 1500);
    } catch (error) {
      setIsProcessing(false);
      toast({ variant: "destructive", title: "Checkout Failed", description: "Please try again later." });
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

        {productsError ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="p-4 bg-rose-50 rounded-2xl w-fit mx-auto mb-4">
              <Package className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Connection Interrupted</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto italic font-medium">
              We're having trouble reaching the catalog. Please check your connection and try again.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="mt-8 bg-primary hover:bg-slate-800 text-white font-bold h-11 px-8 rounded-xl"
            >
              Retry Loading
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {isProductsLoading && products.length === 0 ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </Card>
              ))
            ) : products.length === 0 && !isProductsLoading ? (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
                <div className="flex flex-col items-center gap-4 text-slate-400 p-12">
                  <Package className="h-12 w-12 opacity-20" />
                  <p className="font-bold text-slate-500">Our catalog is being updated. Check back soon!</p>
                  <p className="text-xs italic">Syncing live inventory from the workshop...</p>
                </div>
              </div>
            ) : (
              <>
                {products.map((product) => {
                  const isLowStock = product.currentStock <= (product.lowStockThreshold || 5);
                  const selectedQty = itemQuantities[product.id] || 1;
                  const isAtMax = selectedQty >= product.currentStock;
                  
                  return (
                    <Card key={product.id} className="border-none shadow-sm overflow-hidden group bg-white rounded-2xl transition-all hover:shadow-md relative">
                      {isLowStock && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            Low Stock - Only {product.currentStock} left!
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
                          <Button size="icon" variant="ghost" className="bg-white/90 rounded-full h-8 w-8 shadow-sm">
                            <Heart className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className="text-[10px] font-bold bg-white/90 text-teal-600 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                            {product.category}
                          </span>
                        </div>
                      </div>
                      <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-teal-600 transition-colors">
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between items-center">
                          <div className="text-lg font-bold text-slate-900">
                            KES {product.price.toLocaleString()}
                          </div>
                          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-md hover:bg-white"
                              onClick={() => updateItemQty(product.id, -1, product.currentStock)}
                              disabled={selectedQty <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-bold w-4 text-center">{selectedQty}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn("h-6 w-6 rounded-md hover:bg-white", isAtMax && "opacity-30")}
                              onClick={() => updateItemQty(product.id, 1, product.currentStock)}
                              disabled={isAtMax}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium flex justify-between">
                          <span>SKU: {product.sku}</span>
                          <span className="font-bold text-teal-600">Stock: {product.currentStock}</span>
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                        <Button 
                          onClick={() => addToCart(product)}
                          className="w-full bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-900 text-xs font-bold gap-2 h-10 border-none shadow-none rounded-xl transition-all"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                        </Button>
                        <Button 
                          onClick={() => handleQuickBuy(product)}
                          className="w-full bg-primary hover:bg-slate-800 text-white text-xs font-bold gap-2 h-10 rounded-xl transition-all"
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CreditCard className="h-3.5 w-3.5" /> Buy Now</>}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-teal-50/50 p-8 border-b border-teal-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <ShoppingBag className="h-6 w-6 text-teal-600" />
                Your Selection
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Orders sync instantly with our logistics team.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8">
            <ScrollArea className="max-h-[280px] pr-4 mb-6">
              <div className="space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium italic">
                    Your cart is empty
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Qty: {item.quantity} × KES {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-teal-600">KES {(item.price * item.quantity).toLocaleString()}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-full" onClick={() => removeFromCart(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {cart.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="text-2xl font-bold text-slate-900">KES {cartTotal.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="checkout-phone" className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">M-Pesa Number for STK Push</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500" />
                    <Input 
                      id="checkout-phone" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)} 
                      placeholder="07XXXXXXXX"
                      className="pl-12 bg-slate-50/70 border-none h-12 rounded-xl text-slate-900 font-bold focus-visible:ring-1 focus-visible:ring-teal-300"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-slate-800 text-white font-bold h-14 gap-2 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                  onClick={handleMpesaCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Submit Order • KES {cartTotal.toLocaleString()}</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Guest Auth Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#0f172a] p-8 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <UserPlus className="h-6 w-6 text-teal-400" />
                Join SwiftFlow
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">
                Create a quick account to track your orders and earn loyalty points.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Full Name</Label>
              <Input 
                placeholder="John Doe" 
                className="bg-slate-50 h-11 border-none rounded-xl"
                value={authData.fullName}
                onChange={(e) => setAuthData({...authData, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Email Address</Label>
              <Input 
                type="email" 
                placeholder="name@example.com" 
                className="bg-slate-50 h-11 border-none rounded-xl"
                value={authData.email}
                onChange={(e) => setAuthData({...authData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Create Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-slate-50 h-11 border-none rounded-xl"
                value={authData.password}
                onChange={(e) => setAuthData({...authData, password: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 bg-slate-50/50">
            <Button 
              className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 rounded-xl transition-all"
              onClick={handleGuestRegistrationAndOrder}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register & Complete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

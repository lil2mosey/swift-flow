"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser, setDocumentNonBlocking } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { BrandLoader } from '@/components/layout/BrandLoader';
import { FirebaseService } from '@/services/firebase-service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading, profile, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (user && profile) {
      const pendingOrderStr = localStorage.getItem('swiftflow_pending_order');
      if (pendingOrderStr) {
        try {
          const pendingOrder = JSON.parse(pendingOrderStr);
          FirebaseService.addManualOrder(firestore, 'system-seller', {
            customerId: user.uid,
            customerName: profile.fullName || profile.firstName || user.email?.split('@')[0] || 'Customer',
            customerPhone: pendingOrder.customerPhone,
            deliveryLocation: 'Online Storefront',
            totalAmount: pendingOrder.totalAmount,
            paymentStatus: 'unpaid',
            status: 'pending',
            items: pendingOrder.items
          });
          localStorage.removeItem('swiftflow_pending_order');
          toast({ title: "Order Synced", description: "Your items have been added to your profile." });
          router.push('/orders');
          return;
        } catch (e) {
          localStorage.removeItem('swiftflow_pending_order');
        }
      }

      if (profile.role === 'seller') {
        router.push('/dashboard');
      } else {
        router.push('/shop');
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading, router, firestore]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setIsLoading(false);
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.message || "Invalid credentials." 
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent, role: 'seller' | 'customer') => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please fill in all fields." });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Member';

      const profileRef = doc(firestore, 'userProfiles', uid);
      
      await setDocumentNonBlocking(profileRef, {
        id: uid,
        authSystemId: uid,
        email,
        firstName,
        lastName,
        fullName,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
    } catch (error: any) {
      setIsLoading(false);
      toast({ 
        variant: "destructive", 
        title: "Registration Failed", 
        description: error.message || "Could not create account." 
      });
    }
  };

  if (isUserLoading || (user && isProfileLoading) || isLoading) {
    return <BrandLoader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-900">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f172a] text-teal-400 mb-4 shadow-2xl ring-4 ring-white">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">SwiftFlow</h1>
          <p className="text-slate-500 font-medium italic">order management and inventory tracking</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl">
            <TabsTrigger value="login" className="rounded-xl font-bold py-2.5">Login</TabsTrigger>
            <TabsTrigger value="register" className="rounded-xl font-bold py-2.5">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden">
              <form onSubmit={handleSignIn}>
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription className="text-slate-400 font-medium text-xs uppercase tracking-widest leading-relaxed">Enterprise Command Center</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 px-8 pb-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-50 h-14 border-none rounded-2xl font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-slate-50 h-14 border-none rounded-2xl pr-12 font-medium" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-teal-500 transition-colors">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-8 pb-8">
                  <Button type="submit" className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">Sign In to Portal</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pt-8 px-8">
                <CardTitle className="text-2xl font-bold">New Account</CardTitle>
                <CardDescription className="text-slate-400 font-medium text-xs uppercase tracking-widest leading-relaxed">Join the ecosystem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-8 pb-8">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</Label>
                  <Input placeholder="E.g. Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-slate-50 h-14 border-none rounded-2xl font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Email</Label>
                  <Input type="email" placeholder="E.g. jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-50 h-14 border-none rounded-2xl font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-slate-50 h-14 border-none rounded-2xl pr-12 font-medium" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-teal-500 transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 px-8 pb-8">
                <Button onClick={(e) => handleSignUp(e, 'seller')} className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">Start as Seller</Button>
                <Button onClick={(e) => handleSignUp(e, 'customer')} variant="outline" className="w-full h-14 border-slate-200 font-bold rounded-2xl hover:bg-slate-50">Join as Customer</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

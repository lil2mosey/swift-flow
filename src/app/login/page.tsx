"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser, setDocumentNonBlocking } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { BrandLoader } from '@/components/layout/BrandLoader';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading, profile, isProfileLoading } = useUser();
  const router = useRouter();

  // Unified redirect logic
  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (user && profile) {
      if (profile.role === 'seller') {
        router.push('/dashboard');
      } else {
        router.push('/shop');
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
          <p className="text-slate-500 font-medium italic">Order Management and Inventory Tracking</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl">
            <TabsTrigger value="login" className="rounded-xl font-bold py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Login</TabsTrigger>
            <TabsTrigger value="register" className="rounded-xl font-bold py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] bg-white overflow-hidden">
              <form onSubmit={handleSignIn}>
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription className="text-slate-400 font-medium">Access your synchronized command center.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 px-8 pb-8">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Work Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="bg-slate-50 h-14 border-none rounded-2xl px-4 focus-visible:ring-teal-500 font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Secure Password</Label>
                    <div className="relative group">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="bg-slate-50 h-14 border-none rounded-2xl px-4 pr-12 focus-visible:ring-teal-500 font-medium" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-teal-500 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-8 pb-8">
                  <Button type="submit" className="w-full h-14 bg-[#0f172a] hover:bg-slate-800 text-white font-bold gap-3 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                    <LogIn className="h-5 w-5 text-teal-400" /> Sign In to Portal
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pt-8 px-8">
                <CardTitle className="text-2xl font-bold">New Account</CardTitle>
                <CardDescription className="text-slate-400 font-medium">Join the SwiftFlow synchronization ecosystem.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-8 pb-8">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="John Doe" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    required 
                    className="bg-slate-50 h-14 border-none rounded-2xl px-4 focus-visible:ring-teal-500 font-medium" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Work Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="bg-slate-50 h-14 border-none rounded-2xl px-4 focus-visible:ring-teal-500 font-medium" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Create Password</Label>
                  <div className="relative group">
                    <Input 
                      id="reg-password" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="bg-slate-50 h-14 border-none rounded-2xl px-4 pr-12 focus-visible:ring-teal-500 font-medium" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-teal-500 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 px-8 pb-8">
                <Button onClick={(e) => handleSignUp(e, 'seller')} className="w-full h-14 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                  Start as Seller (Admin)
                </Button>
                <Button onClick={(e) => handleSignUp(e, 'customer')} variant="outline" className="w-full h-14 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                  Join as Customer (Storefront)
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
            Enterprise Secure Environment
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser, setDocumentNonBlocking } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { BrandLoader } from '@/components/layout/BrandLoader';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading, profile, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (user && profile) {
      if (profile.role === 'seller') {
        router.push('/dashboard');
      } else if (profile.role === 'customer') {
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
      
      // We await this specific write to ensure the profile is created before the page redirects
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
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-teal-400 mb-4 shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SwiftFlow</h1>
          <p className="text-slate-500 mt-2 font-medium">Logistics & Order Management</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg">Login</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-none shadow-xl rounded-2xl bg-white">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to access the portal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-50 h-11 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-slate-50 h-11 border-none rounded-xl" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full h-12 bg-primary text-white font-bold gap-2 rounded-xl">
                    <LogIn className="h-4 w-4" /> Sign In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-none shadow-xl rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Create Account</CardTitle>
                <CardDescription>Select your primary role to get started.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-slate-50 h-11 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-50 h-11 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-slate-50 h-11 border-none rounded-xl" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button onClick={(e) => handleSignUp(e, 'seller')} className="w-full h-12 bg-primary text-white font-bold rounded-xl">
                  Join as Seller (Admin)
                </Button>
                <Button onClick={(e) => handleSignUp(e, 'customer')} variant="outline" className="w-full h-12 border-slate-200 text-slate-700 font-bold rounded-xl">
                  Join as Customer (Storefront)
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

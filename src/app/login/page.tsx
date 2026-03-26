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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading, profile, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !isUserLoading && profile && !isProfileLoading) {
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
        description: error.message || "Invalid credentials. Please try again.",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent, role: 'seller' | 'customer') => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Member';

      const profileRef = doc(firestore, 'userProfiles', uid);
      setDocumentNonBlocking(profileRef, {
        id: uid,
        authSystemId: uid,
        email,
        firstName,
        lastName,
        fullName, // Keep for UI convenience
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error: any) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create account.",
      });
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-teal-400 mb-4 shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SwiftFlow</h1>
          <p className="text-slate-500 mt-2 font-medium">Enter your shared portal credentials</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-none shadow-xl rounded-2xl">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle className="text-xl">Welcome Back</CardTitle>
                  <CardDescription>Single core auth for all roles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      className="bg-slate-50 h-11 rounded-xl border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      className="bg-slate-50 h-11 rounded-xl border-none"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full h-12 bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Enter Portal
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-none shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Create Account</CardTitle>
                <CardDescription>Choose your role to get started.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="John Doe" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-50 h-11 rounded-xl border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="bg-slate-50 h-11 rounded-xl border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="bg-slate-50 h-11 rounded-xl border-none"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  onClick={(e) => handleSignUp(e, 'seller')} 
                  className="w-full h-12 bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl" 
                  disabled={isLoading}
                >
                  Join as Seller (Admin)
                </Button>
                <Button 
                  onClick={(e) => handleSignUp(e, 'customer')} 
                  variant="outline"
                  className="w-full h-12 border-slate-200 text-slate-700 font-bold gap-2 rounded-xl" 
                  disabled={isLoading}
                >
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

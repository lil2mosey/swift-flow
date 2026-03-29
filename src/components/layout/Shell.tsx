"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  MessageSquare, 
  LogOut,
  Menu,
  X,
  CreditCard,
  User as UserIcon,
  ShieldCheck,
  ShoppingBag,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

interface ShellProps {
  children: React.ReactNode;
  userRole?: 'seller' | 'customer';
}

export function Shell({ children, userRole }: ShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isUserLoading, isProfileLoading } = useUser();
  const auth = useAuth();

  // Define public routes that don't require authentication
  const isPublicRoute = pathname === '/shop' || pathname === '/' || pathname === '/login';

  useEffect(() => {
    if (!isUserLoading && !user && !isPublicRoute) {
      router.push('/login');
    }
  }, [user, isUserLoading, pathname, router, isPublicRoute]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const sellerNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ClipboardList },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  const customerNav = [
    { name: 'Shop', href: '/shop', icon: ShoppingBag },
    { name: 'My Orders', href: '/orders', icon: ClipboardList },
    { name: 'Chat', href: '/messages', icon: MessageSquare },
  ];

  // For guests, we show the customer nav but restricted
  const activeRole = userRole || profile?.role || 'customer';
  const navItems = activeRole === 'seller' ? sellerNav : customerNav;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 z-[100] h-16 bg-[#0f172a] text-white flex items-center justify-between px-6 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white hover:bg-slate-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-400" />
            Swift<span className="text-teal-400">Flow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider transition-colors hover:text-teal-400 flex items-center gap-2",
                  pathname === item.href ? "text-teal-400" : "text-slate-400"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                <UserIcon className="h-3 w-3 text-teal-400" />
                <span className="text-[10px] font-bold text-slate-300 truncate max-w-[80px] uppercase">
                  {isProfileLoading ? <Skeleton className="h-3 w-16 bg-slate-700" /> : (profile?.fullName || user?.email?.split('@')[0] || 'Guest')}
                </span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="secondary" 
                size="sm" 
                className="bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border-none h-8 w-8 p-0 rounded-full"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" className="text-teal-400 font-bold text-xs uppercase gap-2 hover:bg-slate-800">
              <Link href="/login">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="max-w-[1200px] mx-auto px-6">
          {children}
        </div>
      </main>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-[#0f172a] pt-20 px-8 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-4 py-5 text-xl font-bold uppercase tracking-widest border-b border-slate-800 transition-colors",
                  pathname === item.href ? "text-teal-400" : "text-white"
                )}
              >
                <item.icon className="h-6 w-6" />
                {item.name}
              </Link>
            ))}
            {user ? (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-4 py-5 text-xl font-bold uppercase tracking-widest text-rose-500 border-b border-slate-800"
              >
                <LogOut className="h-6 w-6" />
                Sign Out
              </button>
            ) : (
              <Link 
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 py-5 text-xl font-bold uppercase tracking-widest text-teal-400 border-b border-slate-800"
              >
                <LogIn className="h-6 w-6" />
                Sign In
              </Link>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 left-6 text-white hover:bg-slate-800"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}

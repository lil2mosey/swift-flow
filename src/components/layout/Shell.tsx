
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
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

interface ShellProps {
  children: React.ReactNode;
  userRole?: 'seller' | 'customer';
}

export function Shell({ children, userRole }: ShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const sellerNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ClipboardList },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Payments', href: '/payments', icon: CreditCard },
  ];

  const customerNav = [
    { name: 'Storefront', href: '/dashboard', icon: ShoppingBag },
    { name: 'My Orders', href: '/orders', icon: ClipboardList },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  const activeRole = userRole || profile?.role || 'customer';
  const navItems = activeRole === 'seller' ? sellerNav : customerNav;

  if (isUserLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f172a] text-white flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
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
                  "text-sm font-medium transition-colors hover:text-teal-400 flex items-center gap-2",
                  pathname === item.href ? "text-white" : "text-slate-400"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
            <UserIcon className="h-3 w-3 text-teal-400" />
            <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">
              {profile?.fullName || user?.email?.split('@')[0] || 'Guest'}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-500/20 text-teal-400 rounded uppercase tracking-wider hidden sm:inline">
              {activeRole}
            </span>
          </div>
          <Button 
            onClick={handleLogout}
            variant="secondary" 
            size="sm" 
            className="bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border-none h-8 font-bold"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </header>

      <main className="pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">
          {children}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0f172a]/95 pt-20 px-6 md:hidden">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-lg font-medium text-slate-300 border-b border-slate-800"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

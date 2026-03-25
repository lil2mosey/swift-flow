
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  MessageSquare, 
  LogOut,
  Settings,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ShellProps {
  children: React.ReactNode;
  userRole?: 'seller' | 'customer';
}

export function Shell({ children, userRole = 'seller' }: ShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const sellerNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ClipboardList },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Payments', href: '/payments', icon: CreditCard },
  ];

  const customerNav = [
    { name: 'Shop', href: '/shop', icon: ShoppingCart },
    { name: 'My Orders', href: '/orders', icon: ClipboardList },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  const navItems = userRole === 'seller' ? sellerNav : customerNav;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
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
          <Link href="/" className="text-xl font-bold tracking-tight">
            Swift<span className="text-teal-400">Flow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-teal-400",
                  pathname === item.href ? "text-white" : "text-slate-400"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
            <span className="text-xs font-medium text-slate-300">musaa</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-500/20 text-teal-400 rounded uppercase tracking-wider">
              {userRole}
            </span>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border-none h-8 font-bold"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">
          {children}
        </div>
      </main>

      {/* Mobile Nav Overlay */}
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

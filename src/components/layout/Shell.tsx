
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShellProps {
  children: React.ReactNode;
  userRole?: 'seller' | 'customer';
}

export function Shell({ children, userRole = 'seller' }: ShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const sellerNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Orders', href: '/orders', icon: ClipboardList },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  const customerNav = [
    { name: 'Shop', href: '/shop', icon: ShoppingCart },
    { name: 'My Orders', href: '/orders', icon: ClipboardList },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  const navItems = userRole === 'seller' ? sellerNav : customerNav;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-primary text-primary-foreground border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
          <Link href="/" className="text-xl font-bold tracking-tight">
            musaa<span className="text-teal-accent">OrderFlow</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-teal-accent",
                pathname === item.href ? "text-teal-accent" : "text-slate-400"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs font-medium px-2 py-1 bg-slate-800 rounded uppercase tracking-wider text-slate-400">
            {userRole}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {children}
        </div>
      </main>

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-primary/95 pt-20 px-6 md:hidden">
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

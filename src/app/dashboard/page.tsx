
"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  MessageSquare,
  PlusCircle,
  Package,
  Mail,
  CreditCard,
  ArrowRight,
  Activity
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

const statusData = [
  { name: 'Pending', value: 30 },
  { name: 'Processing', value: 45 },
  { name: 'Shipped', value: 20 },
  { name: 'Completed', value: 55 },
];

const inventoryData = [
  { name: 'Stock A', value: 400 },
  { name: 'Stock B', value: 300 },
  { name: 'Stock C', value: 200 },
  { name: 'Stock D', value: 100 },
];

export default function DashboardPage() {
  const stats = [
    { label: 'Total Orders', value: '1', sub: 'Total', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pending Orders', value: '1', sub: 'PENDING', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Completed', value: '0', sub: 'COMPLETED', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Low Stock', value: '0', sub: 'LOW', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Revenue', value: 'KES 0', sub: 'REVENUE', icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Unread Messages', value: '3', sub: 'UNREAD', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <Shell userRole="seller">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          Welcome back, musaa! <span className="animate-bounce">👋</span>
        </h1>
        <p className="text-slate-500 font-medium">Here&apos;s what&apos;s happening with your store today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.sub}</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-[10px] text-slate-500 font-medium mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">4 available</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Button className="h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-200 shadow-lg border-none rounded-xl">
                <PlusCircle className="h-6 w-6" />
                <span className="text-xs font-bold">New Order</span>
              </Button>
              <Button className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700 shadow-green-200 shadow-lg border-none rounded-xl">
                <Package className="h-6 w-6" />
                <span className="text-xs font-bold">Add Stock</span>
              </Button>
              <Button className="h-24 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700 shadow-purple-200 shadow-lg border-none rounded-xl">
                <Mail className="h-6 w-6" />
                <span className="text-xs font-bold">View Messages</span>
              </Button>
              <Button className="h-24 flex flex-col gap-2 bg-orange-600 hover:bg-orange-700 shadow-orange-200 shadow-lg border-none rounded-xl">
                <CreditCard className="h-6 w-6" />
                <span className="text-xs font-bold">Payments</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Average Order Value</p>
                <p className="text-sm font-bold text-slate-900 mt-1">KES 0</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Completion Rate</p>
                <p className="text-sm font-bold text-slate-900 mt-1">0%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-none shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {[
                { label: 'New orders today', value: '0' },
                { label: 'Messages to reply', value: '3' },
                { label: 'Low stock items', value: '0' },
                { label: 'Pending payments', value: '1' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                  <span className="text-sm font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-slate-100 pt-4">
              <Button variant="link" className="text-blue-600 p-0 h-auto text-xs font-bold flex items-center justify-between w-full">
                View all orders <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <CardTitle className="text-base font-bold">Order Status Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statusData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Area type="monotone" dataKey="value" stroke="#22c55e" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <CardTitle className="text-base font-bold">Inventory Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

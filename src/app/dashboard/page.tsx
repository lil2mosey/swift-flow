
"use client";

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  PackageCheck, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const data = [
  { name: 'Mon', sales: 4000, orders: 24 },
  { name: 'Tue', sales: 3000, orders: 13 },
  { name: 'Wed', sales: 2000, orders: 98 },
  { name: 'Thu', sales: 2780, orders: 39 },
  { name: 'Fri', sales: 1890, orders: 48 },
  { name: 'Sat', sales: 2390, orders: 38 },
  { name: 'Sun', sales: 3490, orders: 43 },
];

export default function DashboardPage() {
  return (
    <Shell userRole="seller">
      <PageHeader 
        title="Seller Dashboard" 
        description="Overview of your business performance and inventory health."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 128,430.00</div>
            <p className="text-xs text-teal-500 font-medium flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +20.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Orders</CardTitle>
            <PackageCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-slate-500 font-medium flex items-center mt-1">
              12 pending shipment
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">856</div>
            <p className="text-xs text-teal-500 font-medium flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +4.5% since yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Low Stock Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">8</div>
            <p className="text-xs text-amber-500 font-medium mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#2dd4bf' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
            <Button variant="ghost" className="text-teal-600 text-xs font-bold">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 'ORD-7721', user: 'James Kimani', amount: 'KES 12,400', status: 'paid' },
                { id: 'ORD-7722', user: 'Sarah Wambui', amount: 'KES 5,200', status: 'unpaid' },
                { id: 'ORD-7723', user: 'David Otieno', amount: 'KES 8,900', status: 'paid' },
                { id: 'ORD-7724', user: 'Lucy Njeri', amount: 'KES 3,500', status: 'paid' },
              ].map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{order.user}</span>
                    <span className="text-xs text-slate-500">{order.id}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-teal-accent">{order.amount}</span>
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                      order.status === 'paid' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

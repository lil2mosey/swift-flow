
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { intelligentInventoryRecommendation } from '@/ai/flows/intelligent-inventory-recommendation';
import { type IntelligentInventoryRecommendationOutput } from '@/ai/flows/intelligent-inventory-recommendation';

const initialProducts = [
  { id: 'P001', name: 'Premium Espresso Beans', sku: 'COF-EPS-01', stock: 120, sales: 15.5, lead: 5, price: 2500 },
  { id: 'P002', name: 'Ceramic Pour Over Set', sku: 'ACC-PO-02', stock: 15, sales: 4.2, lead: 10, price: 4500 },
  { id: 'P003', name: 'Stainless Steel Tamper', sku: 'ACC-TMP-03', stock: 8, sales: 2.1, lead: 7, price: 3200 },
  { id: 'P004', name: 'Gooseneck Kettle', sku: 'ACC-KET-04', stock: 45, sales: 8.4, lead: 14, price: 8900 },
];

export default function InventoryPage() {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<IntelligentInventoryRecommendationOutput | null>(null);

  const getAiRecommendations = async () => {
    setIsAiLoading(true);
    try {
      const input = {
        products: initialProducts.map(p => ({
          productId: p.id,
          productName: p.name,
          currentStock: p.stock,
          averageDailySales: p.sales,
          leadTimeDays: p.lead,
        }))
      };
      const result = await intelligentInventoryRecommendation(input);
      setRecommendations(result);
    } catch (error) {
      console.error("AI Recommendation error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Shell userRole="seller">
      <PageHeader 
        title="Inventory Management" 
        description="Track stock levels, SKUs, and get AI-powered reorder insights."
        action={
          <div className="flex gap-2">
            <Button 
              onClick={getAiRecommendations} 
              disabled={isAiLoading}
              variant="outline" 
              className="border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold gap-2"
            >
              {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Recommendations
            </Button>
            <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>
        }
      />

      {recommendations && (
        <Card className="mb-8 border-teal-100 bg-teal-50/30 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              <CardTitle className="text-lg">AI Stock Insights</CardTitle>
            </div>
            {recommendations.overallSummary && (
              <CardDescription className="text-slate-600">{recommendations.overallSummary}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              {recommendations.recommendations.map((rec) => (
                <div key={rec.productId} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-bold truncate max-w-[120px]">{rec.productName}</span>
                    {rec.status === 'low_stock' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-500">Stock: {rec.currentStock}</span>
                    <span className="font-bold">Reorder @ {rec.recommendedReorderPoint}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed italic border-t pt-2">
                    {rec.rationale}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" className="text-xs text-teal-700 font-bold" onClick={() => setRecommendations(null)}>
                Dismiss Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-9 bg-slate-50 border-slate-100" placeholder="Search products, SKUs..." />
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Filter className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-800">Product</TableHead>
                <TableHead className="font-bold text-slate-800">SKU</TableHead>
                <TableHead className="font-bold text-slate-800">Stock</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Unit Price</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                  <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
                  <TableCell className="text-slate-500 font-medium">{product.sku}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold",
                        product.stock < 20 ? "text-amber-600" : "text-slate-700"
                      )}>
                        {product.stock}
                      </span>
                      {product.stock < 20 && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">
                          Low
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-teal-accent">
                    KES {product.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-primary">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  );
}

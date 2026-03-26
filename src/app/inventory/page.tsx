"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Package as PackageIcon,
  X
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { intelligentInventoryRecommendation } from '@/ai/flows/intelligent-inventory-recommendation';
import { type IntelligentInventoryRecommendationOutput } from '@/ai/flows/intelligent-inventory-recommendation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Product } from '@/lib/types';
import { FirebaseService } from '@/services/firebase-service';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function InventoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<IntelligentInventoryRecommendationOutput | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: 0,
    cost: 0,
    currentStock: 0,
    location: '',
    category: '',
    supplier: '',
    lowStockThreshold: 20,
    criticalThreshold: 10
  });

  const productsQuery = useMemoFirebase(() => {
    return FirebaseService.getProductsQuery(db);
  }, [db]);

  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

  const getAiRecommendations = async () => {
    if (!products) return;
    setIsAiLoading(true);
    try {
      const input = {
        products: products.map(p => ({
          productId: p.id,
          productName: p.name,
          currentStock: p.currentStock,
          averageDailySales: p.averageDailySales || 1,
          leadTimeDays: p.leadTimeDays || 5,
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

  const handleAddProduct = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Missing Information", description: "Material name is required." });
      return;
    }

    try {
      await FirebaseService.addProduct(db, {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        price: Number(formData.price),
        cost: Number(formData.cost),
        currentStock: Number(formData.currentStock),
        location: formData.location,
        category: formData.category,
        supplier: formData.supplier,
        lowStockThreshold: Number(formData.lowStockThreshold),
        criticalThreshold: Number(formData.criticalThreshold),
        averageDailySales: 0,
        leadTimeDays: 7,
      });

      toast({ title: "Item Added", description: `${formData.name} has been added to inventory.` });
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: 0,
        cost: 0,
        currentStock: 0,
        location: '',
        category: '',
        supplier: '',
        lowStockThreshold: 20,
        criticalThreshold: 10
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add item to inventory." });
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
              disabled={isAiLoading || isProductsLoading || !products?.length}
              variant="outline" 
              className="border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold gap-2 rounded-xl"
            >
              {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Recommendations
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-11 px-6 shadow-lg shadow-slate-200">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <div className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <DialogTitle className="text-3xl font-bold text-slate-900 tracking-tight">Add New Item</DialogTitle>
                    <DialogClose className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-100 transition-colors">
                      <X className="h-4 w-4 text-slate-400" />
                    </DialogClose>
                  </div>
                  <DialogDescription className="text-slate-500 text-sm font-medium">
                    Enter the details of the new material or product to track in your inventory.
                  </DialogDescription>
                </div>
                
                <div className="px-8 py-4 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Material Name *</Label>
                      <Input 
                        placeholder="e.g. Gold Clasps" 
                        className="h-12 bg-slate-50/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-slate-200"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">SKU (Optional)</Label>
                      <Input 
                        placeholder="e.g. GC-001" 
                        className="h-12 bg-slate-50/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-slate-200"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Description</Label>
                    <Textarea 
                      placeholder="Brief description of the material" 
                      className="bg-slate-50/50 border-none rounded-xl min-h-[100px] focus-visible:ring-1 focus-visible:ring-slate-200"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Price (KES) *</Label>
                      <Input 
                        type="number"
                        className="h-12 bg-slate-50/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-slate-200"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cost (KES)</Label>
                      <Input 
                        type="number"
                        className="h-12 bg-slate-50/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-slate-200"
                        value={formData.cost}
                        onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pb-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Initial Quantity *</Label>
                      <Input 
                        type="number"
                        className="h-12 bg-slate-50/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-slate-200"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Location</Label>
                      <Input 
                        placeholder="e.g. Shelf A-12" 
                        className="h-12 bg-slate-50/50 border-none border-b-2 border-slate-900 rounded-none focus-visible:ring-0 focus-visible:border-slate-700"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex flex-row items-center justify-end gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAddDialogOpen(false)} 
                    className="text-slate-900 font-bold hover:bg-transparent hover:text-slate-600 h-12"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddProduct} 
                    className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 px-10 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                  >
                    Add Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            <Input className="pl-9 bg-slate-50 border-slate-100 rounded-xl h-10" placeholder="Search materials, SKUs, locations..." />
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Filter className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-800">Item Name</TableHead>
                <TableHead className="font-bold text-slate-800">SKU / Category</TableHead>
                <TableHead className="font-bold text-slate-800">Location</TableHead>
                <TableHead className="font-bold text-slate-800">Stock</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Selling Price</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isProductsLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading inventory...</TableCell>
                  </TableRow>
                ))
              ) : !products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <PackageIcon className="h-10 w-10 opacity-20" />
                      <p className="font-medium italic">No items in your inventory yet.</p>
                      <Button variant="link" onClick={() => setIsAddDialogOpen(true)}>Add your first item</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                  <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-medium">{product.sku || 'No SKU'}</span>
                      <span className="text-[10px] uppercase text-slate-400 font-bold">{product.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">
                    {product.location || 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold",
                        product.currentStock < (product.lowStockThreshold || 20) ? "text-amber-600" : "text-slate-700"
                      )}>
                        {product.currentStock}
                      </span>
                      {product.currentStock < (product.lowStockThreshold || 20) && (
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

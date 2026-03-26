"use client";

import React, { useState, useMemo } from 'react';
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
  X,
  Layers,
  ShoppingBag
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { intelligentInventoryRecommendation } from '@/ai/flows/intelligent-inventory-recommendation';
import { type IntelligentInventoryRecommendationOutput } from '@/ai/flows/intelligent-inventory-recommendation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { Product, InventoryItemType } from '@/lib/types';
import { FirebaseService } from '@/services/firebase-service';
import { toast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<IntelligentInventoryRecommendationOutput | null>(null);
  const [activeTab, setActiveTab] = useState<InventoryItemType>('product');

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
    criticalThreshold: 10,
    itemType: 'product' as InventoryItemType
  });

  const productsQuery = useMemoFirebase(() => {
    return FirebaseService.getProductsQuery(db);
  }, [db]);

  const { data: allItems, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter(item => (item.itemType || 'product') === activeTab);
  }, [allItems, activeTab]);

  const getAiRecommendations = async () => {
    if (!allItems) return;
    setIsAiLoading(true);
    try {
      const input = {
        products: allItems.filter(p => (p.itemType || 'product') === 'product').map(p => ({
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
    if (!formData.name || !user) {
      toast({ variant: "destructive", title: "Action Required", description: formData.name ? "Please log in." : "Item name is required." });
      return;
    }

    try {
      await FirebaseService.addProduct(db, user.uid, {
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
        itemType: formData.itemType
      });

      toast({ title: "Item Added", description: `${formData.name} has been added to your ${formData.itemType === 'product' ? 'finished goods' : 'raw materials'}.` });
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
        criticalThreshold: 10,
        itemType: activeTab
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add item to inventory." });
    }
  };

  return (
    <Shell userRole="seller">
      <PageHeader 
        title="Inventory Command" 
        description="Track live stock levels for finished goods and raw materials."
        action={
          <div className="flex gap-3">
            <Button 
              onClick={getAiRecommendations} 
              disabled={isAiLoading || isProductsLoading || !allItems?.length}
              variant="outline" 
              className="border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold gap-2 rounded-xl h-11"
            >
              {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Recommendations
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-11 px-6 shadow-lg shadow-slate-200">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white">
                <div className="bg-teal-50/50 p-8 pb-6 border-b border-teal-100">
                  <div className="flex justify-between items-start mb-2">
                    <DialogTitle className="text-3xl font-bold text-slate-900 tracking-tight">
                      Add <span className="text-teal-600">New Item</span>
                    </DialogTitle>
                    <DialogClose className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-white hover:text-teal-600 transition-colors shadow-sm bg-white/50">
                      <X className="h-4 w-4 text-slate-400" />
                    </DialogClose>
                  </div>
                  <DialogDescription className="text-slate-600 text-sm font-medium">
                    Enter the details of the new material or finished product to track.
                  </DialogDescription>
                </div>
                
                <div className="px-8 py-6 space-y-6">
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-xl mb-2">
                    <button 
                      onClick={() => setFormData({...formData, itemType: 'product'})}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                        formData.itemType === 'product' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400"
                      )}
                    >
                      Finished Product
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, itemType: 'material'})}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                        formData.itemType === 'material' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400"
                      )}
                    >
                      Raw Material
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Item Name <span className="text-teal-500">*</span></Label>
                      <Input 
                        placeholder={formData.itemType === 'product' ? "e.g. Gold Necklace" : "e.g. Lobster Clasps"} 
                        className="h-12 bg-slate-50/70 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-teal-300 text-slate-900 font-medium"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">SKU / Batch ID</Label>
                      <Input 
                        placeholder="e.g. GC-001" 
                        className="h-12 bg-slate-50/70 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-teal-300 text-slate-900 font-medium"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Description</Label>
                    <Textarea 
                      placeholder="Brief description of the item" 
                      className="bg-slate-50/70 border-none rounded-xl min-h-[80px] focus-visible:ring-1 focus-visible:ring-teal-300 text-slate-900 font-medium placeholder:text-slate-400"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Price/Valuation (KES) <span className="text-teal-500">*</span></Label>
                      <Input 
                        type="number"
                        className="h-12 bg-teal-50/30 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-teal-300 text-slate-900 font-bold"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Stock Quantity <span className="text-teal-500">*</span></Label>
                      <Input 
                        type="number"
                        className="h-12 bg-teal-50/30 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-teal-300 text-slate-900 font-bold"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pb-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Shelf Location</Label>
                      <Input 
                        placeholder="e.g. Shelf A-12" 
                        className="h-12 bg-slate-50/70 border-none border-b-2 border-teal-500 rounded-none focus-visible:ring-0 focus-visible:border-teal-400 text-slate-900 font-medium placeholder:text-slate-400"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Supplier</Label>
                      <Input 
                        placeholder="e.g. Nairobi Metals" 
                        className="h-12 bg-slate-50/70 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-teal-300 text-slate-900 font-medium"
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex flex-row items-center justify-end gap-6 bg-slate-50/30">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAddDialogOpen(false)} 
                    className="text-slate-600 font-bold hover:bg-white hover:text-teal-600 h-12 transition-colors rounded-xl px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddProduct} 
                    className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 px-10 rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-[0.98]"
                  >
                    Confirm Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Tabs defaultValue="product" value={activeTab} onValueChange={(v) => setActiveTab(v as InventoryItemType)} className="w-full">
        <TabsList className="mb-8 bg-slate-100 p-1 rounded-2xl w-full max-w-md">
          <TabsTrigger value="product" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm py-2.5 font-bold uppercase text-[10px] tracking-widest">
            <ShoppingBag className="h-3.5 w-3.5 mr-2" /> Finished Goods
          </TabsTrigger>
          <TabsTrigger value="material" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm py-2.5 font-bold uppercase text-[10px] tracking-widest">
            <Layers className="h-3.5 w-3.5 mr-2" /> Raw Materials
          </TabsTrigger>
        </TabsList>

        {recommendations && activeTab === 'product' && (
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
              <Input className="pl-9 bg-slate-50 border-slate-100 rounded-xl h-10" placeholder={`Search ${activeTab === 'product' ? 'products' : 'materials'}...`} />
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
                  <TableHead className="font-bold text-slate-800">Shelf Location</TableHead>
                  <TableHead className="font-bold text-slate-800">Stock</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right">Value (KES)</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isProductsLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading items...</TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <PackageIcon className="h-10 w-10 opacity-20" />
                        <p className="font-medium italic">No {activeTab === 'product' ? 'finished products' : 'raw materials'} found.</p>
                        <Button variant="link" onClick={() => setIsAddDialogOpen(true)}>Add your first {activeTab === 'product' ? 'item' : 'material'}</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                    <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-medium">{item.sku || 'No SKU'}</span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold">{item.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {item.location || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          item.currentStock < (item.lowStockThreshold || 5) ? "text-amber-600" : "text-slate-700"
                        )}>
                          {item.currentStock}
                        </span>
                        {item.currentStock < (item.lowStockThreshold || 5) && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">
                            Low
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-teal-accent">
                      KES {item.price.toLocaleString()}
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
      </Tabs>
    </Shell>
  );
}

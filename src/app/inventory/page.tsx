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
import { RoleGuard } from '@/components/RoleGuard';

export default function InventoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<IntelligentInventoryRecommendationOutput | null>(null);
  const [activeTab, setActiveTab] = useState<InventoryItemType>('product');

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

      toast({ title: "Item Added", description: `${formData.name} has been added to inventory.` });
      setIsAddDialogOpen(false);
      setFormData({
        name: '', sku: '', description: '', price: 0, cost: 0, currentStock: 0,
        location: '', category: '', supplier: '', lowStockThreshold: 20,
        criticalThreshold: 10, itemType: activeTab
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add item." });
    }
  };

  return (
    <RoleGuard allowedRoles={['seller']}>
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
                  </div>
                  
                  <div className="px-8 py-6 space-y-6">
                    <div className="flex gap-4 p-1 bg-slate-100 rounded-xl mb-2">
                      <button 
                        onClick={() => setFormData({...formData, itemType: 'product'})}
                        className={cn("flex-1 py-2 text-xs font-bold rounded-lg", formData.itemType === 'product' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400")}
                      >
                        Finished Product
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, itemType: 'material'})}
                        className={cn("flex-1 py-2 text-xs font-bold rounded-lg", formData.itemType === 'material' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400")}
                      >
                        Raw Material
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Item Name</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Price (KES)</Label>
                        <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-12 bg-slate-50 border-none rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Stock Quantity</Label>
                      <Input type="number" value={formData.currentStock} onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})} className="h-12 bg-slate-50 border-none rounded-xl" />
                    </div>
                  </div>
                  <DialogFooter className="p-8 pt-0 bg-slate-50/30">
                    <Button onClick={handleAddProduct} className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 px-10 rounded-2xl">
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
            <TabsTrigger value="product" className="flex-1 py-2.5 font-bold uppercase text-[10px] tracking-widest">
              <ShoppingBag className="h-3.5 w-3.5 mr-2" /> Finished Goods
            </TabsTrigger>
            <TabsTrigger value="material" className="flex-1 py-2.5 font-bold uppercase text-[10px] tracking-widest">
              <Layers className="h-3.5 w-3.5 mr-2" /> Raw Materials
            </TabsTrigger>
          </TabsList>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="font-bold">Item Name</TableHead>
                    <TableHead className="font-bold">Stock</TableHead>
                    <TableHead className="font-bold text-right">Value (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isProductsLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-10">Loading inventory...</TableCell></TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-20 text-slate-400">No items found.</TableCell></TableRow>
                  ) : filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-slate-100">
                      <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                      <TableCell className="font-bold">{item.currentStock}</TableCell>
                      <TableCell className="text-right font-bold text-teal-accent">KES {item.price.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs>
      </Shell>
    </RoleGuard>
  );
}

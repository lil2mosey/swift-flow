"use client";

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Loader2,
  X,
  Layers,
  ShoppingBag,
  Package as PackageIcon,
  RefreshCcw,
  PlusCircle,
  AlertCircle
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Product, InventoryItemType } from '@/lib/types';
import { FirebaseService } from '@/services/firebase-service';
import { toast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/RoleGuard';

export default function InventoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InventoryItemType>('product');
  const [addMode, setAddMode] = useState<'restock' | 'new'>('restock');

  // Restock State
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [restockAmount, setRestockAmount] = useState<number>(0);

  // New Item State
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

  const handleRestock = async () => {
    if (!selectedItemId || restockAmount <= 0) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Please select an item and enter a valid quantity." });
      return;
    }

    const item = allItems?.find(i => i.id === selectedItemId);
    if (!item) {
      toast({ variant: "destructive", title: "Error", description: "Could not find the selected item." });
      return;
    }

    try {
      const itemRef = doc(db, 'products', selectedItemId);
      // Ensure we are adding to the existing numeric value
      const currentCount = Number(item.currentStock) || 0;
      const amountToAdd = Number(restockAmount);
      const newTotal = currentCount + amountToAdd;
      
      await updateDocumentNonBlocking(itemRef, { 
        currentStock: newTotal,
        updatedAt: new Date().toISOString()
      });

      toast({ 
        title: "Stock Replenished", 
        description: `Added ${amountToAdd} units to ${item.name}. New level: ${newTotal}.` 
      });
      
      setIsAddDialogOpen(false);
      setSelectedItemId('');
      setRestockAmount(0);
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not synchronize stock update." });
    }
  };

  const handleAddNewItem = async () => {
    if (!formData.name || !user) {
      toast({ variant: "destructive", title: "Action Required", description: formData.name ? "Please log in." : "Item name is required." });
      return;
    }

    try {
      await FirebaseService.addProduct(db, user.uid, {
        name: formData.name,
        sku: formData.sku || `SKU-${Date.now()}`,
        description: formData.description,
        price: Number(formData.price),
        cost: Number(formData.cost),
        currentStock: Number(formData.currentStock),
        location: formData.location,
        category: formData.category || (formData.itemType === 'product' ? 'Product' : 'Material'),
        supplier: formData.supplier,
        lowStockThreshold: Number(formData.lowStockThreshold),
        criticalThreshold: Number(formData.criticalThreshold),
        averageDailySales: 0,
        leadTimeDays: 7,
        itemType: formData.itemType
      });

      toast({ title: "Registration Successful", description: `${formData.name} is now in the catalog.` });
      setIsAddDialogOpen(false);
      setFormData({
        name: '', sku: '', description: '', price: 0, cost: 0, currentStock: 0,
        location: '', category: '', supplier: '', lowStockThreshold: 20,
        criticalThreshold: 10, itemType: activeTab
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not register new item." });
    }
  };

  return (
    <RoleGuard allowedRoles={['seller']}>
      <Shell userRole="seller">
        <PageHeader 
          title="Inventory Command" 
          description="Manage stock levels for finished products and materials."
          action={
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-11 px-6 shadow-lg shadow-slate-200">
                  <Plus className="h-4 w-4" /> Stock Management
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white">
                <div className="bg-[#0f172a] p-8 pb-6 border-b border-slate-800 text-white">
                  <div className="flex justify-between items-start mb-2">
                    <DialogTitle className="text-3xl font-bold tracking-tight">
                      Stock <span className="text-teal-400">Logistics</span>
                    </DialogTitle>
                    <DialogClose className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm bg-slate-700/50">
                      <X className="h-4 w-4 text-slate-300" />
                    </DialogClose>
                  </div>
                  <DialogDescription className="text-slate-400 font-medium">Add to current stock levels or register a brand new item.</DialogDescription>
                </div>
                
                <div className="px-8 py-6 space-y-6">
                  {/* Mode Selector */}
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-xl mb-2">
                    <button 
                      onClick={() => setAddMode('restock')}
                      className={cn("flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2", addMode === 'restock' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400")}
                    >
                      <RefreshCcw className="h-3.5 w-3.5" /> Restock Existing
                    </button>
                    <button 
                      onClick={() => setAddMode('new')}
                      className={cn("flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2", addMode === 'new' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400")}
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Register New
                    </button>
                  </div>

                  {addMode === 'restock' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Target Item</Label>
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                          <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl text-slate-900 font-bold">
                            <SelectValue placeholder="-- Choose Item to Update --" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-xl">
                            {allItems && allItems.length > 0 ? (
                              allItems.map(item => (
                                <SelectItem key={item.id} value={item.id} className="py-3 font-medium">
                                  <div className="flex justify-between items-center w-full min-w-[300px]">
                                    <span>{item.name}</span>
                                    <div className="flex gap-2">
                                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">Stock: {item.currentStock}</span>
                                      <span className="text-[10px] bg-teal-50 px-2 py-0.5 rounded-full text-teal-600 font-bold uppercase">{item.itemType || 'product'}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-4 text-center text-xs text-slate-400 italic">Catalog is empty.</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Quantity to Add</Label>
                        <div className="relative">
                          <Plus className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-500" />
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="0"
                            value={restockAmount || ''} 
                            onChange={(e) => setRestockAmount(Number(e.target.value))} 
                            className="h-14 bg-slate-50 border-none rounded-xl pl-12 text-lg font-bold text-slate-900" 
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium px-1 flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3" /> This will be added to the current stock level.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex gap-4 p-1 bg-slate-50 rounded-xl mb-2">
                        <button 
                          onClick={() => setFormData({...formData, itemType: 'product'})}
                          className={cn("flex-1 py-2 text-[10px] font-bold rounded-lg transition-all", formData.itemType === 'product' ? "bg-white text-teal-600 shadow-sm border border-teal-100" : "text-slate-400")}
                        >
                          Finished Product
                        </button>
                        <button 
                          onClick={() => setFormData({...formData, itemType: 'material'})}
                          className={cn("flex-1 py-2 text-[10px] font-bold rounded-lg transition-all", formData.itemType === 'material' ? "bg-white text-teal-600 shadow-sm border border-teal-100" : "text-slate-400")}
                        >
                          Raw Material
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Item Name</Label>
                          <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 bg-slate-50 border-none rounded-xl font-bold" placeholder="E.g. Summer Dress" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Price (KES)</Label>
                          <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Initial Stock</Label>
                          <Input type="number" value={formData.currentStock} onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Low Stock Warning</Label>
                          <Input type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="p-8 pt-0 bg-slate-50/30">
                  <Button 
                    onClick={addMode === 'restock' ? handleRestock : handleAddNewItem} 
                    className="bg-primary hover:bg-slate-800 text-white font-bold h-14 px-10 rounded-2xl w-full shadow-xl shadow-slate-200"
                  >
                    {addMode === 'restock' ? 'Update Existing Stock' : 'Save New Catalog Item'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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

          <Card className="border-none shadow-sm min-h-[400px] overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-primary text-white">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="font-bold pl-6 uppercase text-[10px] tracking-widest text-teal-400">Item Details</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">Category</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">Current Stock</TableHead>
                    <TableHead className="font-bold text-right pr-6 uppercase text-[10px] tracking-widest text-slate-200">Unit Price (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isProductsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-32 text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <PackageIcon className="h-10 w-10 opacity-10" />
                          <p className="font-medium italic">No items found in this category.</p>
                          <Button variant="link" onClick={() => setIsAddDialogOpen(true)} className="text-teal-600 font-bold">Register your first item</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-500 uppercase">{item.category}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-bold px-3 py-1.5 rounded-lg inline-flex items-center",
                          item.currentStock <= (item.criticalThreshold || 5) ? "bg-rose-100 text-rose-700" : 
                          item.currentStock <= (item.lowStockThreshold || 20) ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-900"
                        )}>
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-teal-600 pr-6">KES {item.price.toLocaleString()}</TableCell>
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


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
  Layers,
  ShoppingBag,
  RefreshCcw,
  PlusCircle,
  Search,
  Sparkles,
  Calendar
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
import { doc, serverTimestamp } from 'firebase/firestore';
import { Product, InventoryItemType } from '@/lib/types';
import { FirebaseService } from '@/services/firebase-service';
import { toast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/RoleGuard';
import { format } from 'date-fns';

export default function InventoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InventoryItemType>('product');
  const [addMode, setAddMode] = useState<'restock' | 'new'>('restock');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

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
    return FirebaseService.getProductsQuery(db, user?.uid);
  }, [db, user?.uid]);

  const { data: allItems, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter(item => {
      const itemType = item.itemType || 'product';
      const matchesTab = itemType === activeTab;
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [allItems, activeTab, searchTerm]);

  const formatDate = (date: any) => {
    if (!date) return 'New Item';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return isNaN(d.getTime()) ? 'Recently' : format(d, 'MMM d, HH:mm');
  };

  const handleRestock = async () => {
    if (!selectedItemId || restockAmount <= 0) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Please select an item and quantity." });
      return;
    }

    const item = allItems?.find(i => i.id === selectedItemId);
    if (!item) return;

    try {
      const itemRef = doc(db, 'products', selectedItemId);
      await updateDocumentNonBlocking(itemRef, { 
        currentStock: (Number(item.currentStock) || 0) + Number(restockAmount),
        updatedAt: serverTimestamp()
      });

      toast({ title: "Stock Replenished", description: `${item.name} synchronized.` });
      setIsAddDialogOpen(false);
      setRestockAmount(0);
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not sync." });
    }
  };

  const handleAddNewItem = async () => {
    if (!formData.name || !user) {
       toast({ variant: "destructive", title: "Incomplete", description: "Please provide an item name." });
       return;
    }

    try {
      await FirebaseService.addProduct(db, user.uid, {
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost),
        currentStock: Number(formData.currentStock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        criticalThreshold: Number(formData.criticalThreshold),
        averageDailySales: 0,
        leadTimeDays: 7
      });

      toast({ title: "Registration Successful", description: `${formData.name} added.` });
      setIsAddDialogOpen(false);
      setFormData({
        name: '', sku: '', description: '', price: 0, cost: 0, currentStock: 0,
        location: '', category: '', supplier: '', lowStockThreshold: 20,
        criticalThreshold: 10, itemType: activeTab
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not register item." });
    }
  };

  const handleSeedCatalog = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      await FirebaseService.seedKenyaJewelry(db, user.uid);
      toast({ title: "Catalog Seeded", description: "Synchronized jewelry materials." });
    } catch (error) {
      toast({ variant: "destructive", title: "Seed Failed", description: "Could not populate." });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['seller']}>
      <Shell userRole="seller">
        <PageHeader 
          title="Inventory Command" 
          description="Manage stock levels and track last synchronization dates."
          action={
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleSeedCatalog}
                disabled={isSeeding}
                className="border-teal-100 text-teal-600 hover:bg-teal-50 font-bold gap-2 rounded-xl h-11"
              >
                {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Seed Catalog
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-slate-800 text-white font-bold gap-2 rounded-xl h-11 px-6">
                    <Plus className="h-4 w-4" /> Stock Management
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white">
                  <div className="bg-[#0f172a] p-8 pb-6 border-b border-slate-800 text-white">
                    <DialogTitle className="text-3xl font-bold tracking-tight">
                      Stock <span className="text-teal-400">Logistics</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">Add to current stock levels or register a brand new item.</DialogDescription>
                  </div>
                  
                  <div className="px-8 py-6 space-y-6">
                    <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                      <button onClick={() => setAddMode('restock')} className={cn("flex-1 py-3 text-xs font-bold rounded-lg transition-all", addMode === 'restock' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400")}>Restock</button>
                      <button onClick={() => setAddMode('new')} className={cn("flex-1 py-3 text-xs font-bold rounded-lg transition-all", addMode === 'new' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400")}>New Item</button>
                    </div>

                    {addMode === 'restock' ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Target Item</Label>
                          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-bold">
                              <SelectValue placeholder="-- Select Item --" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {allItems?.map(item => (
                                <SelectItem key={item.id} value={item.id}>{item.name} ({item.currentStock} in stock)</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">Quantity to Add</Label>
                          <Input 
                            type="number" 
                            value={restockAmount || ''} 
                            onChange={(e) => setRestockAmount(e.target.value === '' ? 0 : Number(e.target.value))} 
                            className="h-14 bg-slate-50 border-none rounded-xl text-lg font-bold" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Item Name</Label>
                            <Input placeholder="E.g. Gold Grain" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-11 bg-slate-50 border-none rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">SKU Code</Label>
                            <Input placeholder="E.g. RM-G-24" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="h-11 bg-slate-50 border-none rounded-xl" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Initial Stock</Label>
                            <Input placeholder="0" type="number" value={formData.currentStock || ''} onChange={(e) => setFormData({...formData, currentStock: e.target.value === '' ? 0 : Number(e.target.value)})} className="h-11 bg-slate-50 border-none rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Price (KES)</Label>
                            <Input placeholder="0" type="number" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value === '' ? 0 : Number(e.target.value)})} className="h-11 bg-slate-50 border-none rounded-xl" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="p-8 pt-0">
                    <Button onClick={addMode === 'restock' ? handleRestock : handleAddNewItem} className="bg-primary text-white font-bold h-14 rounded-2xl w-full">Update Sync</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Tabs defaultValue="product" value={activeTab} onValueChange={(v) => setActiveTab(v as InventoryItemType)} className="flex-1">
            <TabsList className="bg-slate-100 p-1 rounded-2xl w-full max-w-md">
              <TabsTrigger value="product" className="flex-1 py-2.5 font-bold uppercase text-[10px] tracking-widest">Finished Goods</TabsTrigger>
              <TabsTrigger value="material" className="flex-1 py-2.5 font-bold uppercase text-[10px] tracking-widest">Raw Materials</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search catalog..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12 bg-white border-none rounded-xl shadow-sm" />
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-primary text-white">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="font-bold pl-6 uppercase text-[10px] tracking-widest text-teal-400">Item Details</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">Current Stock</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-200">Last Sync</TableHead>
                  <TableHead className="font-bold text-right pr-6 uppercase text-[10px] tracking-widest text-slate-200">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isProductsLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 italic">No items found.</TableCell></TableRow>
                ) : filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-slate-100">
                    <TableCell className="font-medium text-slate-900 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("font-bold px-3 py-1.5 rounded-lg", item.currentStock <= (item.lowStockThreshold || 5) ? "bg-rose-100 text-rose-700" : "bg-slate-50")}>
                        {item.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {formatDate(item.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-teal-600 pr-6">KES {item.price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Shell>
    </RoleGuard>
  );
}

"use client";

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search, Phone, MessageSquare, Loader2, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Message, Product } from '@/lib/types';
import { format } from 'date-fns';
import { query, collection, limit } from 'firebase/firestore';

/**
 * Unified Messaging Page for SwiftFlow.
 * Handles both Seller (Conversation Management) and Customer (Direct Support) views.
 * Real-time synchronization is achieved via consistent participant sorting.
 */
export default function MessagesPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const [message, setMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const isSeller = profile?.role === 'seller';

  // --- Recipient Discovery for Customers ---
  // Customers discover the actual Seller UID from the seeded products.
  const productsQuery = useMemoFirebase(() => query(collection(db, 'products'), limit(1)), [db]);
  const { data: sampleProducts, isLoading: isCatalogSyncing } = useCollection<Product>(productsQuery);
  
  const systemSellerId = useMemo(() => {
    if (sampleProducts && sampleProducts.length > 0) return sampleProducts[0].sellerId || 'system-seller';
    return 'system-seller';
  }, [sampleProducts]);

  // --- Conversation Loading ---
  // We fetch all messages where the user is a participant.
  const allConversationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return FirebaseService.getConversationsQuery(db, user.uid);
  }, [db, user]);

  const { data: allMessages, isLoading: isConversationsLoading } = useCollection<Message>(allConversationsQuery);

  // Group messages into unique conversations for the sidebar
  const uniqueConversations = useMemo(() => {
    if (!allMessages || !user) return [];
    
    const map = new Map();
    allMessages.forEach(msg => {
      const otherId = msg.participants.find(p => p !== user.uid);
      if (otherId && !map.has(otherId)) {
        map.set(otherId, {
          id: otherId,
          name: msg.senderId === otherId ? (msg.senderName || "User") : (isSeller ? "Customer" : "Workshop Support"),
          lastMsg: msg.content,
          timestamp: msg.createdAt?.seconds ? msg.createdAt.seconds * 1000 : Date.now(),
        });
      }
    });
    
    // Sort conversations locally by timestamp to avoid index requirements
    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [allMessages, user, isSeller]);

  // --- Active Chat Logic ---
  const activeReceiverId = useMemo(() => {
    if (!isSeller) return systemSellerId; 
    return selectedContactId;
  }, [isSeller, systemSellerId, selectedContactId]);

  const chatQuery = useMemoFirebase(() => {
    if (!user || !activeReceiverId) return null;
    return FirebaseService.getMessagesQuery(db, [user.uid, activeReceiverId]);
  }, [db, user, activeReceiverId]);

  const { data: chatMessages, isLoading: isChatLoading } = useCollection<Message>(chatQuery);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim() || !activeReceiverId) return;

    FirebaseService.sendMessage(
      db, 
      user.uid, 
      activeReceiverId, 
      message, 
      profile?.fullName || user.email?.split('@')[0] || "User"
    );
    setMessage('');
  };

  const activeContact = useMemo(() => {
    if (!isSeller) return { name: 'SwiftFlow Workshop', id: systemSellerId };
    return uniqueConversations.find(c => c.id === selectedContactId);
  }, [isSeller, uniqueConversations, selectedContactId, systemSellerId]);

  return (
    <Shell userRole={profile?.role}>
      <PageHeader 
        title="Synchronized Messaging" 
        description={isSeller ? "Manage your direct customer inquiries." : "Chat with our jewelry experts about your requests."}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[650px] max-w-6xl mx-auto">
        {/* Contact List (Sellers Only) */}
        {isSeller && (
          <Card className="border-none shadow-sm h-full flex flex-col bg-white rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="pl-10 bg-slate-50 border-none h-11 rounded-xl" placeholder="Search customers..." />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isConversationsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
              ) : uniqueConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center px-6">
                  <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                    <MessageSquare className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Active Chats</p>
                  <p className="text-xs text-slate-400 mt-1 italic">Waiting for customer inquiries...</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {uniqueConversations.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={cn(
                        "w-full p-6 flex items-center gap-4 hover:bg-slate-50/80 transition-all text-left group",
                        selectedContactId === contact.id && "bg-teal-50/50 border-r-4 border-teal-500"
                      )}
                    >
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={`https://picsum.photos/seed/${contact.id}/60`} />
                        <AvatarFallback className="bg-slate-100"><User className="h-5 w-5 text-slate-400" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm font-bold text-slate-900 truncate group-hover:text-teal-600 transition-colors">{contact.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            {format(new Date(contact.timestamp), 'HH:mm')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate font-medium">{contact.lastMsg}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        )}

        {/* Chat Window */}
        <Card className={cn(
          "border-none shadow-sm h-full flex flex-col bg-white rounded-3xl overflow-hidden",
          isSeller ? "lg:col-span-2" : "lg:col-span-3"
        )}>
          {(activeReceiverId || !isSeller) ? (
            <>
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-slate-100">
                    <AvatarImage src={`https://picsum.photos/seed/${activeReceiverId}/60`} />
                    <AvatarFallback><User className="h-5 w-5 text-slate-400" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activeContact?.name || (isCatalogSyncing ? "Syncing..." : "Workshop")}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-tighter">Synchronized</span>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 bg-slate-50/30 p-8">
                <div className="space-y-8">
                  {isChatLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
                  ) : !chatMessages || chatMessages.length === 0 ? (
                    <div className="text-center py-20">
                       <div className="p-4 bg-white rounded-3xl shadow-sm border border-slate-100 w-fit mx-auto mb-4">
                         <MessageSquare className="h-10 w-10 text-slate-100" />
                       </div>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Start of Conversation</p>
                       <p className="text-[10px] text-slate-300 mt-1 italic">Type below to sync your inquiry with the workshop.</p>
                    </div>
                  ) : chatMessages.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm shadow-sm font-medium leading-relaxed",
                        msg.senderId === user?.uid 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-tighter">
                        {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : 'Syncing...'}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-slate-50">
                <form className="flex gap-3" onSubmit={handleSendMessage}>
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isCatalogSyncing && !isSeller}
                    className="bg-slate-50 border-none h-14 rounded-2xl px-6 font-medium text-slate-900 focus-visible:ring-1 focus-visible:ring-teal-200" 
                    placeholder={isCatalogSyncing && !isSeller ? "Syncing workshop connection..." : "Describe your jewelry request..."} 
                  />
                  <Button 
                    type="submit" 
                    disabled={!message.trim() || (isCatalogSyncing && !isSeller)}
                    className="h-14 w-14 sm:w-auto sm:px-8 bg-primary hover:bg-slate-800 text-white font-bold gap-3 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send Sync</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                <MessageSquare className="h-12 w-12 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Select a Conversation</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-3 leading-relaxed">
                Choose a customer from your list to begin synchronized logistics support.
              </p>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}

"use client";

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search, MessageSquare, Loader2, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Message, Product } from '@/lib/types';
import { format } from 'date-fns';
import { query, collection, limit, where, orderBy } from 'firebase/firestore';

/**
 * Synchronized Messaging Page.
 * Persists all chat history in Firestore for reference.
 */
export default function MessagesPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const [message, setMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const isSeller = profile?.role === 'seller';

  // --- Recipient Discovery for Customers ---
  const productsQuery = useMemoFirebase(() => query(collection(db, 'products'), limit(1)), [db]);
  const { data: sampleProducts, isLoading: isCatalogSyncing } = useCollection<Product>(productsQuery);
  
  const systemSellerId = useMemo(() => {
    if (sampleProducts && sampleProducts.length > 0) return sampleProducts[0].sellerId || 'system-seller';
    return 'system-seller';
  }, [sampleProducts]);

  // --- Conversation Sidebar Loading ---
  const allConversationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return FirebaseService.getConversationsQuery(db, user.uid);
  }, [db, user]);

  const { data: allMessages, isLoading: isConversationsLoading } = useCollection<Message>(allConversationsQuery);

  const uniqueConversations = useMemo(() => {
    if (!allMessages || !user) return [];
    
    const map = new Map();
    allMessages.forEach(msg => {
      const otherId = msg.participants.find(p => p !== user.uid);
      if (otherId && !map.has(otherId)) {
        map.set(otherId, {
          id: otherId,
          name: msg.senderId === otherId ? (msg.senderName || "Customer") : (isSeller ? "Customer" : "Workshop Support"),
          lastMsg: msg.content,
          timestamp: msg.createdAt?.seconds ? msg.createdAt.seconds * 1000 : Date.now(),
        });
      }
    });
    
    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [allMessages, user, isSeller]);

  // --- Active Chat History ---
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
        title="Chat Reference" 
        description="All communications are synchronized and persisted for your reference."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px] max-w-6xl mx-auto">
        {/* Sidebar */}
        <Card className={cn(
          "border-none shadow-sm h-full flex flex-col bg-white rounded-3xl overflow-hidden",
          !isSeller && "hidden lg:flex"
        )}>
          <div className="p-6 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-10 bg-slate-50 border-none h-11 rounded-xl" placeholder="Search contacts..." />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isConversationsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
            ) : uniqueConversations.length === 0 ? (
              <div className="p-12 text-center text-slate-300 italic text-xs">No previous chats.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {uniqueConversations.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={cn(
                      "w-full p-6 flex items-center gap-4 hover:bg-slate-50/80 transition-all text-left",
                      selectedContactId === contact.id && "bg-teal-50/30 border-r-4 border-teal-500"
                    )}
                  >
                    <Avatar className="h-10 w-10 border border-white shadow-sm">
                      <AvatarImage src={`https://picsum.photos/seed/${contact.id}/60`} />
                      <AvatarFallback><User className="h-4 w-4 text-slate-400" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold text-slate-900 truncate">{contact.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{format(new Date(contact.timestamp), 'HH:mm')}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{contact.lastMsg}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat History */}
        <Card className={cn(
          "border-none shadow-sm h-full flex flex-col bg-white rounded-3xl overflow-hidden",
          isSeller ? "lg:col-span-2" : "lg:col-span-3"
        )}>
          {(activeReceiverId || !isSeller) ? (
            <>
              <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-white z-10">
                <Avatar className="h-10 w-10 border border-slate-100">
                  <AvatarImage src={`https://picsum.photos/seed/${activeReceiverId}/60`} />
                  <AvatarFallback><User className="h-4 w-4 text-slate-400" /></AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeContact?.name || "Syncing..."}</h3>
                  <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">Active Reference</p>
                </div>
              </div>

              <ScrollArea className="flex-1 bg-slate-50/20 p-6">
                <div className="space-y-6">
                  {isChatLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
                  ) : !chatMessages || chatMessages.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 text-xs italic">Start a conversation. All messages are persisted.</div>
                  ) : chatMessages.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[80%]",
                      msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm shadow-sm font-medium",
                        msg.senderId === user?.uid 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                        {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : '...'}
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
                    className="bg-slate-50 border-none h-12 rounded-xl px-6 font-medium text-slate-900" 
                    placeholder="Type your message..." 
                  />
                  <Button 
                    type="submit" 
                    disabled={!message.trim()}
                    className="h-12 px-6 bg-primary text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <MessageSquare className="h-12 w-12 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Select a Contact</h3>
              <p className="text-sm text-slate-400 mt-2">Pick a customer to see your chat history.</p>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
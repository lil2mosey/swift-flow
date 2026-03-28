"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
import { Message, UserProfile } from '@/lib/types';
import { format } from 'date-fns';

/**
 * Unified Messaging Page
 * Handles both Seller (Conversation List) and Customer (Direct Chat) views.
 */
export default function MessagesPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const [message, setMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // --- Seller Logic: Conversations List ---
  const sellerId = "system-seller"; // In a real app, this would be the actual seller's UID
  
  const conversationsQuery = useMemoFirebase(() => {
    if (!user || profile?.role !== 'seller') return null;
    return FirebaseService.getConversationsQuery(db, user.uid);
  }, [db, user, profile]);

  const { data: allMessages, isLoading: isConversationsLoading } = useCollection<Message>(conversationsQuery);

  // Group messages by unique customer for the seller's list
  const uniqueConversations = useMemo(() => {
    if (!allMessages || profile?.role !== 'seller' || !user) return [];
    
    const map = new Map();
    allMessages.forEach(msg => {
      const otherId = msg.participants.find(p => p !== user.uid);
      if (otherId && !map.has(otherId)) {
        map.set(otherId, {
          id: otherId,
          name: msg.senderId === otherId ? msg.senderName : "Customer",
          lastMsg: msg.content,
          time: msg.createdAt ? format(new Date(msg.createdAt?.seconds * 1000 || Date.now()), 'HH:mm') : '...',
        });
      }
    });
    return Array.from(map.values());
  }, [allMessages, profile, user]);

  // --- Chat Logic: Active Conversation ---
  const activeReceiverId = useMemo(() => {
    if (profile?.role === 'customer') return sellerId;
    return selectedContactId;
  }, [profile, selectedContactId]);

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
      profile?.fullName || "User"
    );
    setMessage('');
  };

  const activeContact = useMemo(() => {
    if (profile?.role === 'customer') return { name: 'Support / Seller', id: sellerId };
    return uniqueConversations.find(c => c.id === selectedContactId);
  }, [profile, uniqueConversations, selectedContactId]);

  return (
    <Shell userRole={profile?.role}>
      <PageHeader 
        title="Messages" 
        description={profile?.role === 'seller' ? "Direct communication with your customers." : "Chat with the seller about your orders."}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        {/* Contact List (Sellers Only) */}
        {profile?.role === 'seller' && (
          <Card className="border-none shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="pl-9 bg-slate-50 border-none" placeholder="Search customers..." />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isConversationsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-200" /></div>
              ) : uniqueConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <MessageSquare className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 font-medium italic">No active conversations found.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {uniqueConversations.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={cn(
                        "w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left",
                        selectedContactId === contact.id && "bg-slate-50 border-r-4 border-teal-500"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${contact.id}/40`} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm font-bold text-slate-900 truncate">{contact.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{contact.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{contact.lastMsg}</p>
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
          "border-none shadow-sm h-full flex flex-col overflow-hidden",
          profile?.role === 'seller' ? "lg:col-span-2" : "lg:col-span-3"
        )}>
          {activeReceiverId ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://picsum.photos/seed/${activeReceiverId}/40`} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activeContact?.name || "Customer"}</h3>
                    <span className="text-[10px] text-teal-600 font-bold uppercase">Active Chat</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 bg-slate-50/50 p-6">
                <div className="space-y-6">
                  {isChatLoading ? (
                    <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-200" /></div>
                  ) : chatMessages?.length === 0 ? (
                    <div className="text-center py-10 text-slate-300 text-xs italic font-medium">Send a message to start the conversation.</div>
                  ) : chatMessages?.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[80%]",
                      msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm font-medium leading-relaxed",
                        msg.senderId === user?.uid ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                        {msg.createdAt ? format(new Date(msg.createdAt?.seconds * 1000 || Date.now()), 'HH:mm') : '...'}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 bg-white border-t border-slate-100">
                <form className="flex gap-2" onSubmit={handleSendMessage}>
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-slate-50 border-none h-11" 
                    placeholder="Type your message here..." 
                  />
                  <Button type="submit" className="h-11 px-6 bg-primary hover:bg-slate-800 text-white font-bold gap-2">
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Select a Conversation</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-2">Choose a customer from the left list to start synchronized communication.</p>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}

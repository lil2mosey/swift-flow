
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search, MessageSquare, Loader2, User, Package, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { FirebaseService } from '@/services/firebase-service';
import { Conversation, ChatMessage } from '@/lib/types';
import { format } from 'date-fns';

export default function MessagesPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSeller = profile?.role === 'seller';

  // --- Conversations List ---
  const convsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return FirebaseService.getInquiriesQuery(db, user.uid);
  }, [db, user]);

  const { data: conversations, isLoading: isConvsLoading } = useCollection<Conversation>(convsQuery);

  // --- Chat Messages ---
  const chatQuery = useMemoFirebase(() => {
    if (!selectedConvId) return null;
    return FirebaseService.getChatMessagesQuery(db, selectedConvId);
  }, [db, selectedConvId]);

  const { data: messages, isLoading: isChatLoading } = useCollection<ChatMessage>(chatQuery);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !user || !newMessage.trim()) return;

    FirebaseService.sendChatMessage(db, selectedConvId, user.uid, newMessage);
    setNewMessage('');
  };

  const activeConv = useMemo(() => 
    conversations?.find(c => c.id === selectedConvId), 
    [conversations, selectedConvId]
  );

  return (
    <Shell userRole={profile?.role}>
      <PageHeader 
        title="Inquiry Management" 
        description="Synchronized conversations about specific jewelry items."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px] max-w-6xl mx-auto">
        {/* Sidebar */}
        <Card className="border-none shadow-sm h-full flex flex-col bg-white rounded-[2rem] overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-[#0f172a] text-white">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-400" /> Recent Inquiries
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {isConvsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="p-12 text-center text-slate-300 italic text-xs">No active inquiries found.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={cn(
                      "w-full p-6 flex items-start gap-4 hover:bg-slate-50 transition-all text-left group",
                      selectedConvId === conv.id && "bg-teal-50/40 border-r-4 border-teal-500"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={`https://picsum.photos/seed/${conv.itemId}/60`} />
                        <AvatarFallback><Package className="h-5 w-5 text-slate-400" /></AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-teal-400 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {isSeller ? conv.customerName || 'Inquiry' : 'SwiftFlow Workshop'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {conv.timestamp?.seconds ? format(new Date(conv.timestamp.seconds * 1000), 'HH:mm') : '...'}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1 truncate">{conv.itemName}</p>
                      <p className="text-xs text-slate-500 truncate group-hover:text-slate-900 transition-colors">{conv.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat History Area */}
        <Card className="lg:col-span-2 border-none shadow-sm h-full flex flex-col bg-white rounded-[2rem] overflow-hidden">
          {selectedConvId ? (
            <>
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-slate-100">
                    <AvatarImage src={`https://picsum.photos/seed/${activeConv?.itemId}/60`} />
                    <AvatarFallback><Package className="h-4 w-4 text-slate-400" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activeConv?.itemName}</h3>
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">
                      {isSeller ? `Customer: ${activeConv?.customerName}` : 'Workshop Support'}
                    </p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 bg-slate-50/30 p-8">
                <div className="space-y-6">
                  {isChatLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
                  ) : messages?.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[80%]",
                      msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm font-medium shadow-sm",
                        msg.senderId === user?.uid 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                        {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : '...'}
                      </span>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-slate-100">
                <form className="flex gap-3" onSubmit={handleSendMessage}>
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-slate-50 border-none h-14 rounded-2xl px-6 font-medium text-slate-900 focus-visible:ring-1 focus-visible:ring-teal-400" 
                    placeholder="Type your response..." 
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="h-14 w-14 bg-primary text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/20">
              <div className="p-6 bg-white rounded-full shadow-sm mb-4">
                <MessageSquare className="h-12 w-12 text-slate-100" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Select an Inquiry</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">Pick a conversation from the sidebar to view the item details and chat history.</p>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}

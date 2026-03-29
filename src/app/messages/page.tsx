"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  MessageSquare, 
  Loader2, 
  Clock, 
  Mail, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, where } from 'firebase/firestore';
import { FirebaseService } from '@/services/firebase-service';
import { Conversation, ChatMessage, Product } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function MessagesPage() {
  const { user, profile } = useUser();
  const db = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [generalInquiry, setGeneralInquiry] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unreplied' | 'replied'>('all');
  const [isSendingGeneral, setIsSendingGeneral] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSeller = profile?.role === 'seller';

  // Discover actual seller ID from products or fallback
  const productsLookupQuery = useMemoFirebase(() => query(collection(db, 'products'), limit(1)), [db]);
  const { data: sampleProducts } = useCollection<Product>(productsLookupQuery);
  const sellerLookupQuery = useMemoFirebase(() => query(collection(db, 'userProfiles'), where('role', '==', 'seller'), limit(1)), [db]);
  const { data: sellerProfiles } = useCollection<any>(sellerLookupQuery);

  const systemSellerId = useMemo(() => {
    return sampleProducts?.[0]?.sellerId || sellerProfiles?.[0]?.id || 'system-seller';
  }, [sampleProducts, sellerProfiles]);

  const convsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return FirebaseService.getInquiriesQuery(db, user.uid);
  }, [db, user]);

  const { data: rawConversations, isLoading: isConvsLoading } = useCollection<Conversation>(convsQuery);

  const conversations = useMemo(() => {
    if (!rawConversations) return [];
    return [...rawConversations].sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawConversations]);

  const stats = useMemo(() => {
    if (!conversations) return { total: 0, unreplied: 0, replied: 0 };
    return {
      total: conversations.length,
      unreplied: conversations.filter(c => c.status === 'unreplied').length,
      replied: conversations.filter(c => c.status === 'replied').length
    };
  }, [conversations]);

  const chatQuery = useMemoFirebase(() => {
    if (!selectedConvId) return null;
    return FirebaseService.getChatMessagesQuery(db, selectedConvId);
  }, [db, selectedConvId]);

  const { data: messages, isLoading: isChatLoading } = useCollection<ChatMessage>(chatQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !user || !newMessage.trim()) return;
    const senderName = profile?.fullName || profile?.firstName || user.email?.split('@')[0] || 'Member';
    FirebaseService.sendChatMessage(db, selectedConvId, user.uid, senderName, newMessage, isSeller);
    setNewMessage('');
  };

  const handleSendGeneralMessage = async () => {
    if (!user || !generalInquiry.trim()) return;
    setIsSendingGeneral(true);
    try {
      const customerName = profile?.fullName || profile?.firstName || user.email?.split('@')[0] || 'Customer';
      const convId = await FirebaseService.findOrCreateGeneralConversation(db, user.uid, systemSellerId, customerName);
      await FirebaseService.sendChatMessage(db, convId, user.uid, customerName, generalInquiry, false);
      setGeneralInquiry('');
      setSelectedConvId(convId);
      toast({ title: "Message Sent", description: "Workshop will respond shortly." });
    } finally {
      setIsSendingGeneral(false);
    }
  };

  const activeConv = useMemo(() => conversations?.find(c => c.id === selectedConvId), [conversations, selectedConvId]);

  if (isSeller) {
    return (
      <Shell userRole="seller">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-2 sm:p-3 bg-[#0f172a] rounded-xl text-teal-400">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Inquiry Command</h1>
              <p className="text-slate-500 text-xs sm:text-sm font-medium italic">Synchronized workshop chat</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            <Card className="border-none shadow-sm bg-white p-4 sm:p-6 col-span-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unreplied</p>
              <h3 className="text-xl sm:text-3xl font-bold text-amber-500">{stats.unreplied}</h3>
            </Card>
            <Card className="border-none shadow-sm bg-white p-4 sm:p-6 col-span-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Replied</p>
              <h3 className="text-xl sm:text-3xl font-bold text-teal-500">{stats.replied}</h3>
            </Card>
            <Card className="hidden md:flex border-none shadow-sm bg-white p-4 sm:p-6 flex-col justify-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
              <h3 className="text-xl sm:text-3xl font-bold text-slate-900">{stats.total}</h3>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 h-[500px] sm:h-[650px]">
            <Card className="lg:col-span-2 border-none shadow-sm h-full flex flex-col bg-white overflow-hidden rounded-2xl">
              <div className="p-4 border-b bg-[#0f172a] text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Active Chats</h2>
              </div>
              <ScrollArea className="flex-1">
                {isConvsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-teal-500" /></div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={cn(
                          "w-full p-4 flex items-start gap-3 text-left transition-colors border-l-4",
                          selectedConvId === conv.id ? "bg-slate-50 border-[#0f172a]" : "border-transparent"
                        )}
                      >
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={`https://picsum.photos/seed/${conv.id}/60`} />
                          <AvatarFallback><UserIcon className="h-4 w-4 text-slate-400" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-900 truncate">{conv.customerName || 'Customer'}</span>
                            <Badge variant="secondary" className={cn(
                              "text-[8px] px-1.5 h-4",
                              conv.status === 'replied' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {conv.status === 'replied' ? 'Replied' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate italic">"{conv.lastMessage}"</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            <Card className="lg:col-span-3 border-none shadow-sm h-full flex flex-col bg-white overflow-hidden rounded-2xl">
              {selectedConvId ? (
                <>
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://picsum.photos/seed/${activeConv?.id}/60`} />
                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-bold">{activeConv?.customerName}</h3>
                        <p className="text-[9px] font-bold text-teal-500 uppercase">Synchronized</p>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-4 bg-slate-50/20">
                    <div className="space-y-4">
                      {messages?.map((msg) => (
                        <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.senderId === user?.uid ? "ml-auto items-end" : "items-start")}>
                          <span className="text-[9px] text-slate-400 mb-0.5 font-bold uppercase">{msg.senderName}</span>
                          <div className={cn("p-3 rounded-2xl text-xs font-medium shadow-sm", msg.senderId === user?.uid ? "bg-primary text-white rounded-tr-none" : "bg-white border rounded-tl-none")}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <form className="flex gap-2" onSubmit={handleSendMessage}>
                      <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="h-11 bg-slate-50 border-none text-xs" placeholder="Reply..." />
                      <Button type="submit" disabled={!newMessage.trim()} className="h-11 w-11 bg-primary text-white rounded-xl"><Send className="h-4 w-4" /></Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-300 italic">
                  <MessageSquare className="h-10 w-10 mb-2" />
                  <p className="text-sm">Select an inquiry to synchronize.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell userRole="customer">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-2 sm:p-3 bg-[#0f172a] rounded-xl text-teal-400">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Direct Messages</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium italic">Synchronize with our craftsmen</p>
          </div>
        </div>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <Textarea 
              placeholder="How can we help?" 
              className="min-h-[120px] sm:min-h-[160px] bg-slate-50 border-2 rounded-2xl p-4 sm:p-6 text-base sm:text-lg focus-visible:ring-teal-400 transition-all shadow-inner"
              value={generalInquiry}
              onChange={(e) => setGeneralInquiry(e.target.value)}
            />
            <Button 
              onClick={handleSendGeneralMessage}
              disabled={isSendingGeneral || !generalInquiry.trim()}
              className="bg-[#b4ccc7] hover:bg-[#a1bdb7] text-slate-800 font-bold h-12 sm:h-14 px-8 rounded-2xl w-full sm:w-auto gap-2"
            >
              {isSendingGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to Workshop
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm sm:text-lg font-bold text-slate-800 ml-2">Recent Synchronizations</h3>
          {conversations.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <MessageSquare className="h-10 w-10 mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400 italic">No message history yet.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <Card key={conv.id} className="border-none shadow-sm rounded-2xl hover:shadow-md transition-all">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 sm:p-3 bg-teal-50 rounded-xl text-teal-600 font-bold text-xs sm:text-sm">
                      {conv.itemName?.slice(0,1)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{conv.itemName}</h4>
                      <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1 italic font-medium">"{conv.lastMessage}"</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-200" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}

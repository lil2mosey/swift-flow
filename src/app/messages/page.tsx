
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
import { collection, query, limit } from 'firebase/firestore';
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

  // --- Conversations List ---
  const convsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return FirebaseService.getInquiriesQuery(db, user.uid);
  }, [db, user]);

  const { data: conversations, isLoading: isConvsLoading } = useCollection<Conversation>(convsQuery);

  // Discovery: Find the "Seller" ID to chat with (as a customer)
  const productsLookupQuery = useMemoFirebase(() => query(collection(db, 'products'), limit(1)), [db]);
  const { data: sampleProducts } = useCollection<Product>(productsLookupQuery);
  const systemSellerId = useMemo(() => sampleProducts?.[0]?.sellerId || 'system-seller', [sampleProducts]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!conversations) return { total: 0, unreplied: 0, replied: 0 };
    return {
      total: conversations.length,
      unreplied: conversations.filter(c => c.status === 'unreplied').length,
      replied: conversations.filter(c => c.status === 'replied').length
    };
  }, [conversations]);

  // Filtering logic
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (activeFilter === 'all') return conversations;
    return conversations.filter(c => c.status === activeFilter);
  }, [conversations, activeFilter]);

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

    FirebaseService.sendChatMessage(db, selectedConvId, user.uid, newMessage, isSeller);
    setNewMessage('');
  };

  const handleSendGeneralMessage = async () => {
    if (!user || !generalInquiry.trim()) return;
    
    setIsSendingGeneral(true);
    try {
      const convId = await FirebaseService.findOrCreateGeneralConversation(
        db, 
        user.uid, 
        systemSellerId, 
        profile?.fullName || user.email?.split('@')[0] || 'Customer'
      );
      await FirebaseService.sendChatMessage(db, convId, user.uid, generalInquiry, false);
      setGeneralInquiry('');
      setSelectedConvId(convId);
      toast({ title: "Message Sent", description: "The workshop will respond shortly." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not send inquiry." });
    } finally {
      setIsSendingGeneral(false);
    }
  };

  const activeConv = useMemo(() => 
    conversations?.find(c => c.id === selectedConvId), 
    [conversations, selectedConvId]
  );

  // --- Seller View ---
  if (isSeller) {
    return (
      <Shell userRole="seller">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0f172a] rounded-xl">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Inquiry Command Center</h1>
              <p className="text-slate-500 font-medium">Manage and respond to customer questions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Inquiries</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
                </div>
                <div className="p-3 bg-slate-50 rounded-full">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Awaiting Response</p>
                  <h3 className="text-3xl font-bold text-amber-500">{stats.unreplied}</h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-full">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved/Replied</p>
                  <h3 className="text-3xl font-bold text-teal-500">{stats.replied}</h3>
                </div>
                <div className="p-3 bg-teal-50 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-teal-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant={activeFilter === 'all' ? 'default' : 'ghost'} 
              onClick={() => setActiveFilter('all')}
              className={cn("h-10 rounded-lg font-bold px-6", activeFilter === 'all' ? "bg-[#0f172a]" : "text-slate-500")}
            >
              All Threads
            </Button>
            <Button 
              variant={activeFilter === 'unreplied' ? 'default' : 'ghost'} 
              onClick={() => setActiveFilter('unreplied')}
              className={cn("h-10 rounded-lg font-bold px-6", activeFilter === 'unreplied' ? "bg-amber-500" : "text-slate-500")}
            >
              Unreplied ({stats.unreplied})
            </Button>
            <Button 
              variant={activeFilter === 'replied' ? 'default' : 'ghost'} 
              onClick={() => setActiveFilter('replied')}
              className={cn("h-10 rounded-lg font-bold px-6", activeFilter === 'replied' ? "bg-teal-500" : "text-slate-500")}
            >
              Replied
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[650px]">
            <Card className="lg:col-span-2 border-none shadow-sm h-full flex flex-col bg-white rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-50 bg-[#0f172a] text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <h2 className="text-sm font-bold">Conversations ({filteredConversations.length})</h2>
              </div>
              <ScrollArea className="flex-1">
                {isConvsLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-12 text-center text-slate-300 italic text-sm">No conversations found.</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={cn(
                          "w-full p-5 flex items-start gap-4 hover:bg-slate-50 transition-all text-left group border-l-4 border-transparent",
                          selectedConvId === conv.id && "bg-slate-50 border-l-[#0f172a]"
                        )}
                      >
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarImage src={`https://picsum.photos/seed/${conv.id}/60`} />
                          <AvatarFallback className="bg-slate-100"><UserIcon className="h-5 w-5 text-slate-400" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-slate-900 truncate">{conv.customerName || 'Customer'}</span>
                            <Badge variant="secondary" className={cn(
                              "text-[9px] font-bold uppercase py-0 px-2 h-5",
                              conv.status === 'replied' ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {conv.status === 'replied' ? 'Replied' : 'Unreplied'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 italic mb-1 truncate">"{conv.lastMessage}"</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                            <Clock className="h-3 w-3" />
                            {conv.timestamp?.seconds ? format(new Date(conv.timestamp.seconds * 1000), 'MMM d, HH:mm') : '...'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            <Card className="lg:col-span-3 border-none shadow-sm h-full flex flex-col bg-white rounded-2xl overflow-hidden">
              {selectedConvId ? (
                <>
                  <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={`https://picsum.photos/seed/${activeConv?.id}/60`} />
                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{activeConv?.customerName || 'Customer'}</h3>
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 bg-teal-500 rounded-full" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Thread</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 bg-slate-50/20 p-6">
                    <div className="space-y-6">
                      {isChatLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
                      ) : messages?.map((msg) => (
                        <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.senderId === user?.uid ? "ml-auto items-end" : "items-start")}>
                          <div className={cn("p-4 rounded-2xl text-sm font-medium shadow-sm", msg.senderId === user?.uid ? "bg-[#0f172a] text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100")}>
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

                  <div className="p-5 bg-white border-t border-slate-100">
                    <form className="flex gap-3" onSubmit={handleSendMessage}>
                      <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="bg-slate-50 border-none h-12 rounded-xl px-4 font-medium" placeholder="Reply to customer..." />
                      <Button type="submit" disabled={!newMessage.trim()} className="h-12 w-12 bg-[#0f172a] text-white font-bold rounded-xl"><Send className="h-5 w-5" /></Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="p-6 bg-slate-50 rounded-full mb-4"><MessageSquare className="h-12 w-12 text-slate-200" /></div>
                  <h3 className="text-xl font-bold text-slate-900">Select an Inquiry</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-xs italic">Choose a conversation from the sidebar to respond to your customers.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Shell>
    );
  }

  // --- Customer View ---
  return (
    <Shell userRole="customer">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
          <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-[#0f172a] text-white">
            <div className="p-2 bg-slate-800 rounded-lg">
              <MessageSquare className="h-5 w-5 text-teal-400" />
            </div>
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <Textarea 
                placeholder="Type your inquiry to the workshop..." 
                className="min-h-[160px] bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 text-lg font-medium focus-visible:ring-teal-400 focus-visible:border-transparent transition-all"
                value={generalInquiry}
                onChange={(e) => setGeneralInquiry(e.target.value)}
              />
              <Button 
                onClick={handleSendGeneralMessage}
                disabled={isSendingGeneral || !generalInquiry.trim()}
                className="bg-[#b4ccc7] hover:bg-[#a1bdb7] text-slate-800 font-bold h-14 px-10 rounded-2xl shadow-lg transition-all active:scale-[0.98] gap-2"
              >
                {isSendingGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-800">
            <Clock className="h-5 w-5" />
            <h3 className="text-lg font-bold">Recent Messages</h3>
          </div>

          {!selectedConvId && stats.total === 0 ? (
            <Card className="bg-slate-50 border-none py-20 text-center rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="p-6 bg-white rounded-full inline-flex mb-4 shadow-sm">
                <MessageSquare className="h-10 w-10 text-slate-200" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">No messages yet</h4>
              <p className="text-sm text-slate-400 mt-2 font-medium">Send an inquiry above to synchronize with our workshop.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {conversations?.map((conv) => (
                <Card 
                  key={conv.id} 
                  className={cn(
                    "border-none shadow-sm cursor-pointer hover:shadow-md transition-all rounded-3xl group overflow-hidden",
                    selectedConvId === conv.id ? "ring-2 ring-teal-400" : ""
                  )}
                  onClick={() => setSelectedConvId(conv.id)}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 font-bold">
                        {conv.itemName?.slice(0, 1) || 'G'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{conv.itemName || 'Store Inquiry'}</h4>
                        <p className="text-sm text-slate-400 line-clamp-1 italic">"{conv.lastMessage}"</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {conv.timestamp?.seconds ? format(new Date(conv.timestamp.seconds * 1000), 'MMM d, HH:mm') : 'Syncing...'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {selectedConvId && (
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                    <h4 className="font-bold text-sm uppercase tracking-widest">Chat History</h4>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedConvId(null)} className="h-8 text-slate-400 hover:text-white">Close Chat</Button>
                  </div>
                  <ScrollArea className="h-[400px] p-6 bg-slate-50/50">
                    <div className="space-y-6">
                      {isChatLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-400" /></div>
                      ) : messages?.map((msg) => (
                        <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.senderId === user?.uid ? "ml-auto items-end" : "items-start")}>
                          <div className={cn("p-4 rounded-3xl text-sm font-medium shadow-sm", msg.senderId === user?.uid ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100")}>
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
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

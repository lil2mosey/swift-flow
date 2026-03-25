
"use client";

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, Search, Phone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const contacts = [
  { id: '1', name: 'James Kimani', lastMsg: 'I have paid for order #101', time: '12:45 PM', unread: 1 },
  { id: '2', name: 'Sarah Wambui', lastMsg: 'When will it be shipped?', time: '9:20 AM', unread: 0 },
  { id: '3', name: 'David Otieno', lastMsg: 'Thanks for the quick delivery!', time: 'Yesterday', unread: 0 },
];

const mockChat = [
  { id: '1', sender: 'James Kimani', text: 'Hello, I just placed an order.', time: '12:30 PM', me: false },
  { id: '2', sender: 'Me', text: 'Hi James! We received it. We are processing it now.', time: '12:35 PM', me: true },
  { id: '3', sender: 'James Kimani', text: 'Great, I have also completed the payment via M-Pesa.', time: '12:45 PM', me: false },
];

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState(contacts[0]);
  const [message, setMessage] = useState('');

  return (
    <Shell userRole="seller">
      <PageHeader 
        title="Messages" 
        description="Direct communication with your customers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        {/* Contact List */}
        <Card className="border-none shadow-sm h-full flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9 bg-slate-50 border-none" placeholder="Search conversations..." />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setActiveChat(contact)}
                  className={cn(
                    "w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left",
                    activeChat.id === contact.id && "bg-slate-50 border-r-4 border-teal-500"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://picsum.photos/seed/${contact.id}/40`} />
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-bold text-slate-900 truncate">{contact.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{contact.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{contact.lastMsg}</p>
                  </div>
                  {contact.unread > 0 && (
                    <div className="h-2 w-2 bg-teal-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 border-none shadow-sm h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://picsum.photos/seed/${activeChat.id}/40`} />
                <AvatarFallback>{activeChat.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeChat.name}</h3>
                <span className="text-[10px] text-teal-600 font-bold uppercase">Online</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-slate-50/50 p-6">
            <div className="space-y-6">
              {mockChat.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.me ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm font-medium leading-relaxed",
                    msg.me ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                    {msg.time}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 bg-white border-t border-slate-100">
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-slate-50 border-none h-11" 
                placeholder="Type your message here..." 
              />
              <Button className="h-11 px-6 bg-primary hover:bg-slate-800 text-white font-bold gap-2">
                <Send className="h-4 w-4" /> Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </Shell>
  );
}

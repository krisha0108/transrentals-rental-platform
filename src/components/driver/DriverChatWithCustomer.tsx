'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderType: 'customer' | 'driver';
  content: string;
  createdAt: string;
  status: string;
}

interface DriverChatWithCustomerProps {
  bookingId: string;
  bookingType?: string;
  customerName: string;
}

export function DriverChatWithCustomer({
  bookingId,
  bookingType = 'chauffeur',
  customerName,
}: DriverChatWithCustomerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastSince, setLastSince] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOrCreateConversation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/driver-app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, bookingType }),
      });
      const data = await res.json();
      if (data.success) {
        setConversationId(data.conversation.id);
        return data.conversation.id;
      }
    } catch {}
    setIsLoading(false);
    return null;
  };

  const fetchMessages = async (convId: string, since?: string | null) => {
    try {
      const qs = since ? `?since=${encodeURIComponent(since)}` : '';
      const res = await fetch(`/api/driver-app/chat/${convId}/messages${qs}`);
      const data = await res.json();
      if (data.success) {
        const incoming: ChatMessage[] = data.messages || [];
        if (since) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const fresh = incoming.filter(m => !ids.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        } else {
          setMessages(incoming);
        }
        if (incoming.length > 0) setLastSince(incoming[incoming.length - 1].createdAt);
      }
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      const convId = conversationId || await getOrCreateConversation();
      if (!convId) return;
      await fetchMessages(convId, null);
      pollRef.current = setInterval(() => {
        setLastSince(prev => { fetchMessages(convId, prev); return prev; });
      }, 4000);
    };

    init();

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || isSending || !conversationId) return;
    setNewMessage('');
    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, senderType: 'driver', content: text, createdAt: new Date().toISOString(), status: 'SENT' }]);
    try {
      const res = await fetch(`/api/driver-app/chat/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
        setLastSince(data.message.createdAt);
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(text);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(text);
    }
    setIsSending(false);
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 transition"
      >
        <MessageCircle className="w-5 h-5" />
        Chat with Customer
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white w-full sm:w-[400px] sm:max-w-full rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: '80vh', maxHeight: '600px' }}>
            {/* Header */}
            <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{customerName}</p>
                  <p className="text-xs text-emerald-200">Customer</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-emerald-500 rounded-lg transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Start chatting with your customer</p>
                  <p className="text-xs text-gray-400 mt-1">Messages are private between you and your customer</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isDriver = msg.senderType === 'driver';
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isDriver ? 'justify-end' : 'justify-start'}`}>
                      {!isDriver && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                          <span className="text-[10px] font-bold text-emerald-700">{customerName.charAt(0)}</span>
                        </div>
                      )}
                      <div className={`max-w-[72%] px-3 py-2 rounded-2xl ${
                        isDriver
                          ? 'bg-emerald-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isDriver ? 'text-emerald-200' : 'text-gray-400'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-3 py-3 flex-shrink-0">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-2">
                <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-transparent resize-none text-sm focus:outline-none placeholder:text-gray-400 leading-relaxed"
                    style={{ maxHeight: '80px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="h-10 w-10 bg-emerald-600 text-white rounded-xl disabled:opacity-40 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center shadow-sm flex-shrink-0"
                >
                  {isSending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

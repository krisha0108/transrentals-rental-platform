// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

interface WanderChatProps {
  vendorId: string;
  customerId: string;
  senderType: 'vendor' | 'customer';
  senderId: string;
  senderName: string;
  otherName: string;
  bookingType: string;
  bookingId?: string;
  quoteId?: string;
}

export default function WanderChat({
  vendorId, customerId, senderType, senderId, senderName, otherName,
  bookingType, bookingId, quoteId,
}: WanderChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);
  const lastMsgCountRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const initConversation = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId, customerId, bookingType,
          bookingId: bookingId || null,
          quoteId: quoteId || null,
          subject: 'Wander Tour Chat',
        }),
      });
      const data = await res.json();
      if (data.success && data.conversation?.id) {
        setConversationId(data.conversation.id);
        return data.conversation.id;
      } else {
        setError('Could not start chat');
        return null;
      }
    } catch {
      setError('Failed to connect');
      return null;
    }
  }, [vendorId, customerId, bookingType, bookingId, quoteId]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}?userType=${senderType}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if ((data.messages?.length || 0) !== lastMsgCountRef.current) {
          lastMsgCountRef.current = data.messages?.length || 0;
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch {}
  }, [senderType, scrollToBottom]);

  // Init on first open
  useEffect(() => {
    if (!open || initialized) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const convId = await initConversation();
      if (cancelled || !convId) { setLoading(false); return; }
      await fetchMessages(convId);
      setLoading(false);
      setInitialized(true);
    })();
    return () => { cancelled = true; };
  }, [open, initialized]);

  // Poll every 5s when open
  useEffect(() => {
    if (!open || !conversationId) return;
    pollRef.current = setInterval(() => fetchMessages(conversationId), 5000);
    return () => clearInterval(pollRef.current);
  }, [open, conversationId, fetchMessages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    const tempMsg = {
      id: `temp-${Date.now()}`,
      senderType, content: text,
      createdAt: new Date().toISOString(),
      status: 'SENDING',
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType, senderId, senderName, content: text, messageType: 'TEXT' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const chatLabel = senderType === 'customer' ? `Chat with ${otherName}` : `Chat with ${otherName}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">{chatLabel}</p>
            <p className="text-xs text-gray-400">Discuss tour details</p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />
        }
      </button>

      {/* Chat body */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Messages */}
          <div className="h-80 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-sm text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-300 mt-1">Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isMe = msg.senderType === senderType;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-300'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {msg.status === 'SENDING' && ' · sending...'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 px-3 py-2 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 max-h-24 bg-gray-50"
                style={{ minHeight: '38px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white flex items-center justify-center transition flex-shrink-0"
              >
                {sending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Loader2, ChevronLeft, X, Building2, User } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  ownerName?: string;
  phone?: string;
  unreadCount: number;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
}

interface Message {
  id: string;
  senderType: 'customer' | 'vendor';
  content: string;
  senderName?: string;
  createdAt: string;
  status?: string;
}

interface B2BBookingChatProps {
  bookingId: string;
  customerId?: string;
  customerName?: string;
  defaultOpen?: boolean;
}

export default function B2BBookingChat({ bookingId, customerId, customerName, defaultOpen }: B2BBookingChatProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchVendors = useCallback(async () => {
    setLoadingVendors(true);
    try {
      const params = new URLSearchParams();
      if (customerId) params.set('customer_id', customerId);
      const res = await fetch(`/api/b2b/bookings/${bookingId}/chat?${params}`);
      const data = await res.json();
      if (data.success) {
        setVendors(data.vendors || []);
        setTotalUnread(data.vendors?.reduce((sum: number, v: Vendor) => sum + v.unreadCount, 0) || 0);
      }
    } catch (e) {
      console.error('[B2BChat] fetchVendors error', e);
    } finally {
      setLoadingVendors(false);
    }
  }, [bookingId, customerId]);

  const fetchMessages = useCallback(async (vendorId: string) => {
    try {
      const params = new URLSearchParams({ vendorId });
      if (customerId) params.set('customer_id', customerId);
      const res = await fetch(`/api/b2b/bookings/${bookingId}/chat?${params}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, unreadCount: 0 } : v));
        setTotalUnread(prev => Math.max(0, prev - (data.unreadCount || 0)));
      }
    } catch (e) {
      console.error('[B2BChat] fetchMessages error', e);
    }
  }, [bookingId, customerId]);

  const openChat = () => {
    setIsOpen(true);
    fetchVendors();
  };

  const closeChat = () => {
    setIsOpen(false);
    setSelectedVendor(null);
    setMessages([]);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  // Auto-open if defaultOpen
  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true);
      fetchVendors();
    }
  }, [defaultOpen, fetchVendors]);

  // Polling when vendor selected
  useEffect(() => {
    if (selectedVendor && isOpen) {
      setLoadingMessages(true);
      fetchMessages(selectedVendor.id).finally(() => setLoadingMessages(false));
      pollingRef.current = setInterval(() => fetchMessages(selectedVendor.id), 5000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [selectedVendor, isOpen, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage() {
    if (!newMessage.trim() || !selectedVendor || sending) return;
    const msgText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      senderType: 'customer',
      content: msgText,
      senderName: customerName || 'You',
      createdAt: new Date().toISOString(),
      status: 'SENT',
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const res = await fetch(`/api/b2b/bookings/${bookingId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText, vendorId: selectedVendor.id, customerId, customerName }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
      }
    } catch (e) {
      console.error('[B2BChat] sendMessage error', e);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function groupByDate(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach(msg => {
      const date = formatDate(msg.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.date === date) last.messages.push(msg);
      else groups.push({ date, messages: [msg] });
    });
    return groups;
  }

  return (
    <>
      {/* Inline Button */}
      <button
        onClick={openChat}
        className="w-full flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-green-200"
      >
        <MessageCircle className="w-5 h-5" />
        Chat with Vendor
        {totalUnread > 0 && (
          <span className="bg-white text-green-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Center Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={closeChat}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            style={{ height: '85vh', maxHeight: '600px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center gap-3 px-4 py-4 text-white ${selectedVendor ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}>
              {selectedVendor ? (
                <>
                  <button onClick={() => { setSelectedVendor(null); setMessages([]); }} className="p-1.5 hover:bg-white/20 rounded-lg transition">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 bg-white/25 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {selectedVendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{selectedVendor.name}</p>
                    {selectedVendor.phone && <p className="text-xs text-green-100">{selectedVendor.phone}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 bg-white/25 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Vendor Chat</p>
                    <p className="text-xs text-green-100">Select a vendor to start chatting</p>
                  </div>
                </>
              )}
              <button onClick={closeChat} className="p-1.5 hover:bg-white/20 rounded-full transition flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vendor List */}
            {!selectedVendor && (
              <div className="flex-1 overflow-y-auto bg-white">
                {loadingVendors ? (
                  <div className="flex flex-col justify-center items-center h-full gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    <p className="text-sm text-gray-400">Loading vendors...</p>
                  </div>
                ) : vendors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 px-8">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <Building2 className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-semibold text-gray-500 text-center">No vendors assigned yet</p>
                    <p className="text-sm text-center mt-1 text-gray-400">Chat will be available after vendor confirmation.</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {vendors.map(vendor => (
                      <button
                        key={vendor.id}
                        onClick={() => setSelectedVendor(vendor)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 rounded-2xl text-left transition-all"
                      >
                        <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white text-base flex-shrink-0 shadow-sm">
                          {vendor.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{vendor.name}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {vendor.lastMessage || 'Tap to start chatting'}
                          </p>
                        </div>
                        {vendor.unreadCount > 0 ? (
                          <span className="bg-green-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                            {vendor.unreadCount}
                          </span>
                        ) : (
                          <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat Messages */}
            {selectedVendor && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-7 h-7 animate-spin text-green-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <MessageCircle className="w-7 h-7 text-gray-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500">No messages yet</p>
                        <p className="text-xs text-gray-400 mt-0.5">Say hello to get started!</p>
                      </div>
                    </div>
                  ) : (
                    groupByDate(messages).map(group => (
                      <div key={group.date}>
                        <div className="flex justify-center my-3">
                          <span className="bg-white text-gray-400 text-xs px-3 py-1 rounded-full border border-gray-200 shadow-sm">{group.date}</span>
                        </div>
                        {group.messages.map(msg => (
                          <div key={msg.id} className={`flex mb-2 ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                              msg.senderType === 'customer'
                                ? 'bg-green-600 text-white rounded-br-sm shadow-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
                            }`}>
                              {msg.senderType === 'vendor' && msg.senderName && (
                                <p className="text-[10px] font-bold text-green-600 mb-1 uppercase tracking-wide">{msg.senderName}</p>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${msg.senderType === 'customer' ? 'text-green-200 text-right' : 'text-gray-400'}`}>
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-3 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-1.5">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none py-1.5"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                        newMessage.trim() && !sending
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                          : 'text-gray-400'
                      }`}
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

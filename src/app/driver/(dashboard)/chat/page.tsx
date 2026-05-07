'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, RefreshCw, MessageCircle, Phone, Search, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DriverConv {
  id: string;
  bookingType: string;
  bookingId: string | null;
  bookingNumber: string | null;
  subject: string | null;
  status: string;
  unreadCount: number;
  lastMessage: { content: string; senderType: string; createdAt: string } | null;
  lastMessageAt: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  createdAt: string;
}

interface ChatMsg {
  id: string;
  senderType: string;
  content: string;
  createdAt: string;
  status: string;
}

const SVC_LABEL: Record<string, string> = {
  chauffeur: 'Chauffeur', bus: 'Bus', truck: 'Truck',
  packers: 'Packers', equipment: 'Equipment', luxury: 'Luxury', b2b: 'B2B',
};
const SVC_COLOR: Record<string, string> = {
  chauffeur: 'bg-blue-100 text-blue-700',
  bus: 'bg-amber-100 text-amber-700',
  truck: 'bg-orange-100 text-orange-700',
  packers: 'bg-green-100 text-green-700',
  equipment: 'bg-sky-100 text-sky-700',
  luxury: 'bg-purple-100 text-purple-700',
  b2b: 'bg-violet-100 text-violet-700',
};

export default function DriverChatPage() {
  const [conversations, setConversations] = useState<DriverConv[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastSince, setLastSince] = useState<string | null>(null);
  const [showMobile, setShowMobile] = useState(true);
  const [search, setSearch] = useState('');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/driver-app/chat');
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch {}
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async (since?: string | null) => {
    if (!selectedId) return;
    try {
      const qs = since ? `?since=${encodeURIComponent(since)}` : '';
      const res = await fetch(`/api/driver-app/chat/${selectedId}/messages${qs}`);
      const data = await res.json();
      if (data.success) {
        const newMsgs = data.messages || [];
        if (since) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const fresh = newMsgs.filter((m: ChatMsg) => !ids.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        } else {
          setMessages(newMsgs);
        }
        if (newMsgs.length > 0) setLastSince(newMsgs[newMsgs.length - 1].createdAt);
      }
    } catch {}
    setLoadingMsgs(false);
  }, [selectedId]);

  useEffect(() => {
    fetchConversations();
    pollRef.current = setInterval(fetchConversations, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMsgs(true);
    setMessages([]);
    setLastSince(null);
    fetchMessages(null);
    setShowMobile(false);
    msgPollRef.current = setInterval(() => {
      setLastSince(prev => { fetchMessages(prev); return prev; });
    }, 3000);
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
  }, [selectedId]);

  useEffect(() => {
    if (messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMsg = async () => {
    if (!newMsg.trim() || !selectedId || sending) return;
    const text = newMsg.trim();
    setNewMsg('');
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, senderType: 'driver', content: text, createdAt: new Date().toISOString(), status: 'SENT' }]);
    try {
      const res = await fetch(`/api/driver-app/chat/${selectedId}/messages`, {
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
        setNewMsg(text);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMsg(text);
    }
    setSending(false);
  };

  const selectedConv = conversations.find(c => c.id === selectedId);

  const filtered = search.trim()
    ? conversations.filter(c => {
        const q = search.toLowerCase();
        return (
          c.customer?.name?.toLowerCase().includes(q) ||
          c.bookingId?.toLowerCase().includes(q) ||
          (SVC_LABEL[c.bookingType] || c.bookingType)?.toLowerCase().includes(q)
        );
      })
    : conversations;

  const formatTime = (d: string) => {
    const date = new Date(d);
    const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diff === 0) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="h-[calc(100vh-148px)] flex rounded-2xl overflow-hidden shadow-md border border-gray-200">
      {/* Sidebar */}
      <div className={`w-72 bg-white flex flex-col border-r border-gray-100 flex-shrink-0 ${!showMobile && selectedId ? 'hidden lg:flex' : 'flex'}`}>
        {/* Sidebar header */}
        <div className="px-4 py-3.5 bg-emerald-600 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-100" />
            <span className="font-semibold text-white text-sm">Messages</span>
            {conversations.length > 0 && (
              <span className="bg-emerald-500/60 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
                {conversations.length}
              </span>
            )}
          </div>
          <button onClick={fetchConversations} className="p-1.5 hover:bg-emerald-500 rounded-lg transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-200" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, booking ID..."
              className="flex-1 text-xs bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-700"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-2 bg-gray-100 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">{search ? 'No results found' : 'No conversations yet'}</p>
              <p className="text-xs text-gray-300 mt-1">{search ? 'Try a different search' : 'Accept a booking to start chatting'}</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filtered.map(conv => {
                const isActive = selectedId === conv.id;
                const name = conv.customer?.name || 'Customer';
                const svcLabel = SVC_LABEL[conv.bookingType] || conv.bookingType;
                const svcColor = isActive ? 'bg-white/20 text-white' : (SVC_COLOR[conv.bookingType] || 'bg-gray-100 text-gray-500');
                const shortId = conv.bookingNumber || (conv.bookingId ? conv.bookingId.slice(-8).toUpperCase() : '—');
                return (
                  <button key={conv.id} onClick={() => setSelectedId(conv.id)}
                    className={`w-full px-3 py-2.5 text-left rounded-xl flex items-center gap-3 transition-all ${
                      isActive ? 'bg-emerald-600 shadow-sm' : 'hover:bg-gray-50'
                    }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-1">
                        <span className={`text-sm truncate ${
                          isActive ? 'font-semibold text-white' : conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                        }`}>{name}</span>
                        <span className={`text-xs flex-shrink-0 ${isActive ? 'text-emerald-200' : 'text-gray-400'}`}>
                          {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className={`text-xs truncate ${isActive ? 'text-emerald-200' : 'text-gray-400'}`}>
                          {conv.lastMessage?.content || 'No messages'}
                        </p>
                        {conv.unreadCount > 0 && !isActive && (
                          <span className="bg-emerald-600 text-white text-xs font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center ml-1 flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {/* Service + booking ID row */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${svcColor}`}>
                          {svcLabel}
                        </span>
                        <span className={`text-[10px] font-mono ${isActive ? 'text-emerald-300' : 'text-gray-400'}`}>
                          #{shortId}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 ${showMobile && !selectedId ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <MessageCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Select a conversation</p>
              <p className="text-xs text-gray-400 mt-1">Choose a customer from the list to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedId(null); setShowMobile(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg lg:hidden">
                  <ArrowLeft className="w-4 h-4 text-gray-500" />
                </button>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                    {(selectedConv?.customer?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedConv?.customer?.name || 'Customer'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${SVC_COLOR[selectedConv?.bookingType || ''] || 'bg-gray-100 text-gray-500'}`}>
                      {SVC_LABEL[selectedConv?.bookingType || ''] || selectedConv?.bookingType}
                    </span>
                    {selectedConv?.bookingId && (
                      <span className="text-[10px] font-mono text-gray-400">#{selectedConv.bookingNumber || selectedConv.bookingId?.slice(-8).toUpperCase()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv?.bookingId && (
                  <Link
                    href={`/driver/bookings/${selectedConv.bookingNumber || selectedConv.bookingId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 text-xs font-semibold transition-colors border border-gray-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Booking
                  </Link>
                )}
                {selectedConv?.customer?.phone && (
                  <a href={`tel:${selectedConv.customer.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold transition-colors border border-emerald-200/60">
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 29px, #e5e7eb1a 30px)' }}>
              {loadingMsgs ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-xs text-gray-400 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    No messages yet — say hello!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {messages.map((msg, idx) => {
                    const isDriver = msg.senderType === 'driver';
                    const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="bg-white text-gray-400 text-xs px-3 py-1 rounded-full shadow-sm border border-gray-100">
                              {new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex items-end gap-2 ${isDriver ? 'justify-end' : 'justify-start'}`}>
                          {!isDriver && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mb-0.5">
                              <span className="text-[10px] font-bold text-gray-500">{(selectedConv?.customer?.name || 'C').charAt(0)}</span>
                            </div>
                          )}
                          <div className={`max-w-[65%] px-3.5 py-2 rounded-2xl ${
                            isDriver
                              ? 'bg-emerald-600 text-white rounded-br-sm shadow-sm'
                              : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 text-right ${isDriver ? 'text-emerald-200' : 'text-gray-300'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <form onSubmit={e => { e.preventDefault(); sendMsg(); }} className="flex items-end gap-2">
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                  <textarea
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-transparent resize-none text-sm focus:outline-none placeholder:text-gray-400 leading-relaxed"
                    style={{ maxHeight: '80px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMsg.trim() || sending}
                  className="h-10 w-10 bg-emerald-600 text-white rounded-xl disabled:opacity-40 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center shadow-sm flex-shrink-0"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

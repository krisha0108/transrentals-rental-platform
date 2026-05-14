'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import {
  MessageCircle, Send, Search, CheckCheck, Check, RefreshCw,
  ArrowLeft, Smile, Paperclip, X, Zap, FileIcon, Download,
  Loader2, Eye, ChevronDown, Building2, Car, Bike, Bus, Truck,
  Package, Star, Settings, Phone,
} from 'lucide-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  bookingType: string;
  bookingId: string | null;
  bookingNumber: string | null;
  subject: string | null;
  status: string;
  unreadCount: number;
  lastMessage: { id: string; content: string; senderType: string; messageType: string; createdAt: string } | null;
  lastMessageAt: string | null;
  participant: { id: string; name: string; logo?: string; phone?: string };
  createdAt: string;
}

interface Message {
  id: string;
  senderType: string;
  senderId: string | null;
  senderName: string | null;
  messageType: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: string;
  readAt: string | null;
  createdAt: string;
}

interface VendorGroup {
  vendorId: string;
  vendorName: string;
  logo?: string;
  phone?: string;
  conversations: Conversation[];
  totalUnread: number;
  lastMessageAt: string | null;
  lastMessage: Conversation['lastMessage'];
}

interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_COLORS: Record<string, string> = {
  bike: '#3B82F6', car: '#8B5CF6', chauffeur: '#8B5CF6', luxury: '#EC4899',
  bus: '#F97316', truck: '#6366F1', equipment: '#14B8A6', packers: '#F59E0B',
  'self-drive': '#06B6D4', wander: '#10B981', wander_booking: '#10B981',
};

const TYPE_LABELS: Record<string, string> = {
  bike: 'Bike', car: 'Self-Drive', chauffeur: 'Car', luxury: 'Luxury',
  bus: 'Bus', truck: 'Truck', equipment: 'Equipment', packers: 'Packers',
  'self-drive': 'Self-Drive', wander: 'Wander', wander_booking: 'Wander',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerChatPage() {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedVendorGroup, setSelectedVendorGroup] = useState<VendorGroup | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatMode, setChatMode] = useState<'vendor' | 'driver'>('vendor');
  const [driverConversations, setDriverConversations] = useState<any[]>([]);
  const [selectedDriverConvId, setSelectedDriverConvId] = useState<string | null>(null);
  const [driverMessages, setDriverMessages] = useState<any[]>([]);
  const [driverTotalUnread, setDriverTotalUnread] = useState(0);
  const [isLoadingDriverMsgs, setIsLoadingDriverMsgs] = useState(false);
  const [isLoadingDriverConvs, setIsLoadingDriverConvs] = useState(false);
  const [driverLastSince, setDriverLastSince] = useState<string | null>(null);
  const [driverNewMsg, setDriverNewMsg] = useState('');
  const [isDriverSending, setIsDriverSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driverPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Derived: active conversation
  const selectedConversation = useMemo(() => {
    if (!selectedVendorGroup) return null;
    return selectedVendorGroup.conversations.find(c => c.id === activeConvId)
      || selectedVendorGroup.conversations[0]
      || null;
  }, [selectedVendorGroup, activeConvId]);

  // ── Load customer from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem('customer');
      if (raw) setCustomer(JSON.parse(raw));
    } catch {}
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Fetch conversations ──
  const fetchConversations = useCallback(async () => {
    if (!customer) return;
    const identifier = customer.phone || customer.email || '';
    if (!identifier) return;
    try {
      const param = customer.phone ? `phone=${customer.phone}` : `email=${customer.email}`;
      const res = await fetch(`/api/chat/conversations?userType=customer&${param}`);
      const data = await res.json();
      if (data.success) {
        const convs: Conversation[] = data.conversations || [];
        setConversations(convs);
        setTotalUnread(data.totalUnread || 0);

        // Auto-select vendor conversation from URL params (only on first load)
        const urlParams = new URLSearchParams(window.location.search);
        const urlConvId = urlParams.get('conv');
        const urlMode = urlParams.get('mode');
        if (urlConvId && urlMode === 'vendor') {
          const target = convs.find(c => c.id === urlConvId);
          if (target) {
            const vendorId = target.participant.id;
            const group: VendorGroup = {
              vendorId,
              vendorName: target.participant.name,
              logo: target.participant.logo,
              phone: target.participant.phone,
              conversations: convs.filter(c => c.participant.id === vendorId),
              totalUnread: 0,
              lastMessageAt: target.lastMessageAt,
              lastMessage: target.lastMessage,
            };
            group.totalUnread = group.conversations.reduce((s, c) => s + c.unreadCount, 0);
            setSelectedVendorGroup(group);
            setActiveConvId(urlConvId);
            setShowMobileSidebar(false);
            // Clear params so polls don't re-select on every tick
            window.history.replaceState({}, '', '/customer/chat');
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [customer]);

  // ── Fetch messages ──
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}?userType=customer`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setConversations(prev =>
          prev.map(c => c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversation]);

  // ── Driver chat fetch functions ──
  const fetchDriverConversations = useCallback(async () => {
    if (!customer) return;
    const param = customer.phone ? `phone=${customer.phone}` : customer.email ? `email=${customer.email}` : '';
    if (!param) return;
    setIsLoadingDriverConvs(true);
    try {
      const res = await fetch(`/api/customer/driver-chat?${param}`);
      const data = await res.json();
      if (data.success) {
        setDriverConversations(data.conversations || []);
        setDriverTotalUnread(data.totalUnread || 0);
      }
    } catch {}
    setIsLoadingDriverConvs(false);
  }, [customer]);

  const fetchDriverMessages = useCallback(async (since?: string | null) => {
    if (!selectedDriverConvId) return;
    try {
      const qs = since ? `?since=${encodeURIComponent(since)}` : '';
      const res = await fetch(`/api/customer/driver-chat/${selectedDriverConvId}/messages${qs}`);
      const data = await res.json();
      if (data.success) {
        const newMsgs = data.messages || [];
        if (since) {
          setDriverMessages(prev => {
            const ids = new Set(prev.map((m: any) => m.id));
            const fresh = newMsgs.filter((m: any) => !ids.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        } else {
          setDriverMessages(newMsgs);
          // Backfill bookingNumber into driverConversations if not already present
          if (data.conversation?.bookingNumber) {
            setDriverConversations(prev => prev.map(c =>
              c.id === selectedDriverConvId && !c.bookingNumber
                ? { ...c, bookingNumber: data.conversation.bookingNumber }
                : c
            ));
          }
        }
        if (newMsgs.length > 0) setDriverLastSince(newMsgs[newMsgs.length - 1].createdAt);
      }
    } catch {}
    setIsLoadingDriverMsgs(false);
  }, [selectedDriverConvId]);

  const sendDriverMessage = async () => {
    if (!driverNewMsg.trim() || !selectedDriverConvId || isDriverSending) return;
    const text = driverNewMsg.trim();
    setDriverNewMsg('');
    setIsDriverSending(true);
    const tempId = `temp-${Date.now()}`;
    setDriverMessages(prev => [...prev, { id: tempId, senderType: 'customer', content: text, createdAt: new Date().toISOString(), status: 'SENT' }]);
    try {
      const res = await fetch(`/api/customer/driver-chat/${selectedDriverConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, senderName: customer?.name || 'Customer' }),
      });
      const data = await res.json();
      if (data.success) {
        setDriverMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
        setDriverLastSince(data.message.createdAt);
      } else {
        setDriverMessages(prev => prev.filter(m => m.id !== tempId));
        setDriverNewMsg(text);
      }
    } catch {
      setDriverMessages(prev => prev.filter(m => m.id !== tempId));
      setDriverNewMsg(text);
    } finally {
      setIsDriverSending(false);
    }
  };

  // ── Send message ──
  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation || isSending) return;
    const text = content.trim();
    setNewMessage('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, senderType: 'customer', senderId: null, senderName: 'You',
      messageType: 'TEXT', content: text, status: 'SENT', readAt: null, createdAt: new Date().toISOString(),
    }]);
    scrollToBottom();

    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType: 'customer', content: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
        setConversations(prev => prev.map(c => c.id === selectedConversation.id
          ? { ...c, lastMessage: { id: data.message.id, content: text, senderType: 'customer', messageType: 'TEXT', createdAt: new Date().toISOString() }, lastMessageAt: new Date().toISOString() }
          : c
        ));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(text);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // ── File upload ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;
    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) { alert('Failed to upload file'); return; }

      const fileUrl = uploadData.url;
      const isImage = file.type.startsWith('image/');
      const contentText = isImage ? `📷 ${file.name}` : file.name;
      const tempId = `temp-${Date.now()}`;

      setMessages(prev => [...prev, {
        id: tempId, senderType: 'customer', senderId: null, senderName: 'You',
        messageType: isImage ? 'IMAGE' : 'FILE', content: contentText,
        attachmentUrl: fileUrl, attachmentName: file.name, status: 'SENT', readAt: null, createdAt: new Date().toISOString(),
      }]);
      scrollToBottom();

      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType: 'customer', content: contentText, messageType: isImage ? 'IMAGE' : 'FILE', attachmentUrl: fileUrl, attachmentName: file.name, attachmentSize: file.size, attachmentType: file.type }),
      });
      const data = await res.json();
      if (data.success) setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      else setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch { } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Emoji ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // ── Initial load ──
  useEffect(() => {
    if (customer) fetchConversations();
  }, [customer, fetchConversations]);

  // ── Auto-select conversation from URL query params ──
  useEffect(() => {
    if (!customer) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const convId = params.get('conv');
    if (!convId) return;

    if (mode === 'driver') {
      setChatMode('driver');
      setSelectedDriverConvId(convId);
      setShowMobileSidebar(false);
      fetchDriverConversations();
      window.history.replaceState({}, '', '/customer/chat');
    } else if (mode === 'vendor') {
      setChatMode('vendor');
      setShowMobileSidebar(false);
      // fetchConversations handles vendor auto-select via window.location.search
    }
  }, [customer, fetchDriverConversations]);

  // ── Load messages + polling ──
  useEffect(() => {
    if (selectedConversation) {
      setIsLoadingMessages(true);
      setMessages([]);
      fetchMessages();
      setShowMobileSidebar(false);
      pollingRef.current = setInterval(fetchMessages, 3000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [selectedConversation?.id, fetchMessages]);

  // ── Scroll on new messages ──
  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        const near = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (near || prevMsgCount.current === 0) scrollToBottom();
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, scrollToBottom]);

  // ── Poll conversations ──
  useEffect(() => {
    if (!customer) return;
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations, customer]);

  // ── Fetch driver conversations ──
  useEffect(() => {
    if (customer && chatMode === 'driver') fetchDriverConversations();
  }, [customer, chatMode, fetchDriverConversations]);

  // ── Driver messages polling ──
  useEffect(() => {
    if (chatMode !== 'driver' || !selectedDriverConvId) return;
    setIsLoadingDriverMsgs(true);
    setDriverMessages([]);
    setDriverLastSince(null);
    fetchDriverMessages(null);
    driverPollRef.current = setInterval(() => {
      setDriverLastSince(prev => { fetchDriverMessages(prev); return prev; });
    }, 3000);
    return () => { if (driverPollRef.current) clearInterval(driverPollRef.current); };
  }, [selectedDriverConvId, chatMode]);

  // ── Helpers ──
  const formatTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diff === 0) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return date.toLocaleDateString('en-IN', { weekday: 'short' });
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDateGroup = (d: string | null) => {
    if (!d) return 'Earlier';
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return 'This Week';
    return 'Earlier';
  };

  // ── Filter ──
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) {
      if (activeTab === 'all') return true;
      if (activeTab === 'unread') return conv.unreadCount > 0;
      return conv.bookingType.toLowerCase().includes(activeTab);
    }
    const q = searchQuery.toLowerCase();
    return conv.participant.name.toLowerCase().includes(q) || conv.bookingType.toLowerCase().includes(q);
  });

  // ── Group by vendor ──
  const vendorGroups = useMemo<VendorGroup[]>(() => {
    const map = new Map<string, VendorGroup>();
    filteredConversations.forEach(conv => {
      const existing = map.get(conv.participant.id);
      if (existing) {
        existing.conversations.push(conv);
        existing.totalUnread += conv.unreadCount;
        if (!existing.lastMessageAt || (conv.lastMessageAt && conv.lastMessageAt > existing.lastMessageAt)) {
          existing.lastMessageAt = conv.lastMessageAt;
          existing.lastMessage = conv.lastMessage;
        }
      } else {
        map.set(conv.participant.id, {
          vendorId: conv.participant.id,
          vendorName: conv.participant.name,
          logo: conv.participant.logo,
          phone: conv.participant.phone,
          conversations: [conv],
          totalUnread: conv.unreadCount,
          lastMessageAt: conv.lastMessageAt,
          lastMessage: conv.lastMessage,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.localeCompare(a.lastMessageAt);
    });
  }, [filteredConversations]);

  // ── Group vendors by date ──
  const groupedVendors: { label: string; items: VendorGroup[] }[] = [];
  let currentDateGroup = '';
  vendorGroups.forEach(vg => {
    const label = getDateGroup(vg.lastMessageAt);
    if (label !== currentDateGroup) {
      currentDateGroup = label;
      groupedVendors.push({ label, items: [vg] });
    } else {
      groupedVendors[groupedVendors.length - 1].items.push(vg);
    }
  });

  const uniqueTypes = Array.from(new Set(conversations.map(c => c.bookingType)));
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    ...uniqueTypes.map(t => ({ id: t, label: TYPE_LABELS[t] || t })),
  ];

  // ── Not logged in ──
  if (!isLoading && !customer) {
    return (
      <>
        <CustomerHeader showBackButton backHref="/" title="Messages" />
        <div className="flex items-center justify-center h-screen pt-16">
          <div className="text-center bg-white rounded-2xl shadow p-10">
            <MessageCircle className="w-10 h-10 text-teal-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-gray-700 mb-1">Please log in</h2>
            <p className="text-sm text-gray-400">Login to view your chats with vendors</p>
            <Link href="/customer/login" className="mt-4 inline-block px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">Go to Login</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <CustomerHeader showBackButton backHref="/customer/dashboard" title="Messages" />
    <div className="pt-16 h-screen flex flex-col px-4 pb-4 bg-gray-50">
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-200/60 bg-[#F9FAFB] min-h-0">

      <style jsx>{`
        @keyframes msgIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulseTeal { 0%,100% { box-shadow:0 0 0 0 rgba(13,148,136,0.3) } 50% { box-shadow:0 0 0 6px rgba(13,148,136,0) } }
        .msg-in { animation: msgIn 0.25s ease-out; }
        .fade-in-up { animation: fadeInUp 0.35s ease-out; }
        .chat-bg { background: linear-gradient(135deg,#f0fdfa 0%,#f9fafb 40%,#ccfbf1 100%); }
        .shimmer-teal { background: linear-gradient(90deg,#99f6e4 25%,#5eead4 50%,#99f6e4 75%); background-size:200% 100%; animation:shimmer 1.5s ease-in-out infinite; }
        .pulse-ring { animation: pulseTeal 2s ease-in-out infinite; }
      `}</style>

      {/* Teal accent strip */}
      <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-600 flex-shrink-0" />

      <div className="flex flex-1 min-h-0">

        {/* ══════ SIDEBAR ══════ */}
        <div className={`w-[300px] bg-white flex flex-col flex-shrink-0 border-r border-gray-200 ${!showMobileSidebar && selectedVendorGroup ? 'hidden lg:flex' : 'flex'}`}>

          <div className="px-4 pt-4 pb-2.5 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-extrabold text-gray-900">My Chats</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">{customer?.name || 'Customer'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {(chatMode === 'vendor' ? totalUnread : driverTotalUnread) > 0 && (
                  <span className="bg-teal-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                    {chatMode === 'vendor' ? totalUnread : driverTotalUnread}
                  </span>
                )}
                <button onClick={chatMode === 'vendor' ? fetchConversations : fetchDriverConversations} className="p-1.5 hover:bg-teal-50 rounded-lg transition-colors group">
                  <RefreshCw className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                </button>
              </div>
            </div>
            {/* Mode toggle */}
            <div className="flex gap-1 mb-2.5">
              <button onClick={() => { setChatMode('vendor'); setSelectedDriverConvId(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${chatMode === 'vendor' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-teal-50 hover:text-teal-700'}`}>
                Vendor Chats
              </button>
              <button onClick={() => { setChatMode('driver'); setSelectedVendorGroup(null); setActiveConvId(null); fetchDriverConversations(); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${chatMode === 'driver' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                Driver Chats
                {driverTotalUnread > 0 && <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{driverTotalUnread}</span>}
              </button>
            </div>

            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search vendors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white border border-gray-200 focus:border-teal-400 transition-all placeholder:text-gray-400" />
            </div>

            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-teal-700 hover:bg-teal-50'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 pt-1">
            {chatMode === 'driver' ? (
              /* Driver conversations list */
              isLoadingDriverConvs ? (
                <div className="p-1">{[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5">
                    <div className="w-10 h-10 shimmer-teal rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 shimmer-teal rounded w-24" />
                      <div className="h-2 shimmer-teal rounded w-32" />
                    </div>
                  </div>
                ))}</div>
              ) : driverConversations.length === 0 ? (
                <div className="text-center py-14 fade-in-up">
                  <Car className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No driver chats</p>
                  <p className="text-[11px] text-gray-300 mt-1">Driver chats appear after booking acceptance</p>
                </div>
              ) : (
                <div className="pb-1 pt-1">
                  {driverConversations.map(conv => {
                    const isActive = selectedDriverConvId === conv.id;
                    const driverName = conv.driver?.name || 'Driver';
                    return (
                      <button key={conv.id}
                        onClick={() => setSelectedDriverConvId(conv.id)}
                        className={`w-full p-2.5 text-left rounded-xl flex items-center gap-3 mb-0.5 transition-all ${isActive ? 'bg-emerald-50 border border-emerald-200/60' : 'hover:bg-emerald-50/40 border border-transparent'}`}>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">
                          {driverName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-1">
                            <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{driverName}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}</span>
                          </div>
                          <div className="flex justify-between items-center mt-0.5">
                            <p className="text-[13px] text-gray-400 truncate">{conv.lastMessage?.content || 'No messages'}</p>
                            {conv.unreadCount > 0 && <span className="bg-emerald-600 text-white text-xs font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center ml-1">{conv.unreadCount}</span>}
                          </div>
                          <p className="text-[10px] text-gray-300 mt-0.5">{conv.bookingNumber ? `#${conv.bookingNumber}` : 'Chauffeur booking'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : isLoading ? (
              <div className="p-1">{[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5">
                  <div className="w-10 h-10 shimmer-teal rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5"><div className="h-3 shimmer-teal rounded w-24" /><div className="h-2 shimmer-teal rounded w-32" /></div>
                </div>
              ))}</div>
            ) : vendorGroups.length === 0 ? (
              <div className="text-center py-14 fade-in-up">
                <MessageCircle className="w-8 h-8 text-teal-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No conversations yet</p>
                <p className="text-[11px] text-gray-300 mt-1">Start a chat from your booking page</p>
              </div>
            ) : (
              <div className="pb-1">
                {groupedVendors.map(section => (
                  <div key={section.label}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mt-1">{section.label}</p>
                    {section.items.map(vg => {
                      const isSelected = selectedVendorGroup?.vendorId === vg.vendorId;
                      const latestConv = vg.conversations[0];
                      const sc = SERVICE_COLORS[latestConv?.bookingType] || '#6B7280';

                      return (
                        <button key={vg.vendorId}
                          onClick={() => {
                            const latest = [...vg.conversations].sort((a, b) =>
                              (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '')
                            )[0];
                            setSelectedVendorGroup(vg);
                            setActiveConvId(latest?.id || vg.conversations[0]?.id || null);
                          }}
                          className={`w-full p-2.5 text-left rounded-xl flex items-center gap-3 mb-0.5 transition-all duration-200 ${
                            isSelected ? 'bg-teal-50 shadow-sm border border-teal-200/60 ring-1 ring-teal-200/40' : 'hover:bg-teal-50/40 border border-transparent'
                          }`}>
                          {isSelected && <div className="w-[3px] h-8 bg-teal-600 rounded-full flex-shrink-0 -ml-0.5" />}

                          {/* Vendor avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all overflow-hidden ${isSelected ? 'ring-2 ring-teal-300/50' : ''}`}
                            style={{ backgroundColor: `${sc}18`, color: sc }}>
                            {vg.logo
                              ? <img src={vg.logo} alt="" className="w-10 h-10 object-cover rounded-full" />
                              : <Building2 className="w-5 h-5" style={{ color: sc }} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-sm truncate ${vg.totalUnread > 0 ? 'font-bold text-gray-900' : isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>{vg.vendorName}</span>
                              <span className={`text-xs flex-shrink-0 ${vg.totalUnread > 0 ? 'text-teal-600 font-bold' : 'text-gray-400'}`}>{vg.lastMessageAt ? formatTime(vg.lastMessageAt) : ''}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <p className={`text-[13px] truncate ${vg.totalUnread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                {vg.lastMessage?.senderType === 'customer' && <CheckCheck className="w-3 h-3 inline mr-0.5 text-teal-400" />}
                                {vg.lastMessage?.content || 'No messages'}
                              </p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {vg.conversations.length > 1 && (
                                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">{vg.conversations.length}</span>
                                )}
                                {vg.totalUnread > 0 && <span className="bg-teal-600 text-white text-xs font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center">{vg.totalUnread}</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══════ CHAT AREA ══════ */}
        <div className={`flex-1 flex flex-col min-w-0 ${showMobileSidebar && !selectedVendorGroup && !selectedDriverConvId ? 'hidden lg:flex' : 'flex'}`}>
          {chatMode === 'driver' && !selectedDriverConvId ? (
            <div className="flex-1 flex items-center justify-center chat-bg">
              <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl px-10 py-8 shadow-sm fade-in-up">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Car className="w-7 h-7 text-emerald-500" />
                </div>
                <h2 className="text-base font-bold text-gray-600 mb-0.5">Select a driver conversation</h2>
                <p className="text-sm text-gray-400">Choose a driver to view messages</p>
              </div>
            </div>
          ) : chatMode === 'driver' && selectedDriverConvId ? (
            /* Driver chat area */
            <>
              {/* Driver chat header */}
              {(() => {
                const conv = driverConversations.find(c => c.id === selectedDriverConvId);
                const driverName = conv?.driver?.name || 'Driver';
                const bNum = conv?.bookingNumber || null;
                return (
                  <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setSelectedDriverConvId(null); setShowMobileSidebar(true); }} className="p-1.5 hover:bg-emerald-50 rounded-lg lg:hidden transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-500" />
                      </button>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-base flex-shrink-0">
                        {driverName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">{driverName}</h2>
                        {bNum ? (
                          <p className="text-xs text-gray-400 mt-0.5">Booking <span className="text-gray-600 font-semibold">#{bNum}</span></p>
                        ) : (
                          <p className="text-xs text-gray-400">Driver • Chauffeur booking</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bNum && (
                        <Link href={conv?.bookingType === 'car' ? `/customer/car-bookings/${bNum}` : `/customer/car-rental-bookings/${bNum}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-700 text-xs font-semibold">
                          <Eye className="w-3.5 h-3.5" />View
                        </Link>
                      )}
                      {conv?.driver?.phone && (
                        <a href={`tel:${conv.driver.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-700 text-xs font-semibold">
                          <Phone className="w-3.5 h-3.5" />Call
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}
              {/* Driver messages */}
              <div className="flex-1 overflow-y-auto chat-bg">
                <div className="px-3 py-3">
                  {isLoadingDriverMsgs ? (
                    <div className="flex items-center justify-center h-32"><div className="animate-spin w-5 h-5 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full" /></div>
                  ) : driverMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                      <div className="bg-white/80 rounded-2xl px-6 py-5 text-center shadow-sm">
                        <p className="text-sm text-gray-400">No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {driverMessages.map((msg: any, idx: number) => {
                        const isCustomer = msg.senderType === 'customer';
                        const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(driverMessages[idx - 1].createdAt).toDateString();
                        return (
                          <div key={msg.id} className="msg-in">
                            {showDate && (
                              <div className="flex justify-center my-3">
                                <span className="bg-white/90 text-gray-500 text-xs font-medium px-3 py-1 rounded-md shadow-sm">
                                  {new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mt-2`}>
                              {!isCustomer && (
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-1.5 mt-auto flex-shrink-0">
                                  <Car className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                              )}
                              <div className={`max-w-[68%] px-3 py-[7px] ${isCustomer ? 'bg-teal-600 text-white rounded-2xl rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-2xl rounded-bl-md'}`}>
                                <p className="text-sm leading-[1.5] whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center justify-end gap-0.5 mt-[2px] ${isCustomer ? 'text-white/50' : 'text-gray-300'}`}>
                                  <span className="text-xs">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                  {isCustomer && <Check className="w-3 h-3" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>
              {/* Driver message input */}
              <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex-shrink-0">
                <form onSubmit={e => { e.preventDefault(); sendDriverMessage(); }} className="flex items-end gap-2">
                  <div className="flex-1 flex items-end bg-gray-50 rounded-2xl px-4 py-1 border border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:bg-white transition-all">
                    <textarea value={driverNewMsg} onChange={e => setDriverNewMsg(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDriverMessage(); } }}
                      placeholder="Type a message..." rows={1}
                      className="flex-1 py-2 bg-transparent resize-none text-sm focus:outline-none placeholder:text-gray-400 leading-[1.4]"
                      style={{ maxHeight: '80px' }} />
                  </div>
                  <button type="submit" disabled={!driverNewMsg.trim() || isDriverSending}
                    className="h-10 w-10 bg-emerald-600 text-white rounded-xl disabled:opacity-40 hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center flex-shrink-0">
                    {isDriverSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-[18px] h-[18px]" />}
                  </button>
                </form>
              </div>
            </>
          ) : !selectedVendorGroup ? (
            <div className="flex-1 flex items-center justify-center chat-bg">
              <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl px-10 py-8 shadow-sm fade-in-up">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3 pulse-ring">
                  <MessageCircle className="w-7 h-7 text-teal-500" />
                </div>
                <h2 className="text-base font-bold text-gray-600 mb-0.5">Select a conversation</h2>
                <p className="text-sm text-gray-400">Choose a vendor to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── HEADER ── */}
              <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelectedVendorGroup(null); setActiveConvId(null); setShowMobileSidebar(true); }}
                    className="p-1.5 hover:bg-teal-50 rounded-lg lg:hidden transition-colors">
                    <ArrowLeft className="w-4 h-4 text-gray-500" />
                  </button>

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-teal-400/40 pulse-ring overflow-hidden`}
                    style={{ backgroundColor: `${SERVICE_COLORS[selectedConversation?.bookingType || ''] || '#6B7280'}15` }}>
                    {selectedVendorGroup.logo
                      ? <img src={selectedVendorGroup.logo} alt="" className="w-10 h-10 object-cover rounded-full" />
                      : <Building2 className="w-5 h-5 text-teal-600" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-gray-900 truncate">{selectedVendorGroup.vendorName}</h2>
                      {selectedConversation && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${SERVICE_COLORS[selectedConversation.bookingType] || '#6B7280'}10`, color: SERVICE_COLORS[selectedConversation.bookingType] || '#6B7280' }}>
                          {TYPE_LABELS[selectedConversation.bookingType] || selectedConversation.bookingType}
                        </span>
                      )}
                    </div>
                    {selectedConversation?.bookingId && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Booking <span className="text-gray-500 font-medium">#{(selectedConversation.bookingNumber || selectedConversation.bookingId).slice(-8)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {selectedVendorGroup.phone && (
                  <a href={`tel:${selectedVendorGroup.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors text-teal-700 text-xs font-semibold">
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                )}
              </div>

              {/* ── BOOKING SWITCHER ── */}
              {selectedVendorGroup.conversations.length > 1 && (() => {
                const convs = selectedVendorGroup.conversations;
                const useDropdown = convs.length > 3;

                return (
                  <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex-shrink-0">Booking:</span>

                    {useDropdown ? (
                      <div className="relative">
                        <select value={activeConvId || ''} onChange={e => setActiveConvId(e.target.value)}
                          className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent cursor-pointer text-gray-700">
                          {convs.map(conv => (
                            <option key={conv.id} value={conv.id}>
                              {TYPE_LABELS[conv.bookingType] || conv.bookingType}
                              {conv.bookingNumber ? ` #${conv.bookingNumber.slice(-8)}` : conv.bookingId ? ` #${conv.bookingId.slice(-6)}` : ''}
                              {conv.unreadCount > 0 ? ` (${conv.unreadCount})` : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                        {convs.map(conv => {
                          const isActive = activeConvId === conv.id;
                          const color = SERVICE_COLORS[conv.bookingType] || '#6B7280';
                          return (
                            <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${isActive ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                              style={isActive ? { backgroundColor: color } : {}}>
                              {TYPE_LABELS[conv.bookingType] || conv.bookingType}
                              {(conv.bookingNumber || conv.bookingId) && (
                                <span className="opacity-70">#{(conv.bookingNumber || conv.bookingId || '').slice(-6)}</span>
                              )}
                              {conv.unreadCount > 0 && !isActive && (
                                <span className="bg-teal-600 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">{conv.unreadCount}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── MESSAGES ── */}
              <div className="flex-1 overflow-y-auto chat-bg relative">
                <div className="relative px-3 py-3">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin w-5 h-5 border-[3px] border-teal-100 border-t-teal-600 rounded-full" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-5 text-center shadow-sm fade-in-up">
                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <Send className="w-6 h-6 text-teal-400" />
                        </div>
                        <p className="text-sm text-gray-400">Send a message to start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isCustomer = msg.senderType === 'customer';
                        const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
                        const isSameSender = idx > 0 && messages[idx - 1].senderType === msg.senderType && !showDate;
                        const isLastInGroup = idx === messages.length - 1 || messages[idx + 1]?.senderType !== msg.senderType;

                        return (
                          <div key={msg.id} className="msg-in">
                            {showDate && (
                              <div className="flex justify-center my-3">
                                <span className="bg-white/90 backdrop-blur-sm text-gray-500 text-xs font-medium px-3 py-1 rounded-md shadow-sm">
                                  {new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-[2px]' : 'mt-2'}`}>
                              {!isCustomer && !isSameSender && (
                                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center mr-1.5 mt-auto flex-shrink-0 overflow-hidden">
                                  {selectedVendorGroup.logo
                                    ? <img src={selectedVendorGroup.logo} alt="" className="w-6 h-6 object-cover rounded-full" />
                                    : <Building2 className="w-3.5 h-3.5 text-teal-600" />}
                                </div>
                              )}
                              {!isCustomer && isSameSender && <div className="w-6 mr-1.5 flex-shrink-0" />}

                              <div className={`max-w-[68%] ${
                                isCustomer
                                  ? `bg-teal-600 text-white shadow-sm shadow-teal-200/30 ${isLastInGroup ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
                                  : `bg-white text-gray-800 border border-gray-100 shadow-sm ${isLastInGroup ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'}`
                              } ${msg.messageType === 'IMAGE' ? 'p-1' : 'px-3 py-[7px]'}`}>

                                {msg.messageType === 'IMAGE' && msg.attachmentUrl && (
                                  <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                                    <img src={msg.attachmentUrl} alt="" className="rounded-[12px] max-w-[250px] max-h-[250px] object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 rounded-[12px] transition-colors flex items-center justify-center">
                                      <Download className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                    </div>
                                  </a>
                                )}

                                {msg.messageType === 'FILE' && msg.attachmentUrl && (
                                  <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg ${isCustomer ? 'bg-white/10' : 'bg-gray-50'}`}>
                                    <FileIcon className={`w-3.5 h-3.5 ${isCustomer ? 'text-white/80' : 'text-teal-600'}`} />
                                    <span className={`text-sm font-medium truncate ${isCustomer ? 'text-white/90' : 'text-gray-600'}`}>{msg.attachmentName || 'File'}</span>
                                  </a>
                                )}

                                {msg.content && msg.messageType !== 'IMAGE' && (
                                  <p className="text-sm leading-[1.5] whitespace-pre-wrap break-words">{msg.content}</p>
                                )}

                                <div className={`flex items-center justify-end gap-0.5 ${msg.messageType === 'IMAGE' ? 'px-1 pb-0.5' : 'mt-[2px]'} ${isCustomer ? 'text-white/50' : 'text-gray-300'}`}>
                                  <span className="text-xs">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                  {isCustomer && (msg.status === 'READ' ? <CheckCheck className="w-3 h-3 text-teal-200" /> : msg.status === 'DELIVERED' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* ── INPUT BAR ── */}
              <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex-shrink-0 relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent" />

                {showEmojiPicker && (
                  <div ref={emojiRef} className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
                    <EmojiPicker onEmojiClick={(d: any) => { setNewMessage(p => p + d.emoji); inputRef.current?.focus(); }} width={320} height={380} searchPlaceHolder="Search emoji..." previewConfig={{ showPreview: false }} />
                  </div>
                )}

                {isUploading && (
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-teal-50 rounded-lg border border-teal-100">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span className="text-xs font-medium text-teal-700">Uploading...</span>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />

                <form onSubmit={e => { e.preventDefault(); sendMessage(newMessage); }} className="flex items-end gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="h-10 w-10 flex items-center justify-center hover:bg-teal-50 rounded-xl text-gray-400 hover:text-teal-600 transition-colors disabled:opacity-40 flex-shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 flex items-end bg-gray-50 rounded-2xl px-4 py-1 border border-gray-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:bg-white focus-within:shadow-sm transition-all gap-1">
                    <textarea ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(newMessage); } }}
                      placeholder="Type a message..." rows={1}
                      className="flex-1 py-2 bg-transparent resize-none text-sm focus:outline-none placeholder:text-gray-400 leading-[1.4]"
                      style={{ maxHeight: '80px' }} />
                    <button type="button" onClick={() => setShowEmojiPicker(p => !p)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors mb-0.5 flex-shrink-0 ${showEmojiPicker ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>

                  <button type="submit" disabled={(!newMessage.trim() && !isUploading) || isSending}
                    className="h-10 w-10 bg-teal-600 text-white rounded-xl disabled:opacity-40 hover:bg-teal-700 transition-all shadow-md shadow-teal-200/50 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95">
                    {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-[18px] h-[18px]" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </div>
    </>
  );
}

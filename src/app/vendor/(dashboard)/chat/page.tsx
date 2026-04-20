'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Archive,
  Trash2,
  Image as ImageIcon,
  Paperclip,
  Smile,
  Zap,
  X,
  ChevronDown,
  User,
  Building2,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Star,
  RefreshCw,
  Settings,
  Plus,
  ArrowLeft,
  Info,
  Mic,
  FileIcon,
  Download,
  Loader2,
  Eye,
} from 'lucide-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface Conversation {
  id: string;
  bookingType: string;
  bookingId: string | null;
  subject: string | null;
  status: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    content: string;
    senderType: string;
    messageType: string;
    createdAt: string;
  } | null;
  lastMessageAt: string | null;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
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

interface CustomerGroup {
  customerId: string;
  customerName: string;
  avatar?: string;
  phone?: string;
  conversations: Conversation[];
  totalUnread: number;
  lastMessageAt: string | null;
  lastMessage: Conversation['lastMessage'];
}

interface QuickReply {
  id: string;
  title: string;
  message: string;
  category: string | null;
}

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bike: Bike,
  car: Car,
  chauffeur: Car,
  luxury: Star,
  bus: Bus,
  truck: Truck,
  equipment: Package,
  packers: Package,
};

// Booking detail page URL prefix per service type
const BOOKING_DETAIL_URLS: Record<string, string> = {
  bike: '/vendor/bike-rentals/bookings/',
  car: '/vendor/car-rental/bookings/',
  chauffeur: '/vendor/car-rental/bookings/',
  luxury: '/vendor/luxury/bookings/',
  bus: '/vendor/bus/bookings/',
  truck: '/vendor/truck/bookings/',
  equipment: '/vendor/equipment/bookings/',
  packers: '/vendor/packers/bookings/',
  'self-drive': '/vendor/self-drive/bookings/',
  wander_booking: '/vendor/wander/bookings/',
  wander_quote: '/vendor/wander/quotes/',
};

const SERVICE_COLORS: Record<string, string> = {
  bike: '#3B82F6',
  car: '#8B5CF6',
  chauffeur: '#8B5CF6',
  luxury: '#EC4899',
  bus: '#F97316',
  truck: '#6366F1',
  equipment: '#14B8A6',
  packers: '#F59E0B',
};

export default function VendorChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState<CustomerGroup | null>(null);
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

  // Quick replies
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyCategory, setQuickReplyCategory] = useState('all');

  // Emoji & file upload
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived: active conversation from group + activeConvId (must be before any useCallback that uses it)
  const selectedConversation = useMemo(() => {
    if (!selectedCustomerGroup) return null;
    return selectedCustomerGroup.conversations.find(c => c.id === activeConvId)
      || selectedCustomerGroup.conversations[0]
      || null;
  }, [selectedCustomerGroup, activeConvId]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations?userType=vendor');
      const data = await res.json();

      if (data.success) {
        setConversations(data.conversations || []);
        setTotalUnread(data.totalUnread || 0);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(
        `/api/chat/conversations/${selectedConversation.id}?userType=vendor`
      );
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
        // Update unread count in conversation list
        if (selectedConversation) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversation]);

  // Fetch quick replies
  const fetchQuickReplies = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/quick-replies');
      const data = await res.json();
      if (data.success) {
        setQuickReplies(data.quickReplies || []);
      }
    } catch (err) {
      console.error('Failed to fetch quick replies:', err);
    }
  }, []);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation || isSending) return;

    const messageText = content.trim();
    setNewMessage('');
    setIsSending(true);
    setShowQuickReplies(false);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderType: 'vendor',
      senderId: null,
      senderName: 'You',
      messageType: 'TEXT',
      content: messageText,
      status: 'SENT',
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'vendor',
          content: messageText,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
        // Update conversation in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? {
                  ...c,
                  lastMessage: {
                    id: data.message.id,
                    content: messageText,
                    senderType: 'vendor',
                    messageType: 'TEXT',
                    createdAt: new Date().toISOString(),
                  },
                  lastMessageAt: new Date().toISOString(),
                }
              : c
          )
        );
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setNewMessage(messageText);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.message);
  };

  // Emoji select
  const handleEmojiClick = (emojiData: any) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // File upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setShowEmojiPicker(false);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        alert('Failed to upload file');
        return;
      }

      const fileUrl = uploadData.url;
      const isImage = file.type.startsWith('image/');
      const contentText = isImage ? `📷 ${file.name}` : file.name;

      // Send as message with attachment
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        senderType: 'vendor',
        senderId: null,
        senderName: 'You',
        messageType: isImage ? 'IMAGE' : 'FILE',
        content: contentText,
        attachmentUrl: fileUrl,
        attachmentName: file.name,
        status: 'SENT',
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'vendor',
          content: contentText,
          messageType: isImage ? 'IMAGE' : 'FILE',
          attachmentUrl: fileUrl,
          attachmentName: file.name,
          attachmentSize: Number(file.size),
          attachmentType: file.type,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  // Get date group label
  const getDateGroup = (dateString: string | null) => {
    if (!dateString) return 'Earlier';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return 'This Week';
    return 'Earlier';
  };

  // Get service icon
  const getServiceIcon = (bookingType: string) => {
    const Icon = SERVICE_ICONS[bookingType] || MessageCircle;
    return Icon;
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) {
      if (activeTab === 'all') return true;
      if (activeTab === 'unread') return conv.unreadCount > 0;
      return conv.bookingType.toLowerCase().includes(activeTab);
    }
    const query = searchQuery.toLowerCase();
    return (
      conv.participant.name.toLowerCase().includes(query) ||
      conv.bookingType.toLowerCase().includes(query) ||
      conv.subject?.toLowerCase().includes(query)
    );
  });

  // Group conversations by customer (participant.id)
  const customerGroups = useMemo<CustomerGroup[]>(() => {
    const map = new Map<string, CustomerGroup>();
    filteredConversations.forEach((conv) => {
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
          customerId: conv.participant.id,
          customerName: conv.participant.name,
          avatar: conv.participant.avatar,
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

  // Group customer groups by date for sidebar sections
  const groupedCustomers: { label: string; items: CustomerGroup[] }[] = [];
  let currentGroup = '';
  customerGroups.forEach((group) => {
    const label = getDateGroup(group.lastMessageAt);
    if (label !== currentGroup) {
      currentGroup = label;
      groupedCustomers.push({ label, items: [group] });
    } else {
      groupedCustomers[groupedCustomers.length - 1].items.push(group);
    }
  });

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchQuickReplies();
  }, [fetchConversations, fetchQuickReplies]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setIsLoadingMessages(true);
      setMessages([]);
      fetchMessages();
      setShowMobileSidebar(false);

      pollingRef.current = setInterval(fetchMessages, 3000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [selectedConversation?.id, fetchMessages]);

  // Scroll to bottom only when new messages are added (not on every poll)
  const prevMessageCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      // Only auto-scroll if user is near the bottom already
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom || prevMessageCount.current === 0) {
          scrollToBottom();
        }
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages, scrollToBottom]);

  // Poll conversations for updates
  useEffect(() => {
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Clean label mapping for booking types
  const TYPE_LABELS: Record<string, string> = {
    bike: 'Bike',
    car: 'Car',
    chauffeur: 'Chauffeur',
    luxury: 'Luxury',
    bus: 'Bus',
    truck: 'Truck',
    equipment: 'Equipment',
    packers: 'Packers',
    'self-drive': 'Self-Drive',
    Wander_quote: 'Quotes',
    Wander_booking: 'Bookings',
  };

  // Build tabs dynamically — merge similar types, show clean labels
  const uniqueTypes = Array.from(new Set(conversations.map(c => c.bookingType)));
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    ...uniqueTypes.map(type => ({
      id: type,
      label: TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    })),
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-200/60 bg-[#F9FAFB]">

      <style jsx>{`
        @keyframes msgIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse-emerald { 0%, 100% { box-shadow: 0 0 0 0 rgba(5,150,105,0.3) } 50% { box-shadow: 0 0 0 6px rgba(5,150,105,0) } }
        .msg-in { animation: msgIn 0.25s ease-out; }
        .fade-in-up { animation: fadeInUp 0.35s ease-out; }
        .chat-bg { background: linear-gradient(135deg, #f0fdf4 0%, #f9fafb 40%, #ecfdf5 100%); }
        .shimmer-emerald { background: linear-gradient(90deg, #d1fae5 25%, #a7f3d0 50%, #d1fae5 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; }
        .pulse-ring { animation: pulse-emerald 2s ease-in-out infinite; }
      `}</style>

      {/* Emerald accent strip */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 flex-shrink-0" />

      <div className="flex flex-1 min-h-0">

      {/* ══════ SIDEBAR (300px) ══════ */}
      <div className={`w-[300px] bg-white flex flex-col flex-shrink-0 border-r border-gray-200 ${!showMobileSidebar && selectedConversation ? 'hidden lg:flex' : 'flex'}`}>

        {/* Header */}
        <div className="px-4 pt-4 pb-2.5 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-extrabold text-gray-900">Messages</h1>
            <div className="flex items-center gap-1.5">
              {totalUnread > 0 && <span className="bg-emerald-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">{totalUnread}</span>}
              <button onClick={fetchConversations} className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors group"><RefreshCw className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors" /></button>
            </div>
          </div>

          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white border border-gray-200 focus:border-emerald-400 transition-all placeholder:text-gray-400" />
          </div>

          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200/50' : 'bg-gray-100 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pt-1">
          {isLoading ? (
            <div className="p-1">{[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5">
                <div className="w-10 h-10 shimmer-emerald rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5"><div className="h-3 shimmer-emerald rounded w-24" /><div className="h-2 shimmer-emerald rounded w-32" /></div>
              </div>
            ))}</div>
          ) : customerGroups.length === 0 ? (
            <div className="text-center py-14 fade-in-up"><MessageCircle className="w-8 h-8 text-emerald-200 mx-auto mb-2" /><p className="text-xs text-gray-400 font-medium">No conversations</p></div>
          ) : (
            <div className="pb-1">
              {groupedCustomers.map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mt-1">{section.label}</p>
                  {section.items.map((cg) => {
                    const isSelected = selectedCustomerGroup?.customerId === cg.customerId;
                    const latestConv = cg.conversations[0];
                    const sc = SERVICE_COLORS[latestConv?.bookingType] || '#6B7280';

                    return (
                      <button key={cg.customerId}
                        onClick={() => {
                          const latest = [...cg.conversations].sort((a, b) =>
                            (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '')
                          )[0];
                          setSelectedCustomerGroup(cg);
                          setActiveConvId(latest?.id || cg.conversations[0]?.id || null);
                        }}
                        className={`w-full p-2.5 text-left rounded-xl flex items-center gap-3 mb-0.5 transition-all duration-200 ${
                          isSelected ? 'bg-emerald-50 shadow-sm border border-emerald-200/60 ring-1 ring-emerald-200/40' : 'hover:bg-emerald-50/40 border border-transparent'
                        }`}>
                        {isSelected && <div className="w-[3px] h-8 bg-emerald-600 rounded-full flex-shrink-0 -ml-0.5" />}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${isSelected ? 'bg-emerald-100 ring-2 ring-emerald-300/50' : 'bg-gray-200/70'}`} style={{ color: sc }}>
                          {cg.avatar ? <img src={cg.avatar} alt="" className="w-10 h-10 rounded-full object-cover" /> : cg.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-sm truncate ${cg.totalUnread > 0 ? 'font-bold text-gray-900' : isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>{cg.customerName}</span>
                            <span className={`text-xs flex-shrink-0 ${cg.totalUnread > 0 ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>{cg.lastMessageAt ? formatTime(cg.lastMessageAt) : ''}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className={`text-[13px] truncate ${cg.totalUnread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                              {cg.lastMessage?.senderType === 'vendor' && <CheckCheck className="w-3 h-3 inline mr-0.5 text-emerald-400" />}
                              {cg.lastMessage?.content || 'No messages'}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {cg.conversations.length > 1 && (
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">{cg.conversations.length}</span>
                              )}
                              {cg.totalUnread > 0 && <span className="bg-emerald-600 text-white text-xs font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center">{cg.totalUnread}</span>}
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

      {/* ══════ CHAT AREA (flex) ══════ */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobileSidebar && !selectedCustomerGroup ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedCustomerGroup ? (
          <div className="flex-1 flex items-center justify-center chat-bg">
            <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl px-10 py-8 shadow-sm fade-in-up">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 pulse-ring">
                <MessageCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-base font-bold text-gray-600 mb-0.5">Select a conversation</h2>
              <p className="text-sm text-gray-400">Choose a chat to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── HEADER (fixed) ── */}
            <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedCustomerGroup(null); setActiveConvId(null); setShowMobileSidebar(true); }} className="p-1.5 hover:bg-emerald-50 rounded-lg lg:hidden transition-colors"><ArrowLeft className="w-4 h-4 text-gray-500" /></button>

                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 flex-shrink-0 ring-2 ring-emerald-400/40 pulse-ring">
                  {selectedConversation.participant.avatar
                    ? <img src={selectedConversation.participant.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    : <span className="text-sm font-bold text-emerald-700">{selectedConversation.participant.name.charAt(0).toUpperCase()}</span>}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900 truncate">{selectedConversation.participant.name}</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${SERVICE_COLORS[selectedConversation.bookingType] || '#6B7280'}10`, color: SERVICE_COLORS[selectedConversation.bookingType] || '#6B7280' }}>
                      {selectedConversation.bookingType.charAt(0).toUpperCase() + selectedConversation.bookingType.slice(1)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedConversation.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {selectedConversation.status === 'ACTIVE' ? 'Active' : selectedConversation.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedConversation.bookingType === 'chauffeur' ? 'Car' : (selectedConversation.bookingType.charAt(0).toUpperCase() + selectedConversation.bookingType.slice(1))} Booking
                    {selectedConversation.bookingId && <span className="text-gray-500 font-medium"> · #{selectedConversation.bookingId.slice(-6)}</span>}
                  </p>
                </div>
              </div>

              {selectedConversation.bookingId && BOOKING_DETAIL_URLS[selectedConversation.bookingType] && (
                <Link
                  href={`${BOOKING_DETAIL_URLS[selectedConversation.bookingType]}${selectedConversation.bookingId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-700 text-xs font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </Link>
              )}
            </div>

            {/* ── BOOKING SWITCHER (tabs ≤3 bookings, dropdown >3) ── */}
            {selectedCustomerGroup && selectedCustomerGroup.conversations.length > 1 && (() => {
              const convs = selectedCustomerGroup.conversations;
              const activeConv = convs.find(c => c.id === activeConvId) || convs[0];
              const useDropdown = convs.length > 3;
              const sc = SERVICE_COLORS[activeConv?.bookingType] || '#6B7280';
              const activeLabel = TYPE_LABELS[activeConv?.bookingType] || activeConv?.bookingType || '';

              return (
                <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex-shrink-0">Booking:</span>

                  {useDropdown ? (
                    <div className="relative">
                      <select
                        value={activeConvId || ''}
                        onChange={e => setActiveConvId(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent cursor-pointer"
                        style={{ color: sc }}
                      >
                        {convs.map(conv => {
                          const label = TYPE_LABELS[conv.bookingType] || conv.bookingType;
                          return (
                            <option key={conv.id} value={conv.id}>
                              {label}{conv.bookingId ? ` #${conv.bookingId.slice(-6)}` : ''}{conv.unreadCount > 0 ? ` (${conv.unreadCount})` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                      {convs.map((conv) => {
                        const isActive = activeConvId === conv.id;
                        const color = SERVICE_COLORS[conv.bookingType] || '#6B7280';
                        const label = TYPE_LABELS[conv.bookingType] || conv.bookingType;
                        return (
                          <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                              isActive ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            style={isActive ? { backgroundColor: color } : {}}>
                            {label}
                            {conv.bookingId && <span className="opacity-70">#{conv.bookingId.slice(-6)}</span>}
                            {conv.unreadCount > 0 && !isActive && (
                              <span className="bg-emerald-600 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">{conv.unreadCount}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── BACKGROUND + MESSAGES ── */}
            <div className="flex-1 overflow-y-auto chat-bg relative">

              <div className="relative px-3 py-3">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-32"><div className="animate-spin w-5 h-5 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[50vh]">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-5 text-center shadow-sm fade-in-up">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Send className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-sm text-gray-400">Say hello to start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const isVendor = msg.senderType === 'vendor';
                      const showDate = index === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();
                      const isSameSender = index > 0 && messages[index - 1].senderType === msg.senderType && !showDate;
                      const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.senderType !== msg.senderType;

                      return (
                        <div key={msg.id} className="msg-in">
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <span className="bg-white/90 backdrop-blur-sm text-gray-500 text-xs font-medium px-3 py-1 rounded-md shadow-sm">{new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                          )}
                          <div className={`flex ${isVendor ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-[2px]' : 'mt-2'}`}>
                            {!isVendor && !isSameSender && (
                              <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center mr-1.5 mt-auto flex-shrink-0">
                                <span className="text-[10px] font-bold text-white">{selectedConversation.participant.name.charAt(0)}</span>
                              </div>
                            )}
                            {!isVendor && isSameSender && <div className="w-6 mr-1.5 flex-shrink-0" />}

                            <div className={`max-w-[68%] ${
                              isVendor
                                ? `bg-emerald-600 text-white shadow-sm shadow-emerald-200/30 ${isLastInGroup ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
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
                                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded-lg ${isVendor ? 'bg-white/10' : 'bg-gray-50'}`}>
                                  <FileIcon className={`w-3.5 h-3.5 ${isVendor ? 'text-white/80' : 'text-emerald-600'}`} />
                                  <span className={`text-sm font-medium truncate ${isVendor ? 'text-white/90' : 'text-gray-600'}`}>{msg.attachmentName || 'File'}</span>
                                </a>
                              )}

                              {msg.content && msg.messageType !== 'IMAGE' && (
                                <p className="text-sm leading-[1.5] whitespace-pre-wrap break-words">{msg.content}</p>
                              )}

                              <div className={`flex items-center justify-end gap-0.5 ${msg.messageType === 'IMAGE' ? 'px-1 pb-0.5' : 'mt-[2px]'} ${isVendor ? 'text-white/50' : 'text-gray-300'}`}>
                                <span className="text-xs">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                {isVendor && (msg.status === 'READ' ? <CheckCheck className="w-3 h-3 text-emerald-200" /> : msg.status === 'DELIVERED' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
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

            {/* ── QUICK REPLIES ── */}
            {showQuickReplies && (
              <div className="bg-white border-t border-gray-100 px-3 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" />Quick Replies</span>
                  <button onClick={() => setShowQuickReplies(false)} className="p-0.5 hover:bg-gray-100 rounded"><X className="w-3 h-3 text-gray-400" /></button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {quickReplies.slice(0, 8).map((r) => (
                    <button key={r.id} onClick={() => handleQuickReply(r)} className="px-2.5 py-1 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-md text-xs font-medium transition-colors border border-gray-100 hover:border-emerald-200">{r.title}</button>
                  ))}
                </div>
              </div>
            )}

            {/* ── INPUT BAR (fixed bottom) ── */}
            <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex-shrink-0 relative">
              {/* Gradient divider line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />

              {showEmojiPicker && (
                <div ref={emojiRef} className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
                  <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={380} searchPlaceHolder="Search emoji..." previewConfig={{ showPreview: false }} />
                </div>
              )}

              {isUploading && (
                <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /><span className="text-xs font-medium text-emerald-700">Uploading image...</span>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" onChange={handleFileSelect} className="hidden" />

              <div>
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="h-10 w-10 flex items-center justify-center hover:bg-emerald-50 rounded-xl text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-40 flex-shrink-0" title="Attach image">
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 flex items-end bg-gray-50 rounded-2xl px-4 py-1 border border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:bg-white focus-within:shadow-sm transition-all gap-1">
                    <textarea ref={inputRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder="Type a message..." rows={1}
                      className="flex-1 py-2 bg-transparent resize-none text-sm focus:outline-none placeholder:text-gray-400 leading-[1.4]"
                      style={{ maxHeight: '80px' }} />
                    <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowQuickReplies(false); }}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors mb-0.5 flex-shrink-0 ${showEmojiPicker ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                      <Smile className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => { setShowQuickReplies(!showQuickReplies); setShowEmojiPicker(false); }}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors mb-0.5 flex-shrink-0 ${showQuickReplies ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                      <Zap className="w-5 h-5" />
                    </button>
                  </div>

                  <button type="submit" disabled={(!newMessage.trim() && !isUploading) || isSending}
                    className="h-10 w-10 bg-emerald-600 text-white rounded-xl disabled:opacity-40 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200/50 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95">
                    {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-[18px] h-[18px]" />}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      </div>
    </div>
  );
}

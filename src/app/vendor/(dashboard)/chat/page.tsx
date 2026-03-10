'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  ExternalLink,
} from 'lucide-react';

interface Conversation {
  id: string;
  bookingType: string;
  bookingId: string | null;
  bookingNumber: string | null;
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

export default function VendorChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const [autoSelectBookingId, setAutoSelectBookingId] = useState<string | null>(null);

  // Read bookingId from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bid = params.get('bookingId');
    if (bid) setAutoSelectBookingId(bid);
  }, []);

  // Quick replies
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyCategory, setQuickReplyCategory] = useState('all');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const convs: Conversation[] = data.conversations || [];
        setConversations(convs);
        setTotalUnread(data.totalUnread || 0);

        // Auto-select conversation if bookingId param was provided
        setAutoSelectBookingId(prev => {
          if (prev && !selectedConversation) {
            const match = convs.find(c => c.bookingId === prev);
            if (match) setSelectedConversation(match);
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedConversation]);

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
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c
          )
        );
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

  // Get service icon
  const getServiceIcon = (bookingType: string) => {
    const Icon = SERVICE_ICONS[bookingType] || MessageCircle;
    return Icon;
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.participant.name.toLowerCase().includes(query) ||
      conv.bookingType.toLowerCase().includes(query) ||
      conv.subject?.toLowerCase().includes(query)
    );
  });

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchQuickReplies();
  }, [fetchConversations, fetchQuickReplies]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      setIsLoadingMessages(true);
      fetchMessages();

      // Poll for new messages every 3 seconds
      pollingRef.current = setInterval(fetchMessages, 3000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [selectedConversation, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
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

  return (
    <div className="h-[calc(100vh-80px)] flex bg-gray-50">
      {/* Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              Chats
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </h1>
            <button
              onClick={fetchConversations}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conv) => {
                const ServiceIcon = getServiceIcon(conv.bookingType);
                const isSelected = selectedConversation?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition flex items-start gap-3 ${
                      isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        {conv.participant.avatar ? (
                          <img
                            src={conv.participant.avatar}
                            alt={conv.participant.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
                        <ServiceIcon className="w-3 h-3 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-semibold text-sm truncate ${
                          conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {conv.participant.name}
                        </h3>
                        {conv.lastMessageAt && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {conv.bookingType.charAt(0).toUpperCase() + conv.bookingType.slice(1)}
                        {(conv.bookingNumber || conv.bookingId) && ` • #${conv.bookingNumber || conv.bookingId?.slice(-6)}`}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${
                          conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {conv.lastMessage?.senderType === 'vendor' && (
                            <span className="text-gray-400 mr-1">You:</span>
                          )}
                          {conv.lastMessage?.content || 'Start a conversation'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-400">
                Choose a chat from the list to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  {selectedConversation.participant.avatar ? (
                    <img
                      src={selectedConversation.participant.avatar}
                      alt={selectedConversation.participant.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.participant.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.bookingType.charAt(0).toUpperCase() +
                      selectedConversation.bookingType.slice(1)} Booking
                    {(selectedConversation.bookingNumber || selectedConversation.bookingId) &&
                      ` • #${selectedConversation.bookingNumber || selectedConversation.bookingId?.slice(-6)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation.participant.phone && (
                  <a
                    href={`tel:${selectedConversation.participant.phone}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Phone className="w-5 h-5 text-gray-500" />
                  </a>
                )}
                {selectedConversation.bookingId && (
                  <a
                    href={
                      selectedConversation.bookingType === 'b2b'
                        ? `/vendor/b2b-bookings/${selectedConversation.bookingId}`
                        : `/vendor/bookings`
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold border border-teal-200 transition"
                    title="View Booking"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Booking
                  </a>
                )}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-3" />
                  <p>No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isVendor = msg.senderType === 'vendor';
                    const showDate =
                      index === 0 ||
                      new Date(msg.createdAt).toDateString() !==
                        new Date(messages[index - 1].createdAt).toDateString();

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] ${
                              isVendor
                                ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                                : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                            } px-4 py-3`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 ${
                                isVendor ? 'text-blue-200' : 'text-gray-400'
                              }`}
                            >
                              <span className="text-[10px]">
                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isVendor && (
                                msg.status === 'READ' ? (
                                  <CheckCheck className="w-3 h-3 text-blue-200" />
                                ) : msg.status === 'DELIVERED' ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )
                              )}
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

            {/* Quick Replies Panel */}
            {showQuickReplies && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Quick Replies
                  </h3>
                  <button
                    onClick={() => setShowQuickReplies(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.slice(0, 8).map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-sm transition"
                    >
                      {reply.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className={`p-2.5 rounded-lg transition ${
                    showQuickReplies
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Quick Replies"
                >
                  <Zap className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

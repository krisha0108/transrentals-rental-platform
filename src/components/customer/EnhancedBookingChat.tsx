'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Check,
  CheckCheck,
  Building2,
  ChevronLeft,
  Phone,
  MoreVertical,
  Loader2,
  Search,
  Star,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
} from 'lucide-react';

interface Conversation {
  id: string;
  bookingType: string;
  bookingId: string | null;
  subject: string | null;
  unreadCount: number;
  lastMessage: {
    content: string;
    senderType: string;
    createdAt: string;
  } | null;
  lastMessageAt: string | null;
  participant: {
    id: string;
    name: string;
    logo?: string;
    phone?: string;
  };
}

interface Message {
  id: string;
  senderType: string;
  content: string;
  messageType: string;
  status: string;
  createdAt: string;
}

interface EnhancedBookingChatProps {
  customerPhone?: string;
  customerEmail?: string;
}

const SERVICE_ICONS: Record<string, any> = {
  bike: Bike,
  car: Car,
  chauffeur: Car,
  luxury: Star,
  bus: Bus,
  truck: Truck,
  equipment: Package,
  packers: Package,
};

export default function EnhancedBookingChat({
  customerPhone,
  customerEmail,
}: EnhancedBookingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const phone = customerPhone || localStorage.getItem('customerPhone');
    const email = customerEmail || localStorage.getItem('customerEmail');

    if (!phone && !email) return;

    try {
      const params = new URLSearchParams({ userType: 'customer' });
      if (phone) params.set('phone', phone);
      if (email) params.set('email', email);

      const res = await fetch(`/api/chat/conversations?${params.toString()}`);
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
  }, [customerPhone, customerEmail]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(
        `/api/chat/conversations/${selectedConversation.id}?userType=customer`
      );
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
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

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderType: 'customer',
      content: messageText,
      messageType: 'TEXT',
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'customer',
          content: messageText,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
      } else {
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
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  // Initial load
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      setIsLoadingMessages(true);
      fetchMessages();

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

  // Poll for new conversations
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(fetchConversations, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchConversations]);

  // Focus input
  useEffect(() => {
    if (selectedConversation && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedConversation]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.participant.name.toLowerCase().includes(query) ||
      conv.bookingType.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat with Vendors
        </span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setSelectedConversation(null);
            }}
          />

          <div className="relative w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {selectedConversation ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedConversation(null);
                        setMessages([]);
                      }}
                      className="p-1 hover:bg-white/20 rounded-lg transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      {selectedConversation.participant.logo ? (
                        <img
                          src={selectedConversation.participant.logo}
                          alt={selectedConversation.participant.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {selectedConversation.participant.name}
                      </h3>
                      <p className="text-white/70 text-xs">
                        {selectedConversation.bookingType} Booking
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-6 w-6" />
                    <div>
                      <h3 className="font-semibold">My Chats</h3>
                      <p className="text-white/70 text-xs">
                        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation?.participant.phone && (
                  <a
                    href={`tel:${selectedConversation.participant.phone}`}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedConversation(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            {!selectedConversation ? (
              <div className="flex-1 flex flex-col">
                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No conversations yet</p>
                      <p className="text-sm mt-1">
                        Start a chat from your booking details
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredConversations.map((conv) => {
                        const ServiceIcon = SERVICE_ICONS[conv.bookingType] || MessageCircle;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv)}
                            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition"
                          >
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                                {conv.participant.logo ? (
                                  <img
                                    src={conv.participant.logo}
                                    alt={conv.participant.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="h-6 w-6 text-purple-600" />
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
                                <ServiceIcon className="w-3 h-3 text-gray-500" />
                              </div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {conv.participant.name}
                                </h4>
                                {conv.lastMessageAt && (
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    {formatTime(conv.lastMessageAt)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className={`text-sm truncate ${
                                  conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                                }`}>
                                  {conv.lastMessage?.senderType === 'customer' && (
                                    <span className="text-gray-400 mr-1">You:</span>
                                  )}
                                  {conv.lastMessage?.content || 'Start a conversation'}
                                </p>
                                {conv.unreadCount > 0 && (
                                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center flex-shrink-0">
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
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageCircle className="h-12 w-12 mb-3" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const isCustomer = msg.senderType === 'customer';
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
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[80%] ${
                                  isCustomer
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-br-md'
                                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                                } px-4 py-2.5`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                                <div
                                  className={`flex items-center justify-end gap-1 mt-1 ${
                                    isCustomer ? 'text-white/70' : 'text-gray-400'
                                  }`}
                                >
                                  <span className="text-[10px]">
                                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {isCustomer && (
                                    msg.status === 'READ' ? (
                                      <CheckCheck className="h-3 w-3 text-blue-300" />
                                    ) : (
                                      <Check className="h-3 w-3" />
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

                {/* Message Input */}
                <form
                  onSubmit={sendMessage}
                  className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

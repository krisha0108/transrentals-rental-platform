'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  Building2,
  ChevronDown,
  Check,
  CheckCheck,
} from 'lucide-react';

interface Vendor {
  id: number;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  image?: string;
  rating?: number;
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
}

interface ChatMessage {
  id: number;
  booking_id: number;
  customer_id: number;
  vendor_id: number;
  sender_type: 'customer' | 'vendor';
  message: string;
  is_read: boolean | number;
  created_at: string;
  updated_at?: string;
}

interface BookingChatProps {
  bookingId: number;
  vendors: Vendor[];
  customerId: number;
  customerName?: string;
}

export default function BookingChat({
  bookingId,
  vendors,
  customerId,
}: BookingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorList, setVendorList] = useState<Vendor[]>(vendors);
  const [totalUnread, setTotalUnread] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'; // Use relative path as fallback

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch vendors with chat info
  const fetchVendors = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/customer/bookings/${bookingId}/vendors`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch vendors:', response.status);
        return;
      }

      const data = await response.json();
      // API returns array directly or {success: true, vendors: [...]}
      const vendorsData = Array.isArray(data) ? data : (data.vendors || data);

      if (Array.isArray(vendorsData) && vendorsData.length > 0) {
        setVendorList(vendorsData);
        const unread = vendorsData.reduce(
          (sum: number, v: Vendor) => sum + (v.unread_count || 0),
          0
        );
        setTotalUnread(unread);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  }, [API_URL, bookingId]);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    if (!selectedVendor) return;

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        setError('Please login to view messages');
        return;
      }

      const response = await fetch(
        `${API_URL}/customer/bookings/${bookingId}/chats/${selectedVendor.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
        }
        console.error('Failed to fetch messages:', response.status);
        return;
      }

      const data = await response.json();
      // API returns array directly
      const messagesData = Array.isArray(data) ? data : (data.messages || []);
      setMessages(messagesData);
      setError(null);

      // Mark messages as read if there are unread vendor messages
      if (messagesData.some((m: ChatMessage) => m.sender_type === 'vendor' && !m.is_read)) {
        markMessagesAsRead();
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages');
    }
  }, [API_URL, bookingId, selectedVendor]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!selectedVendor) return;

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return;

      await fetch(
        `${API_URL}/customer/bookings/${bookingId}/vendor/${selectedVendor.id}/read-messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update vendor list unread count
      setVendorList((prev) =>
        prev.map((v) => (v.id === selectedVendor.id ? { ...v, unread_count: 0 } : v))
      );
      // Update total unread
      setTotalUnread((prev) => Math.max(0, prev - (selectedVendor.unread_count || 0)));
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [API_URL, bookingId, selectedVendor]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedVendor || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    setError(null);

    // Optimistic update
    const tempId = Date.now();
    const tempMessage: ChatMessage = {
      id: tempId,
      booking_id: bookingId,
      customer_id: customerId,
      vendor_id: selectedVendor.id,
      sender_type: 'customer',
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_URL}/customer/bookings/${bookingId}/chats/${selectedVendor.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: messageText }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send message');
      }

      // API returns the chat object directly
      // Replace temp message with actual message from server
      if (data && data.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data : m))
        );
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Format time for vendor list
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return as-is if invalid date

    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  // Format message time
  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Initial load and polling
  useEffect(() => {
    if (isOpen && selectedVendor) {
      setIsLoading(true);
      setError(null);
      fetchMessages().finally(() => setIsLoading(false));

      // Start polling for new messages every 5 seconds
      pollingRef.current = setInterval(fetchMessages, 5000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [isOpen, selectedVendor, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when vendor is selected
  useEffect(() => {
    if (selectedVendor && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedVendor]);

  // Fetch vendors on mount and poll
  useEffect(() => {
    fetchVendors();
    const vendorPoll = setInterval(fetchVendors, 30000);
    return () => clearInterval(vendorPoll);
  }, [fetchVendors]);

  // Don't render if no vendors
  if (vendorList.length === 0) {
    return null;
  }

  return (
    <>
      {/* Chat Toggle Button - positioned above Shivi helpdesk icon */}
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
          Chat with Vendor
        </span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Container */}
          <div className="relative w-full sm:max-w-lg h-[85vh] sm:h-[600px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {selectedVendor ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedVendor(null);
                        setMessages([]);
                        setError(null);
                      }}
                      className="p-1 hover:bg-white/20 rounded-lg transition"
                    >
                      <ChevronDown className="h-5 w-5 rotate-90" />
                    </button>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      {selectedVendor.image ? (
                        <img
                          src={selectedVendor.image}
                          alt={selectedVendor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {selectedVendor.company_name || selectedVendor.name}
                      </h3>
                      <p className="text-white/70 text-xs">{selectedVendor.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-6 w-6" />
                    <div>
                      <h3 className="font-semibold">Chat with Vendors</h3>
                      <p className="text-white/70 text-xs">Booking #{bookingId}</p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {!selectedVendor ? (
              // Vendor List
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <p className="text-gray-500 text-sm mb-4">
                    Select a vendor to start chatting about your booking
                  </p>
                  <div className="space-y-2">
                    {vendorList.map((vendor) => (
                      <button
                        key={`vendor-${vendor.id}`}
                        onClick={() => setSelectedVendor(vendor)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100 hover:border-purple-200 hover:shadow-sm"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {vendor.image ? (
                            <img
                              src={vendor.image}
                              alt={vendor.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {vendor.company_name || vendor.name}
                            </h4>
                            {vendor.last_message_time && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {formatTime(vendor.last_message_time)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-gray-500 truncate">
                              {vendor.last_message || 'Start a conversation'}
                            </p>
                            {(vendor.unread_count ?? 0) > 0 && (
                              <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center flex-shrink-0">
                                {vendor.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Chat Messages
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageCircle className="h-12 w-12 mb-3" />
                      <p className="text-center">No messages yet</p>
                      <p className="text-sm text-center">
                        Send a message to start the conversation
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const isCustomer = msg.sender_type === 'customer';
                        const showDate =
                          index === 0 ||
                          new Date(msg.created_at).toDateString() !==
                            new Date(messages[index - 1].created_at).toDateString();

                        return (
                          <React.Fragment key={`msg-${msg.id}-${index}`}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                  {new Date(msg.created_at).toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                              </div>
                            )}
                            <div
                              className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] ${
                                  isCustomer
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-br-md'
                                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                                } px-4 py-2.5`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                                <div
                                  className={`flex items-center justify-end gap-1 mt-1 ${
                                    isCustomer ? 'text-white/70' : 'text-gray-400'
                                  }`}
                                >
                                  <span className="text-[10px]">
                                    {formatMessageTime(msg.created_at)}
                                  </span>
                                  {isCustomer && (
                                    msg.is_read ? (
                                      <CheckCheck className="h-3 w-3 text-blue-300" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

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

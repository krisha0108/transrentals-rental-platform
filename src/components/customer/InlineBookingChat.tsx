'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  Loader2,
  Building2,
  ChevronLeft,
  Check,
  CheckCheck,
  X,
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

interface InlineBookingChatProps {
  bookingId: number;
  vendors: Vendor[];
  customerId: number;
  isOpen: boolean;
  onClose: () => void;
  selectedVendorId?: number | null;
}

export default function InlineBookingChat({
  bookingId,
  vendors,
  customerId,
  isOpen,
  onClose,
  selectedVendorId,
}: InlineBookingChatProps) {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorList, setVendorList] = useState<Vendor[]>(vendors);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-select vendor if provided
  useEffect(() => {
    if (selectedVendorId && vendors.length > 0) {
      const vendor = vendors.find(v => v.id === selectedVendorId);
      if (vendor) {
        setSelectedVendor(vendor);
      }
    }
  }, [selectedVendorId, vendors]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch vendors with chat info (using local API)
  const fetchVendors = useCallback(async () => {
    try {
      const response = await fetch(`/api/customer/booking/${bookingId}/vendors?customer_id=${customerId}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      const vendorsData = Array.isArray(data) ? data : (data.vendors || data);

      if (Array.isArray(vendorsData) && vendorsData.length > 0) {
        setVendorList(vendorsData);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  }, [bookingId, customerId]);

  // Fetch chat messages (using local API)
  const fetchMessages = useCallback(async () => {
    if (!selectedVendor) return;

    try {
      const response = await fetch(
        `/api/customer/booking/${bookingId}/chat/${selectedVendor.id}?customer_id=${customerId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const messagesData = Array.isArray(data) ? data : (data.messages || []);
      setMessages(messagesData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [bookingId, selectedVendor, customerId]);

  // Mark messages as read (handled automatically in fetchMessages)
  const markMessagesAsRead = useCallback(async () => {
    if (!selectedVendor) return;
    // Messages are marked as read automatically when fetching
    setVendorList((prev) =>
      prev.map((v) => (v.id === selectedVendor.id ? { ...v, unread_count: 0 } : v))
    );
  }, [selectedVendor]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedVendor || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    setError(null);

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
      // Get customer name from localStorage
      const customerData = localStorage.getItem('customer');
      let customerName = '';
      if (customerData) {
        try {
          const parsed = JSON.parse(customerData);
          customerName = parsed.name || '';
        } catch (e) {}
      }

      // Use local API route
      const response = await fetch(
        `/api/customer/booking/${bookingId}/chat/${selectedVendor.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            customer_id: customerId,
            customer_name: customerName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to send message');
      }

      if (data && data.id) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
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

  // Polling for messages
  useEffect(() => {
    if (isOpen && selectedVendor) {
      setIsLoading(true);
      setError(null);
      fetchMessages().finally(() => setIsLoading(false));

      pollingRef.current = setInterval(fetchMessages, 5000);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
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

  // Fetch vendors on mount
  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen, fetchVendors]);

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[600px] sticky top-24">
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
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                {selectedVendor.image ? (
                  <img
                    src={selectedVendor.image}
                    alt={selectedVendor.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">
                  {selectedVendor.company_name || selectedVendor.name}
                </h3>
                <p className="text-white/70 text-xs">{selectedVendor.name}</p>
              </div>
            </>
          ) : (
            <>
              <MessageCircle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold text-sm">Chat with Vendors</h3>
                <p className="text-white/70 text-xs">Select a vendor to chat</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      {!selectedVendor ? (
        // Vendor List
        <div className="flex-1 overflow-y-auto p-3">
          {vendorList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No vendors available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vendorList.map((vendor) => (
                <button
                  key={`vendor-${vendor.id}`}
                  onClick={() => setSelectedVendor(vendor)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition border border-gray-100 hover:border-purple-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {vendor.image ? (
                      <img
                        src={vendor.image}
                        alt={vendor.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {vendor.company_name || vendor.name}
                      </h4>
                      {(vendor.unread_count ?? 0) > 0 && (
                        <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                          {vendor.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {vendor.last_message || 'Start a conversation'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Chat Messages
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="h-10 w-10 mb-2" />
                <p className="text-sm text-center">No messages yet</p>
                <p className="text-xs text-center">Start the conversation!</p>
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
                        <div className="flex justify-center my-3">
                          <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">
                            {new Date(msg.created_at).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] ${
                            isCustomer
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                          } px-3 py-2`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-0.5 ${
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

          {/* Error */}
          {error && (
            <div className="px-3 py-1.5 bg-red-50 border-t border-red-100">
              <p className="text-red-600 text-xs text-center">{error}</p>
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
              className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

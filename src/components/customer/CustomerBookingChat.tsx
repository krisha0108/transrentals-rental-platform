'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  Loader2,
  Building2,
  X,
  Check,
  CheckCheck,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  booking_id: string;
  customer_id: string;
  vendor_id: string;
  sender_type: 'customer' | 'vendor';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  phone?: string;
}

interface CustomerBookingChatProps {
  bookingId: string;
  customerName?: string;
  vendorName?: string;
  vendorPhone?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerBookingChat({
  bookingId,
  customerName,
  vendorName: propVendorName,
  vendorPhone: propVendorPhone,
  isOpen,
  onClose,
}: CustomerBookingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(
    propVendorName ? {
      id: '',
      name: propVendorName,
      phone: propVendorPhone,
    } : null
  );
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/customer/booking-chat/${bookingId}`);

      if (!response.ok) return;

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
        if (data.vendor) {
          setVendor(data.vendor);
        }
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [bookingId]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      booking_id: bookingId,
      customer_id: '',
      vendor_id: vendor?.id || '',
      sender_type: 'customer',
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const response = await fetch(`/api/customer/booking-chat/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          customer_name: customerName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send message');
      }

      if (data && data.id) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: data.id } : m)));
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
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      fetchMessages().finally(() => setIsLoading(false));

      pollingRef.current = setInterval(fetchMessages, 5000);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [isOpen, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">
              {vendor?.name || propVendorName || 'Vendor'}
            </h3>
            <p className="text-white/70 text-xs">
              {vendor?.phone || propVendorPhone || 'Loading...'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
        ) : !vendor ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="h-10 w-10 mb-2" />
            <p className="text-sm text-center">No vendor assigned yet</p>
            <p className="text-xs text-center">Chat will be available once vendor is assigned</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="h-10 w-10 mb-2" />
            <p className="text-sm text-center">No messages yet</p>
            <p className="text-xs text-center">Start the conversation with vendor!</p>
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
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl rounded-br-md'
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
          placeholder={vendor ? "Type a message..." : "Vendor not assigned yet"}
          className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          disabled={isSending || !vendor}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending || !vendor}
          className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}

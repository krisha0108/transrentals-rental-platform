'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  Check,
  CheckCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

interface BikeBookingChatProps {
  bookingId: string;
  vendorId: string;
  vendorName: string;
  customerId: string;
  customerName: string;
}

export function BikeBookingChat({
  bookingId,
  vendorId,
  vendorName,
  customerId,
  customerName,
}: BikeBookingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!vendorId || !customerId) return;

    try {
      const response = await fetch(
        `/api/customer/booking/${bookingId}/chat/${vendorId}?customer_id=${customerId}`
      );

      if (!response.ok) {
        console.error('Failed to fetch messages:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/customer/booking/${bookingId}/chat/${vendorId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: newMessage.trim(),
            customer_id: customerId,
            customer_name: customerName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Open chat
  const openChat = () => {
    setIsOpen(true);
    setIsLoading(true);
    fetchMessages().finally(() => {
      setIsLoading(false);
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);
    });
  };

  // Close chat
  const closeChat = () => {
    setIsOpen(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Poll for new messages when chat is open
  useEffect(() => {
    if (isOpen && vendorId) {
      pollingRef.current = setInterval(fetchMessages, 5000);
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [isOpen, vendorId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: ChatMessage[] }, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!vendorId) {
    return null;
  }

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={openChat}
        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition"
      >
        <MessageCircle className="w-5 h-5" />
        Chat with Vendor
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg h-[80vh] sm:h-[600px] sm:rounded-2xl flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-purple-600 text-white sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{vendorName}</h3>
                  <p className="text-xs text-purple-200">Vendor</p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="text-center">No messages yet</p>
                  <p className="text-sm text-center mt-1">
                    Start a conversation with the vendor
                  </p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex justify-center mb-3">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(msgs[0].created_at)}
                      </span>
                    </div>
                    {msgs.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex mb-3',
                          msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2',
                            msg.sender_type === 'customer'
                              ? 'bg-purple-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <div
                            className={cn(
                              'flex items-center justify-end gap-1 mt-1',
                              msg.sender_type === 'customer' ? 'text-purple-200' : 'text-gray-400'
                            )}
                          >
                            <span className="text-xs">{formatTime(msg.created_at)}</span>
                            {msg.sender_type === 'customer' && (
                              msg.is_read ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white sm:rounded-b-2xl">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition',
                    newMessage.trim() && !isSending
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-400'
                  )}
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

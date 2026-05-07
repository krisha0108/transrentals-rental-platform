'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  MessageSquare,
  User,
  Store,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  FileText,
  Bike,
  Car,
  Eye,
  MapPin,
  IndianRupee,
  Calendar,
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderType: string;
  messageType: string;
  fileUrl: string | null;
  fileName: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  bookingType: string;
  bookingId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  vendors: {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    locations: string[];
  } | null;
  messages: Message[];
  messageCount: number;
}

interface BookingDetails {
  id: string;
  bookingId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  fleet: {
    name: string;
    brand: string;
    model: string;
  } | null;
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  'bike-rental': Bike,
  'bike': Bike,
  'car-rental': Car,
  'car': Car,
  'chauffeur': Car,
};

const SERVICE_LABELS: Record<string, string> = {
  'bike-rental': 'Bike Rental',
  'bike': 'Bike Rental',
  'car-rental': 'Car Rental',
  'car': 'Car Rental',
  'chauffeur': 'Chauffeur Drive',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' },
};

const BOOKING_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
  ONGOING: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Ongoing' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
};

export default function ManagerChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const conversationId = params.id as string;

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const fetchConversation = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/manager/chats/${conversationId}`);
      const data = await response.json();

      if (data.success) {
        setConversation(data.conversation);
        setBookingDetails(data.bookingDetails);
      } else {
        setError(data.error || 'Failed to fetch conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch conversation');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateString: string) => {
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
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: message.createdAt, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const renderMessageContent = (message: Message) => {
    switch (message.messageType) {
      case 'IMAGE':
        return (
          <div className="max-w-xs">
            <img
              src={message.fileUrl || ''}
              alt="Shared image"
              className="rounded-lg max-w-full"
              loading="lazy"
            />
            {message.content && <p className="mt-2 text-sm">{message.content}</p>}
          </div>
        );
      case 'FILE':
        return (
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <a
              href={message.fileUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {message.fileName || 'Download File'}
            </a>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Conversation not found</h3>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[conversation.status] || STATUS_CONFIG.ACTIVE;
  const ServiceIcon = SERVICE_ICONS[conversation.bookingType] || MessageSquare;
  const messageGroups = groupMessagesByDate(conversation.messages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Chat Conversation</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {SERVICE_LABELS[conversation.bookingType] || conversation.bookingType} • {conversation.messageCount} messages
          </p>
        </div>
      </div>

      {/* Read-only Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <Eye className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p className="text-blue-700 text-sm">
          This is a read-only view of the conversation between the vendor and customer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {conversation.vendor?.businessName} & {conversation.customer?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-gray-500">Started {formatDate(conversation.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-500 shadow-sm">
                      {formatFullDate(group.date)}
                    </span>
                  </div>

                  {/* Messages for this date */}
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.senderType === 'customer'
                            ? 'bg-white border border-gray-200'
                            : message.senderType === 'vendor'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-800'
                        }`}
                      >
                        {/* Sender Label */}
                        <p className={`text-xs mb-1 ${
                          message.senderType === 'vendor' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.senderType === 'customer' ? 'Customer' : message.senderType === 'vendor' ? 'Vendor' : 'System'}
                        </p>

                        {renderMessageContent(message)}

                        <p className={`text-xs mt-1 text-right ${
                          message.senderType === 'vendor' ? 'text-green-100' : 'text-gray-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Read-only Footer */}
            <div className="p-4 border-t bg-gray-100">
              <p className="text-center text-sm text-gray-500">
                Read-only mode - You cannot send messages in this conversation
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Customer
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {conversation.customer?.name || 'N/A'}
                  </p>
                </div>
              </div>
              {conversation.customer?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{conversation.customer.phone}</span>
                </div>
              )}
              {conversation.customer?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{conversation.customer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Info */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-gray-400" />
              Vendor
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Store className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {conversation.vendor?.businessName}
                  </p>
                  <p className="text-sm text-gray-500">{conversation.vendor?.ownerName}</p>
                </div>
              </div>
              {conversation.vendor?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{conversation.vendor.phone}</span>
                </div>
              )}
              <Link
                href={`/manager/vendors/${conversation.vendor?.id}`}
                className="text-sm text-green-600 hover:underline"
              >
                View Vendor Profile
              </Link>
            </div>
          </div>

          {/* Booking Info */}
          {bookingDetails && (
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ServiceIcon className="w-5 h-5 text-gray-400" />
                Booking Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Booking ID</span>
                  <span className="text-sm font-medium text-gray-900">{bookingDetails.bookingId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    BOOKING_STATUS_CONFIG[bookingDetails.status]?.bg || 'bg-gray-100'
                  } ${BOOKING_STATUS_CONFIG[bookingDetails.status]?.text || 'text-gray-700'}`}>
                    {BOOKING_STATUS_CONFIG[bookingDetails.status]?.label || bookingDetails.status}
                  </span>
                </div>
                {bookingDetails.fleet && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Vehicle</span>
                    <span className="text-sm font-medium text-gray-900">
                      {bookingDetails.fleet.brand} {bookingDetails.fleet.model}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-medium text-gray-900 flex items-center">
                    <IndianRupee className="w-3 h-3" />
                    {bookingDetails.totalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Booked On</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(bookingDetails.createdAt)}
                  </span>
                </div>
                <Link
                  href={`/manager/bookings/${bookingDetails.id}?service=${conversation.bookingType}`}
                  className="block w-full text-center py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium mt-3"
                >
                  View Booking Details
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

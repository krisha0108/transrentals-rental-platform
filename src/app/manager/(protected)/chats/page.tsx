'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Search,
  MessageSquare,
  User,
  Store,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Bike,
  Car,
  Eye,
} from 'lucide-react';

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
  } | null;
  lastMessage: {
    id: string;
    content: string;
    senderType: string;
    messageType: string;
    createdAt: string;
  } | null;
  messageCount: number;
}

interface Stats {
  total: number;
  active: number;
  closed: number;
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active', icon: CheckCircle },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed', icon: XCircle },
};

export default function ManagerChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/manager/chats?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch chats');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch chats');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!loading) fetchConversations();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchConversations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Conversations</h1>
          <p className="text-gray-500 mt-1">View conversations between vendors and customers</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                <p className="text-xs text-gray-500">Closed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer or vendor name..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <Eye className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p className="text-blue-700 text-sm">
          You have read-only access to these conversations. Messages between vendors and customers are shown for monitoring purposes.
        </p>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No chat conversations in your assigned locations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => {
              const statusConfig = STATUS_CONFIG[conversation.status] || STATUS_CONFIG.ACTIVE;
              const StatusIcon = statusConfig.icon;
              const ServiceIcon = SERVICE_ICONS[conversation.bookingType] || MessageSquare;
              return (
                <Link
                  key={conversation.id}
                  href={`/manager/chats/${conversation.id}`}
                  className="block p-4 sm:p-5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs flex items-center gap-1">
                          <ServiceIcon className="w-3 h-3" />
                          {SERVICE_LABELS[conversation.bookingType] || conversation.bookingType}
                        </span>
                        <span className="text-xs text-gray-400">
                          {conversation.messageCount} messages
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="truncate">
                            {conversation.customer?.name || conversation.customer?.phone || 'Customer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Store className="w-4 h-4 text-gray-400" />
                          <span className="truncate">
                            {conversation.vendor?.businessName || 'Vendor'}
                          </span>
                        </div>
                      </div>

                      {/* Last Message Preview */}
                      {conversation.lastMessage && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium text-gray-600">
                            {conversation.lastMessage.senderType === 'customer' ? 'Customer' : 'Vendor'}:
                          </span>
                          <span className="truncate">
                            {conversation.lastMessage.messageType === 'TEXT'
                              ? truncateMessage(conversation.lastMessage.content)
                              : `[${conversation.lastMessage.messageType}]`}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatDate(conversation.lastMessage.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

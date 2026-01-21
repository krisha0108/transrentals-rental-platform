'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
  ChevronRight,
  Filter,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpdeskTicket {
  id: number | string;
  ticket_number?: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  subject?: string;
  message?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  admin_response?: string;
  notes?: string;
  images?: string;
  created_at?: string;
  updated_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  open: { label: 'Open', bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle },
  'in progress': { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  resolved: { label: 'Resolved', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle },
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getStatusConfig = (status?: string) => {
  const key = status?.toLowerCase().trim() || 'open';
  return STATUS_CONFIG[key] || STATUS_CONFIG.open;
};

export default function AdminHelpdeskTicketsPage() {
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [adminResponse, setAdminResponse] = useState('');

  const fetchTickets = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/helpdesk?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        setError(data.error || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Failed to fetch helpdesk tickets');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTickets();
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/helpdesk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: updateStatus || selectedTicket.status,
          response: adminResponse,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? { ...t, status: updateStatus || t.status, admin_response: adminResponse }
              : t
          )
        );
        setSelectedTicket(null);
        setUpdateStatus('');
        setAdminResponse('');
      } else {
        alert(data.error || 'Failed to update ticket');
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
      alert('Failed to update ticket');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.customer_name?.toLowerCase().includes(query) ||
      ticket.customer_email?.toLowerCase().includes(query) ||
      ticket.customer_phone?.includes(query) ||
      ticket.subject?.toLowerCase().includes(query) ||
      ticket.message?.toLowerCase().includes(query) ||
      ticket.ticket_number?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading helpdesk tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/helpdesk"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">CRM Helpdesk Tickets</h1>
          </div>
          <p className="text-gray-600 ml-10">Manage customer helpdesk tickets from the CRM system</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets by name, email, phone, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && filteredTickets.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'No tickets match your search criteria'
              : 'There are no helpdesk tickets to display'}
          </p>
        </div>
      )}

      {/* Tickets List */}
      {filteredTickets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          #{ticket.ticket_number || ticket.id}
                        </p>
                        <p className="text-xs text-gray-500">{ticket.category || 'General'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{ticket.customer_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{ticket.customer_phone || ticket.customer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 line-clamp-2">{ticket.subject || 'No subject'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(ticket.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setUpdateStatus(ticket.status || 'open');
                            setAdminResponse(ticket.admin_response || '');
                          }}
                        >
                          View
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Ticket #{selectedTicket.ticket_number || selectedTicket.id}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Created {formatDateTime(selectedTicket.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{selectedTicket.customer_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{selectedTicket.customer_phone || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedTicket.customer_email || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Ticket Content */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Subject</h3>
                <p className="text-gray-700">{selectedTicket.subject || 'No subject'}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedTicket.message || selectedTicket.description || 'No message'}
                </p>
              </div>

              {/* Update Form */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Update Ticket</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Response</label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={4}
                    placeholder="Add your response to the customer..."
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTicket} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Update Ticket
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Tag,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

interface Ticket {
  id: string;
  ticket_no: string;
  heading: string;
  problem: string;
  status: string;
  priority: string;
  booking_id?: string;
  booking_type?: string;
  images?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    image?: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'normal':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'low':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '\u2014';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
};

export default function ManagerTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const [newStatus, setNewStatus] = useState('');
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/manager/helpdesk?ticketId=${ticketId}`);
      const data = await res.json();

      if (data.success && data.ticket) {
        setTicket(data.ticket);
        setNewStatus(data.ticket.status);
        setResolution(data.ticket.resolution || '');
      } else {
        setError('Ticket not found');
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!ticket) return;

    try {
      setUpdating(true);
      const res = await fetch('/api/manager/helpdesk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          status: newStatus,
          resolution: resolution,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchTicket();
        alert('Ticket updated successfully');
      } else {
        alert(data.error || 'Failed to update ticket');
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      alert('Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Ticket Not Found</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700">{error || 'The requested ticket could not be found.'}</p>
          <Link
            href="/manager/helpdesk"
            className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Helpdesk
          </Link>
        </div>
      </div>
    );
  }

  const images = ticket.images ? JSON.parse(ticket.images) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{ticket.ticket_no}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}
              >
                {ticket.status.replace('_', ' ')}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}
              >
                {ticket.priority}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Created {formatDateTime(ticket.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Issue Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{ticket.heading}</h3>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Problem Description</p>
                <div className="bg-slate-50 rounded-xl p-4 text-slate-700 whitespace-pre-wrap">
                  {ticket.problem}
                </div>
              </div>

              {ticket.booking_id && (
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs text-indigo-500 uppercase tracking-wider">Related Booking</p>
                    <p className="font-medium text-indigo-900">
                      {ticket.booking_type}: {ticket.booking_id}
                    </p>
                  </div>
                  <Link
                    href={`/manager/bookings`}
                    className="ml-auto p-2 hover:bg-indigo-100 rounded-lg transition"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                  </Link>
                </div>
              )}

              {/* Images */}
              {images.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Attached Images ({images.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img: string, idx: number) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-video bg-slate-100 rounded-lg overflow-hidden hover:opacity-90 transition"
                      >
                        <img
                          src={img}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resolution / Response */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resolution / Response
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {ticket.resolution && ticket.status.toLowerCase() === 'resolved' ? (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-green-600 mb-1">
                    Resolved on {formatDateTime(ticket.resolved_at)}
                  </p>
                  <p className="text-green-900 whitespace-pre-wrap">{ticket.resolution}</p>
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  placeholder="Add resolution notes or response to customer..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleUpdateTicket}
                disabled={updating}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Update Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Customer
              </h2>
            </div>
            <div className="p-6">
              {ticket.customer ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                      {ticket.customer.image ? (
                        <img
                          src={ticket.customer.image}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{ticket.customer.name}</p>
                      <p className="text-sm text-slate-500">Customer</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <a
                        href={`tel:${ticket.customer.phone}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {ticket.customer.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a
                        href={`mailto:${ticket.customer.email}`}
                        className="text-indigo-600 hover:underline truncate"
                      >
                        {ticket.customer.email}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No customer information available</p>
              )}
            </div>
          </div>

          {/* Ticket Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Ticket Created</p>
                    <p className="text-xs text-slate-500">{formatDateTime(ticket.created_at)}</p>
                  </div>
                </div>

                {ticket.updated_at !== ticket.created_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Last Updated</p>
                      <p className="text-xs text-slate-500">{formatDateTime(ticket.updated_at)}</p>
                    </div>
                  </div>
                )}

                {ticket.resolved_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Resolved</p>
                      <p className="text-xs text-slate-500">{formatDateTime(ticket.resolved_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  Calendar,
  Inbox,
} from 'lucide-react';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

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
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
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
    hour12: true,
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

  // Ticket number, status/priority badges and Back go into the shared sticky bar,
  // which was otherwise rendering empty above this page's own header row.
  useManagerPageHeader(
    ticket ? ticket.ticket_no : 'Ticket',
    ticket ? `Created ${formatDateTime(ticket.created_at)}` : undefined,
    ticket ? (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
          {ticket.status.replace('_', ' ')}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority}
        </span>
      </div>
    ) : undefined,
    <button
      type="button"
      onClick={() => router.back()}
      title="Back"
      className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0 text-slate-600"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>,
  );

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

  const images = (() => {
    if (!ticket.images) return [];
    try {
      const parsed = JSON.parse(ticket.images);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [ticket.images];
    }
  })();

  return (
    <div className="space-y-6">
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

              {ticket.booking_id && (() => {
                const bid = String(ticket.booking_id);
                const prefix = bid.split('-')[0]?.toUpperCase();
                const slugMap: Record<string, string> = {
                  'BK': 'bike-on-rent', 'BKQ': 'bike-on-rent',
                  'CB': 'car-rental', 'CR': 'car-rental',
                  'BB': 'bus-rental', 'BUS': 'bus-rental', 'BQR': 'bus-rental', 'BUSQ': 'bus-rental',
                  'SD': 'self-drive-car-rentals', 'SDQ': 'self-drive-car-rentals',
                  'TB': 'truck-rental', 'TR': 'truck-rental', 'TQR': 'truck-rental',
                  'EB': 'equipment-rental', 'EQ': 'equipment-rental', 'EQR': 'equipment-rental',
                  'PB': 'packers-movers', 'PK': 'packers-movers', 'PQR': 'packers-movers', 'PKQ': 'packers-movers',
                  'LB': 'luxury-car-rental', 'LUX': 'luxury-car-rental', 'LQR': 'luxury-car-rental', 'LUXQ': 'luxury-car-rental',
                };
                const serviceSlug = slugMap[prefix] || 'car-rental';
                const bookingUrl = `/manager/bookings/${bid}`;
                return (
                  <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-indigo-500 uppercase tracking-wider">Related Booking</p>
                      <p className="font-medium text-indigo-900">{bid}</p>
                    </div>
                    <Link
                      href={bookingUrl}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition text-sm font-medium text-indigo-700"
                    >
                      View Booking
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })()}

              {/* Images */}
              {images.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Attached Images ({images.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img: string, idx: number) => {
                      const src = img.startsWith('/') || img.startsWith('http') ? img : `/${img}`;
                      return (
                        <a
                          key={idx}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-video bg-slate-100 rounded-lg overflow-hidden hover:opacity-90 transition"
                        >
                          <img
                            src={src}
                            alt={`Attachment ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      );
                    })}
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
              {ticket.resolution && ['resolved', 'closed'].includes(ticket.status.toLowerCase()) ? (
                <div className={`rounded-xl p-4 border ${ticket.status.toLowerCase() === 'closed' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <p className={`text-sm mb-1 ${ticket.status.toLowerCase() === 'closed' ? 'text-red-600' : 'text-green-600'}`}>
                    {ticket.status.toLowerCase() === 'closed' ? 'Cancelled' : 'Resolved'} on {formatDateTime(ticket.resolved_at)}
                  </p>
                  <p className={`whitespace-pre-wrap ${ticket.status.toLowerCase() === 'closed' ? 'text-red-900' : 'text-green-900'}`}>{ticket.resolution}</p>
                </div>
              ) : null}

              {!['resolved', 'closed'].includes(ticket.status.toLowerCase()) && (
                <>
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
                      <option value="CLOSED">Cancelled</option>
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
                </>
              )}
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

                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                    <Link
                      href={`/manager/bookings?search=${encodeURIComponent(ticket.customer.email)}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-xl hover:bg-emerald-100 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      View Customer Bookings
                    </Link>
                    <Link
                      href={`/manager/inquiries?search=${encodeURIComponent(ticket.customer.email)}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-100 transition"
                    >
                      <Inbox className="w-4 h-4" />
                      View Customer Quote Requests
                    </Link>
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

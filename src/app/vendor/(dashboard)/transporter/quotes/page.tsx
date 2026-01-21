'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Truck,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Calendar,
  ArrowRight,
  IndianRupee,
  AlertCircle,
  Weight,
} from 'lucide-react';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';

interface Quote {
  id: string;
  quoteNumber: string;
  vehicleName: string;
  chauffeur_vehicle_categories: string;
  totalAmount: number;
  status: string;
  validTill: string;
  viewCount: number;
  request: {
    id: string;
    requestNumber: string;
    customerName: string;
    pickupCity: string;
    dropCity: string;
    pickupDate: string;
    status: string;
  };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SENT: { label: 'Awaiting Response', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  VIEWED: { label: 'Viewed', color: 'bg-blue-100 text-blue-700', icon: Eye },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

export default function VendorTransporterQuotesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const config = TRANSPORTER_CONFIG;

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') return;

    fetchQuotes();
  }, [sessionStatus, filter]);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const status = filter !== 'all' ? filter : '';
      const response = await fetch(`/api/vendor/truck-quotes?status=${status}`);
      const data = await response.json();

      if (data.success) {
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuotes = quotes;

  const getCategoryName = (id: string) => {
    return config.categories.find((c) => c.id === id)?.shortName || id || 'Transport';
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
            <p className="text-gray-600">Track your submitted quotes</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
          <p className="text-sm text-gray-500">Total Quotes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-yellow-100">
          <p className="text-2xl font-bold text-yellow-600">
            {quotes.filter((q) => q.status === 'PENDING').length}
          </p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {quotes.filter((q) => q.status === 'ACCEPTED').length}
          </p>
          <p className="text-sm text-gray-500">Accepted</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-100">
          <p className="text-2xl font-bold text-red-600">
            {quotes.filter((q) => q.status === 'REJECTED').length}
          </p>
          <p className="text-sm text-gray-500">Rejected</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All Quotes' },
          { value: 'SENT', label: 'Pending' },
          { value: 'VIEWED', label: 'Viewed' },
          { value: 'ACCEPTED', label: 'Accepted' },
          { value: 'REJECTED', label: 'Rejected' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === f.value
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No quotes found</h3>
            <p className="text-sm text-gray-500">Your submitted quotes will appear here</p>
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.SENT;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={quote.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      #{quote.quoteNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      for #{quote.request?.requestNumber}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{quote.request?.customerName || 'Customer'}</h3>
                        <p className="text-sm text-gray-500">
                          {quote.vehicleName || getCategoryName(quote.vehicle_category)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {quote.request?.pickupCity}
                          <ArrowRight className="w-3 h-3" />
                          {quote.request?.dropCity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 flex items-center justify-end">
                        <IndianRupee className="w-5 h-5" />
                        {quote.totalAmount?.toLocaleString()}
                      </p>
                      {quote.viewCount > 0 && (
                        <p className="text-sm text-gray-500 flex items-center justify-end gap-1">
                          <Eye className="w-4 h-4" />
                          Viewed {quote.viewCount}x
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    {quote.request?.pickupDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        Pickup: {new Date(quote.request.pickupDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      Quoted: {getTimeAgo(quote.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/transporter/quotes/${quote.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {quote.status === 'ACCEPTED' && (
                      <Link
                        href="/vendor/transporter/bookings"
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        View Booking
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

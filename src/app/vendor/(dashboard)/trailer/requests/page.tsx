'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  Inbox,
  MapPin,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle,
  Eye,
  Phone,
  Mail,
  User,
  ArrowRight,
  Weight,
} from 'lucide-react';
import { TRAILER_CONFIG } from '@/lib/quote-services';

interface QuoteRequest {
  id: string;
  inquiryNumber: string;
  trailerType: string;
  cargoType: string;
  weight: number;
  dimensions: string;
  fromCity: string;
  toCity: string;
  loadingDate: string;
  needCrane: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialRequirements?: string;
  quotesReceived: number;
  createdAt: string;
  hasQuoted: boolean;
}

const SAMPLE_REQUESTS: QuoteRequest[] = [
  {
    id: '1',
    inquiryNumber: 'TL-INQ-2024-0001',
    trailerType: 'lowbed',
    cargoType: 'Excavator PC300',
    weight: 35000,
    dimensions: '12x3x3.5',
    fromCity: 'Chennai',
    toCity: 'Hyderabad',
    loadingDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    needCrane: false,
    customerName: 'Metro Construction',
    customerPhone: '9737965551',
    specialRequirements: 'Self-loading with ramps',
    quotesReceived: 3,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    hasQuoted: false,
  },
  {
    id: '2',
    inquiryNumber: 'TL-INQ-2024-0002',
    trailerType: 'flatbed-40ft',
    cargoType: 'Steel Beams',
    weight: 28000,
    dimensions: '40x8x4',
    fromCity: 'Jamshedpur',
    toCity: 'Mumbai',
    loadingDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    needCrane: true,
    customerName: 'Steel Works Ltd.',
    customerPhone: '9737965551',
    quotesReceived: 5,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    hasQuoted: true,
  },
];

export default function VendorTrailerRequestsPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const config = TRAILER_CONFIG;

  useEffect(() => {
    setTimeout(() => {
      setRequests(SAMPLE_REQUESTS);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (filter === 'new') return !r.hasQuoted;
    if (filter === 'quoted') return r.hasQuoted;
    return true;
  });

  const getCategoryName = (id: string) => {
    return config.categories.find((c) => c.id === id)?.shortName || id;
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Inbox className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trailer Requests</h1>
            <p className="text-gray-600">Quote requests for trailer & low-bed</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { value: 'new', label: 'New Requests' },
            { value: 'quoted', label: 'My Quotes' },
            { value: 'all', label: 'All' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.value
                  ? 'bg-white text-slate-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No requests found</h3>
            <p className="text-sm text-gray-500">
              {filter === 'new'
                ? 'No new quote requests at the moment'
                : 'No requests match this filter'}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className={`px-4 py-2 flex items-center justify-between ${request.hasQuoted ? 'bg-green-50' : 'bg-slate-50'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{request.customerName}</span>
                  <span className="text-xs text-gray-500">{getTimeAgo(request.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {request.quotesReceived > 0 && (
                    <span className="text-xs text-gray-500">
                      {request.quotesReceived} quotes received
                    </span>
                  )}
                  {request.hasQuoted ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Quoted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      New
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Container className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{getCategoryName(request.trailerType)}</h3>
                      <p className="text-sm text-gray-500">{request.cargoType}</p>
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">
                          {request.fromCity}<ArrowRight className="w-3 h-3 inline mx-1" />{request.toCity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-slate-600 font-semibold">
                      <Weight className="w-4 h-4" />
                      {(request.weight / 1000).toFixed(0)} tons
                    </div>
                    <p className="text-xs text-gray-500">{request.dimensions} ft</p>
                    {request.needCrane && (
                      <span className="text-xs text-amber-600">Crane needed</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Loading: {new Date(request.loadingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                {/* Customer Info Card */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <User className="w-4 h-4 text-blue-500" />
                      {request.customerName}
                    </div>
                    {request.customerPhone && (
                      <a href={`tel:${request.customerPhone}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        {request.customerPhone}
                      </a>
                    )}
                    {request.customerEmail && (
                      <a href={`mailto:${request.customerEmail}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        <Mail className="w-3.5 h-3.5" />
                        {request.customerEmail}
                      </a>
                    )}
                  </div>
                </div>

                {expandedId === request.id && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    {request.specialRequirements && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Special Requirements</span>
                        <p className="text-sm text-gray-700">{request.specialRequirements}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  <button
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {expandedId === request.id ? 'Less Details' : 'View Details'}
                  </button>
                  {!request.hasQuoted ? (
                    <Link
                      href={`/vendor/trailer/requests/${request.id}/quote`}
                      className="px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send Quote
                    </Link>
                  ) : (
                    <Link
                      href={`/vendor/trailer/quotes/${request.id}`}
                      className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      View Your Quote
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

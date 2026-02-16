'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cog,
  Inbox,
  MapPin,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  CheckCircle,
  Eye,
  Phone,
} from 'lucide-react';
import { JCB_CONFIG } from '@/lib/quote-services';

interface QuoteRequest {
  id: string;
  inquiryNumber: string;
  equipmentType: string;
  workType: string;
  duration: string;
  startDate: string;
  siteLocation: string;
  city: string;
  customerName: string;
  customerPhone: string;
  specialRequirements?: string;
  quotesReceived: number;
  createdAt: string;
  hasQuoted: boolean;
}

const SAMPLE_REQUESTS: QuoteRequest[] = [
  {
    id: '1',
    inquiryNumber: 'JCB-INQ-2024-0001',
    equipmentType: 'JCB 3DX Backhoe',
    workType: 'excavation',
    duration: '1-week',
    startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    siteLocation: 'Plot No. 45, Industrial Area',
    city: 'Faridabad',
    customerName: 'ABC Builders',
    customerPhone: '9737965551',
    specialRequirements: 'Foundation digging for residential building',
    quotesReceived: 3,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    hasQuoted: false,
  },
  {
    id: '2',
    inquiryNumber: 'JCB-INQ-2024-0002',
    equipmentType: 'Excavator PC200',
    workType: 'loading',
    duration: '1-month',
    startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    siteLocation: 'Stone Quarry, Outer Ring',
    city: 'Hyderabad',
    customerName: 'Rock Mining Co.',
    customerPhone: '9876543211',
    quotesReceived: 5,
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    hasQuoted: true,
  },
];

export default function VendorJCBRequestsPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const config = JCB_CONFIG;

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
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Inbox className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">JCB Rental Requests</h1>
            <p className="text-gray-600">Quote requests for JCB and excavators</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { value: 'new', label: 'New', count: requests.filter((r) => !r.hasQuoted).length },
            { value: 'quoted', label: 'Quoted', count: requests.filter((r) => r.hasQuoted).length },
            { value: 'all', label: 'All', count: requests.length },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.value ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-600'
                }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filter === f.value ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200'
                  }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900">No requests found</h3>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className={`px-4 py-2 flex items-center justify-between ${request.hasQuoted ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-700">#{request.inquiryNumber}</span>
                  <span className="text-xs text-gray-500">{getTimeAgo(request.createdAt)}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${request.hasQuoted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  {request.hasQuoted ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {request.hasQuoted ? 'Quoted' : 'New'}
                </span>
              </div>

              <div className="p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Cog className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{request.equipmentType}</h3>
                      <p className="text-sm text-gray-500 capitalize">{request.workType}</p>
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{request.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded">
                      {request.duration.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-yellow-500" />
                    Start: {new Date(request.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short',
                    })}
                  </div>
                </div>

                {expandedId === request.id && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Site Location</span>
                      <p className="text-sm text-gray-700">{request.siteLocation}</p>
                    </div>
                    {request.specialRequirements && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Work Details</span>
                        <p className="text-sm text-gray-700">{request.specialRequirements}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="text-xs text-gray-500">Customer</span>
                        <p className="text-sm font-medium">{request.customerName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Phone</span>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />{request.customerPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  <button
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {expandedId === request.id ? 'Less' : 'Details'}
                  </button>
                  {!request.hasQuoted ? (
                    <Link
                      href={`/vendor/jcb/requests/${request.id}/quote`}
                      className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send Quote
                    </Link>
                  ) : (
                    <Link
                      href={`/vendor/jcb/quotes/${request.id}`}
                      className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      View Quote
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

// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, MapPin, Clock, Users, Calendar, Loader2, Heart,
  ChevronRight, CheckCircle, AlertCircle, Hourglass,
  Play, Flag, XCircle, MessageSquare, IndianRupee, UserPlus,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:           { label: 'Pending',           color: 'text-amber-700',   bg: 'bg-amber-100' },
  QUOTED:            { label: 'Quoted',             color: 'text-blue-700',    bg: 'bg-blue-100' },
  ACCEPTED:          { label: 'Accepted',           color: 'text-emerald-700', bg: 'bg-emerald-100' },
  CANCELLED:         { label: 'Cancelled',          color: 'text-red-600',     bg: 'bg-red-100' },
  EXPIRED:           { label: 'Expired',            color: 'text-gray-500',    bg: 'bg-gray-100' },
  PAYMENT_PENDING:   { label: 'Payment Pending',    color: 'text-amber-700',   bg: 'bg-amber-100' },
  PAYMENT_SUBMITTED: { label: 'Payment Review',     color: 'text-orange-700',  bg: 'bg-orange-100' },
  CONFIRMED:         { label: 'Confirmed',          color: 'text-emerald-700', bg: 'bg-emerald-100' },
  GUIDE_ASSIGNED:    { label: 'Guide Assigned',     color: 'text-blue-700',    bg: 'bg-blue-100' },
  STARTED:           { label: 'Started',            color: 'text-indigo-700',  bg: 'bg-indigo-100' },
  COMPLETED:         { label: 'Completed',          color: 'text-gray-600',    bg: 'bg-gray-100' },
  DROPPED:           { label: 'Dropped',            color: 'text-gray-400',    bg: 'bg-gray-50' },
};

function fmt(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseImages(val: string | null): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

interface TourDashboardProps {
  customerId: string;
}

export default function TourDashboard({ customerId }: TourDashboardProps) {
  const [tab, setTab] = useState<'requests' | 'bookings' | 'wishlist' | 'groups'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [groups, setGroups]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/customer/wander-quote-requests?customer_id=${customerId}`).then(r => r.json()),
      fetch(`/api/customer/wander-bookings?customer_id=${customerId}`).then(r => r.json()),
      fetch(`/api/wander/wishlist?customerId=${customerId}`).then(r => r.json()),
      fetch(`/api/customer/wander-groups?customer_id=${customerId}`).then(r => r.json()),
    ]).then(([reqData, bookData, wishData, grpData]) => {
      setRequests(reqData.requests || []);
      setBookings(bookData.bookings || []);
      setWishlists(wishData.wishlists || []);
      setGroups(grpData.groups || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  // Stats
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const quotedRequests = requests.filter(r => r.status === 'QUOTED').length;
  const activeBookings = bookings.filter(b => ['CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED', 'PAYMENT_PENDING', 'PAYMENT_SUBMITTED'].includes(b.status)).length;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Hourglass} label="Pending Requests" value={pendingRequests} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={MessageSquare} label="Quotes Received" value={quotedRequests} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Play} label="Active Tours" value={activeBookings} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Flag} label="Completed" value={completedBookings} color="text-gray-600" bg="bg-gray-50" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('requests')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
            tab === 'requests' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Quote Requests ({requests.length})
        </button>
        <button
          onClick={() => setTab('bookings')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
            tab === 'bookings' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setTab('wishlist')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 ${
            tab === 'wishlist' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${tab === 'wishlist' ? 'fill-red-500' : ''}`} /> Saved ({wishlists.length})
        </button>
        <button
          onClick={() => setTab('groups')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
            tab === 'groups' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Groups ({groups.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'requests' && (
        requests.length === 0 ? (
          <EmptyState message="No tour quote requests yet" sub="Browse tours and request quotes to get started!" link="/wander" linkText="Explore Tours" />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const listing = req.listing;
              const images = parseImages(listing?.images);
              const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
              const quoteCount = req.quotes?.length || 0;
              const lowestQuote = quoteCount > 0 ? req.quotes[0] : null;

              return (
                <Link
                  key={req.id}
                  href={`/customer/wander-quotes/${req.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex">
                    {/* Image */}
                    <div className="w-28 sm:w-36 flex-shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
                      {images[0] ? (
                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Compass className="w-8 h-8 text-indigo-200" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          {listing?.category && (
                            <span className="text-[10px] font-semibold text-indigo-500">{listing.category.icon} {listing.category.name}</span>
                          )}
                          <h3 className="font-bold text-gray-900 text-sm truncate">{listing?.title || 'Tour Request'}</h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-2">
                        {listing?.mainLocation?.name && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.mainLocation.name}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmt(req.travelDate)}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {req.groupSize} pax</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs flex items-center gap-2">
                          {quoteCount > 0 ? (
                            <span className="text-emerald-600 font-semibold">
                              {quoteCount} quote{quoteCount > 1 ? 's' : ''} · from ₹{Number(lowestQuote.amount).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-gray-400">Waiting for quotes...</span>
                          )}
                          {req.bookingFor === 'COMPANY' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">🏢 Company</span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {tab === 'bookings' && (
        bookings.length === 0 ? (
          <EmptyState message="No tour bookings yet" sub="Accept a quote to create your first booking" />
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const listing = booking.quoteRequest?.listing;
              const images = parseImages(listing?.images);
              const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
              const vendor = booking.quote?.vendor;

              return (
                <Link
                  key={booking.id}
                  href={`/customer/wander-quotes/${booking.quoteRequestId}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex">
                    {/* Image */}
                    <div className="w-28 sm:w-36 flex-shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
                      {images[0] ? (
                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Compass className="w-8 h-8 text-indigo-200" />
                        </div>
                      )}
                      {/* Status strip */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                        booking.status === 'STARTED' ? 'bg-indigo-500' :
                        booking.status === 'CONFIRMED' ? 'bg-emerald-500' :
                        booking.status === 'COMPLETED' ? 'bg-gray-400' :
                        'bg-amber-400'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono text-gray-400 mb-0.5">{booking.bookingId}</p>
                          <h3 className="font-bold text-gray-900 text-sm truncate">{listing?.title || 'Tour Booking'}</h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-2">
                        {listing?.mainLocation?.name && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.mainLocation.name}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmt(booking.travelDate)}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {booking.groupSize} pax</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-bold text-indigo-700 flex items-center gap-0.5">
                            <IndianRupee className="w-3 h-3" />
                            {Number(booking.amount).toLocaleString('en-IN')}
                          </span>
                          {vendor?.businessName && (
                            <span className="text-gray-400">by {vendor.businessName}</span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* Wishlist Tab */}
      {tab === 'wishlist' && (
        wishlists.length === 0 ? (
          <EmptyState message="No saved tours yet" sub="Tap the heart icon on any tour to save it here" link="/wander" linkText="Explore Tours" />
        ) : (
          <div className="space-y-3">
            {wishlists.map((w: any) => {
              const listing = w.listing;
              if (!listing) return null;
              const images = parseImages(listing.images);
              return (
                <Link
                  key={w.id}
                  href={`/wander/${listing.slug || listing.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex">
                    <div className="w-28 sm:w-36 flex-shrink-0 bg-gradient-to-br from-red-50 to-pink-50 relative overflow-hidden">
                      {images[0] ? (
                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Compass className="w-8 h-8 text-red-200" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </div>
                    </div>
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          {listing.category && (
                            <span className="text-[10px] font-semibold text-indigo-500">{listing.category.icon} {listing.category.name}</span>
                          )}
                          <h3 className="font-bold text-gray-900 text-sm truncate">{listing.title}</h3>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-2">
                        {listing.mainLocation?.name && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.mainLocation.name}</span>
                        )}
                        {listing.duration && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {listing.duration}</span>
                        )}
                        {listing.vendor?.businessName && (
                          <span className="text-gray-300">by {listing.vendor.businessName}</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* Groups tab */}
      {tab === 'groups' && (
        groups.length === 0 ? (
          <EmptyState message="No group trips yet" sub='Go to a tour page and click "Plan with Friends" to create your first group' link="/wander" linkText="Explore Tours" />
        ) : (
          <div className="space-y-3">
            {groups.map((g: any) => {
              const planningTrips  = (g.trips || []).filter((t: any) => t.status === 'PLANNING').length;
              const submittedTrips = (g.trips || []).filter((t: any) => t.status === 'SUBMITTED').length;
              return (
                <Link
                  key={g.id}
                  href={`/wander/group/${g.groupCode}`}
                  className="block bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{g.name}</h3>
                        <p className="text-xs font-mono text-emerald-600 mt-0.5">{g.groupCode}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {(g.members || []).length} members
                    </span>
                    {planningTrips > 0 && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        🗓 {planningTrips} planning
                      </span>
                    )}
                    {submittedTrips > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ✅ {submittedTrips} submitted
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-gray-100`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ message, sub, link, linkText }: { message: string; sub: string; link?: string; linkText?: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
      <Compass className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="font-semibold text-gray-500 mb-1">{message}</p>
      <p className="text-sm text-gray-400 mb-4">{sub}</p>
      {link && (
        <Link href={link} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">
          <Compass className="w-4 h-4" /> {linkText}
        </Link>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  CalendarCheck,
  MapPin,
  Calendar,
  Phone,
  Eye,
  IndianRupee,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  ArrowRight,
  Truck,
  Loader2,
  Users,
  Search,
  X,
} from 'lucide-react';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

interface PackersBooking {
  id: string;
  bookingNumber: string;
  serviceType: string;
  shiftingType: string;
  customerName: string;

  pickupCity: string;
  pickupAddress: string;
  pickupFloor?: number;
  dropCity: string;
  dropAddress: string;
  dropFloor?: number;
  scheduledDate: string;
  teamSize: number;
  totalAmount: number;
  advanceAmount: number;
  advancePaid: boolean;
  status: string;
  paymentStatus: string;
  teamLeaderName?: string;
  teamLeaderPhone?: string;
  quoteRequest?: {
    id: string;
    requestNumber: string;
  };
  createdAt: string;
}

interface Stats {
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  totalEarnings: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  TEAM_ASSIGNED: { label: 'Team Assigned', color: 'bg-emerald-100 text-emerald-700', icon: Users },
  PACKING: { label: 'Packing', color: 'bg-emerald-100 text-emerald-700', icon: Package },
  LOADING: { label: 'Loading', color: 'bg-cyan-100 text-cyan-700', icon: Truck },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-emerald-100 text-emerald-700', icon: Navigation },
  UNLOADING: { label: 'Unloading', color: 'bg-teal-100 text-teal-700', icon: Truck },
  UNPACKING: { label: 'Unpacking', color: 'bg-pink-100 text-pink-700', icon: Package },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function VendorPackersBookingsPage() {
  const [bookings, setBookings] = useState<PackersBooking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filter, currentPage, dateFilter, search]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filter === 'upcoming') params.set('type', 'pending');
      else if (filter === 'confirmed') params.set('type', 'confirmed');
      else if (filter === 'active') params.set('type', 'active');
      else if (filter === 'completed') params.set('type', 'completed');

      // Pagination params
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // Date filter params
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);
      if (search) params.set('search', search);

      const response = await fetch(`/api/vendor/packers-bookings?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings || []);
        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      } else {
        setError(data.error || 'Failed to load bookings');
      }
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/vendor/packers-bookings', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      // Silent fail for stats
    }
  };

  const handleSearch = () => { setSearch(searchInput); setCurrentPage(1); };
  const handleClearSearch = () => { setSearchInput(''); setSearch(''); setCurrentPage(1); };

  const getBalanceAmount = (booking: PackersBooking) => {
    return booking.advancePaid ? booking.totalAmount - booking.advanceAmount : booking.totalAmount;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 md:p-6">
        <div className="absolute inset-0 opacity-10"><div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" /><div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" /></div>
        <div className="relative flex items-center gap-3.5">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20"><Package className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-xl font-extrabold text-white">Packers Bookings</h1><p className="text-emerald-100 text-xs mt-0.5">Manage your confirmed shifting jobs</p></div>
        </div>
      </div>

      {error && (<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>)}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming', value: stats ? stats.pending + stats.confirmed : 0, icon: <CalendarCheck className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'confirmed jobs' },
          { label: 'In Progress', value: stats?.active || 0, icon: <Navigation className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'active shifting' },
          { label: 'Completed', value: stats?.completed || 0, icon: <CheckCircle className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-gray-100 to-gray-50', iconColor: 'text-gray-500', border: 'border-gray-100', sub: 'finished jobs' },
          { label: 'Earnings', value: `₹${(stats?.totalEarnings || 0).toLocaleString()}`, icon: <IndianRupee className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'total revenue' },
        ].map((s: any) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center ${s.iconColor} group-hover:scale-110 transition-transform`}>{s.icon}</div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1">
            {[
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'active', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'all', label: 'All' },
            ].map((f) => (
              <button key={f.value} onClick={() => { setFilter(f.value); setCurrentPage(1); }} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${filter === f.value ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <Link href="/vendor/packers/bookings/cancelled" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </Link>
          <div className="flex gap-1.5 flex-1 min-w-[200px] max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search booking #, customer, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchInput && (
                <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="shrink-0 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Search
            </button>
          </div>
          <DateFilterDropdown onFilterChange={(start, end) => { setDateFilter({ start, end }); setCurrentPage(1); }} initialStartDate={dateFilter.start || undefined} initialEndDate={dateFilter.end || undefined} />
        </div>
      </div>

      {/* ── Bookings List ── */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-emerald-50 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-emerald-100 flex items-center justify-center shadow-sm"><Package className="w-7 h-7 text-emerald-400" /></div>
          </div>
          <p className="text-gray-900 font-bold text-base">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">{filter !== 'all' ? 'Try adjusting your filters' : 'Accepted quotes will appear here'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bookings.map((booking) => {
            const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
            const StatusIcon = sc.icon;
            const balanceAmount = getBalanceAmount(booking);
            const statusBorder = ['CONFIRMED', 'TEAM_ASSIGNED', 'ADVANCE_PAID'].includes(booking.status) ? '#10B981'
              : ['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'].includes(booking.status) ? '#8B5CF6'
              : ['CANCELLED', 'DROPPED'].includes(booking.status) ? '#EF4444'
              : booking.status === 'COMPLETED' ? '#6B7280' : '#F59E0B';

            return (
              <Link key={booking.id} href={`/vendor/packers/bookings/${booking.id}`}
                className="block bg-white rounded-2xl hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
                style={{ border: '1px solid #e8e8ee', borderLeft: `3px solid ${statusBorder}` }}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-bold text-gray-900">#{booking.bookingNumber}</span>
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.color}`}><StatusIcon className="w-2.5 h-2.5" /> {sc.label}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700"><Users className="w-3 h-3 text-gray-400" /> {booking.customerName}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1 capitalize"><Package className="w-3 h-3 text-gray-400" /> {booking.shiftingType} Shifting</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {booking.pickupCity} → {booking.dropCity}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span className="font-semibold text-emerald-600">(Team: {booking.teamSize})</span>
                      </div>
                      {booking.status === 'DROPPED' && (
                        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5"><XCircle className="w-3 h-3 shrink-0" /><span className="font-medium">Dropped</span></div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                        {balanceAmount > 0 && balanceAmount < booking.totalAmount && <p className="text-[10px] text-emerald-600 mt-0.5">Bal ₹{balanceAmount.toLocaleString()}</p>}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors"><Eye className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" /></div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {bookings.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={20} onPageChange={(page) => setCurrentPage(page)} />
      )}
    </div>
  );
}

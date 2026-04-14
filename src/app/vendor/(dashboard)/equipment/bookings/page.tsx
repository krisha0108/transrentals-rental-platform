'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Wrench,
  CalendarCheck,
  MapPin,
  Calendar,

  Eye,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Search,
  X,
} from 'lucide-react';
import { EQUIPMENT_CONFIG } from '@/lib/quote-services';
import Pagination from '@/components/vendor/Pagination';
import DateFilterDropdown from '@/components/vendor/DateFilterDropdown';

// Equipment type ID to name mapping (IDs from customer booking form)
const EQUIPMENT_TYPE_NAMES: Record<string, string> = {
  '1': 'Grove Crane',
  '2': 'Truck Mounted Crane',
  '3': 'Tower Crane',
  '4': 'Telescopic Crane',
  '5': 'Rough Terrain Crane',
  '6': 'Overhead Crane',
  '7': 'Bulldozer',
  '8': 'Dumper',
  '9': 'Loader',
  '10': 'Excavators',
  '11': 'Backhoe Loader',
};

interface EquipmentBooking {
  id: string;
  bookingNumber: string;
  equipmentCategory: string;
  equipmentType: string;
  equipmentName?: string;
  equipmentModel?: string;
  quantity: number;
  rentalDays?: number;
  startDate: string;
  endDate?: string;
  city: string;
  deliveryAddress: string;
  customerName: string;

  totalAmount: number;
  advanceAmount?: number;
  advancePaid?: number;
  status: string;
  paymentStatus?: string;
  operatorName?: string;
  operatorPhone?: string;
  deliveryOtp?: string;
  returnOtp?: string;
  rating?: number;
  quoteRequest?: { id: string; requestNumber: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DISPATCHED: { label: 'Dispatched', color: 'bg-emerald-100 text-emerald-700', icon: Wrench },
  DELIVERED: { label: 'Delivered', color: 'bg-cyan-100 text-cyan-700', icon: CheckCircle },
  ON_RENT: { label: 'On Rent', color: 'bg-emerald-100 text-emerald-700', icon: Clock },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: 'bg-emerald-100 text-emerald-700', icon: Calendar },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function VendorEquipmentBookingsPage() {
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, active: 0, completed: 0, totalEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // Fetch bookings from API
  const fetchBookings = async (type?: string) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (type && type !== 'all') {
        params.set('type', type);
      }

      // PAGINATION PARAMS
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      // DATE FILTER PARAMS
      if (dateFilter.start) params.set('startDate', dateFilter.start);
      if (dateFilter.end) params.set('endDate', dateFilter.end);
      if (search) params.set('search', search);

      const url = `/api/vendor/equipment-bookings?${params}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setBookings(data.bookings || []);
        // Set pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/vendor/equipment-bookings', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchBookings(filter);
    fetchStats();
  }, [filter, currentPage, dateFilter, search]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  // API already filters, so just use the bookings directly
  const filteredBookings = bookings;

  const getCategoryName = (category: string) => {
    const cat = EQUIPMENT_CONFIG?.categories?.find((c) => c.id === category);
    return cat?.shortName || cat?.name || category || 'Equipment';
  };

  const getEquipmentDisplayName = (booking: EquipmentBooking) => {
    return booking.equipmentName || booking.equipmentModel || booking.equipmentType || 'Equipment';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => { setError(null); fetchBookings(filter); }}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 md:p-6">
        <div className="absolute inset-0 opacity-10"><div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" /><div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" /></div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"><CalendarCheck className="w-6 h-6 text-white" /></div>
            <div><h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">Equipment Bookings</h1><p className="text-emerald-100 text-sm mt-0.5">Manage your rental contracts</p></div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active', value: bookings.filter((b) => ['CONFIRMED', 'DISPATCHED', 'DELIVERED', 'ON_RENT'].includes(b.status)).length, icon: <CheckCircle className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'in progress' },
          { label: 'Completed', value: bookings.filter((b) => b.status === 'COMPLETED').length, icon: <CalendarCheck className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-gray-100 to-gray-50', iconColor: 'text-gray-500', border: 'border-gray-100', sub: 'finished rentals' },
          { label: 'Balance', value: `₹${bookings.reduce((sum, b) => sum + (b.totalAmount - (b.advancePaid || 0)), 0).toLocaleString()}`, icon: <Clock className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'pending payments' },
          { label: 'Revenue', value: `₹${bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}`, icon: <TrendingUp className="w-4 h-4" />, iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100', sub: 'total value' },
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
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'all', label: 'All' },
            ].map((f) => (
              <button key={f.value} onClick={() => { setFilter(f.value); setCurrentPage(1); }} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${filter === f.value ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search booking, customer, equipment..." value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 focus:bg-white transition-all placeholder:text-gray-400" />
            {searchInput && (<button onClick={() => handleSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-gray-500" /></button>)}
          </div>
          <DateFilterDropdown onFilterChange={(start, end) => { setDateFilter({ start, end }); setCurrentPage(1); }} initialStartDate={dateFilter.start || undefined} initialEndDate={dateFilter.end || undefined} />
        </div>
      </div>

      {/* ── Bookings List ── */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-emerald-50 rounded-3xl -rotate-3" />
            <div className="relative w-full h-full bg-white rounded-3xl border border-emerald-100 flex items-center justify-center shadow-sm"><Wrench className="w-7 h-7 text-emerald-400" /></div>
          </div>
          <p className="text-gray-900 font-bold text-base">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredBookings.map((booking) => {
            const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
            const StatusIcon = sc.icon;
            const balanceAmount = booking.totalAmount - (booking.advancePaid || 0);
            const statusBorder = ['CONFIRMED', 'DISPATCHED', 'DELIVERED'].includes(booking.status) ? '#10B981'
              : booking.status === 'ON_RENT' ? '#8B5CF6'
              : ['CANCELLED', 'DROPPED'].includes(booking.status) ? '#EF4444'
              : booking.status === 'COMPLETED' ? '#6B7280' : '#F59E0B';

            return (
              <Link key={booking.id} href={`/vendor/equipment/bookings/${booking.id}`}
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
                        <span className="flex items-center gap-1 font-medium text-gray-700"><CalendarCheck className="w-3 h-3 text-gray-400" /> {booking.customerName}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-gray-400" /> {booking.equipmentName || EQUIPMENT_TYPE_NAMES[booking.equipmentType] || booking.equipmentType}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {booking.city}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{booking.endDate ? ` → ${new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</span>
                        {booking.rentalDays && <span className="font-semibold text-emerald-600">({booking.rentalDays}d)</span>}
                      </div>
                      {booking.status === 'DROPPED' && (
                        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5"><XCircle className="w-3 h-3 shrink-0" /><span className="font-medium">Dropped</span></div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-gray-900">₹{booking.totalAmount?.toLocaleString()}</p>
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

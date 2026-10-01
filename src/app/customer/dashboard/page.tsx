'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  LogOut,
  Loader2,
  ChevronRight,
  RefreshCw,
  Phone,
  Mail,
  Car,
  Star,
  IndianRupee,
  MessageCircle,
  Sparkles,
  Filter,
  Edit3,
  X,
  Save,
  AlertCircle,
  ChevronDown,
  Gift,
  Home,
  Menu,
  Inbox,
  Bell,
  BarChart,
  HelpCircle,
  Building2,
  Briefcase,
  Hash,
  ShieldCheck,
  Compass,
  Truck,
  Bike,
  Bus,
  Tractor,
  Caravan,
  Package,
  Wrench,
  Users,
  Coins,
  Zap,
  ExternalLink,
  TrendingUp,
  Search,

} from 'lucide-react';
import B2BDashboard from './B2BDashboard';
import TourDashboard from './TourDashboard';
import DashboardViewSwitch from './DashboardViewSwitch';
import { quoteDisplay } from '@/lib/quote-font';
import CustomerHeader from '@/components/customer/CustomerHeader';
import NotificationPanel from '@/components/customer/NotificationPanel';
import BackrCard from '@/components/backr/BackrCard';
import CustomerRefundsList from '@/components/customer/CustomerRefundsList';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Side-view luxury sedan. Drawn to match lucide's grid and stroke weight —
 * 24x24 box, 1.8 stroke, round caps — because it sits in the same row as their
 * bike, bus and truck on the hero road.
 */
const LuxuryCar = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {/* boot, raked screens, long bonnet — one silhouette */}
    <path d="M2.6 15.3v-1.8c0-.6.4-1.1.9-1.3l3.6-1.1 2.2-2.6c.4-.4.9-.7 1.5-.7h3.4c.6 0 1.2.3 1.5.7l2.3 2.7 3.1 1c.6.2 1 .7 1 1.3v1.8" />
    {/* ground line, broken by the wheels */}
    <path d="M2.6 15.3h2.5M9 15.3h6M18.9 15.3h2.5" />
    {/* wheels */}
    <circle cx="7" cy="15.5" r="2" />
    <circle cx="17" cy="15.5" r="2" />
  </svg>
);

const formatDetailDate = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  image?: string;
  avatar?: string;
  isB2B?: boolean;
  companyName?: string;
  b2bStatus?: string;
}

interface Quotation {
  id: number;
  vendor?: {
    id: number;
    name: string;
    company_name?: string;
  };
  price?: number;
  amount?: number;
  status: string;
}

interface Booking {
  id: number | string;
  booking_number?: string;
  service_name: string;
  service_type?: 'bike' | 'car' | 'chauffeur' | 'bus' | 'truck' | 'packers' | 'equipment' | 'luxury';
  location_name: string;
  destination?: string;
  journey_datetime: string;
  status: string;
  created_at: string;
  quotations?: Quotation[];
  is_quote_request?: boolean;
  all_quotes_expired?: boolean;
  quote_count?: number;
  lowest_quote_amount?: number | null;
  passengers?: number;
  trip_type?: string;
  total_amount?: number;
  goods_type?: string;
}

interface BookingStats {
  open: number;
  confirmed: number;
  ongoing: number;
  completed: number;
  dropped: number;
  total: number;
}

interface ChatVendor {
  id: number;
  name: string;
  unread_count?: number;
  last_message?: string;
}

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
}

interface FinancialDetail {
  id?: string | number;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'net';
  description?: string;
  date?: string;
}

interface BusQuoteRequest {
  id: string;
  requestNumber: string;
  tripType: string;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName: string;
  passengers: number;
  pickupCity: string;
  dropCity?: string;
  pickupDate: string;
  status: string;
  quotesCount: number;
  createdAt: string;
}

interface BusBookingItem {
  id: string;
  bookingNumber: string;
  tripType: string;
  chauffeur_vehicle_categories: string;
  vehicleName: string;
  passengers: number;
  pickupCity: string;
  dropCity?: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  status: string;
  vendor?: {
    name: string;
    phone: string;
    rating: number;
  };
  createdAt: string;
}

const BOOKINGS_PER_PAGE = 6;

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Dropped'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardView, setDashboardView] = useState<'b2b' | 'personal' | 'tour'>('personal');
  const [currentPage, setCurrentPage] = useState(1);

  // Service filter
  const [selectedService, setSelectedService] = useState<string>('all');
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showExpiredQuotesOnly, setShowExpiredQuotesOnly] = useState(false);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  // Free-text search over the journeys ledger.
  const [journeySearch, setJourneySearch] = useState('');

  // Profile edit modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // Mobile menu
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Company manage modal
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // Chat state
  const [totalUnreadChats, setTotalUnreadChats] = useState(0);
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [chatBookings, setChatBookings] = useState<any[]>([]);
  const [financials, setFinancials] = useState<{
    totalExpense: number;
    expenses: FinancialDetail[];
  }>({
    totalExpense: 0,
    expenses: [],
  });
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);
  const [financialsError, setFinancialsError] = useState<string | null>(null);

  // Bus bookings state
  const [busQuoteRequests, setBusQuoteRequests] = useState<BusQuoteRequest[]>([]);
  const [busBookings, setBusBookings] = useState<BusBookingItem[]>([]);
  const [isLoadingBusData, setIsLoadingBusData] = useState(false);

  // Wander tour quote requests
  const [tourQuoteRequests, setTourQuoteRequests] = useState<any[]>([]);
  const [isLoadingTourQuotes, setIsLoadingTourQuotes] = useState(false);

  // Contact inquiries
  const [contactInquiries, setContactInquiries] = useState<any[]>([]);


  const fetchContactInquiries = async (email: string) => {
    try {
      const res = await fetch(`/api/customer/contact-inquiries?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setContactInquiries(data.inquiries || []);
    } catch { /* silent */ }
  };

  // Use local Next.js API routes instead of external Laravel API
  const useLocalAPI = true;

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const customerData = localStorage.getItem('customer');

    if (!token || !customerData) {
      router.push('/customer/login');
      return;
    }

    try {
      const parsed = JSON.parse(customerData);
      setCustomer(parsed);
      if (parsed.isB2B && parsed.b2bStatus === 'APPROVED') {
        setDashboardView('b2b');
      }
      if (parsed.email) fetchContactInquiries(parsed.email);

      // Auto-switch tab from URL param ?tab=tour
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'tour') {
        setDashboardView('tour');
      }

      // Refresh customer data from API to get latest b2bStatus etc.
      const refreshId = parsed?.id ?? parsed?.customer_id ?? parsed?.customerId;
      if (refreshId) {
        fetch(`/api/customer/profile?customer_id=${refreshId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.customers) {
              const rawAvatar = data.customers.avatar || data.customers.image;
              const normalizedAvatar = rawAvatar
                ? (rawAvatar.startsWith('http') || rawAvatar.startsWith('data:') || rawAvatar.startsWith('/')
                    ? rawAvatar
                    : `/uploads/profile_images/${rawAvatar}`)
                : undefined;
              const updated = {
                ...parsed,
                ...data.customers,
                avatar: normalizedAvatar || parsed.avatar || parsed.image,
                image: normalizedAvatar || parsed.avatar || parsed.image,
              };
              localStorage.setItem('customer', JSON.stringify(updated));
              setCustomer(updated);
              if (updated.isB2B && updated.b2bStatus === 'APPROVED') {
                setDashboardView('b2b');
              }
            }
          })
          .catch(() => {});
      }
      setProfileForm((prev) => ({
        ...prev,
        name: parsed.name || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        avatar: parsed.avatar || parsed.image || '',
        address: parsed.address || '',
        city: parsed.city || '',
        state: parsed.state || '',
        pincode: parsed.pincode || '',
        bank_name: parsed.bank_name || parsed.bankName || '',
        account_number: parsed.account_number || parsed.accountNumber || '',
        ifsc_code: parsed.ifsc_code || parsed.ifscCode || '',
        upi_id: parsed.upi_id || parsed.upiId || '',
      }));
      const identifier = parsed.phone || parsed.email;
      const parsedId = parsed?.id ?? parsed?.customer_id ?? parsed?.customerId;
      fetchStats(identifier, parsedId);
      fetchBookings(identifier, 'All', parsedId);
      fetchLiveChats();
      fetchBusData(identifier);
      if (parsedId) {
        fetchFinancials(parsedId);
        fetchTourQuotes(parsedId);
      }
    } catch (e) {
      router.push('/customer/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!customer) return;
    setProfileForm((prev) => ({
      ...prev,
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      avatar: customer.avatar || customer.image || prev.avatar || '',
      address: (customer as any).address || prev.address || '',
      city: (customer as any).city || prev.city || '',
      state: (customer as any).state || prev.state || '',
      pincode: (customer as any).pincode || prev.pincode || '',
      bank_name: (customer as any).bank_name || (customer as any).bankName || prev.bank_name || '',
      account_number:
        (customer as any).account_number ||
        (customer as any).accountNumber ||
        prev.account_number ||
        '',
      ifsc_code:
        (customer as any).ifsc_code ||
        (customer as any).ifscCode ||
        prev.ifsc_code ||
        '',
      upi_id: (customer as any).upi_id || (customer as any).upiId || prev.upi_id || '',
    }));
  }, [customer]);

  // Service type to name mapping for filter matching
  const SERVICE_TYPE_NAMES: Record<string, string> = {
    luxury: 'Luxury Car Rental',
    bike: 'Bike Rental',
    bus: 'Bus Rental',
    truck: 'Truck Rental',
    packers: 'Packers & Movers',
    equipment: 'Equipment Rental',
    car: 'Car Rental',
    chauffeur: 'Chauffeur Service',
  };

  // Filter bookings when service/location filters or bookings change
  useEffect(() => {
    let filtered = bookings;

    if (selectedService !== 'all') {
      filtered = filtered.filter((b) => {
        const nameMatch = b.service_name.toLowerCase().includes(selectedService.toLowerCase());
        const typeMatch = b.service_type
          ? SERVICE_TYPE_NAMES[b.service_type]?.toLowerCase() === selectedService.toLowerCase()
          : false;
        return nameMatch || typeMatch;
      });
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(
        (b) =>
          b.location_name === selectedLocation ||
          (b.destination && b.destination === selectedLocation)
      );
    }

    if (showExpiredQuotesOnly) {
      filtered = filtered.filter((b) => b.is_quote_request && b.all_quotes_expired);
    }

    // Punctuation is flattened on both sides before comparing. The row prints
    // the booking number as "#TQR-2026-6452" while the field holds it without
    // the hash, so a customer copying what they see would otherwise get nothing.
    const flatten = (v: unknown) =>
      String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const terms = journeySearch.split(/s+/).map(flatten).filter(Boolean);
    if (terms.length) {
      filtered = filtered.filter((b) => {
        // Every term has to land somewhere, so "ahmedabad bike" narrows rather
        // than widens. Matched against the fields the row actually prints.
        const hay = flatten(
          [
            b.booking_number,
            b.service_name,
            b.location_name,
            b.destination,
            b.trip_type,
            b.goods_type,
            b.status,
          ]
            .filter(Boolean)
            .join(' ')
        );
        return terms.every((t) => hay.includes(t));
      });
    }

    setFilteredBookings(filtered);
  }, [selectedService, selectedLocation, showExpiredQuotesOnly, journeySearch, bookings]);

  // Extract unique services from bookings, always include Luxury Car Rental
  useEffect(() => {
    const fromBookings = [...new Set(bookings.map((b) => b.service_name))];
    const ALWAYS_AVAILABLE = ['Luxury Car Rental'];
    const merged = [...new Set([...fromBookings, ...ALWAYS_AVAILABLE])];
    setServiceOptions(merged);
  }, [bookings]);

  // Extract unique pickup/drop locations from bookings
  useEffect(() => {
    const locations = new Set<string>();
    bookings.forEach((booking) => {
      if (booking.location_name) locations.add(booking.location_name);
      if (booking.destination) locations.add(booking.destination);
    });
    const sortedLocations = [...locations].sort((a, b) => a.localeCompare(b));
    setLocationOptions(sortedLocations);
  }, [bookings]);

  useEffect(() => {
    if (!showLocationFilter) {
      setLocationSearch('');
    }
  }, [showLocationFilter]);

  useEffect(() => {
    if (!showServiceFilter) {
      setServiceSearch('');
    }
  }, [showServiceFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedService, selectedLocation, journeySearch, activeTab, bookings.length]);

  const fetchLiveChats = async () => {
    // Live chats feature - currently not implemented in local database
    // Set empty chats to avoid errors
    setChatBookings([]);
    setTotalUnreadChats(0);
  };

  const fetchBusData = async (identifier: string) => {
    setIsLoadingBusData(true);
    try {
      // Fetch bus quote requests
      const quotesRes = await fetch(`/api/bus-quote-requests?phone=${encodeURIComponent(identifier)}`);
      const quotesData = await quotesRes.json();

      if (quotesData.success && quotesData.requests) {
        setBusQuoteRequests(quotesData.requests);
      }

      // Fetch bus bookings
      const bookingsRes = await fetch(`/api/bus-bookings?phone=${encodeURIComponent(identifier)}`);
      const bookingsData = await bookingsRes.json();

      if (bookingsData.success && bookingsData.bookings) {
        setBusBookings(bookingsData.bookings);
      }
    } catch (error) {
      console.error('Failed to fetch bus data:', error);
    } finally {
      setIsLoadingBusData(false);
    }
  };
  const fetchTourQuotes = async (customerId: string | number) => {
    setIsLoadingTourQuotes(true);
    try {
      const res = await fetch(`/api/customer/wander-quote-requests?customer_id=${customerId}`);
      const data = await res.json();
      if (data.requests) setTourQuoteRequests(data.requests);
    } catch {
      // ignore
    } finally {
      setIsLoadingTourQuotes(false);
    }
  };

  const fetchStats = async (identifier: string, customerId?: string | number) => {
    try {
      // Use local API (Prisma/trans_cms database)
      const params = new URLSearchParams({ identifier });
      if (customerId) {
        params.set('customer_id', String(customerId));
      }
      const response = await fetch(`/api/customer/stats?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.stats) {
        setStats({
          open: data.stats.open || 0,
          confirmed: data.stats.confirmed || 0,
          ongoing: data.stats.ongoing || 0,
          completed: data.stats.completed || 0,
          dropped: data.stats.dropped || 0,
          total: data.stats.total || 0,
        });
      } else {
        // Set empty stats if no data
        setStats({
          open: 0,
          confirmed: 0,
          ongoing: 0,
          completed: 0,
          dropped: 0,
          total: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats({
        open: 0,
        confirmed: 0,
        ongoing: 0,
        completed: 0,
        dropped: 0,
        total: 0,
      });
    }
  };

  // /api/customer/bookings fans out to 16 tables, so one tab costs 9-23s even
  // though the payload is ~15KB. The answer for a given tab doesn't change while
  // you sit on the page, so remember it: re-visiting a tab is then instant and
  // the server isn't asked the same question again. Refresh clears this.
  const bookingsCache = useRef<Record<string, Booking[]>>({});

  // Clicking through tabs stacks 10-20s requests that finish out of order — the
  // last one to land would win, which need not be the tab you're looking at.
  // Only the newest request may write.
  const bookingsReq = useRef(0);

  const fetchBookings = async (
    identifier: string,
    status: string,
    customerId?: string | number,
    opts?: { force?: boolean }
  ) => {
    const cacheKey = `${status}|${identifier}|${customerId ?? ''}`;
    const seq = ++bookingsReq.current;

    const cached = opts?.force ? undefined : bookingsCache.current[cacheKey];
    if (cached) {
      // Straight from memory — no skeleton, no request.
      setBookings(cached);
      setIsLoadingBookings(false);
      return;
    }

    setIsLoadingBookings(true);
    try {
      // Use local API (Prisma/trans_cms database)
      const params = new URLSearchParams({
        identifier: identifier,
        status: status,
      });
      if (customerId) {
        params.set('customer_id', String(customerId));
      }
      const response = await fetch(`/api/customer/bookings?${params.toString()}`);
      const data = await response.json();

      const rows: Booking[] =
        data.success && data.bookings
          ? data.bookings
          : Array.isArray(data.bookings)
            ? data.bookings
            : [];

      if (seq !== bookingsReq.current) return; // a newer tab has taken over
      bookingsCache.current[cacheKey] = rows;
      setBookings(rows);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      if (seq !== bookingsReq.current) return;
      setBookings([]);
    } finally {
      if (seq === bookingsReq.current) setIsLoadingBookings(false);
    }
  };

  const normalizeExpenseDetail = (item: any, index: number): FinancialDetail => {
    const rawAmount =
      item?.amount ?? item?.value ?? item?.total ?? item?.expense ?? item?.transaction_amount ?? 0;
    const amount = Number.isFinite(Number(rawAmount)) ? Number(rawAmount) : 0;
    return {
      id: item?.id ?? item?.transaction_id ?? `${index}-${item?.source_name ?? 'expense'}`,
      title:
        item?.source_name ||
        item?.heading ||
        item?.description ||
        item?.label ||
        `Expense #${index + 1}`,
      amount: Math.abs(amount),
      type: 'expense',
      description: item?.description || item?.note || item?.vendor?.name || item?.receiver_name,
      date: item?.date || item?.created_at || item?.transaction_date,
    };
  };

  const fetchFinancials = async (customerId?: string | number) => {
    if (!customerId) {
      setFinancials({ totalExpense: 0, expenses: [] });
      setFinancialsError('Unable to identify your account for financial data.');
      return;
    }

    setIsLoadingFinancials(true);
    setFinancialsError(null);

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const params = new URLSearchParams({ customer_id: String(customerId) });
      const response = await fetch(`/api/customer/financials?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Financial summary is currently unavailable.');
      }

      if (!payload) {
        throw new Error('Financial summary is currently unavailable.');
      }

      if (payload.success === false) {
        throw new Error(payload.message || 'Financial summary is currently unavailable.');
      }

      const normalized: FinancialDetail[] = Array.isArray(payload.expenses)
        ? payload.expenses.map((item: any, index: number) => normalizeExpenseDetail(item, index))
        : [];
      normalized.sort((a: FinancialDetail, b: FinancialDetail) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      });

      const reduceExpenseTotal = (items: FinancialDetail[]) =>
        items.reduce<number>((sum, item) => sum + item.amount, 0);

      let totalExpense = Number.isFinite(Number(payload.total_expense))
        ? Number(payload.total_expense)
        : reduceExpenseTotal(normalized);
      if (!Number.isFinite(totalExpense)) {
        totalExpense = reduceExpenseTotal(normalized);
      }

      setFinancials({ totalExpense, expenses: normalized });
    } catch (err) {
      console.error('Failed to fetch financials:', err);
      setFinancialsError(
        err instanceof Error ? err.message : 'Financial summary is currently unavailable.'
      );
      setFinancials({ totalExpense: 0, expenses: [] });
    } finally {
      setIsLoadingFinancials(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedService('all');
    const identifier = customer?.phone || customer?.email || '';
    const customerId = customer?.id;
    fetchBookings(identifier, tab, customerId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Refresh is the one place that must ignore the per-tab cache — drop it all,
    // so the other tabs are re-read from the server next time they're opened.
    bookingsCache.current = {};
    const identifier = customer?.phone || customer?.email || '';
    const customerId = customer?.id;
    const refreshTasks = [
      fetchStats(identifier, customerId),
      fetchBookings(identifier, activeTab, customerId, { force: true }),
      fetchLiveChats(),
      fetchBusData(identifier),
    ];
    if (customer?.id) {
      refreshTasks.push(fetchFinancials(customer.id));
    }
    await Promise.all(refreshTasks);
    setIsRefreshing(false);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    // Small delay so user sees the loader
    await new Promise(r => setTimeout(r, 1000));
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    router.push('/customer/login');
  };

  const submitProfileUpdate = async (payload: Record<string, any>) => {
    // Use local API (Prisma/trans_cms database)
    const response = await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Unable to update profile');
    }
    return data;
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    // Frontend phone validation
    if (profileForm.phone) {
      const digits = profileForm.phone.replace(/\D/g, '');
      if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
        setProfileError('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
        setIsSavingProfile(false);
        return;
      }
    }

    // Password validation (only if user filled the new password field)
    const isChangingPassword = !!passwordForm.newPassword;
    if (isChangingPassword) {
      if (passwordForm.newPassword.length < 8) {
        setIsSavingProfile(false);
        return setProfileError('New password must be at least 8 characters.');
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setIsSavingProfile(false);
        return setProfileError('New password and confirm password do not match.');
      }
    }

    try {
      let savedAvatarFilename: string | undefined = customer?.avatar || customer?.image;

      // If a new image was selected (base64 data URL), upload it first
      if (profileForm.avatar && profileForm.avatar.startsWith('data:')) {
        const formData = new FormData();
        formData.append('customer_id', String(customer?.id));
        // Convert base64 data URL to Blob without fetch (avoids CSP issues)
        const [meta, b64] = profileForm.avatar.split(',');
        const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
        const binary = atob(b64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        const blob = new Blob([arr], { type: mime });
        formData.append('image', blob, 'profile.jpg');

        const uploadRes = await fetch('/api/customer/update-profile', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.customers?.avatar) {
          savedAvatarFilename = uploadData.customers.avatar;
        } else if (!uploadRes.ok) {
          setProfileError('Failed to upload image. Please try again.');
          return;
        }
      }

      const payload: Record<string, any> = {
        customer_id: customer?.id,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        pincode: profileForm.pincode,
        bank_name: profileForm.bank_name,
        account_number: profileForm.account_number,
        ifsc_code: profileForm.ifsc_code,
        upi_id: profileForm.upi_id,
        ...(isChangingPassword ? { newPassword: passwordForm.newPassword } : {}),
      };

      // Handle password change separately
      if (isChangingPassword) {
        const pwRes = await fetch('/api/customer/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: customer?.id,
            newPassword: passwordForm.newPassword,
          }),
        });
        const pwData = await pwRes.json();
        if (!pwData.success) {
          setIsSavingProfile(false);
          return setProfileError(pwData.message || 'Failed to update password');
        }
      }

      const data = await submitProfileUpdate(payload);

      if (data.success || data.status === 'success') {
        const finalAvatar = savedAvatarFilename || data.customers?.avatar || data.customers?.image;
        const avatarUrl = finalAvatar
          ? (finalAvatar.startsWith('http') || finalAvatar.startsWith('data:')
              ? finalAvatar
              : `/uploads/profile_images/${finalAvatar}`)
          : undefined;

        const updatedCustomer = {
          ...customer,
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          avatar: avatarUrl,
          image: avatarUrl,
          address: profileForm.address,
          city: profileForm.city,
          state: profileForm.state,
          pincode: profileForm.pincode,
          bank_name: profileForm.bank_name,
          account_number: profileForm.account_number,
          ifsc_code: profileForm.ifsc_code,
          upi_id: profileForm.upi_id,
        };
        setCustomer(updatedCustomer as Customer);
        setProfileForm((prev) => ({ ...prev, avatar: avatarUrl || '' }));
        localStorage.setItem('customer', JSON.stringify(updatedCustomer));
        setProfileSuccess(true);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordSection(false);
        setTimeout(() => {
          setShowProfileModal(false);
          setProfileSuccess(false);
        }, 1500);
      } else {
        setProfileError(data.error || data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Network error. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (value: number) => {
    const sanitized = Number.isFinite(value) ? value : 0;
    return currencyFormatter.format(sanitized);
  };

  const formatCount = (value: number) => {
    const sanitized = Number.isFinite(value) ? value : 0;
    return sanitized.toLocaleString('en-IN');
  };

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * BOOKINGS_PER_PAGE,
    currentPage * BOOKINGS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // The API returns raw upper-case statuses (PENDING, QUOTES_RECEIVED, …); the
  // Open/Confirmed/… keys are the bucket names used by the filter tabs. Both are
  // listed so a badge never silently falls back to the wrong colour.
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      Open: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      Confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      Ongoing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      Completed: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
      Dropped: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },

      PENDING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      QUOTES_RECEIVED: { bg: 'bg-[#09B368]/10', text: 'text-[#067F4A]', dot: 'bg-[#09B368]' },
      QUOTES_EXPIRED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      PENDING_PAYMENT: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      PAYMENT_SUBMITTED: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      CONFIRMED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
      CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      EXPIRED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      REFUNDED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      DROPPED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };
    return configs[status] || configs.Open;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      QUOTES_RECEIVED: 'Quotes Received',
      QUOTES_EXPIRED: 'Quotes Expired',
      PENDING_PAYMENT: 'Payment Pending',
      PAYMENT_SUBMITTED: 'Payment Submitted',
      CONFIRMED: 'Confirmed',
      IN_PROGRESS: 'Ongoing',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Expired',
      REFUNDED: 'Refunded',
      DROPPED: 'Dropped',
    };
    return labels[status] || status;
  };

  const getServiceIcon = (serviceName: string, serviceType?: string) => {
    const name = serviceName.toLowerCase();
    const type = serviceType || '';
    if (type === 'bike' || name.includes('bike') || name.includes('scooter')) return 'bike';
    if (type === 'bus' || name.includes('bus') || name.includes('tempo')) return 'bus';
    if (type === 'truck' || name.includes('truck') || name.includes('transport')) return 'truck';
    if (type === 'luxury' || name.includes('luxury')) return 'luxury';
    if (type === 'packers' || name.includes('packer') || name.includes('mover')) return 'packers';
    if (type === 'equipment' || name.includes('equipment') || name.includes('jcb') || name.includes('crane')) return 'equipment';
    if (type === 'car' || name.includes('self') || name.includes('self-drive')) return 'selfdrive';
    if (type === 'chauffeur' || name.includes('chauffeur') || name.includes('driver')) return 'chauffeur';
    return 'car';
  };

  // Get service badge color and label based on service type
  const getServiceBadge = (serviceType?: string, serviceName?: string) => {
    const type = serviceType || '';
    const name = serviceName?.toLowerCase() || '';

    if (type === 'bike' || name.includes('bike') || name.includes('scooter')) {
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Bike Rental' };
    }
    if (type === 'bus' || name.includes('bus') || name.includes('tempo traveller')) {
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Bus Rental' };
    }
    if (type === 'truck' || name.includes('truck') || name.includes('transporter')) {
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Truck Rental' };
    }
    if (type === 'luxury' || name.includes('luxury')) {
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Luxury Car' };
    }
    if (type === 'packers' || name.includes('packer') || name.includes('mover')) {
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Packers & Movers' };
    }
    if (type === 'equipment' || name.includes('equipment') || name.includes('jcb') || name.includes('crane')) {
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Equipment' };
    }
    if (type === 'car' || name.includes('self-drive') || name.includes('self drive')) {
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Self Drive' };
    }
    if (type === 'chauffeur' || name.includes('chauffeur') || name.includes('outstation') || name.includes('airport') || name.includes('local')) {
      return { bg: 'bg-[#09B368]/10', text: 'text-[#09B368]', border: 'border-[#09B368]/20', label: 'Car Rental' };
    }
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'Car Rental' };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get the correct booking detail URL based on service type
  const getBookingUrl = (booking: Booking) => {
    const bookingNumber = booking.booking_number || booking.id;

    // Use service_type if available, otherwise infer from service_name
    let type = booking.service_type;
    if (!type) {
      const name = booking.service_name.toLowerCase();
      if (name.includes('bike') || name.includes('scooter')) {
        type = 'bike';
      } else if (name.includes('bus')) {
        type = 'bus';
      } else if (name.includes('truck')) {
        type = 'truck';
      } else if (name.includes('packer') || name.includes('mover')) {
        type = 'packers';
      } else if (name.includes('equipment')) {
        type = 'equipment';
      } else if (name.includes('self') || name.includes('self-drive')) {
        type = 'car';
      } else {
        type = 'chauffeur';
      }
    }

    // Quote-based services have different URLs for quote requests vs bookings
    if (type === 'bus') {
      if (booking.is_quote_request) {
        return `/customer/bus-quotes/${booking.id}`;
      }
      return `/customer/bus-bookings/${booking.id}`;
    }

    if (type === 'truck') {
      if (booking.is_quote_request) {
        return `/customer/truck-quotes/${booking.id}`;
      }
      return `/customer/truck-bookings/${booking.id}`;
    }

    if (type === 'packers') {
      if (booking.is_quote_request) {
        return `/customer/packers-quotes/${booking.id}`;
      }
      return `/customer/packers-bookings/${booking.id}`;
    }

    if (type === 'equipment') {
      if (booking.is_quote_request) {
        return `/customer/equipment-quotes/${booking.id}`;
      }
      return `/customer/equipment-bookings/${booking.id}`;
    }

    if (type === 'luxury') {
      if (booking.is_quote_request) {
        return `/customer/luxury-quotes/${booking.id}`;
      }
      return `/customer/luxury-bookings/${booking.id}`;
    }

    // CUSTOM_BULK (multi-day event) bookings live in b2b_bookings and have a
    // dedicated detail page. The generic /customer/booking/[id] route can't
    // find them, so route them explicitly.
    if (type === 'bulk') {
      return `/customer/b2b-bookings/${booking.id}`;
    }

    switch (type) {
      case 'bike':
        if (booking.is_quote_request) {
          return `/customer/bike-quotes/${booking.id}`;
        }
        return `/customer/bike-bookings/${bookingNumber}`;
      case 'car':
        if (booking.is_quote_request) {
          return `/customer/self-drive-quotes/${booking.id}`;
        }
        return `/customer/self-drive-bookings/${booking.id}`;
      case 'chauffeur':
        // Car with driver bookings
        return `/customer/car-rental-bookings/${bookingNumber}`;
      default:
        // Fallback to generic booking page
        return `/customer/booking/${booking.id}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 border-4 border-[#09B368]/20 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#09B368]" />
            </div>
          </div>
          <p className="text-gray-500 mt-5 font-medium text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const tabConfig = [
    { key: 'All', label: 'All', count: stats?.total || 0, icon: Calendar, color: 'purple' },
    { key: 'Open', label: 'Waiting', count: stats?.open || 0, icon: Clock, color: 'blue' },
    { key: 'Confirmed', label: 'Confirmed', count: stats?.confirmed || 0, icon: CheckCircle, color: 'emerald' },
    { key: 'Ongoing', label: 'Ongoing', count: stats?.ongoing || 0, icon: Car, color: 'amber' },
    { key: 'Completed', label: 'Completed', count: stats?.completed || 0, icon: Star, color: 'gray' },
    { key: 'Dropped', label: 'Dropped', count: stats?.dropped || 0, icon: XCircle, color: 'red' },
  ] as const;

  const tourStatsConfig = [
    { label: 'Tour Requests', count: tourQuoteRequests.length, icon: Compass, sub: 'Total submitted' },
    { label: 'Pending', count: tourQuoteRequests.filter(r => r.status === 'PENDING').length, icon: Clock, sub: 'Awaiting quotes' },
    { label: 'Quotes Received', count: tourQuoteRequests.filter(r => r.status === 'QUOTED').length, icon: MessageCircle, sub: 'Vendors responded' },
    { label: 'Accepted', count: tourQuoteRequests.filter(r => r.status === 'ACCEPTED').length, icon: CheckCircle, sub: 'Confirmed tours' },
  ];

  const normalizedLocationSearch = locationSearch.trim().toLowerCase();
  const filteredLocationOptions = normalizedLocationSearch
    ? locationOptions.filter((location) => location.toLowerCase().includes(normalizedLocationSearch))
    : locationOptions;
  const normalizedServiceSearch = serviceSearch.trim().toLowerCase();
  const filteredServiceOptions = normalizedServiceSearch
    ? serviceOptions.filter((service) => service.toLowerCase().includes(normalizedServiceSearch))
    : serviceOptions;

  const latestExpense = financials.expenses[0];
  const financialCards = [
    {
      key: 'total',
      title: 'Total spent',
      amount: financials.totalExpense,
      icon: IndianRupee,
      iconBg: 'bg-red-50 text-red-600',
      description: 'Sum of your expenses recorded in CRM',
      isCurrency: true,
    },
    {
      key: 'entries',
      title: 'Entries recorded',
      amount: financials.expenses.length,
      icon: BarChart,
      iconBg: 'bg-slate-50 text-slate-600',
      description: 'Expenses synced from Laravel routes',
      isCurrency: false,
    },
    {
      key: 'latest',
      title: latestExpense ? 'Latest expense' : 'No expenses yet',
      amount: latestExpense?.amount ?? 0,
      icon: Gift,
      iconBg: 'bg-emerald-50 text-emerald-600',
      description: latestExpense ? formatDetailDate(latestExpense.date) : 'Raise a helpdesk ticket to log spend',
      isCurrency: true,
    },
  ];
  const recentExpenses = financials.expenses.slice(0, 6);

  // ── View-only derivations ────────────────────────────────────────────────
  // Everything below reads state that already exists in this component. No new
  // state, no effect, no fetch — purely how the same data is presented.

  // "Waiting on your decision" — the same bookings, filtered by what they need.
  const quotesReady = bookings.find((b) => b.is_quote_request && (b.quote_count ?? b.quotations?.length ?? 0) > 0);
  const paymentDue = bookings.find((b) => b.status === 'PENDING_PAYMENT');
  const quotesLapsed = bookings.find(
    (b) => b.all_quotes_expired || (b.status === 'QUOTES_RECEIVED' && (b.quote_count ?? 0) === 0)
  );
  const actionCount = [quotesReady, paymentDue, quotesLapsed].filter(Boolean).length;

  // Group the current page of bookings by month for the ledger.
  const ledgerGroups: { key: string; label: string; items: Booking[] }[] = [];
  paginatedBookings.forEach((b) => {
    const d = new Date(b.journey_datetime);
    const label = Number.isNaN(d.getTime())
      ? 'Scheduled'
      : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const last = ledgerGroups[ledgerGroups.length - 1];
    if (last && last.key === label) last.items.push(b);
    else ledgerGroups.push({ key: label, label, items: [b] });
  });

  // The eight fleets. Hrefs are unchanged from the previous Quick Book grid;
  // the copy and the "from" figures are marketing text, not live pricing.
  const FLEETS = [
    { label: 'Bike', href: '/bike-on-rent', desc: 'Daily & monthly rentals', from: '₹349', unit: '/day', icon: 'bike' },
    { label: 'Car', href: '/car-rental', desc: 'With a professional driver', from: '₹12', unit: '/km', icon: 'car' },
    { label: 'Bus', href: '/bus-rental', desc: 'Group & wedding travel', from: '₹38', unit: '/km', icon: 'bus' },
    { label: 'Truck', href: '/', desc: 'Goods & part-load transport', from: '₹26', unit: '/km', icon: 'truck' },
    { label: 'Luxury', href: '/luxury-car-rental', desc: 'Premium chauffeured fleet', from: '₹4,500', unit: '/day', icon: 'luxury' },
    { label: 'Equipment', href: '/', desc: 'JCB, cranes, generators', from: '₹1,200', unit: '/hr', icon: 'equipment' },
    { label: 'Packers', href: '/', desc: 'Home & office shifting', from: '₹8,500', unit: '', icon: 'packers' },
    { label: 'Self Drive', href: '/', desc: 'Take the wheel yourself', from: '₹1,899', unit: '/day', icon: 'selfdrive' },
  ] as const;

  // The road wants vehicles, not category symbols — a star or a wrench driving
  // past reads wrong. The marketplace cards keep their own icons.
  const roadIcon = (kind: string, cls: string) => {
    if (kind === 'bike') return <Bike className={cls} />;
    if (kind === 'bus') return <Bus className={cls} />;
    if (kind === 'truck') return <Truck className={cls} />;
    if (kind === 'luxury') return <LuxuryCar className={cls} />;
    if (kind === 'equipment') return <Tractor className={cls} />;
    if (kind === 'packers') return <Caravan className={cls} />;
    return <Car className={cls} />;  // car, self drive
  };

  const fleetIcon = (kind: string, cls: string) => {
    if (kind === 'bike') return <Bike className={cls} />;
    if (kind === 'bus') return <Bus className={cls} />;
    if (kind === 'truck') return <Truck className={cls} />;
    if (kind === 'luxury') return <Star className={cls} />;
    if (kind === 'equipment') return <Wrench className={cls} />;
    if (kind === 'packers') return <Package className={cls} />;
    return <Car className={cls} />;
  };

  const GUTTER = { paddingLeft: 'max(24px, calc((100vw - 1240px) / 2))' } as const;
  const GUTTER_R = { paddingRight: 'max(24px, calc((100vw - 1240px) / 2))' } as const;

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-white`}>
      <CustomerHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Scoped to this page so nothing here can leak into another stylesheet. */}
      <style>{`
        @keyframes cdbGlow{to{transform:translate(-70px,50px) scale(1.2);opacity:.62}}
        .cdb-glow{animation:cdbGlow 15s ease-in-out infinite alternate}
        .cdb-perf{background:repeating-linear-gradient(180deg,rgba(255,255,255,.26) 0 6px,transparent 6px 12px)}
        .cdb-perf::before,.cdb-perf::after{content:"";position:absolute;left:-9px;width:18px;height:18px;border-radius:9999px;background:#fff}
        .cdb-perf::before{top:-9px}
        .cdb-perf::after{bottom:-9px}
        .cdb-dash{background:repeating-linear-gradient(90deg,rgba(255,255,255,.32) 0 5px,transparent 5px 10px)}
        .cdb-fleet::before{content:"";position:absolute;left:0;bottom:0;height:2px;width:100%;background:#09B368;transform:scaleX(0);transform-origin:left;transition:transform .28s}
        .cdb-fleet:hover::before{transform:scaleX(1)}
        @keyframes cdbPan{to{background-position:-40px -40px}}
        .cdb-grid{animation:cdbPan 26s linear infinite}
        @keyframes cdbRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .cdb-rise{animation:cdbRise .66s cubic-bezier(.2,.9,.25,1) var(--d,0s) both}
        @keyframes cdbTar{to{background-position-x:-14px}}
        .cdb-tar{animation:cdbTar 2.8s linear infinite}
        @keyframes cdbPosts{to{background-position-x:-110px}}
        .cdb-posts{animation:cdbPosts 14s linear infinite}
        .cdb-lane{container-type:inline-size}
        /* Eight 30s slots inside one 240s loop — each vehicle drives across
           during its own slot and stays hidden for the other seven. */
        @keyframes cdbCycle{
          0%{transform:translateX(-70px);opacity:0}
          0.6%{opacity:1}
          11.9%{opacity:1}
          12.5%{transform:translateX(100cqw);opacity:0}
          12.51%{transform:translateX(-70px);opacity:0}
          100%{transform:translateX(-70px);opacity:0}}
        .cdb-veh{animation:cdbCycle 240s linear infinite backwards}
        @keyframes cdbPing{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(2.6);opacity:0}}
        .cdb-ping::after{content:"";position:absolute;inset:0;border-radius:9999px;background:currentColor;animation:cdbPing 2.4s cubic-bezier(0,0,.2,1) infinite}
        @keyframes cdbHalo{0%,100%{opacity:.30;transform:scale(1)}50%{opacity:.55;transform:scale(1.06)}}
        .cdb-halo{animation:cdbHalo 6s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){
          .cdb-glow,.cdb-grid,.cdb-halo,.cdb-tar,.cdb-posts{animation:none}
          .cdb-veh{animation:none;opacity:0}
          .cdb-veh:first-of-type{opacity:1}
          .cdb-ping::after{animation:none;opacity:0}
          .cdb-rise{animation:none;opacity:1;transform:none}
        }
      `}</style>

      {/* Main Content with top padding for fixed header */}
      <div className="pt-16">
        {/* Travel-Agent Self-Booking Banner — shown when this customer record
             is linked to a travel agent (i.e. the agent is using their own
             customer login to place bookings). Quick way back to the agent
             dashboard. */}
        {(customer as any)?.linkedTravelAgentId && (
          <div className="bg-[#061A11] text-white">
            <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-3 px-10 py-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3BE39F]" />
                <div className="flex-1">
                  <p className="text-[12.5px] font-semibold">You&apos;re signed in as a Travel Agent</p>
                  <p className="text-[11.5px] leading-relaxed text-white/60">
                    <span className="font-semibold text-[#3BE39F]">Car Rental</span> supports full TA modes (Personal &amp; Company with manager review).
                    Other transport services book as standard customer.
                    Non-transport services (packers, equipment, group trips) are not available for company booking — they use standard flow.
                    All bookings auto-appear on your agent dashboard.
                  </p>
                </div>
              </div>
              <Link
                href="/travel-agent/bookings"
                className="flex-shrink-0 border-b border-white/40 pb-0.5 text-[11.5px] font-semibold text-white"
              >
                Open Agent Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* B2B Approval Pending Banner */}
        {customer?.isB2B && customer?.b2bStatus !== 'APPROVED' && (
          <div className="border-b border-amber-200 bg-[#FFFBEB]">
            <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-10 py-3">
              <Clock className="h-4 w-4 flex-shrink-0 text-[#B45309]" />
              <div>
                <p className="text-[12.5px] font-semibold text-[#92400E]">B2B Account — Approval In Review</p>
                <p className="text-[11.5px] text-[#B45309]">
                  Your corporate account{customer?.companyName ? ` for ${customer.companyName}` : ''} is under review by the admin team. You&apos;ll be able to access B2B features once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* B2B Dashboard View */}
        {dashboardView === 'b2b' && customer?.isB2B ? (
          // No wrapper: the company hero is full-bleed like the personal one, so
          // the component carries its own gutters below it.
          <>
            <B2BDashboard
              customerId={String(customer.id)}
              customerName={customer.name}
              companyName={customer.companyName || null}
              viewSwitch={<DashboardViewSwitch
                view={dashboardView as any}
                onChange={(v) => setDashboardView(v as any)}
                showB2B={Boolean(customer?.isB2B && customer?.b2bStatus === 'APPROVED')}
                personalLabel={customer?.isB2B ? 'Personal' : 'My Bookings'}
              />}
              manageCompany={
                <button
                  onClick={() => setShowCompanyModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/25"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Manage Company
                </button>
              }
            />
          </>
        ) : dashboardView === 'tour' ? (
          // No wrapper: the tours hero is full-bleed like the bookings one, so
          // the component carries its own gutters below it.
          <TourDashboard
            customerId={String(customer?.id)}
            viewSwitch={<DashboardViewSwitch
              view={dashboardView as any}
              onChange={(v) => setDashboardView(v as any)}
              showB2B={Boolean(customer?.isB2B && customer?.b2bStatus === 'APPROVED')}
              personalLabel={customer?.isB2B ? 'Personal' : 'My Bookings'}
            />}
          />
        ) : (
        <>

        {/* ══════════════ GREEN HERO — full-bleed ticket ══════════════ */}
        {/* Same ticket shape as before (full-bleed panel, 3-column split,
            perforated divider with punched notches, ambient glow). The content
            is the old dashboard hero: avatar, greeting, name, portal line, and
            the three headline stats. */}
        <div className="relative mt-8 grid grid-cols-1 overflow-hidden bg-gradient-to-br from-[#022B1A] via-[#045030] to-[#09B368] text-white lg:grid-cols-[0.74fr_auto_1.26fr]">
          {/* drifting grid */}
          <div className="cdb-grid pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
          {/* key light from the top right, and a soft floor shadow */}
          <div className="pointer-events-none absolute inset-0"
            style={{backgroundImage: 'radial-gradient(760px 340px at 88% -25%, rgba(255,255,255,.20), transparent 62%), radial-gradient(520px 260px at 8% 130%, rgba(1,35,20,.55), transparent 60%)'}} />
          {/* glow blobs */}
          <div className="cdb-glow pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#09B368]/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[#056040]/40 blur-2xl" />
          {/* lit top edge */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* ── road along the bottom ── */}
          <div className="cdb-lane pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[44px] overflow-hidden">
            {/* roadside posts, drifting faster than the grid for depth */}
            <div className="cdb-posts absolute inset-x-0 bottom-[22px] h-4"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.16) 0 1px, transparent 1px 110px)',
                WebkitMaskImage: 'linear-gradient(transparent 10%, #000 90%)',
                maskImage: 'linear-gradient(transparent 10%, #000 90%)',
              }} />
            {/* tarmac */}
            <div className="absolute inset-x-0 bottom-0 h-[22px] border-t border-white/[0.18] bg-[#01230F]/55" />
            {/* centre line */}
            <div className="cdb-tar absolute inset-x-0 bottom-[10px] h-[2px]"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.42) 0 8px, transparent 8px 14px)' }} />
            {/* one vehicle per pass, cycling through all eight services */}
            {FLEETS.map((f, i) => (
              <span
                key={f.label}
                className="cdb-veh absolute bottom-[18px] left-0 text-[#E4FBEF] drop-shadow-[0_3px_6px_rgba(0,0,0,.45)]"
                style={{ animationDelay: `${i * 30}s` }}
                aria-hidden
              >
                {roadIcon(f.icon, 'h-[26px] w-[26px]')}
              </span>
            ))}
          </div>

          <div className="relative z-10 flex items-center pb-[66px] pr-6 pt-8 lg:pr-[46px]" style={GUTTER}>
            <div className="cdb-rise flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {/* halo */}
                <div className="cdb-halo pointer-events-none absolute -inset-3 rounded-full bg-[#4ADE80]/25 blur-xl" />
                <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,.6)] backdrop-blur-sm [&>img]:relative [&>img]:z-10">
                  {customer?.avatar || customer?.image ? (
                    <img
                      src={customer.avatar || customer.image}
                      className="h-full w-full object-cover"
                      alt=""
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : null}
                  <span className="quote-serif absolute text-[30px] font-medium">{customer?.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 h-[15px] w-[15px] rounded-full border-[3px] border-[#022B1A] bg-[#4ADE80]" />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/[0.55]">
                  <span className="h-px w-6 bg-white/30" />
                  {getGreeting()}
                </p>
                <h1 className="quote-serif mt-1.5 text-[36px] font-medium leading-[1] tracking-[-0.02em] [text-shadow:0_2px_20px_rgba(0,0,0,.28)] sm:text-[42px]">
                  {customer?.name || 'Customer'}
                </h1>
                <p className="mt-1.5 text-[12.5px] tracking-[0.02em] text-white/[0.55]">Vehicle rental portal</p>
                <DashboardViewSwitch
                  view={dashboardView as any}
                  onChange={(v) => setDashboardView(v as any)}
                  showB2B={Boolean(customer?.isB2B && customer?.b2bStatus === 'APPROVED')}
                  personalLabel={customer?.isB2B ? 'Personal' : 'My Bookings'}
                />
              </div>
            </div>
          </div>

          <div className="cdb-perf relative z-10 hidden w-px lg:block" />

          <div className="relative z-10 flex items-center pb-[66px] pl-6 pt-8 lg:pl-10" style={GUTTER_R}>
            <div className="cdb-rise grid w-full grid-cols-3 gap-3" style={{ ['--d' as any]: '.12s' }}>
              {[
                {
                  label: 'Total Bookings',
                  value: formatCount(stats?.total ?? 0),
                  caption: 'All time',
                  icon: Calendar,
                },
                {
                  label: 'Active',
                  value: formatCount((stats?.open ?? 0) + (stats?.confirmed ?? 0) + (stats?.ongoing ?? 0)),
                  caption: 'Waiting, confirmed & ongoing',
                  icon: Car,
                },
                {
                  label: 'Total Spent',
                  value: formatCurrency(financials.totalExpense),
                  caption: 'Across all bookings',
                  icon: IndianRupee,
                },
              ].map(({ label, value, caption, icon: Icon }) => (
                <div
                  key={label}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.08] px-3 pb-3 pt-3 backdrop-blur-sm sm:px-4"
                >
                  {/* lit top edge, same trick as the panel itself */}
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                  <div className="flex items-center gap-2">
                    <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-lg border border-white/20 bg-white/[0.14]">
                      <Icon className="h-3 w-3" />
                    </span>
                    <p className="min-w-0 text-[9px] uppercase leading-[1.4] tracking-[0.08em] text-white/[0.66] sm:tracking-[0.16em]">{label}</p>
                  </div>
                  <p className="quote-serif mt-2 text-[32px] font-medium leading-none tabular-nums [text-shadow:0_2px_14px_rgba(0,0,0,.25)]">
                    {value}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-tight text-white/[0.5]">{caption}</p>
                </div>
              ))}

              {/* How those bookings split, drawn from the same counts. */}
              {(stats?.total ?? 0) > 0 && (() => {
                const total = stats?.total || 1;
                const mix = [
                  { k: 'Waiting', v: stats?.open ?? 0, c: '#FCD34D' },
                  { k: 'Confirmed', v: stats?.confirmed ?? 0, c: '#4ADE80' },
                  { k: 'Ongoing', v: stats?.ongoing ?? 0, c: '#7DD3FC' },
                  { k: 'Completed', v: stats?.completed ?? 0, c: 'rgba(255,255,255,.6)' },
                  { k: 'Dropped', v: stats?.dropped ?? 0, c: '#FCA5A5' },
                ].filter((x) => x.v > 0);
                return (
                  <div className="col-span-3 mt-4">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/[0.5]">Booking mix</p>
                      <p className="text-[10px] text-white/[0.5]">
                        <span className="tabular-nums text-white/85">{formatCount(stats?.total ?? 0)}</span> total
                      </p>
                    </div>

                    <div className="flex h-2 w-full gap-[3px]">
                      {mix.map((x) => (
                        <span
                          key={x.k}
                          className="relative overflow-hidden rounded-full"
                          style={{ width: `${(x.v / total) * 100}%`, background: x.c }}
                          title={`${x.k}: ${x.v}`}
                        >
                          {/* lit top edge, same as the panels above */}
                          <span className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/25" />
                        </span>
                      ))}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                      {mix.map((x) => (
                        <span key={x.k} className="flex items-baseline gap-2 text-[10.5px] text-white/[0.55]">
                          <span className="h-1.5 w-1.5 flex-none translate-y-[-1px] rounded-full" style={{ background: x.c }} />
                          {x.k}
                          <span className="tabular-nums font-semibold text-white/90">{x.v}</span>
                          <span className="tabular-nums text-white/40">{Math.round((x.v / total) * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ══════════════ NEEDS YOU — waiting on your decision ══════════════ */}
        {/* First thing under the hero: what the customer has to act on. */}
        {actionCount > 0 && (
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10 pt-[60px]">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E7EEE9] pb-[18px]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Needs you</p>
                <h2 className="quote-serif mt-2 text-[40px] font-medium leading-none">Waiting on your decision</h2>
              </div>
              <span className="text-[12.5px] text-[#78857C]">{actionCount} item{actionCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 border-b border-[#E7EEE9] lg:auto-rows-fr lg:grid-cols-3">
              {quotesReady && (
                <a
                  href={getBookingUrl(quotesReady)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-4 border-b border-[#E7EEE9] py-[26px] pr-7 transition hover:bg-[#F4F8F5] lg:border-b-0 lg:border-r"
                >
                  <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-lg bg-[#EAF8F1] text-[#056B3E]">
                    <IndianRupee className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="quote-serif block text-[21px] font-medium leading-[1.35]">
                      {(() => {
                        const c = quotesReady.quote_count ?? quotesReady.quotations?.length ?? 0;
                        return `${c} quote${c !== 1 ? 's' : ''} ready to compare`;
                      })()}
                    </span>
                    <span className="mt-1.5 block text-[12px] leading-relaxed text-[#78857C]">
                      {quotesReady.service_name} · {quotesReady.location_name}
                      {quotesReady.destination && quotesReady.destination !== quotesReady.location_name ? ` → ${quotesReady.destination}` : ''}
                      {quotesReady.lowest_quote_amount ? `. Lowest is ₹${Number(quotesReady.lowest_quote_amount).toLocaleString('en-IN')}.` : '.'}
                    </span>
                    <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#056B3E]">
                      Compare quotes <ChevronRight className="h-3 w-3" />
                    </span>
                  </span>
                </a>
              )}
              {paymentDue && (
                <a
                  href={getBookingUrl(paymentDue)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-4 border-b border-[#E7EEE9] py-[26px] pr-7 transition hover:bg-[#F4F8F5] lg:border-b-0 lg:border-r lg:pl-7"
                >
                  <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-lg bg-[#FFFBEB] text-[#B45309]">
                    <Clock className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="quote-serif block text-[21px] font-medium leading-[1.35]">Payment pending</span>
                    <span className="mt-1.5 block text-[12px] leading-relaxed text-[#78857C]">
                      {paymentDue.service_name}
                      {paymentDue.booking_number ? ` #${paymentDue.booking_number}` : ''} · {formatDate(paymentDue.journey_datetime)}. Pay to keep the vehicle held.
                    </span>
                    <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#B45309]">
                      Complete payment <ChevronRight className="h-3 w-3" />
                    </span>
                  </span>
                </a>
              )}
              {quotesLapsed && (
                <a
                  href={getBookingUrl(quotesLapsed)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-4 py-[26px] transition hover:bg-[#F4F8F5] lg:pl-7"
                >
                  <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-lg bg-red-50 text-red-600">
                    <AlertCircle className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="quote-serif block text-[21px] font-medium leading-[1.35]">Quotes expired</span>
                    <span className="mt-1.5 block text-[12px] leading-relaxed text-[#78857C]">
                      {quotesLapsed.service_name} · {quotesLapsed.location_name}
                      {quotesLapsed.destination && quotesLapsed.destination !== quotesLapsed.location_name ? ` → ${quotesLapsed.destination}` : ''}. Re-request to get fresh vendor pricing.
                    </span>
                    <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                      Re-request quotes <ChevronRight className="h-3 w-3" />
                    </span>
                  </span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ YOUR MONEY — refunds raised ══════════════ */}
        {customer?.id && <CustomerRefundsList customerId={String(customer.id)} />}

        {/* ══════════════ YOUR RECORD — journeys ledger ══════════════ */}
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10 pt-[76px]">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E7EEE9] pb-[18px]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Your record</p>
              <h2 className="quote-serif mt-2 text-[40px] font-medium leading-none">Journeys</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search — booking number, service, city, status */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-[13px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A6B1AA]" />
                <input
                  type="text"
                  value={journeySearch}
                  onChange={(e) => setJourneySearch(e.target.value)}
                  placeholder="Search journeys..."
                  aria-label="Search journeys"
                  className="w-[200px] rounded-full border border-[#D4DFD8] bg-white py-2 pl-9 pr-8 text-[12px] text-[#0B1610] transition placeholder:text-[#A6B1AA] focus:border-[#09B368] focus:outline-none"
                />
                {journeySearch && (
                  <button
                    type="button"
                    onClick={() => setJourneySearch('')}
                    aria-label="Clear search"
                    className="absolute right-[11px] top-1/2 -translate-y-1/2 text-[#A6B1AA] transition hover:text-[#0B1610]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {/* Service Filter */}
              <div className="relative">
                <button
                  onClick={() => { setShowServiceFilter(prev => !prev); setShowLocationFilter(false); }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4DFD8] bg-white px-[13px] py-2 text-[12px] text-[#46524A] transition hover:border-[#09B368] hover:text-[#056B3E]"
                >
                  <Filter className="h-3 w-3" />
                  {selectedService === 'all' ? 'All Services' : selectedService}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showServiceFilter ? 'rotate-180' : ''}`} />
                </button>
                {showServiceFilter && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#D4DFD8] bg-white shadow-[0_18px_40px_-18px_rgba(6,26,17,.5)]">
                    <div className="space-y-1 p-2">
                      <input type="text" value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Search services..."
                        className="w-full rounded-lg border border-[#D4DFD8] px-3 py-2 text-xs transition focus:border-[#09B368] focus:outline-none" />
                      <button onClick={() => { setSelectedService('all'); setShowServiceFilter(false); setServiceSearch(''); }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${selectedService === 'all' ? 'bg-[#EAF8F1] font-semibold text-[#056B3E]' : 'text-[#46524A] hover:bg-[#F4F8F5]'}`}>
                        All Services
                      </button>
                      <div className="max-h-48 space-y-0.5 overflow-y-auto">
                        {filteredServiceOptions.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-[#A6B1AA]">{serviceOptions.length === 0 ? 'No services yet' : 'No match'}</p>
                        ) : filteredServiceOptions.map(service => (
                          <button key={service} onClick={() => { setSelectedService(service); setShowServiceFilter(false); setServiceSearch(''); }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${selectedService === service ? 'bg-[#EAF8F1] font-semibold text-[#056B3E]' : 'text-[#46524A] hover:bg-[#F4F8F5]'}`}>
                            {service}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Location Filter */}
              <div className="relative">
                <button
                  onClick={() => { setShowLocationFilter(prev => !prev); setShowServiceFilter(false); }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4DFD8] bg-white px-[13px] py-2 text-[12px] text-[#46524A] transition hover:border-[#09B368] hover:text-[#056B3E]"
                >
                  <MapPin className="h-3 w-3" />
                  {selectedLocation === 'all' ? 'All Cities' : selectedLocation}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showLocationFilter ? 'rotate-180' : ''}`} />
                </button>
                {showLocationFilter && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#D4DFD8] bg-white shadow-[0_18px_40px_-18px_rgba(6,26,17,.5)]">
                    <div className="space-y-1 p-2">
                      <input type="text" value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} placeholder="Search cities..."
                        className="w-full rounded-lg border border-[#D4DFD8] px-3 py-2 text-xs transition focus:border-[#09B368] focus:outline-none" />
                      <button onClick={() => { setSelectedLocation('all'); setLocationSearch(''); setShowLocationFilter(false); }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${selectedLocation === 'all' ? 'bg-[#EAF8F1] font-semibold text-[#056B3E]' : 'text-[#46524A] hover:bg-[#F4F8F5]'}`}>
                        All Cities
                      </button>
                      <div className="max-h-48 space-y-0.5 overflow-y-auto">
                        {filteredLocationOptions.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-[#A6B1AA]">{locationOptions.length === 0 ? 'No locations yet' : 'No match'}</p>
                        ) : filteredLocationOptions.map(location => (
                          <button key={location} onClick={() => { setSelectedLocation(location); setShowLocationFilter(false); setLocationSearch(''); }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${selectedLocation === location ? 'bg-[#EAF8F1] font-semibold text-[#056B3E]' : 'text-[#46524A] hover:bg-[#F4F8F5]'}`}>
                            {location}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Quotes Expired Filter */}
              <button
                onClick={() => setShowExpiredQuotesOnly(prev => !prev)}
                className={`inline-flex items-center gap-2 rounded-full border px-[13px] py-2 text-[12px] transition ${showExpiredQuotesOnly ? 'border-red-200 bg-red-50 text-red-600' : 'border-[#D4DFD8] bg-white text-[#46524A] hover:border-red-300'}`}
              >
                <Clock className="h-3 w-3" />
                Quotes Expired
              </button>
              <button onClick={handleRefresh} disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-full border border-[#D4DFD8] bg-white px-3 py-2 text-[12px] text-[#46524A] transition hover:border-[#09B368]">
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-[#09B368]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status filter — one strip, a column per status. The count sits in
              the display face so the numbers, not the chrome, carry the row. */}
          <div className="my-[22px] grid grid-cols-3 overflow-hidden rounded-2xl border border-[#E7EEE9] sm:grid-cols-6">
            {tabConfig.map((stat, idx) => {
              const isActive = activeTab === stat.key;
              const dot: Record<string, string> = {
                All: 'bg-[#0B1610]',
                Open: 'bg-[#F59E0B]',
                Confirmed: 'bg-[#09B368]',
                Ongoing: 'bg-[#0284C7]',
                Completed: 'bg-[#A6B1AA]',
                Dropped: 'bg-[#DC2626]',
              };
              return (
                <button
                  key={stat.key}
                  onClick={() => handleTabChange(stat.key)}
                  className={`relative border-[#E7EEE9] px-3 py-3.5 text-left transition sm:px-4 ${
                    idx % 3 !== 2 ? 'border-r' : ''
                  } sm:border-r sm:[&:nth-child(6)]:border-r-0 ${
                    idx < 3 ? 'border-b sm:border-b-0' : ''
                  } ${isActive ? 'bg-[#F4F8F5]' : 'bg-white hover:bg-[#FAFCFB]'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 flex-none rounded-full ${dot[stat.key] || 'bg-[#A6B1AA]'}`} />
                    <span
                      className={`min-w-0 text-[9.5px] uppercase tracking-[0.06em] sm:tracking-[0.16em] ${
                        isActive ? 'font-semibold text-[#0B1610]' : 'font-medium text-[#A6B1AA]'
                      }`}
                    >
                      {stat.label}
                    </span>
                  </span>
                  <span
                    className={`quote-serif mt-1.5 block text-[28px] font-medium leading-none tabular-nums ${
                      isActive ? 'text-[#0B1610]' : 'text-[#78857C]'
                    }`}
                  >
                    {stat.count}
                  </span>
                  {isActive && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#09B368]" />}
                </button>
              );
            })}
          </div>

          {/* Ledger */}
          {isLoadingBookings ? (
            <div className="border-t border-[#E7EEE9]" aria-label="Loading bookings">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="grid grid-cols-[44px_1fr] items-center gap-x-4 gap-y-3 border-b border-[#E7EEE9] py-4 lg:grid-cols-[40px_minmax(150px,1.1fr)_minmax(150px,1.15fr)_minmax(140px,1fr)_120px_120px_14px] lg:gap-y-0"
                >
                  <span className="h-9 w-9 animate-pulse rounded-xl bg-[#EAF0EC]" />
                  <div>
                    <span className="block h-3.5 w-4/5 animate-pulse rounded bg-[#EAF0EC]" />
                    <span className="mt-2 block h-2.5 w-2/5 animate-pulse rounded bg-[#F1F5F2]" />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <span className="block h-3 w-3/4 animate-pulse rounded bg-[#EAF0EC]" />
                    <span className="mt-2 block h-2.5 w-1/2 animate-pulse rounded bg-[#F1F5F2]" />
                  </div>
                  <div className="hidden lg:block">
                    <span className="block h-3 w-3/5 animate-pulse rounded bg-[#EAF0EC]" />
                    <span className="mt-2 block h-2.5 w-2/5 animate-pulse rounded bg-[#F1F5F2]" />
                  </div>
                  <div className="hidden lg:block">
                    <span className="block h-3 w-3/5 animate-pulse rounded bg-[#EAF0EC]" />
                    <span className="mt-2.5 block h-[3px] w-[100px] animate-pulse rounded-full bg-[#F1F5F2]" />
                  </div>
                  <span className="ml-auto hidden h-4 w-20 animate-pulse rounded bg-[#F1F5F2] lg:block" />
                  <span className="hidden lg:block" />
                </div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border-t border-[#E7EEE9] py-20">
              {journeySearch.trim() ? (
                <>
                  <Search className="h-7 w-7 text-[#A6B1AA]" />
                  <p className="quote-serif text-[24px] font-medium text-[#0B1610]">No matches</p>
                  <p className="max-w-xs text-center text-xs text-[#A6B1AA]">
                    Nothing in {activeTab.toLowerCase()} matches &ldquo;{journeySearch.trim()}&rdquo;. Try a booking number, service or city.
                  </p>
                  <button
                    type="button"
                    onClick={() => setJourneySearch('')}
                    className="mt-1 inline-flex items-center gap-2 rounded-full border border-[#D4DFD8] bg-white px-5 py-2.5 text-xs font-semibold text-[#46524A] transition hover:border-[#09B368] hover:text-[#056B3E]"
                  >
                    <X className="h-3.5 w-3.5" /> Clear search
                  </button>
                </>
              ) : (
                <>
                  <Calendar className="h-7 w-7 text-[#09B368]" />
                  <p className="quote-serif text-[24px] font-medium text-[#0B1610]">No {activeTab.toLowerCase()} bookings</p>
                  <p className="max-w-xs text-center text-xs text-[#A6B1AA]">
                    {activeTab === 'Open' ? 'Create a new booking to get started!' : `No ${activeTab.toLowerCase()} bookings yet.`}
                  </p>
                  <Link href="/" className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#09B368] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#078F53]">
                    <Sparkles className="h-3.5 w-3.5" /> Book Now
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="border-t border-[#E7EEE9]">
              {ledgerGroups.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center gap-4 pb-3 pt-7">
                    <span className="whitespace-nowrap rounded-full bg-[#F4F8F5] px-3 py-1 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#78857C]">{group.label}</span>
                    <span className="h-px flex-1 bg-[#E7EEE9]" />
                    <span className="whitespace-nowrap text-[10.5px] tabular-nums text-[#A6B1AA]">{group.items.length} booking{group.items.length !== 1 ? 's' : ''}</span>
                  </div>

                  {group.items.map((booking) => {
                    const serviceBadge = getServiceBadge(booking.service_type, booking.service_name);
                    // The API sends the live quote count and cheapest price directly;
                    // `quotations` is only populated for legacy payloads, so fall back to it.
                    const quoteCount = booking.quote_count
                      ?? booking.quotations?.length
                      ?? 0;
                    const lowestQuote = booking.lowest_quote_amount
                      ?? booking.quotations?.reduce((min, q) => {
                        const price = q.price || q.amount || 0;
                        return price < min ? price : min;
                      }, Infinity)
                      ?? Infinity;
                    // The request stays QUOTES_RECEIVED once a vendor has quoted, even
                    // after every quote lapsed — say "expired" rather than showing a
                    // green "Quotes Received" badge with nothing left to act on.
                    const displayStatus =
                      booking.status === 'QUOTES_RECEIVED' && quoteCount === 0
                        ? 'QUOTES_EXPIRED'
                        : booking.status;
                    const statusConfig = getStatusConfig(displayStatus);
                    return (
                      <div
                        key={booking.id}
                        onClick={() => window.open(getBookingUrl(booking), '_blank')}
                        className="group relative grid cursor-pointer grid-cols-[44px_1fr] lg:grid-cols-[40px_minmax(150px,1.1fr)_minmax(150px,1.15fr)_minmax(140px,1fr)_120px_120px_14px] items-center gap-x-4 gap-y-3 border-b border-[#E7EEE9] py-4 pr-2 transition lg:gap-y-0"
                      >
                        <span className="absolute -inset-x-4 inset-y-0 z-0 rounded-lg bg-[#F4F8F5] opacity-0 transition group-hover:opacity-100" />

                        <span className={`relative z-10 grid h-9 w-9 place-items-center rounded-xl border ${serviceBadge.bg} ${serviceBadge.border}`}>
                          {(() => {
                            const iconType = getServiceIcon(booking.service_name, booking.service_type);
                            const cls = `h-4 w-4 ${serviceBadge.text}`;
                            if (iconType === 'truck') return <Truck className={cls} />;
                            if (iconType === 'luxury') return <Star className={cls} />;
                            if (iconType === 'packers') return <Package className={cls} />;
                            if (iconType === 'equipment') return <Wrench className={cls} />;
                            if (iconType === 'bus') return <Bus className={cls} />;
                            return <Car className={cls} />;
                          })()}
                        </span>

                        <div className="relative z-10 min-w-0">
                          <p className="quote-serif truncate text-[18px] font-medium leading-[1.2] transition-colors group-hover:text-[#056B3E]">{booking.service_name}</p>
                          {booking.booking_number && (
                            <p className="mt-1 text-[10px] tracking-[0.06em] tabular-nums text-[#A6B1AA]">#{booking.booking_number}</p>
                          )}
                        </div>

                        <div className="relative z-10 col-span-2 min-w-0 lg:col-span-1">
                          <p className="flex flex-wrap items-center gap-2.5 text-[13px] font-medium text-[#0B1610]">
                            <span className="truncate">{booking.location_name}</span>
                            {booking.destination && booking.destination !== booking.location_name && (
                              <>
                                <span className="h-px w-5 flex-none bg-[#D4DFD8]" />
                                <span className="truncate">{booking.destination}</span>
                              </>
                            )}
                          </p>
                          <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[#C3CEC7] lg:hidden">Schedule</p>
                        </div>

                        {/* Schedule — its own column, so the row's spare width
                            carries information instead of sitting empty. */}
                        <div className="relative z-10 col-span-2 min-w-0 lg:col-span-1">
                          <p className="flex flex-wrap items-center gap-x-3 text-[12.5px] text-[#46524A]">
                            <span className="tabular-nums">{formatDate(booking.journey_datetime)}</span>
                            <span className="text-[#D4DFD8]">·</span>
                            <span className="tabular-nums">{formatTime(booking.journey_datetime)}</span>
                          </p>
                          {(!!booking.passengers || booking.goods_type) && (
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11px] text-[#A6B1AA]">
                              {!!booking.passengers && (
                                <span><span className="tabular-nums">{booking.passengers}</span> passengers</span>
                              )}
                              {!!booking.passengers && booking.goods_type && <span className="text-[#D4DFD8]">·</span>}
                              {booking.goods_type && <span className="truncate">{booking.goods_type}</span>}
                            </p>
                          )}
                        </div>

                        <div className="relative z-10">
                          {(() => {
                            // Where this booking sits in its lifecycle.
                            const STEP: Record<string, number> = {
                              PENDING: 1,
                              QUOTES_RECEIVED: 2,
                              PENDING_PAYMENT: 3,
                              PAYMENT_SUBMITTED: 3,
                              CONFIRMED: 3,
                              IN_PROGRESS: 3,
                              COMPLETED: 4,
                            };
                            const STOPPED = ['QUOTES_EXPIRED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'DROPPED'];
                            const stopped = STOPPED.includes(displayStatus);
                            const step = stopped ? 0 : (STEP[displayStatus] ?? 1);
                            const needsAction =
                              displayStatus === 'QUOTES_RECEIVED' || displayStatus === 'PENDING_PAYMENT';
                            return (
                              <>
                                <p className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${statusConfig.text}`}>
                                  {needsAction && (
                                    <span className={`cdb-ping relative h-1.5 w-1.5 flex-none rounded-full ${statusConfig.dot}`} />
                                  )}
                                  {getStatusLabel(displayStatus)}
                                </p>

                                <span className="mt-2 flex gap-[3px]" title={stopped ? 'Stopped' : ['Requested', 'Quoted', 'Confirmed', 'Completed'][step - 1]}>
                                  {[1, 2, 3, 4].map((seg) => (
                                    <span
                                      key={seg}
                                      className={`h-[3px] w-[22px] rounded-full ${
                                        stopped ? 'bg-[#F0D8D8]' : seg <= step ? statusConfig.dot : 'bg-[#E7EEE9]'
                                      }`}
                                    />
                                  ))}
                                </span>

                              </>
                            );
                          })()}

                          {booking.is_quote_request && (
                            quoteCount > 0 ? (
                              <p className="mt-2 text-[10px] font-medium text-[#056B3E]">
                                {quoteCount} quote{quoteCount !== 1 ? 's' : ''} received
                              </p>
                            ) : booking.all_quotes_expired ? (
                              <p className="mt-2 text-[10.5px] font-medium text-red-500">Quotes expired</p>
                            ) : (
                              <p className="mt-2 text-[10.5px] font-medium text-[#A6B1AA]">Awaiting quotes</p>
                            )
                          )}
                        </div>

                        <div className="relative z-10 text-right">
                          {quoteCount > 0 ? (
                            <>
                              <p className="quote-serif text-[21px] font-medium leading-none tabular-nums text-[#056B3E]">
                                ₹{lowestQuote !== Infinity ? lowestQuote.toLocaleString('en-IN') : '—'}
                              </p>
                              <p className="mt-1 text-[10px] text-[#A6B1AA]">lowest of {quoteCount}</p>
                            </>
                          ) : (
                            <span className="text-[10.5px] text-[#C3CEC7]">Not quoted yet</span>
                          )}
                        </div>

                        <ChevronRight className="relative z-10 hidden h-4 w-4 text-[#D4DFD8] transition-colors group-hover:text-[#09B368] lg:block" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredBookings.length > 0 && (
            <div className="flex items-center justify-between py-[26px] text-[12px] text-[#78857C]">
              <span className="tabular-nums">Page {currentPage} of {totalPages} · showing {paginatedBookings.length} of {filteredBookings.length}</span>
              <div className="flex gap-2.5">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                  className={`rounded-full border px-[18px] py-2 text-[12px] font-semibold transition ${currentPage === 1 ? 'cursor-not-allowed border-[#E7EEE9] text-[#D4DFD8]' : 'border-[#D4DFD8] text-[#46524A] hover:border-[#09B368] hover:text-[#056B3E]'}`}>
                  Previous
                </button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                  className={`rounded-full border px-[18px] py-2 text-[12px] font-semibold transition ${currentPage === totalPages ? 'cursor-not-allowed border-[#E7EEE9] text-[#D4DFD8]' : 'border-[#D4DFD8] text-[#46524A] hover:border-[#09B368] hover:text-[#056B3E]'}`}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════ THE MARKETPLACE — eight fleets ══════════════ */}
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10 pt-[72px]">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#E7EEE9] pb-[18px]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">The marketplace</p>
              <h2 className="quote-serif mt-2 text-[40px] font-medium leading-none">Book from eight fleets</h2>
              <p className="mt-2 max-w-[520px] text-[13px] text-[#78857C]">
                Verified vendors across India. Post a request, compare real quotes, pay only through TransRentals.
              </p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#056B3E]">
              Browse all services <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {FLEETS.map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className="cdb-fleet group relative flex flex-col overflow-hidden border-b border-r border-[#E7EEE9] px-5 pb-3.5 pt-4 transition last:border-r-0 hover:bg-[#F4F8F5] lg:[&:nth-child(4n)]:border-r-0"
              >
                <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[#EDF3EF] transition-all duration-300 group-hover:-translate-x-1 group-hover:text-[#D6F0E3]">
                  {fleetIcon(f.icon, 'h-[52px] w-[52px] stroke-[0.9]')}
                </span>
                <p className="quote-serif relative text-[21px] font-medium leading-[1.1]">{f.label}</p>
                <p className="relative mt-1 min-h-[30px] text-[11px] leading-[1.35] text-[#78857C]">{f.desc}</p>
                <p className="relative mt-2.5 text-[10.5px] tracking-[0.03em] text-[#A6B1AA]">
                  from <b className="text-[12px] font-semibold text-[#0B1610]">{f.from}</b>{f.unit}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* ══════════════ WALLET BAND — disabled ══════════════ */}
        {/* Temporarily switched off. Change `false` to `true` to bring the
            Lifetime spend band back; the markup below is untouched. */}
        {false && (
          <>
          <section className="relative mt-[72px] overflow-hidden bg-gradient-to-br from-[#09B368] to-[#056040] text-white">
            {/* same drifting grid as the hero, so the two bands read as a pair */}
            <div className="cdb-grid pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
            <div className="pointer-events-none absolute inset-0"
              style={{backgroundImage: 'radial-gradient(760px 320px at 88% -20%, rgba(255,255,255,.18), transparent 60%), radial-gradient(520px 260px at 6% 125%, rgba(1,48,27,.42), transparent 58%)'}} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <div className="relative z-10 mx-auto grid max-w-[1320px] grid-cols-1 items-start gap-x-14 gap-y-8 px-10 py-9 lg:grid-cols-[1.05fr_1fr]">

              {/* the headline figure */}
              <div>
                <p className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/[0.7]">
                  <span className="h-px w-6 bg-white/40" />
                  Lifetime spend
                </p>
                <p className="quote-serif mt-3 text-[44px] font-medium leading-none tabular-nums [text-shadow:0_2px_20px_rgba(0,0,0,.22)] sm:text-[52px]">
                  {formatCurrency(financials.totalExpense)}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {[
                    { k: 'Journeys', v: formatCount(stats?.total ?? 0), icon: Calendar },
                    {
                      k: 'Avg / journey',
                      v: formatCurrency(Math.round(financials.totalExpense / Math.max(stats?.total ?? 0, 1))),
                      icon: TrendingUp,
                    },
                    { k: 'Payments', v: formatCount(financials.expenses.length), icon: IndianRupee },
                  ].map(({ k, v, icon: Icon }) => (
                    <div key={k} className="relative overflow-hidden rounded-2xl border border-white/[0.2] bg-white/[0.12] px-3 py-2.5 backdrop-blur-sm">
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                      <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-white/[0.66]">
                        <Icon className="h-3 w-3 flex-none" /> {k}
                      </p>
                      <p className="mt-1 text-[16px] font-semibold tabular-nums">{v}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/customer/financials"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[12.5px] font-semibold text-[#056B3E] transition hover:bg-white/90"
                >
                  View full expense report <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* what the money actually went on */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.2] bg-white/[0.1] backdrop-blur-sm">
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

                <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.18] px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/[0.72]">Recent payments</p>
                  {financials.expenses.length > 3 && (
                    <Link href="/customer/financials" className="text-[11px] font-semibold text-white/80 hover:text-white">
                      See all {financials.expenses.length}
                    </Link>
                  )}
                </div>

                {isLoadingFinancials ? (
                  <div className="px-5" aria-label="Loading payments">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-start justify-between gap-5 border-b border-white/[0.14] py-3.5 last:border-b-0">
                        <div className="min-w-0 flex-1">
                          <span className="block h-3 w-3/5 animate-pulse rounded bg-white/25" />
                          <span className="mt-2 block h-2.5 w-2/5 animate-pulse rounded bg-white/15" />
                        </div>
                        <span className="h-5 w-20 flex-none animate-pulse rounded bg-white/25" />
                      </div>
                    ))}
                  </div>
                ) : financials.expenses.length === 0 ? (
                  <div className="px-5 py-7 text-center">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/[0.12]">
                      <IndianRupee className="h-5 w-5" />
                    </span>
                    <p className="mx-auto mt-3.5 max-w-[300px] text-[12.5px] leading-relaxed text-white/[0.7]">
                      {financialsError || 'No payments yet. Accept a quote and pay through TransRentals — every payment shows up here.'}
                    </p>
                    <Link
                      href="/"
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10"
                    >
                      Browse services <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="px-5">
                    {financials.expenses.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id ?? idx}
                        className="flex items-start justify-between gap-5 border-b border-white/[0.14] py-3 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{item.title}</p>
                          <p className="mt-1 text-[11px] text-white/[0.6]">
                            {item.date ? formatDetailDate(item.date) : 'Date not recorded'}
                            {item.description ? ` · ${item.description}` : ''}
                          </p>
                        </div>
                        <p className="quote-serif flex-none text-[22px] font-medium leading-none tabular-nums">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* The promise that sits behind every figure above. */}
            <div className="relative z-10 border-t border-white/[0.16]">
              <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-8 gap-y-2 px-10 py-3">
                <p className="flex items-center gap-2.5 text-[12px] font-semibold">
                  <ShieldCheck className="h-4 w-4 flex-none" />
                  Every payment runs through TransRentals
                </p>
                <p className="text-[11.5px] text-white/[0.7]">
                  Funds stay protected until your trip completes — never pay a vendor directly.
                </p>
              </div>
            </div>
          </section>
          </>
        )}

        {/* ══════════════ ACCOUNT BAND ══════════════ */}
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10 pt-[72px]">
          <div className="border-b border-[#E7EEE9] pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Your account</p>
            <h2 className="quote-serif mt-2 text-[40px] font-medium leading-none">Profile &amp; support</h2>
          </div>

          {/* items-start: each column takes its own height. Sharing one height
              looked tidy until a column grew on its own data (the rewards card
              on a connected account) — the other two then stretched with it and
              their cards went hollow, the content stranded in a tall empty box. */}
          <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_1.12fr_1fr]">

            {/* ── profile + inquiries ── */}
            <div className="flex flex-col gap-4">
              {/* Each card in this section carries one accent — green here, then
                  teal, sky and amber — so the band reads as a family rather than
                  four unrelated colours. */}
              <div className="overflow-hidden rounded-2xl border border-[#C6E7D8] bg-white transition-colors hover:border-[#9FD8BE]">
                <div className="flex items-end justify-between gap-3 border-b border-[#C6E7D8] bg-gradient-to-r from-[#E4F6EE] to-[#F7FCFA] px-5 py-4">
                  <div>
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#0E8552]">Signed in as</p>
                    <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none text-[#04321F]">Your profile</h3>
                  </div>
                  {/* the action lives in the header, so the body stays a clean
                      identity block instead of ending on a stub button */}
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#A9DCC5] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#056B3E] transition hover:border-[#09B368] hover:bg-[#EAF8F1]"
                  >
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                </div>

                <div className="group/id flex items-center gap-4 px-5 py-5">
                  <span className="relative flex-none">
                    <span className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#09B368] to-[#056040] text-white ring-[#09B368]/0 transition duration-300 group-hover/id:ring-[6px] group-hover/id:ring-[#09B368]/15">
                      {customer?.avatar || customer?.image ? (
                        <img
                          src={customer.avatar || customer.image}
                          className="relative z-10 h-full w-full object-cover"
                          alt=""
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null}
                      <span className="quote-serif absolute text-[28px] font-medium">{customer?.name?.charAt(0)?.toUpperCase()}</span>
                    </span>
                    {/* Signed-in marker. Outside the tile so the avatar can still
                        clip, and above z-10 because the avatar image carries it. */}
                    <span className="absolute -bottom-[3px] -right-[3px] z-20 h-4 w-4 rounded-full border-[3px] border-white bg-[#4ADE80]" />
                  </span>
                  <div className="min-w-0">
                    <p className="quote-serif truncate text-[26px] font-medium leading-[1.05]">{customer?.name}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#EAF8F1] px-2.5 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#056B3E]">
                      <ShieldCheck className="h-2.5 w-2.5" /> Verified member
                    </span>
                  </div>
                </div>

                {/* Contact rows carry their own accent as `currentColor`, so the
                    icon tile and the bar that wipes in on hover stay in step. */}
                <div className="flex flex-col border-t border-[#E7EEE9]">
                  <a
                    href={customer?.email ? `mailto:${customer.email}` : undefined}
                    className="group relative flex items-center gap-3.5 overflow-hidden border-b border-[#E7EEE9] px-5 py-3.5 text-[#056B3E] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100"
                  >
                    <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-[#EAF8F1] text-[#0E8552] transition group-hover:bg-[#D3F0E2] group-hover:text-[#04321F]">
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[9.5px] uppercase tracking-[0.14em] text-[#A6B1AA]">Email</span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-[#0B1610]">{customer?.email}</span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                  </a>
                  <a
                    href={customer?.phone ? `tel:${customer.phone}` : undefined}
                    className="group relative flex items-center gap-3.5 overflow-hidden px-5 py-3.5 text-[#056B3E] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100"
                  >
                    <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-[#EAF8F1] text-[#0E8552] transition group-hover:bg-[#D3F0E2] group-hover:text-[#04321F]">
                      <Phone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[9.5px] uppercase tracking-[0.14em] text-[#A6B1AA]">Phone</span>
                      <span className="mt-0.5 block truncate text-[12.5px] tabular-nums text-[#0B1610]">{customer?.phone}</span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                  </a>
                </div>
              </div>

              {/* Sized by its own content — no leftover column height to absorb
                  now that the columns no longer share one. */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#F0E3C4] bg-white transition-colors hover:border-[#E3CE99]">
                <div className="flex items-end justify-between gap-2.5 border-b border-[#F0E3C4] bg-gradient-to-r from-[#FEF8EA] to-[#FFFDF7] px-5 py-4">
                  <div>
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#B4700F]">Raised by you</p>
                    <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none text-[#3D2408]">My inquiries</h3>
                  </div>
                  {contactInquiries.length > 0 && (
                    <span className="rounded-full bg-[#B45309] px-2.5 py-[2px] text-[10px] font-bold text-white">{contactInquiries.length}</span>
                  )}
                </div>

                {contactInquiries.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <p className="flex items-center gap-2.5 text-[12px] text-[#A6B1AA]">
                      <Inbox className="h-4 w-4 flex-none text-[#E5C075]" />
                      No inquiries raised yet.
                    </p>
                    <Link href="/contact"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EBD5A3] px-4 py-2 text-[12px] font-semibold text-[#A9600C] transition hover:border-[#B45309] hover:bg-[#FEF8EA]">
                      <Mail className="h-3.5 w-3.5" /> New inquiry
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Two rows tall (a row measures ~70px), then it scrolls — so a
                        fourth inquiry lengthens the list, not the card. Same
                        treatment as the notification panel, scrollbar included.
                        Deliberately not flex-col: in a flex column a max-height
                        makes the rows shrink to fit instead of overflowing, so
                        nothing would ever scroll. */}
                    <div className="max-h-[140px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {contactInquiries.slice(0, 4).map((inq: any) => {
                        // Status reads as a dot + word rather than a filled pill, so
                        // four stacked rows don't turn into four blocks of colour.
                        const statusMap: Record<string, { label: string; dot: string; text: string }> = {
                          NEW: { label: 'New', dot: 'bg-blue-600', text: 'text-blue-700' },
                          IN_PROGRESS: { label: 'In Progress', dot: 'bg-yellow-500', text: 'text-yellow-700' },
                          RESOLVED: { label: 'Resolved', dot: 'bg-[#09B368]', text: 'text-[#056B3E]' },
                          CLOSED: { label: 'Closed', dot: 'bg-[#A6B1AA]', text: 'text-[#78857C]' },
                        };
                        const st = statusMap[inq.status] || statusMap.NEW;
                        return (
                          <div
                            key={inq.id}
                            className="group relative flex items-center gap-3.5 overflow-hidden border-b border-[#E7EEE9] px-5 py-3.5 text-[#B45309] transition last:border-b-0 after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100"
                          >
                            <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl border border-[#FDE9B5] bg-[#FFFBEB] text-[#B45309]">
                              <Inbox className="h-[17px] w-[17px]" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="quote-serif truncate text-[17px] font-semibold leading-[1.2] text-[#0B1610] transition group-hover:text-[#056B3E]">
                                {inq.subject}
                              </p>
                              <div className="mt-1 flex items-center justify-between gap-3">
                                <span className="text-[10.5px] tabular-nums text-[#A6B1AA]">
                                  {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className={`flex flex-none items-center gap-[7px] text-[11.5px] font-semibold ${st.text}`}>
                                  <i className={`h-[6px] w-[6px] rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* mt-auto pins the footer to the bottom edge when the rows
                        don't fill the stretched card */}
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#E7EEE9] px-5 py-3.5">
                      <p className="text-[11px] text-[#A6B1AA]">Closed inquiries stay here for your records.</p>
                      <Link href="/contact"
                        className="inline-flex flex-none items-center justify-center gap-2 rounded-full border border-[#EBD5A3] px-4 py-2 text-[12px] font-semibold text-[#A9600C] transition hover:border-[#B45309] hover:bg-[#FEF8EA]">
                        <Mail className="h-3.5 w-3.5" /> New inquiry
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── notifications (renders its own card) ── */}
            <NotificationPanel />

            {/* ── support + inquiries ── */}
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl border border-[#BFE7E2] bg-white">
                <div className="border-b border-[#BFE7E2] bg-gradient-to-r from-[#E2F6F4] to-[#F6FCFB] px-5 py-4">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#0B7C74]">Need a hand</p>
                  <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none text-[#04302C]">Get in touch</h3>
                </div>
                {/* Each row carries its own accent as `currentColor`: the icon tile
                    tints from it and the bar that wipes in on hover uses the same
                    value, so a row reads as one colour without repeating the hex. */}
                <div className="flex flex-col">
                  <Link
                    href="/customer/chat"
                    className="group relative flex items-center gap-3.5 overflow-hidden border-b border-[#E7EEE9] px-5 py-4 text-teal-600 transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100"
                  >
                    <span className="relative grid h-[42px] w-[42px] flex-none place-items-center rounded-[13px] bg-teal-50">
                      <MessageCircle className="h-[19px] w-[19px]" />
                      {totalUnreadChats > 0 && (
                        <span className="absolute -right-[5px] -top-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-teal-600 px-1 text-[9px] font-bold text-white">{totalUnreadChats}</span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold text-[#0B1610]">Messages</span>
                      <span className="mt-px block text-[11.5px] text-[#A6B1AA]">Chat with your vendors</span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                  </Link>
                  <Link
                    href="/customer/helpdesk"
                    className="group relative flex items-center gap-3.5 overflow-hidden border-b border-[#E7EEE9] px-5 py-4 text-sky-600 transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100"
                  >
                    <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[13px] bg-sky-50">
                      <HelpCircle className="h-[19px] w-[19px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold text-[#0B1610]">Help &amp; Support</span>
                      <span className="mt-px block text-[11.5px] text-[#A6B1AA]">Raise a support ticket</span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                  </Link>
                  <Link
                    href="/customer/financials"
                    className="group relative flex items-center gap-3.5 overflow-hidden px-5 py-4 text-[#056B3E] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100"
                  >
                    <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[13px] bg-[#EAF8F1]">
                      <IndianRupee className="h-[19px] w-[19px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold text-[#0B1610]">Financials</span>
                      <span className="mt-px block text-[11.5px] text-[#A6B1AA]">Payments and invoices</span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                  </Link>
                </div>
              </div>

              {/* BACKR rewards — same component and props as before, moved here
                  so the three columns end at roughly the same height. */}
              <BackrCard type="customer" uid={customer?.id ? String(customer.id) : undefined} variant="editorial" />
            </div>
          </div>

          {/* App download strip */}
          <div className="relative my-10 overflow-hidden rounded-2xl bg-gradient-to-br from-[#056040] via-[#09B368] to-[#01301B] text-white">
            {/* drifting grid + key light, same as the other green bands */}
            <div className="cdb-grid pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
            <div className="pointer-events-none absolute inset-0"
              style={{backgroundImage: 'radial-gradient(620px 280px at 88% -25%, rgba(255,255,255,.20), transparent 62%), radial-gradient(420px 220px at 4% 130%, rgba(1,35,20,.5), transparent 58%)'}} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <div className="relative grid grid-cols-1 items-center gap-6 px-8 py-7 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/[0.72]">
                  <Gift className="h-3 w-3" /> Earn rewards
                </p>
                <h3 className="quote-serif mt-2.5 text-[32px] font-medium leading-[1.1] [text-shadow:0_2px_16px_rgba(0,0,0,.25)]">
                  Download the TransRentals App
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {[
                    { icon: Calendar, t: 'Track bookings', s: 'Live trip status' },
                    { icon: MessageCircle, t: 'Chat with vendors', s: 'Straight from your phone' },
                    { icon: Coins, t: 'Earn tokens', s: 'On every booking' },
                  ].map(({ icon: Icon, t, s: sub }) => (
                    <div key={t} className="relative overflow-hidden rounded-lg border border-white/[0.2] bg-white/[0.12] px-3 py-2.5 backdrop-blur-sm">
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <span className="flex items-start gap-2.5">
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-white/25 bg-white/[0.14]">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[12px] font-semibold leading-tight">{t}</span>
                          <span className="mt-0.5 block text-[10.5px] leading-tight text-white/[0.66]">{sub}</span>
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="https://play.google.com/store/apps/details?id=com.transrentals.customer"
                className="inline-flex items-center gap-2.5 self-start whitespace-nowrap rounded-full bg-white px-[22px] py-3.5 text-[12.5px] font-semibold text-[#056B3E] transition hover:bg-white/90 lg:self-center"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                Google Play
              </a>
            </div>
          </div>
        </div>

        {/* closing line */}
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10">
          <div className="border-t border-[#E7EEE9] py-7">
            <p className="text-[11.5px] text-[#A6B1AA]">
              TransRentals &middot; verified vendors, real quotes, protected payments.
            </p>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E7EEE9] bg-white">

            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#E7EEE9] bg-[#F4F8F5] px-6 py-4">
              <div>
                <h3 className="quote-serif text-[26px] font-medium text-[#0B1610]">Edit Profile</h3>
                <p className="mt-0.5 text-[12px] text-[#78857C]">Update your personal information</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#D4DFD8] bg-white text-[#78857C] transition hover:border-[#09B368] hover:text-[#056B3E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {profileError && (
                <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-[#BEE9D3] bg-[#EAF8F1] px-4 py-3 text-[12.5px] text-[#056B3E]">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Profile updated successfully!
                </div>
              )}

              {/* Avatar */}
              <div className="flex items-center gap-4 border-b border-[#E7EEE9] pb-5">
                <div className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-lg border border-[#BEE9D3] bg-[#EAF8F1]">
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="quote-serif text-[26px] font-medium text-[#056B3E]">
                      {profileForm.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setProfileForm((prev) => ({
                          ...prev,
                          avatar: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-[#D4DFD8] px-4 py-2 text-[12px] font-semibold text-[#46524A] transition hover:border-[#09B368] hover:text-[#056B3E]"
                  >
                    Change photo
                  </button>
                  <p className="mt-1.5 text-[11px] text-[#A6B1AA]">JPG or PNG</p>
                </div>
              </div>

              {/* Personal */}
              <div className="pt-5">
                <p className="mb-3.5 border-b border-[#E7EEE9] pb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Personal</p>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368]"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setProfileForm((prev) => ({ ...prev, phone: val }));
                      }}
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368] tabular-nums"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368]"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="pt-6">
                <p className="mb-3.5 border-b border-[#E7EEE9] pb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Address</p>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">Address</label>
                    <textarea
                      value={profileForm.address}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368] resize-none"
                      placeholder="House / Flat, Street, Landmark"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368]"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">State</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368]"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">Pincode</label>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 6) setProfileForm((prev) => ({ ...prev, pincode: val }));
                      }}
                      maxLength={6}
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368] tabular-nums"
                      placeholder="123456"
                    />
                  </div>
                </div>
              </div>

              {/* Bank & payout */}
              <div className="pt-6">
                <p className="mb-3.5 border-b border-[#E7EEE9] pb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Bank &amp; payout</p>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">Bank Name</label>
                    <input
                      type="text"
                      value={profileForm.bank_name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, bank_name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368]"
                      placeholder="Enter your bank"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">Account Number</label>
                    <input
                      type="text"
                      value={profileForm.account_number}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, account_number: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368] tabular-nums"
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">IFSC Code</label>
                    <input
                      type="text"
                      value={profileForm.ifsc_code}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, ifsc_code: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368] tabular-nums"
                      placeholder="Enter IFSC code"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">UPI ID</label>
                    <input
                      type="text"
                      value={profileForm.upi_id}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, upi_id: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368]"
                      placeholder="Enter UPI ID"
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(v => !v)}
                  className="mb-3.5 flex w-full items-center justify-between border-b border-[#E7EEE9] pb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA] transition hover:text-[#056B3E]"
                >
                  <span>{customer?.hasPassword ? 'Change password' : 'Set password'}</span>
                  <svg className={`h-3.5 w-3.5 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {showPasswordSection && (
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                          className="w-full rounded-lg border border-[#D4DFD8] bg-white px-3.5 py-2.5 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368] pr-10"
                          placeholder="Min. 8 characters"
                        />
                        <button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A6B1AA] hover:text-[#46524A]">
                          {showPasswords.new ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        </button>
                      </div>
                      {passwordForm.newPassword && (
                        <div className="mt-2 flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                              passwordForm.newPassword.length >= [8,10,12,14][i]
                                ? ['bg-red-400','bg-yellow-400','bg-blue-400','bg-[#09B368]'][i]
                                : 'bg-[#E7EEE9]'
                            }`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.03em] text-[#78857C]">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-[13px] text-[#0B1610] outline-none transition placeholder:text-[#A6B1AA] focus:border-[#09B368] ${
                            passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
                              ? 'border-red-300 bg-red-50'
                              : passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword
                              ? 'border-[#BEE9D3] bg-[#EAF8F1]'
                              : 'border-[#D4DFD8]'
                          }`}
                          placeholder="Re-enter new password"
                        />
                        <button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A6B1AA] hover:text-[#46524A]">
                          {showPasswords.confirm ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                        <p className="mt-1.5 text-[11px] text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 justify-end gap-2.5 border-t border-[#E7EEE9] bg-white px-6 py-4">
              <button
                onClick={() => setShowProfileModal(false)}
                className="rounded-full border border-[#D4DFD8] px-6 py-2.5 text-[12.5px] font-semibold text-[#46524A] transition hover:border-[#09B368] hover:text-[#056B3E]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#09B368] px-6 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-[#078F53] disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {showServiceFilter && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowServiceFilter(false)}
        ></div>
      )}
      {showLocationFilter && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLocationFilter(false)}
        ></div>
      )}

      {/* Company Manage Modal */}
      {showCompanyModal && (() => {
        // Fetch company details on modal open
        if (!companyDetails && !isLoadingCompany) {
          setIsLoadingCompany(true);
          const params = new URLSearchParams();
          if (customer?.id) params.set('customer_id', String(customer.id));
          else if (customer?.email) params.set('email', customer.email);
          fetch(`/api/customer/b2b-status?${params}`)
            .then(r => r.json())
            .then(data => { setCompanyDetails(data); setIsLoadingCompany(false); })
            .catch(() => setIsLoadingCompany(false));
        }
        return null;
      })()}
      {showCompanyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => { setShowCompanyModal(false); setCompanyDetails(null); }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#E7EEE9] bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#E7EEE9] bg-[#F4F8F5] px-6 py-4">
              <div>
                <h2 className="quote-serif text-[26px] font-medium text-[#0B1610]">Company Details</h2>
                <p className="mt-0.5 text-[12px] text-[#78857C]">B2B Corporate Account</p>
              </div>
              <button
                onClick={() => { setShowCompanyModal(false); setCompanyDetails(null); }}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#D4DFD8] bg-white text-[#78857C] transition hover:border-[#09B368] hover:text-[#056B3E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isLoadingCompany ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#09B368]" />
                </div>
              ) : (
                <>
                  {/* Company Name + Status */}
                  <div className="border-b border-[#E7EEE9] pb-5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8F1] px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#056B3E]">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        {companyDetails?.b2bStatus || customer?.b2bStatus || 'Approved'}
                      </span>
                      {companyDetails?.b2bApprovedAt && (
                        <span className="text-[11px] text-[#A6B1AA]">
                          since {new Date(companyDetails.b2bApprovedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h3 className="quote-serif mt-2.5 text-[30px] font-medium leading-[1.05] text-[#0B1610]">
                      {companyDetails?.companyName || customer?.companyName || 'Company Name'}
                    </h3>
                  </div>

                  {/* Company Information */}
                  <div className="pt-5">
                    <p className="mb-3.5 border-b border-[#E7EEE9] pb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Company information</p>
                    <div className="flex items-start gap-3 border-b border-[#E7EEE9] py-3 last:border-b-0">
                      <Hash className="mt-[3px] h-4 w-4 flex-none text-[#A6B1AA]" />
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold text-[#78857C]">GSTIN</p>
                        <p className="mt-0.5 font-mono text-[13.5px] font-semibold text-[#0B1610]">{companyDetails?.gstin || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-b border-[#E7EEE9] py-3 last:border-b-0">
                      <Briefcase className="mt-[3px] h-4 w-4 flex-none text-[#A6B1AA]" />
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold text-[#78857C]">Business Type</p>
                        <p className="mt-0.5 text-[13.5px] font-semibold text-[#0B1610]">{companyDetails?.businessType || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="pt-6">
                    <p className="mb-3.5 border-b border-[#E7EEE9] pb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Contact person</p>
                    <div className="flex items-start gap-3 border-b border-[#E7EEE9] py-3 last:border-b-0">
                      <User className="mt-[3px] h-4 w-4 flex-none text-[#A6B1AA]" />
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold text-[#78857C]">Full Name</p>
                        <p className="mt-0.5 text-[13.5px] font-semibold text-[#0B1610]">{customer?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-b border-[#E7EEE9] py-3 last:border-b-0">
                      <Mail className="mt-[3px] h-4 w-4 flex-none text-[#A6B1AA]" />
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold text-[#78857C]">Email</p>
                        <p className="mt-0.5 truncate text-[13.5px] font-semibold text-[#0B1610]">{customer?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-b border-[#E7EEE9] py-3 last:border-b-0">
                      <Phone className="mt-[3px] h-4 w-4 flex-none text-[#A6B1AA]" />
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold text-[#78857C]">Phone</p>
                        <p className="mt-0.5 text-[13.5px] font-semibold tabular-nums text-[#0B1610]">{customer?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Type */}
                  <div className="mt-6 rounded-lg border border-[#E7EEE9] bg-[#F4F8F5] px-4 py-3.5">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#A6B1AA]">Account type</p>
                    <p className="mt-1.5 text-[13.5px] font-semibold text-[#0B1610]">B2B Corporate — Post-Paid Billing</p>
                  </div>

                  <p className="mt-5 text-center text-[11.5px] text-[#A6B1AA]">
                    To update company details, contact support at{' '}
                    <a href="mailto:book@transrentals.in" className="font-semibold text-[#056B3E]">book@transrentals.in</a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal — the markup is here and styled, but nothing
          opens it: handleLogout is still uncalled, exactly as before. The header
          continues to sign out directly. */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E7EEE9] bg-white">
            <div className="px-8 py-8 text-center">
              <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
                <LogOut className="h-5 w-5" />
              </span>
              <h3 className="quote-serif text-[26px] font-medium text-[#0B1610]">Log out of your account?</h3>
              <p className="mx-auto mt-2 max-w-[320px] text-[12.5px] leading-relaxed text-[#78857C]">
                You&apos;ll need to sign in again to view your bookings and quotes.
              </p>
            </div>
            <div className="flex justify-center gap-2.5 border-t border-[#E7EEE9] px-6 py-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="rounded-full border border-[#D4DFD8] px-6 py-2.5 text-[12.5px] font-semibold text-[#46524A] transition hover:border-[#09B368] hover:text-[#056B3E] disabled:opacity-50"
              >
                Stay signed in
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-80"
              >
                {loggingOut ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Logging out...
                  </>
                ) : (
                  'Log Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

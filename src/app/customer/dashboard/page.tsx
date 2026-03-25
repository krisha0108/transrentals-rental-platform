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
} from 'lucide-react';
import B2BDashboard from './B2BDashboard';
import TourDashboard from './TourDashboard';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

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
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Profile edit modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

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

    setFilteredBookings(filtered);
  }, [selectedService, selectedLocation, bookings]);

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
  }, [selectedService, selectedLocation, activeTab, bookings.length]);

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

  const fetchBookings = async (identifier: string, status: string, customerId?: string | number) => {
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

      if (data.success && data.bookings) {
        setBookings(data.bookings);
      } else if (Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
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
    const identifier = customer?.phone || customer?.email || '';
    const customerId = customer?.id;
    const refreshTasks = [
      fetchStats(identifier, customerId),
      fetchBookings(identifier, activeTab, customerId),
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
        bank_name: profileForm.bank_name,
        account_number: profileForm.account_number,
        ifsc_code: profileForm.ifsc_code,
        upi_id: profileForm.upi_id,
      };

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
          bank_name: profileForm.bank_name,
          account_number: profileForm.account_number,
          ifsc_code: profileForm.ifsc_code,
          upi_id: profileForm.upi_id,
        };
        setCustomer(updatedCustomer as Customer);
        setProfileForm((prev) => ({ ...prev, avatar: avatarUrl || '' }));
        localStorage.setItem('customer', JSON.stringify(updatedCustomer));
        setProfileSuccess(true);
        setTimeout(() => {
          setShowProfileModal(false);
          setProfileSuccess(false);
        }, 1500);
      } else {
        setProfileError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError('Network error. Please try again.');
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      Open: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      Confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      Ongoing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      Completed: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
      Dropped: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };
    return configs[status] || configs.Open;
  };

  const getServiceIcon = (serviceName: string, serviceType?: string) => {
    const name = serviceName.toLowerCase();
    const type = serviceType || '';
    if (type === 'bike' || name.includes('bike') || name.includes('scooter')) return '🏍️';
    if (type === 'bus' || name.includes('bus') || name.includes('tempo')) return '🚌';
    if (type === 'truck' || name.includes('truck') || name.includes('transport')) return '🚛';
    if (type === 'luxury' || name.includes('luxury')) return '👑';
    if (type === 'packers' || name.includes('packer') || name.includes('mover')) return '📦';
    if (type === 'equipment' || name.includes('equipment') || name.includes('jcb') || name.includes('crane')) return '🏗️';
    if (type === 'car' || name.includes('self') || name.includes('self-drive')) return '🔑';
    if (type === 'chauffeur' || name.includes('chauffeur') || name.includes('driver')) return '🚖';
    return '🚗';
  };

  // Get service badge color and label based on service type
  const getServiceBadge = (serviceType?: string, serviceName?: string) => {
    const type = serviceType || '';
    const name = serviceName?.toLowerCase() || '';

    if (type === 'bike' || name.includes('bike') || name.includes('scooter')) {
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: '🏍️ Bike Rental' };
    }
    if (type === 'bus' || name.includes('bus') || name.includes('tempo traveller')) {
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: '🚌 Bus Rental' };
    }
    if (type === 'truck' || name.includes('truck') || name.includes('transporter')) {
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: '🚛 Truck Rental' };
    }
    if (type === 'luxury' || name.includes('luxury')) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: '👑 Luxury Car' };
    }
    if (type === 'packers' || name.includes('packer') || name.includes('mover')) {
      return { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', label: '📦 Packers & Movers' };
    }
    if (type === 'equipment' || name.includes('equipment') || name.includes('jcb') || name.includes('crane')) {
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: '🏗️ Equipment' };
    }
    if (type === 'car' || name.includes('self-drive') || name.includes('self drive')) {
      return { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', label: '🔑 Self Drive' };
    }
    if (type === 'chauffeur' || name.includes('chauffeur') || name.includes('outstation') || name.includes('airport') || name.includes('local')) {
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: '🚗 Car Rental' };
    }
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: '🚗 Car Rental' };
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-purple-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            </div>
          </div>
          <p className="text-purple-200 mt-6 font-medium">Loading your dashboard...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left: Logo & Home Link */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/Logo-favicon.png"
              alt="TR"
              width={48}
              height={48}
              className="w-10 h-10 md:w-11 md:h-11 rounded-md"
            />
            <div className="flex flex-col">
              <Image
                src="/assets/logo-white.png"
                alt="TransRentals"
                width={140}
                height={28}
                className="h-5 md:h-6 w-auto"
              />
              <span className="text-xs text-white/70 hidden md:block">
                Vehicle Rental Marketplace
              </span>
            </div>
          </Link>
            </div>

            {/* Center: User Info (Desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  {customer?.avatar || customer?.image ? (
                    <img
                      src={customer.avatar || customer.image || ''}
                      alt={customer.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-white">
                <p className="text-purple-300 text-xs">{getGreeting()}</p>
                <p className="font-semibold text-sm">{customer?.name || 'Customer'}</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Home Link */}
              <Link
                href="/"
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition hidden sm:flex items-center gap-2"
                title="Go to Homepage"
              >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium hidden lg:inline">Home</span>
              </Link>
              <Link
                href="/customer/helpdesk"
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition hidden sm:flex items-center gap-2"
                title="Open Helpdesk"
              >
                <Inbox className="h-5 w-5" />
                <span className="text-sm font-medium hidden lg:inline">Helpdesk</span>
              </Link>

              {/* Chat Icon with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowChatDropdown(!showChatDropdown)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition relative"
                  title="Messages"
                >
                  <MessageCircle className="h-5 w-5" />
                  {totalUnreadChats > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {totalUnreadChats > 9 ? '9+' : totalUnreadChats}
                    </span>
                  )}
                </button>

                {/* Chat Dropdown */}
                {showChatDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowChatDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                        <h3 className="font-semibold text-gray-900">Vendor Messages</h3>
                        <p className="text-xs text-gray-500">Chat with vendors about your bookings</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {chatBookings.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <MessageCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No active chats</p>
                            <p className="text-xs text-gray-400">Messages from vendors will appear here</p>
                          </div>
                        ) : (
                          chatBookings.map((chat: any) => (
                            <Link
                              key={`chat-${chat.vendor_id}-${chat.booking_id}`}
                              href={`/customer/booking/${chat.booking_id}`}
                              onClick={() => setShowChatDropdown(false)}
                              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b border-gray-50"
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {chat.vendor_name}
                                  </p>
                                  {(chat.unread_count || 0) > 0 && (
                                    <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                                      {chat.unread_count}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{chat.last_message}</p>
                                <p className="text-xs text-purple-600 mt-0.5">
                                  Booking #{chat.booking_id} • {chat.service_name}
                                </p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Edit Profile */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition hidden sm:block"
                title="Edit Profile"
              >
                <Edit3 className="h-5 w-5" />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-200 hover:text-white transition hidden sm:block"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition sm:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="sm:hidden pb-4 border-t border-white/10 mt-2 pt-4">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  {customer?.avatar || customer?.image ? (
                    <img
                      src={customer.avatar || customer.image || ''}
                      alt={customer.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="text-white">
                  <p className="font-semibold">{customer?.name || 'Customer'}</p>
                  <p className="text-purple-300 text-sm">{customer?.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/"
                  className="flex flex-col items-center gap-1 p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
                >
                  <Home className="h-5 w-5" />
                  <span className="text-xs">Home</span>
                </Link>
                <Link
                  href="/customer/helpdesk"
                  className="flex flex-col items-center gap-1 p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
                >
                  <Inbox className="h-5 w-5" />
                  <span className="text-xs">Helpdesk</span>
                </Link>
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="flex flex-col items-center gap-1 p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
                >
                  <Edit3 className="h-5 w-5" />
                  <span className="text-xs">Edit</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center gap-1 p-3 bg-red-500/20 rounded-xl text-red-200 hover:bg-red-500/30 transition"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-xs">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content with top padding for fixed header */}
      <div className="pt-16 md:pt-20">
        {/* B2B Approval Pending Banner */}
        {customer?.isB2B && customer?.b2bStatus !== 'APPROVED' && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
            <div className="container mx-auto px-4 max-w-6xl py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">B2B Account — Approval In Review</p>
                  <p className="text-xs text-amber-600">
                    Your corporate account{customer?.companyName ? ` for ${customer.companyName}` : ''} is under review by the admin team. You'll be able to access B2B features once approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab Toggle */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1">
                {customer?.isB2B && customer?.b2bStatus === 'APPROVED' && (
                  <button
                    onClick={() => setDashboardView('b2b')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      dashboardView === 'b2b'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Building2 className="w-4 h-4" /> B2B Dashboard
                  </button>
                )}
                <button
                  onClick={() => setDashboardView('personal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    dashboardView === 'personal'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Car className="w-4 h-4" /> {customer?.isB2B ? 'Personal' : 'My Bookings'}
                </button>
                <button
                  onClick={() => setDashboardView('tour')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    dashboardView === 'tour'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Compass className="w-4 h-4" /> Tours
                </button>
              </div>
              {customer?.isB2B && customer?.b2bStatus === 'APPROVED' && (
                <button
                  onClick={() => setShowCompanyModal(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-amber-300 hover:bg-white/10 border border-amber-500/30"
                >
                  <Edit3 className="w-4 h-4" /> Manage Company
                </button>
              )}
            </div>
          </div>
        </div>

        {/* B2B Dashboard View */}
        {dashboardView === 'b2b' && customer?.isB2B ? (
          <div className="container mx-auto px-4 max-w-6xl py-6">
            <B2BDashboard
              customerId={String(customer.id)}
              customerName={customer.name}
              companyName={customer.companyName || null}
            />
          </div>
        ) : dashboardView === 'tour' ? (
          <div className="container mx-auto px-4 max-w-6xl py-6">
            <TourDashboard customerId={String(customer?.id)} />
          </div>
        ) : (
        <>
        {/* Stats Section */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-8 pt-6">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* User Welcome (Mobile) */}
            <div className="md:hidden mb-6 text-center">
              <p className="text-purple-300 text-sm">{getGreeting()}</p>
              <h1 className="text-2xl font-bold text-white">{customer?.name || 'Customer'}</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {tabConfig.map((stat) => {
                const Icon = stat.icon;
                const isActive = activeTab === stat.key;
                return (
                  <button
                    key={stat.key}
                    onClick={() => handleTabChange(stat.key)}
                    className={`relative group rounded-2xl p-4 md:p-5 transition-all duration-300 ${
                      isActive
                        ? 'bg-white/20 border-2 border-white/30 shadow-lg'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/15'
                      }`}>
                        <Icon className={`h-4 w-4 md:h-5 md:w-5 ${isActive ? 'text-white' : 'text-purple-200'}`} />
                      </div>
                      <span className={`text-2xl md:text-3xl font-bold ${isActive ? 'text-white' : 'text-purple-100'}`}>
                        {stat.count}
                      </span>
                    </div>
                    <p className={`text-xs md:text-sm font-medium ${isActive ? 'text-white' : 'text-purple-300'}`}>
                      {stat.label}
                    </p>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 md:w-12 h-1 bg-white rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tour overview moved to Tours tab */}
          </div>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="container mx-auto px-4 max-w-7xl py-6 md:py-8 -mt-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side - My Bookings (Scrollable) */}
            <div className="flex-1 min-w-0">
        {/* Bookings Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header with Filter */}
            <div className="p-4 md:p-6 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">My Bookings</h2>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">
                    Showing {filteredBookings.length} of {bookings.length} {activeTab.toLowerCase()} bookings
                  </p>
                </div>

                {/* Service + Location Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowServiceFilter((prev) => !prev);
                        setShowLocationFilter(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition shadow-sm text-sm"
                    >
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">
                        {selectedService === 'all' ? 'All Services' : selectedService}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showServiceFilter ? 'rotate-180' : ''}`} />
                    </button>

                    {showServiceFilter && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                        <div className="p-2 space-y-2">
                          <input
                            type="text"
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                            placeholder="Search services..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                          />
                          <button
                            onClick={() => {
                              setSelectedService('all');
                              setShowServiceFilter(false);
                              setServiceSearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${
                              selectedService === 'all'
                                ? 'bg-purple-50 text-purple-700 font-medium'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            All Services
                          </button>
                          <div className="max-h-60 overflow-y-auto pr-1 space-y-1">
                            {filteredServiceOptions.length === 0 ? (
                              <p className="px-4 py-2 text-sm text-gray-400">
                                {serviceOptions.length === 0
                                  ? 'No services available yet'
                                  : 'No services match your search'}
                              </p>
                            ) : (
                              filteredServiceOptions.map((service) => (
                                <button
                                  key={service}
                                  onClick={() => {
                                    setSelectedService(service);
                                    setShowServiceFilter(false);
                                    setServiceSearch('');
                                  }}
                                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition flex items-center gap-2 ${
                                    selectedService === service
                                      ? 'bg-purple-50 text-purple-700 font-medium'
                                      : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <span>{getServiceIcon(service)}</span>
                                  {service}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowLocationFilter((prev) => !prev);
                      setShowServiceFilter(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition shadow-sm text-sm"
                  >
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 font-medium">
                      {selectedLocation === 'all' ? 'All Locations' : selectedLocation}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showLocationFilter ? 'rotate-180' : ''}`} />
                  </button>

                  {showLocationFilter && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="p-2 space-y-2">
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          placeholder="Search locations..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                        />
                        <button
                          onClick={() => {
                            setSelectedLocation('all');
                            setLocationSearch('');
                            setShowLocationFilter(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${
                            selectedLocation === 'all'
                              ? 'bg-purple-50 text-purple-700 font-medium'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          All Locations
                        </button>
                        <div className="max-h-60 overflow-y-auto pr-1">
                          {filteredLocationOptions.length === 0 ? (
                            <p className="px-4 py-2 text-sm text-gray-400">
                              {locationOptions.length === 0
                                ? 'No locations available yet'
                                : 'No locations match your search'}
                            </p>
                          ) : (
                            filteredLocationOptions.map((location) => (
                              <button
                                key={location}
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setShowLocationFilter(false);
                                  setLocationSearch('');
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${
                                  selectedLocation === location
                                    ? 'bg-purple-50 text-purple-700 font-medium'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                {location}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="divide-y divide-gray-100">
              {isLoadingBookings ? (
                <div className="p-12 md:p-16 text-center">
                  <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
                    <Loader2 className="h-12 w-12 md:h-16 md:w-16 animate-spin text-purple-500" />
                  </div>
                  <p className="text-gray-500 font-medium">Loading your bookings...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-12 md:p-16 text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 md:h-12 md:w-12 text-purple-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    No {activeTab.toLowerCase()} bookings
                  </h3>
                  <p className="text-gray-500 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
                    {activeTab === 'Open'
                      ? "You don't have any bookings waiting for quotes. Create a new booking to get started!"
                      : activeTab === 'Dropped'
                      ? "Great news! You don't have any dropped bookings."
                      : `You don't have any ${activeTab.toLowerCase()} bookings at the moment.`}
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-medium hover:opacity-90 transition shadow-lg shadow-purple-200 text-sm md:text-base"
                  >
                    <Sparkles className="h-5 w-5" />
                    Create New Booking
                  </Link>
                </div>
              ) : (
                paginatedBookings.map((booking) => {
                  const statusConfig = getStatusConfig(booking.status);
                  const serviceBadge = getServiceBadge(booking.service_type, booking.service_name);
                  const quoteCount = booking.quotations?.length || 0;
                  const lowestQuote = booking.quotations?.reduce((min, q) => {
                    const price = q.price || q.amount || 0;
                    return price < min ? price : min;
                  }, Infinity) ?? Infinity;

                  return (
                    <Link
                      key={booking.id}
                      href={getBookingUrl(booking)}
                      className="block p-4 md:p-6 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all duration-300 group"
                    >
                      <div className="flex items-start gap-3 md:gap-5">
                        {/* Service Icon */}
                        <div className="relative">
                          <div className={`w-12 h-12 md:w-16 md:h-16 ${serviceBadge.bg} border ${serviceBadge.border} rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                            {getServiceIcon(booking.service_name, booking.service_type)}
                          </div>
                          <div className={`absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full ${statusConfig.dot} border-2 border-white`}></div>
                        </div>

                        {/* Booking Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 md:gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                {/* Service Badge */}
                                <span className={`px-2 py-0.5 rounded-md border text-[10px] md:text-xs font-semibold ${serviceBadge.bg} ${serviceBadge.text} ${serviceBadge.border}`}>
                                  {serviceBadge.label}
                                </span>
                                <h3 className="font-bold text-gray-900 text-sm md:text-lg group-hover:text-purple-700 transition-colors">
                                  {booking.service_name}
                                </h3>
                                <span
                                  className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                                >
                                  <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${statusConfig.dot}`}></span>
                                  {booking.status}
                                </span>
                                {booking.is_quote_request && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-yellow-100 text-yellow-700">
                                    Awaiting Quotes
                                  </span>
                                )}
                              </div>

                              {/* Route */}
                              <div className="flex items-center gap-1 md:gap-2 text-gray-600 mb-2 md:mb-3 text-xs md:text-sm">
                                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-purple-400 flex-shrink-0" />
                                <span className="truncate">
                                  {booking.location_name}
                                  {booking.destination && booking.destination !== booking.location_name && (
                                    <>
                                      <span className="mx-1 md:mx-2 text-purple-400">→</span>
                                      {booking.destination}
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Date & Time */}
                              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
                                <span className="flex items-center gap-1 md:gap-1.5 text-gray-500 bg-gray-100 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                                  <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                  {formatDate(booking.journey_datetime)}
                                </span>
                                <span className="flex items-center gap-1 md:gap-1.5 text-gray-500 bg-gray-100 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                                  <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                  {formatTime(booking.journey_datetime)}
                                </span>
                              </div>
                            </div>

                            {/* Quote Info & Arrow */}
                            <div className="flex items-center gap-2 md:gap-4">
                              {quoteCount > 0 && (
                                <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 px-2 md:px-4 py-1.5 md:py-3 rounded-lg md:rounded-xl border border-green-100">
                                  <div className="flex items-center gap-0.5 md:gap-1 text-green-600 font-bold text-sm md:text-lg">
                                    <IndianRupee className="h-3 w-3 md:h-4 md:w-4" />
                                    {lowestQuote !== Infinity
                                      ? lowestQuote.toLocaleString('en-IN')
                                      : '---'}
                                  </div>
                                  <p className="text-[10px] md:text-xs text-green-600/70 font-medium">
                                    {quoteCount} {quoteCount === 1 ? 'quote' : 'quotes'}
                                  </p>
                                </div>
                              )}
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            {filteredBookings.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
                <span>
                  Page {currentPage} of {totalPages} • Showing {paginatedBookings.length} of {filteredBookings.length} {activeTab.toLowerCase()} bookings on this page
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold uppercase tracking-wide transition ${
                      currentPage === 1
                        ? 'border-gray-200 bg-white text-gray-400 cursor-not-allowed'
                        : 'border-purple-200 bg-white text-purple-600 hover:border-purple-400'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold uppercase tracking-wide transition ${
                      currentPage === totalPages
                        ? 'border-gray-200 bg-white text-gray-400 cursor-not-allowed'
                        : 'border-purple-200 bg-white text-purple-600 hover:border-purple-400'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tour data moved to Tours tab */}

          {/* Quick Links */}
          <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Link
              href="/customer/financials"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-sm font-semibold text-gray-800 transition hover:border-purple-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5">
                  <IndianRupee className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">View Expenses</p>
                  <p className="text-xs text-gray-500">Financial reports</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500" />
            </Link>
            <Link
              href="/customer/helpdesk"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-sm font-semibold text-gray-800 transition hover:border-purple-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-sky-50 p-2.5">
                  <HelpCircle className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Get Help</p>
                  <p className="text-xs text-gray-500">Customer support</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500" />
            </Link>
          </div>

          {/* Download App CTA - Compact */}
          <div className="mt-6 bg-gradient-to-r from-slate-900 to-purple-900 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 text-xs font-semibold">Earn Rewards</span>
                </div>
                <h3 className="text-lg font-bold">Get the App</h3>
                <p className="text-purple-200 text-xs mt-1">Track bookings & earn ₹50 tokens!</p>
              </div>
              <a
                href="https://play.google.com/store/apps/details?id=com.transrentals.customer"
                className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition shadow-lg text-sm whitespace-nowrap"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                Google Play
              </a>
            </div>
          </div>
            </div>

            {/* Right Side - Quick Actions (Sticky) */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-4">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/"
                      className="group bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 hover:shadow-md transition-all duration-200 border border-purple-100/50"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-sm">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-xs">New Booking</h3>
                    </Link>
                    <Link
                      href="/bike-on-rent"
                      className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 hover:shadow-md transition-all duration-200 border border-blue-100/50"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-sm text-lg">
                        🏍️
                      </div>
                      <h3 className="font-semibold text-gray-900 text-xs">Rent Bike</h3>
                    </Link>
                    <Link
                      href="/car-rental"
                      className="group bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 hover:shadow-md transition-all duration-200 border border-emerald-100/50"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-sm text-lg">
                        🚗
                      </div>
                      <h3 className="font-semibold text-gray-900 text-xs">Rent Car</h3>
                    </Link>
                    <Link
                      href="/luxury-car-rental"
                      className="group bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 hover:shadow-md transition-all duration-200 border border-amber-100/50"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-sm">
                        <Star className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-xs">Luxury Car</h3>
                    </Link>
                    <Link
                      href="/bus-rental"
                      className="group bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 hover:shadow-md transition-all duration-200 border border-orange-100/50"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-sm text-lg">
                        🚌
                      </div>
                      <h3 className="font-semibold text-gray-900 text-xs">Rent Bus</h3>
                    </Link>
                    <Link
                      href="/customer/bus-quotes"
                      className="group bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-3 hover:shadow-md transition-all duration-200 border border-teal-100/50"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-sm text-lg">
                        📋
                      </div>
                      <h3 className="font-semibold text-gray-900 text-xs">Bus Quotes</h3>
                    </Link>
                  </div>
                </div>

                {/* Expense Summary Card */}
                <Link
                  href="/customer/financials"
                  className="block bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-5 w-5" />
                      <span className="font-semibold text-sm">Expense Summary</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(financials.totalExpense)}</p>
                  <p className="text-emerald-100 text-xs mt-1">Total expenses recorded</p>
                </Link>

                {/* Financials Link */}
                <Link
                  href="/customer/financials"
                  className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-purple-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <BarChart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Financial Reports</p>
                      <p className="text-xs text-gray-500">View detailed expenses</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Edit Profile</h3>
                  <p className="text-purple-200 text-sm mt-1">Update your personal information</p>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {profileError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  Profile updated successfully!
                </div>
              )}

              <div className="flex flex-col gap-5 md:flex-row">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="h-28 w-28 rounded-2xl border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                      {profileForm.avatar ? (
                        <img
                          src={profileForm.avatar}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-400">
                          {profileForm.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
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
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:border-gray-400 transition"
                    >
                      Change Image
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Enter your phone"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm font-semibold text-gray-700">Account Details</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={profileForm.bank_name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, bank_name: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Enter your bank"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.account_number}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, account_number: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={profileForm.ifsc_code}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, ifsc_code: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Enter IFSC code"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={profileForm.upi_id}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, upi_id: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Enter UPI ID"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setShowCompanyModal(false); setCompanyDetails(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6" />
                  <div>
                    <h2 className="font-bold text-lg">Company Details</h2>
                    <p className="text-emerald-100 text-sm">B2B Corporate Account</p>
                  </div>
                </div>
                <button onClick={() => { setShowCompanyModal(false); setCompanyDetails(null); }} className="p-2 hover:bg-white/20 rounded-full transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {isLoadingCompany ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : (
                <>
                  {/* Company Name + Status */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                        {companyDetails?.b2bStatus || customer?.b2bStatus || 'Approved'}
                      </span>
                      {companyDetails?.b2bApprovedAt && (
                        <span className="text-[10px] text-emerald-500 ml-auto">
                          since {new Date(companyDetails.b2bApprovedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{companyDetails?.companyName || customer?.companyName || 'Company Name'}</h3>
                  </div>

                  {/* Company Details Section */}
                  <div className="bg-green-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Company Information</span>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg">
                      <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">GSTIN</p>
                        <p className="font-semibold text-gray-900 font-mono">{companyDetails?.gstin || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg">
                      <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Business Type</p>
                        <p className="font-semibold text-gray-900">{companyDetails?.businessType || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">Contact Person</span>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Full Name</p>
                        <p className="font-semibold text-gray-900">{customer?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="font-semibold text-gray-900">{customer?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Phone</p>
                        <p className="font-semibold text-gray-900">{customer?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Type */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">Account Type</p>
                    <p className="text-sm font-semibold text-blue-800">B2B Corporate — Post-Paid Billing</p>
                  </div>

                  <p className="text-xs text-gray-400 text-center">To update company details, contact support at <a href="mailto:book@transrentals.in" className="text-emerald-600 font-medium">book@transrentals.in</a></p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Logout</h3>
            <p className="text-sm text-slate-500 text-center mt-2">
              Are you sure you want to logout? You will need to login again to access your account.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-80 flex items-center justify-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Logging out...
                  </>
                ) : (
                  'Yes, Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Package,
  Wrench,
  Users,
  Coins,
  Zap,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import B2BDashboard from './B2BDashboard';
import TourDashboard from './TourDashboard';
import CustomerHeader from '@/components/customer/CustomerHeader';
import NotificationPanel from '@/components/customer/NotificationPanel';

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
  all_quotes_expired?: boolean;
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

  // BACKR rewards
  const [backrBalance, setBackrBalance] = useState<number | null>(null);

  const fetchBackrBalance = (customerId: string) => {
    fetch(`/api/backr?customer_id=${encodeURIComponent(customerId)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setBackrBalance(d.tokens.remaining_tokens ?? 0); })
      .catch(() => {});
  };

  const connectBackr = () => {
    if (!customer?.id) return;
    window.location.href = `/api/backr/connect?type=customer&uid=${encodeURIComponent(String(customer.id))}`;
  };

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
      if (parsed.id)    fetchBackrBalance(String(parsed.id));

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

    setFilteredBookings(filtered);
  }, [selectedService, selectedLocation, showExpiredQuotesOnly, bookings]);

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

  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <CustomerHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Main Content with top padding for fixed header */}
      <div className="pt-16">
        {/* Travel-Agent Self-Booking Banner — shown when this customer record
             is linked to a travel agent (i.e. the agent is using their own
             customer login to place bookings). Quick way back to the agent
             dashboard. */}
        {(customer as any)?.linkedTravelAgentId && (
          <div className="bg-gradient-to-r from-indigo-600 via-emerald-600 to-teal-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 flex-1">
                <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">You&apos;re signed in as a Travel Agent</p>
                  <p className="text-[11px] text-white/85 leading-relaxed">
                    <span className="font-semibold">Car Rental</span> supports full TA modes (Personal &amp; Company with manager review).
                    Other transport services book as standard customer.
                    Non-transport services (packers, equipment, group trips) are not available for company booking — they use standard flow.
                    All bookings auto-appear on your agent dashboard.
                  </p>
                </div>
              </div>
              <Link
                href="/travel-agent/bookings"
                className="inline-flex items-center gap-1.5 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
              >
                Open Agent Dashboard <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* B2B Approval Pending Banner */}
        {customer?.isB2B && customer?.b2bStatus !== 'APPROVED' && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
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
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {customer?.isB2B && customer?.b2bStatus === 'APPROVED' && (
                  <button
                    onClick={() => setDashboardView('b2b')}
                    className={`px-4 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
                      dashboardView === 'b2b'
                        ? 'border-[#09B368] text-[#09B368]'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4" /> B2B Dashboard
                  </button>
                )}
                <button
                  onClick={() => setDashboardView('personal')}
                  className={`px-4 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
                    dashboardView === 'personal'
                      ? 'border-[#09B368] text-[#09B368]'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <Car className="w-4 h-4" /> {customer?.isB2B ? 'Personal' : 'My Bookings'}
                </button>
                <button
                  onClick={() => setDashboardView('tour')}
                  className={`px-4 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
                    dashboardView === 'tour'
                      ? 'border-[#09B368] text-[#09B368]'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <Compass className="w-4 h-4" /> Tours
                </button>
              </div>
              {customer?.isB2B && customer?.b2bStatus === 'APPROVED' && (
                <button
                  onClick={() => setShowCompanyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#09B368] hover:bg-[#09B368]/10 border border-[#09B368]/30 transition"
                >
                  <Edit3 className="w-4 h-4" /> Manage Company
                </button>
              )}
            </div>
          </div>
        </div>

        {/* B2B Dashboard View */}
        {dashboardView === 'b2b' && customer?.isB2B ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <B2BDashboard
              customerId={String(customer.id)}
              customerName={customer.name}
              companyName={customer.companyName || null}
            />
          </div>
        ) : dashboardView === 'tour' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <TourDashboard customerId={String(customer?.id)} />
          </div>
        ) : (
        <>
        {/* ── HERO BANNER ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#022B1A] via-[#045030] to-[#09B368]">
          {/* grid overlay */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
          {/* glow blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#09B368]/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-[#056040]/40 blur-2xl" />

          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Left: greeting */}
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl border-2 border-white/30 bg-white/10 overflow-hidden backdrop-blur-sm shadow-lg">
                    {customer?.avatar || customer?.image ? (
                      <img src={customer.avatar || customer.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">{customer?.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#4ADE80] rounded-full border-2 border-[#022B1A]" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium">{getGreeting()}</p>
                  <h1 className="text-white font-bold text-xl leading-tight mt-0.5">{customer?.name || 'Customer'}</h1>
                  <p className="text-white/50 text-xs mt-0.5">Vehicle rental portal</p>
                </div>
              </div>

              {/* Right: 3 key stats */}
              <div className="flex items-center gap-3">
                {[
                  { label: 'Total Bookings', value: stats?.total ?? 0, icon: Calendar },
                  { label: 'Active', value: (stats?.open ?? 0) + (stats?.confirmed ?? 0) + (stats?.ongoing ?? 0), icon: Car },
                  { label: 'Total Spent', value: formatCurrency(financials.totalExpense), icon: IndianRupee, isText: true },
                ].map(({ label, value, icon: Icon, isText }) => (
                  <div key={label} className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 min-w-[90px]">
                    <Icon className="w-3.5 h-3.5 text-white/60 mx-auto mb-1" />
                    <p className="text-white font-bold text-lg leading-none">{isText ? value : value.toLocaleString()}</p>
                    <p className="text-white/50 text-[10px] mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* KPI stat cards — overlapping hero */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 -mt-0 pt-6">
            {tabConfig.map((stat) => {
              const Icon = stat.icon;
              const isActive = activeTab === stat.key;
              const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                All:       { bg: 'bg-violet-50',       text: 'text-violet-600',    border: 'border-violet-200' },
                Open:      { bg: 'bg-amber-50',         text: 'text-amber-600',     border: 'border-amber-200' },
                Confirmed: { bg: 'bg-[#09B368]/10',     text: 'text-[#09B368]',     border: 'border-[#09B368]/30' },
                Ongoing:   { bg: 'bg-blue-50',          text: 'text-blue-600',      border: 'border-blue-200' },
                Completed: { bg: 'bg-gray-100',         text: 'text-gray-600',      border: 'border-gray-200' },
                Dropped:   { bg: 'bg-red-50',           text: 'text-red-500',       border: 'border-red-200' },
              };
              const colors = colorMap[stat.key] || colorMap.All;
              return (
                <button
                  key={stat.key}
                  onClick={() => handleTabChange(stat.key)}
                  className={`bg-white border rounded-2xl p-4 text-left transition-all hover:shadow-md ${
                    isActive
                      ? `${colors.border} shadow-sm ring-2 ring-[#09B368]/10`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-9 h-9 ${isActive ? colors.bg : 'bg-gray-50'} rounded-xl flex items-center justify-center mb-3 transition-colors`}>
                    <Icon className={`h-4 w-4 ${isActive ? colors.text : 'text-gray-400'}`} />
                  </div>
                  <p className={`text-2xl font-bold leading-none ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{stat.count}</p>
                  <p className={`text-xs font-semibold mt-1.5 ${isActive ? colors.text : 'text-gray-400'}`}>{stat.label}</p>
                </button>
              );
            })}
          </div>

          {/* ── NOTIFICATIONS (mobile only) ── */}
          <div className="mt-6 lg:hidden">
            <NotificationPanel />
          </div>

          {/* ── TWO COLUMN: main + right sidebar ── */}
          <div className="mt-6 flex gap-6 items-start pb-10">

            {/* ── BOOKINGS TABLE (main, left) ── */}
            <div className="flex-1 min-w-0">

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm">My Bookings</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {filteredBookings.length} {activeTab === 'All' ? 'total' : activeTab.toLowerCase()} booking{filteredBookings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Service Filter */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowServiceFilter(prev => !prev); setShowLocationFilter(false); }}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-[#09B368]/50 transition text-xs font-medium text-gray-700 shadow-sm"
                      >
                        <Filter className="h-3.5 w-3.5 text-gray-400" />
                        {selectedService === 'all' ? 'All Services' : selectedService}
                        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showServiceFilter ? 'rotate-180' : ''}`} />
                      </button>
                      {showServiceFilter && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                          <div className="p-2 space-y-1">
                            <input type="text" value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Search services..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#09B368]/40 transition" />
                            <button onClick={() => { setSelectedService('all'); setShowServiceFilter(false); setServiceSearch(''); }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${selectedService === 'all' ? 'bg-[#09B368]/10 text-[#09B368] font-medium' : 'hover:bg-[#09B368]/5 text-gray-700'}`}>
                              All Services
                            </button>
                            <div className="max-h-48 overflow-y-auto space-y-0.5">
                              {filteredServiceOptions.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-gray-400">{serviceOptions.length === 0 ? 'No services yet' : 'No match'}</p>
                              ) : filteredServiceOptions.map(service => (
                                <button key={service} onClick={() => { setSelectedService(service); setShowServiceFilter(false); setServiceSearch(''); }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${selectedService === service ? 'bg-[#09B368]/10 text-[#09B368] font-medium' : 'hover:bg-[#09B368]/5 text-gray-700'}`}>
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
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-[#09B368]/50 transition text-xs font-medium text-gray-700 shadow-sm"
                      >
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {selectedLocation === 'all' ? 'All Cities' : selectedLocation}
                        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showLocationFilter ? 'rotate-180' : ''}`} />
                      </button>
                      {showLocationFilter && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                          <div className="p-2 space-y-1">
                            <input type="text" value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} placeholder="Search cities..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#09B368]/40 transition" />
                            <button onClick={() => { setSelectedLocation('all'); setLocationSearch(''); setShowLocationFilter(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${selectedLocation === 'all' ? 'bg-[#09B368]/10 text-[#09B368] font-medium' : 'hover:bg-[#09B368]/5 text-gray-700'}`}>
                              All Cities
                            </button>
                            <div className="max-h-48 overflow-y-auto space-y-0.5">
                              {filteredLocationOptions.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-gray-400">{locationOptions.length === 0 ? 'No locations yet' : 'No match'}</p>
                              ) : filteredLocationOptions.map(location => (
                                <button key={location} onClick={() => { setSelectedLocation(location); setShowLocationFilter(false); setLocationSearch(''); }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${selectedLocation === location ? 'bg-[#09B368]/10 text-[#09B368] font-medium' : 'hover:bg-[#09B368]/5 text-gray-700'}`}>
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
                      className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium transition shadow-sm ${showExpiredQuotesOnly ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'}`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Quotes Expired
                    </button>
                    <button onClick={handleRefresh} disabled={isRefreshing}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm">
                      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#09B368]' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Table */}
                {isLoadingBookings ? (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-[#09B368]" />
                    <p className="text-gray-400 text-sm">Loading bookings...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-[#09B368]/10 rounded-2xl flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-[#09B368]" />
                    </div>
                    <p className="font-semibold text-gray-700 text-sm">No {activeTab.toLowerCase()} bookings</p>
                    <p className="text-xs text-gray-400 max-w-xs text-center">
                      {activeTab === 'Open' ? 'Create a new booking to get started!' : `No ${activeTab.toLowerCase()} bookings yet.`}
                    </p>
                    <Link href="/" className="mt-1 inline-flex items-center gap-2 bg-[#09B368] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#078F53] transition text-xs">
                      <Sparkles className="h-3.5 w-3.5" /> Book Now
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Service</th>
                          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest hidden md:table-cell">Route</th>
                          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Date</th>
                          <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-5 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Amount</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBookings.map((booking) => {
                          const statusConfig = getStatusConfig(booking.status);
                          const serviceBadge = getServiceBadge(booking.service_type, booking.service_name);
                          const quoteCount = booking.quotations?.length || 0;
                          const lowestQuote = booking.quotations?.reduce((min, q) => {
                            const price = q.price || q.amount || 0;
                            return price < min ? price : min;
                          }, Infinity) ?? Infinity;
                          return (
                            <tr key={booking.id}
                              className="border-b border-gray-50 last:border-0 hover:bg-[#09B368]/[0.02] transition-colors cursor-pointer group"
                              onClick={() => window.open(getBookingUrl(booking), '_blank')}>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 ${serviceBadge.bg} border ${serviceBadge.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                    {(() => {
                                      const iconType = getServiceIcon(booking.service_name, booking.service_type);
                                      const cls = `h-4 w-4 ${serviceBadge.text}`;
                                      if (iconType === 'truck') return <Truck className={cls} />;
                                      if (iconType === 'luxury') return <Star className={cls} />;
                                      if (iconType === 'packers') return <Package className={cls} />;
                                      if (iconType === 'equipment') return <Wrench className={cls} />;
                                      if (iconType === 'bus') return <Users className={cls} />;
                                      return <Car className={cls} />;
                                    })()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-[#09B368] transition-colors">{booking.service_name}</p>
                                    {booking.booking_number && <p className="text-xs text-gray-400">#{booking.booking_number}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 hidden md:table-cell">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 text-gray-300 flex-shrink-0" />
                                  <span className="truncate max-w-[150px]">
                                    {booking.location_name}
                                    {booking.destination && booking.destination !== booking.location_name && (
                                      <span className="text-gray-300"> → {booking.destination}</span>
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 hidden lg:table-cell">
                                <p className="text-xs text-gray-700">{formatDate(booking.journey_datetime)}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(booking.journey_datetime)}</p>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                  {booking.status}
                                </span>
                                {booking.is_quote_request && (
                                  <p className="text-[9px] text-amber-600 font-medium mt-0.5">Awaiting quotes</p>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                                {quoteCount > 0 ? (
                                  <div>
                                    <p className="text-sm font-bold text-[#09B368]">
                                      ₹{lowestQuote !== Infinity ? lowestQuote.toLocaleString('en-IN') : '—'}
                                    </p>
                                    <p className="text-[10px] text-gray-400">{quoteCount} quote{quoteCount !== 1 ? 's' : ''}</p>
                                  </div>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#09B368] transition-colors" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {filteredBookings.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Page {currentPage} of {totalPages} · {paginatedBookings.length} of {filteredBookings.length}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${currentPage === 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-[#09B368]/30 text-[#09B368] hover:border-[#09B368]'}`}>
                        Previous
                      </button>
                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${currentPage === totalPages ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-[#09B368]/30 text-[#09B368] hover:border-[#09B368]'}`}>
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* App Download Banner */}
              <div className="mt-4 bg-gradient-to-r from-[#033D26] to-[#09B368] rounded-2xl p-5 flex items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 50%, #ffffff 0%, transparent 60%)'}} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-4 w-4 text-white/80" />
                    <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">Earn Rewards</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Download the TransRentals App</h3>
                  <p className="text-white/60 text-xs mt-0.5">Track bookings, chat with vendors & earn ₹50 tokens</p>
                </div>
                <a href="https://play.google.com/store/apps/details?id=com.transrentals.customer"
                  className="relative flex-shrink-0 flex items-center gap-2 bg-white text-[#09B368] hover:bg-white/90 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition shadow-lg">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  Google Play
                </a>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <aside className="hidden lg:flex flex-col gap-4 w-[280px] flex-shrink-0 sticky top-20">

              {/* Account Card */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-br from-[#056040] to-[#09B368] px-5 py-4 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-6 -left-2 w-16 h-16 bg-white/10 rounded-full" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border-2 border-white/40 bg-white/20 overflow-hidden flex-shrink-0">
                      {customer?.avatar || customer?.image ? (
                        <img src={customer.avatar || customer.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-xl">{customer?.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{customer?.name}</p>
                      <p className="text-white/70 text-xs truncate">{customer?.email}</p>
                      <p className="text-white/60 text-xs mt-0.5">{customer?.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <button onClick={() => setShowProfileModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                </div>
              </div>

              {/* BACKR Rewards Card */}
              <div className="relative overflow-hidden rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, #2d1b6b 0%, #4c2fb5 45%, #6547d4 100%)' }}>

                {/* Decorative rings */}
                <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute -bottom-10 -right-3 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute top-6 right-20 w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

                {/* Coin stack */}
                <div className="absolute top-4 right-5 flex flex-col items-center gap-[3px] select-none pointer-events-none">
                  {[0,1,2,3].map(i => (
                    <div key={i}
                      className="w-10 h-[9px] rounded-full shadow-md"
                      style={{
                        background: 'linear-gradient(180deg,#fde68a 0%,#f59e0b 100%)',
                        border: '1px solid rgba(251,191,36,0.5)',
                        transform: `translateY(${i * -3}px) scaleX(${1 - i * 0.04})`,
                        opacity: 1 - i * 0.15,
                      }}
                    />
                  ))}
                  <Coins className="w-5 h-5 text-yellow-300 mt-1"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(253,224,71,0.6))' }} />
                </div>

                <div className="relative p-5">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <Zap className="w-4 h-4 text-yellow-300" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-violet-300">BACKR Ecosystem</p>
                      <p className="text-[15px] font-black text-white leading-tight">Rewards Program</p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-[10px] text-violet-300 mb-0.5">Your token balance</p>
                    <div className="flex items-end gap-1.5">
                      <p className="text-3xl font-black text-white leading-none">
                        {backrBalance !== null ? backrBalance.toLocaleString('en-IN') : '—'}
                      </p>
                      <p className="text-xs text-yellow-300 font-bold pb-0.5">tokens</p>
                    </div>
                  </div>

                  {/* Stats chips */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { icon: Coins,      label: 'Per booking', value: '+50 tokens', glow: '#fbbf24' },
                      { icon: TrendingUp, label: 'XP earned',   value: '+30 XP',     glow: '#a78bfa' },
                    ].map(({ icon: Icon, label, value, glow }) => (
                      <div key={label} className="rounded-xl p-2.5 flex items-center gap-2"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: glow }} />
                        <div>
                          <p className="text-[11px] font-bold text-white">{value}</p>
                          <p className="text-[9px] text-violet-300">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Connect button */}
                  <button
                    onClick={connectBackr}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#1c1003', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}
                  >
                    <ExternalLink className="w-4 h-4" /> Connect BACKR Wallet
                  </button>

                  <p className="text-[9px] text-violet-400 text-center mt-2.5">
                    Powered by backrcoin.org · Earn on every booking
                  </p>
                </div>
              </div>

              {/* Notifications */}
              <NotificationPanel />

              {/* Quick Book */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Book a Vehicle</p>
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { label: 'Bike', href: '/bike-on-rent', bg: 'bg-blue-50', clr: 'text-blue-600', IconEl: Car },
                    { label: 'Car', href: '/car-rental', bg: 'bg-[#09B368]/10', clr: 'text-[#09B368]', IconEl: Car },
                    { label: 'Bus', href: '/bus-rental', bg: 'bg-orange-50', clr: 'text-orange-600', IconEl: Users },
                    { label: 'Truck', href: '/', bg: 'bg-red-50', clr: 'text-red-500', IconEl: Truck },
                    { label: 'Luxury', href: '/luxury-car-rental', bg: 'bg-amber-50', clr: 'text-amber-600', IconEl: Star },
                    { label: 'Equip.', href: '/', bg: 'bg-cyan-50', clr: 'text-cyan-600', IconEl: Wrench },
                    { label: 'Packers', href: '/', bg: 'bg-teal-50', clr: 'text-teal-600', IconEl: Package },
                    { label: 'Drive', href: '/', bg: 'bg-sky-50', clr: 'text-sky-600', IconEl: Car },
                  ] as const).map(({ label, href, bg, clr, IconEl }) => (
                    <Link key={label} href={href}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                        <IconEl className={`w-3.5 h-3.5 ${clr}`} />
                      </div>
                      <span className="text-[9px] font-medium text-gray-500 text-center leading-tight">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Total Spent */}
              <Link href="/customer/financials"
                className="block bg-gradient-to-br from-[#09B368] to-[#056040] rounded-2xl p-4 text-white hover:opacity-95 transition group shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-white/90">Total Spent</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition" />
                </div>
                <p className="text-2xl font-bold leading-none">{formatCurrency(financials.totalExpense)}</p>
                <p className="text-white/60 text-[10px] mt-1.5">View full expense report →</p>
              </Link>

              {/* Messages */}
              <Link href="/customer/chat"
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3.5 hover:border-teal-400/40 hover:shadow-sm transition group shadow-sm">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 relative">
                  <MessageCircle className="w-4 h-4 text-teal-500" />
                  {totalUnreadChats > 0 && (
                    <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">{totalUnreadChats}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Messages</p>
                  <p className="text-xs text-gray-400">Chat with your vendors</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 ml-auto transition" />
              </Link>

              {/* Help */}
              <Link href="/customer/helpdesk"
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3.5 hover:border-[#09B368]/40 hover:shadow-sm transition group shadow-sm">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Help & Support</p>
                  <p className="text-xs text-gray-400">Raise a support ticket</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#09B368] ml-auto transition" />
              </Link>

              {/* My Contact Inquiries */}
              {contactInquiries.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Inquiries</p>
                    <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2 py-0.5 font-semibold">
                      {contactInquiries.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {contactInquiries.slice(0, 4).map((inq: any) => {
                      const statusMap: Record<string, { label: string; cls: string }> = {
                        NEW: { label: 'New', cls: 'bg-blue-50 text-blue-600' },
                        IN_PROGRESS: { label: 'In Progress', cls: 'bg-yellow-50 text-yellow-600' },
                        RESOLVED: { label: 'Resolved', cls: 'bg-green-50 text-green-600' },
                        CLOSED: { label: 'Closed', cls: 'bg-gray-50 text-gray-500' },
                      };
                      const s = statusMap[inq.status] || statusMap.NEW;
                      return (
                        <div key={inq.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-orange-50/50 transition">
                          <Inbox className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{inq.subject}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.cls}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/contact"
                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-orange-200 text-orange-500 text-[10px] font-semibold hover:bg-orange-50 transition">
                    <Mail className="w-3 h-3" /> New Inquiry
                  </Link>
                </div>
              )}

            </aside>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#09B368] p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Edit Profile</h3>
                  <p className="text-white/80 text-sm mt-1">Update your personal information</p>
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
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
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
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setProfileForm((prev) => ({ ...prev, phone: val }));
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm font-semibold text-gray-700">Address</p>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    <MapPin className="h-3.5 w-3.5 inline mr-1.5" />
                    Address
                  </label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition resize-none"
                    placeholder="House / Flat, Street, Landmark"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 6) setProfileForm((prev) => ({ ...prev, pincode: val }));
                      }}
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
                      placeholder="123456"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
                      placeholder="Enter UPI ID"
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(v => !v)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 hover:text-[#09B368] transition"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    {customer?.hasPassword ? 'Change Password' : 'Set Password'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {showPasswordSection && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition"
                          placeholder="Min. 8 characters"
                        />
                        <button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPasswords.new ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        </button>
                      </div>
                      {passwordForm.newPassword && (
                        <div className="mt-1.5 flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                              passwordForm.newPassword.length >= [8,10,12,14][i]
                                ? ['bg-red-400','bg-yellow-400','bg-blue-400','bg-[#09B368]'][i]
                                : 'bg-gray-200'
                            }`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                          className={`w-full px-4 py-3 pr-10 border rounded-xl text-sm focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368] transition ${
                            passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
                              ? 'border-red-300 bg-red-50'
                              : passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200'
                          }`}
                          placeholder="Re-enter new password"
                        />
                        <button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPasswords.confirm ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-4 flex gap-3 flex-shrink-0 border-t border-gray-100 bg-white">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex-1 px-6 py-3 bg-[#09B368] hover:bg-[#078F53] text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="bg-[#09B368] text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6" />
                  <div>
                    <h2 className="font-bold text-lg">Company Details</h2>
                    <p className="text-white/70 text-sm">B2B Corporate Account</p>
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
                  <Loader2 className="w-6 h-6 animate-spin text-[#09B368]" />
                </div>
              ) : (
                <>
                  {/* Company Name + Status */}
                  <div className="bg-[#09B368]/8 border border-[#09B368]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-[#09B368]" />
                      <span className="text-xs font-semibold text-[#09B368] uppercase tracking-wider">
                        {companyDetails?.b2bStatus || customer?.b2bStatus || 'Approved'}
                      </span>
                      {companyDetails?.b2bApprovedAt && (
                        <span className="text-[10px] text-[#09B368]/60 ml-auto">
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

                  <p className="text-xs text-gray-400 text-center">To update company details, contact support at <a href="mailto:book@transrentals.in" className="text-[#09B368] font-medium">book@transrentals.in</a></p>
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

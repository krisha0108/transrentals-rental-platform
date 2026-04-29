'use client';



import { ElementType, ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import CustomerHeader from '@/components/customer/CustomerHeader';

import {

  AlertCircle,

  Inbox,

  Loader2,

  MessageCircle,

  RefreshCw,

  X,

  MessageSquare,

  Headphones,

  Plus,

  Search,

  Filter,

  Eye,

  Pencil,

  Upload,

  FileImage,

  LifeBuoy,

  Phone,

  Clock,

  Paperclip,

  ImageIcon,

  ChevronRight,

  CheckCircle,

} from 'lucide-react';



const STORAGE_SITE =
  process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') ??
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : ''); // Use empty string as fallback

const STORAGE_BASE_URL = `${STORAGE_SITE}/storage`;



const formatDateTime = (value?: string | Date | null) => {

  if (!value) return 'Unknown';

  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {

    return 'Unknown';

  }

  return new Intl.DateTimeFormat('en-IN', {

    dateStyle: 'medium',

    timeStyle: 'short',

  }).format(date);

};



const normalizeStatusKey = (value?: string | null) => {

  if (!value) return 'unknown';

  return value.toString().toLowerCase().replace(/\s+/g, ' ').trim() || 'unknown';

};



const formatStatusLabel = (value?: string | null) => {

  const key = normalizeStatusKey(value);

  if (key === 'unknown') return 'Unspecified';
  if (key === 'closed') return 'Cancelled';

  return key

    .split(' ')

    .map((fragment) => fragment.charAt(0).toUpperCase() + fragment.slice(1))

    .join(' ');

};



const parseTicketImages = (value?: string | null) => {

  if (!value) return [];

  try {

    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {

      return parsed.filter((item) => typeof item === 'string');

    }

  } catch {

    // ignore invalid JSON and fall back to string parsing

  }

  const trimmed = value.trim();

  if (!trimmed) return [];

  if (trimmed.includes(',')) {

    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);

  }

  return [trimmed];

};



const buildStorageUrl = (relative: string) => {

  if (!relative) return '';

  if (/^https?:\/\//.test(relative)) {

    return relative;

  }

  // If path starts with uploads/ it's stored in public folder directly
  if (relative.startsWith('uploads/') || relative.startsWith('/uploads/')) {
    return `/${relative.replace(/^\/+/, '')}`;
  }

  return `${STORAGE_BASE_URL}/${relative.replace(/^\/+/, '')}`;

};



const getTicketImageUrls = (ticket: HelpdeskTicket) => parseTicketImages(ticket.image).map(buildStorageUrl);



const badgeStyles: Record<string, string> = {

  open: 'bg-emerald-50 text-emerald-700 border border-emerald-200',

  pending: 'bg-amber-50 text-amber-700 border border-amber-200',

  completed: 'bg-blue-50 text-blue-700 border border-blue-200',

  resolved: 'bg-blue-50 text-blue-700 border border-blue-200',

  closed: 'bg-red-50 text-red-600 border border-red-200',

  escalated: 'bg-rose-50 text-rose-600 border border-rose-200',

  ongoing: 'bg-amber-50 text-amber-700 border border-amber-200',

  inprogress: 'bg-amber-50 text-amber-700 border border-amber-200',

  unknown: 'bg-slate-50 text-slate-500 border border-slate-100',

};



interface HelpdeskTicket {

  id?: number;

  ticket_no?: string;

  heading?: string;

  problem?: string;

  status?: string;

  priority?: string;

  image?: string | null;

  booking_id?: number | string;

  resolution?: string | null;

  resolvedAt?: string | null;

  resolvedBy?: string | null;

  created_at?: string | null;

  updated_at?: string | null;

}



interface StatCard {

  label: string;

  value: number;

  helper?: string;

  icon: ElementType;

}



interface TicketRow {

  ticket: HelpdeskTicket;

  imageUrls: string[];

}



type TicketFormMode = 'create' | 'edit';



export default function CustomerHelpdeskPage() {

  const router = useRouter();

  const [customerId, setCustomerId] = useState<string | number | null>(null);
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [customerName, setCustomerName] = useState('');

  // Contact inquiries
  const [contactInquiries, setContactInquiries] = useState<any[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);

  const [statusFilter, setStatusFilter] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');

  const [bookingFilter, setBookingFilter] = useState('');

  const [attachmentsOnly, setAttachmentsOnly] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);



  const [formMode, setFormMode] = useState<TicketFormMode>('create');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [formTicketId, setFormTicketId] = useState<number | null>(null);

  const [subject, setSubject] = useState('');

  const [description, setDescription] = useState('');

  const [bookingId, setBookingId] = useState('');
  const [customerBookings, setCustomerBookings] = useState<Array<{ booking_number: string; service_type: string; status: string; from?: string; to?: string }>>([]);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);

  const [formAttachments, setFormAttachments] = useState<File[]>([]);

  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);

  const [fileInputKey, setFileInputKey] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);



  useEffect(() => {

    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

    const storedCustomer = localStorage.getItem('customer');

    if (!token || !storedCustomer) {

      router.push('/customer/login');

      return;

    }

    try {

      const parsed = JSON.parse(storedCustomer);

      // Support both numeric IDs (legacy) and CUID strings (Prisma)

      const id = parsed?.id ?? parsed?.customer_id ?? parsed?.customerId;

      if (id) {

        setCustomerId(id);

      }

      setCustomerName(parsed?.name || parsed?.full_name || parsed?.customer_name || '');
      setCustomerIdentifier(parsed?.phone || parsed?.email || '');
      const email = parsed?.email || '';
      setCustomerEmail(email);
      if (email) {
        setIsLoadingInquiries(true);
        fetch(`/api/customer/contact-inquiries?email=${encodeURIComponent(email)}`)
          .then(r => r.json())
          .then(d => setContactInquiries(d.inquiries || []))
          .catch(() => {})
          .finally(() => setIsLoadingInquiries(false));
      }

    } catch (err) {

      router.push('/customer/login');

    }

  }, [router]);



  const fetchTickets = useCallback(

    async (options?: { showLoader?: boolean }) => {

      if (!customerId) return;

      if (options?.showLoader ?? true) {

        setIsLoading(true);

      }

      setError(null);



      try {

        // Use local API route (Prisma/trans_cms database)

        const response = await fetch(`/api/customer/helpdesk/tickets?customer_id=${customerId}`, {

          headers: { 'Content-Type': 'application/json' },

        });

        const data = await response.json();

        const ticketList = Array.isArray(data?.tickets) ? data.tickets : [];

        setTickets(ticketList);

      } catch (err) {

        setError(err instanceof Error ? err.message : 'Unable to load helpdesk tickets right now.');

        setTickets([]);

      } finally {

        if (options?.showLoader ?? true) {

          setIsLoading(false);

        }

      }

    },

    [customerId]

  );



  useEffect(() => {

    if (!customerId) return;

    fetchTickets({ showLoader: true });

  }, [customerId, fetchTickets]);

  // Fetch customer bookings for dropdown
  useEffect(() => {
    if (!customerId || bookingsLoaded) return;
    const fetchBookings = async () => {
      try {
        const params = new URLSearchParams({ customer_id: String(customerId) });
        if (customerIdentifier) params.set('identifier', customerIdentifier);
        const res = await fetch(`/api/customer/bookings?${params.toString()}`);
        const data = await res.json();
        if (data.bookings) {
          setCustomerBookings(
            data.bookings
              .filter((b: any) => b.booking_number)
              .map((b: any) => ({
                booking_number: b.booking_number,
                service_type: b.service_type || b.type || '',
                status: b.status || '',
                from: b.location_name || b.pickup_city || '',
                to: b.destination || b.drop_city || '',
              }))
          );
        }
      } catch (err) {
        console.log('Could not fetch bookings for dropdown:', err);
      } finally {
        setBookingsLoaded(true);
      }
    };
    fetchBookings();
  }, [customerId, bookingsLoaded]);

  const statusFilters = useMemo(() => {

    const options = [{ key: 'all', label: 'All statuses' }];

    const seen = new Set<string>();

    tickets.forEach((ticket) => {

      const key = normalizeStatusKey(ticket.status);

      if (seen.has(key)) return;

      seen.add(key);

      options.push({

        key,

        label: ticket.status ? formatStatusLabel(ticket.status) : 'Unspecified',

      });

    });

    return options;

  }, [tickets]);



  const statusCounts = useMemo(() => {

    return tickets.reduce<Record<string, number>>((acc, ticket) => {

      const key = normalizeStatusKey(ticket.status);

      acc[key] = (acc[key] || 0) + 1;

      return acc;

    }, {});

  }, [tickets]);



  const statusBreakdown = useMemo(() => {

    const entries = Object.entries(statusCounts).filter(([key]) => key !== 'unknown');

    if (!entries.length && statusCounts.unknown) {

      entries.push(['unknown', statusCounts.unknown]);

    }

    entries.sort((a, b) => b[1] - a[1]);

    return entries.slice(0, 3);

  }, [statusCounts]);



  const statsCards = useMemo<StatCard[]>(() => {
    const statusMap = new Map(statusBreakdown);
    return [
      { label: 'Total', value: tickets.length, icon: Inbox },
      { label: 'Open', value: statusMap.get('open') || 0, icon: AlertCircle },
      { label: 'In Progress', value: statusMap.get('in progress') || statusMap.get('in_progress') || statusMap.get('inprogress') || 0, icon: Clock },
      { label: 'Resolved', value: statusMap.get('resolved') || 0, icon: CheckCircle },
    ];
  }, [tickets.length, statusBreakdown]);



  const toTimestamp = (value?: string | null) => {

    if (!value) return 0;

    const time = new Date(value).getTime();

    return Number.isFinite(time) ? time : 0;

  };



  const filteredSortedTickets = useMemo<TicketRow[]>(() => {

    const needle = searchTerm.trim().toLowerCase();

    const bookingNeedle = bookingFilter.trim().toLowerCase();



    const rows: TicketRow[] = tickets.map((ticket) => ({

      ticket,

      imageUrls: getTicketImageUrls(ticket),

    }));



    return rows

      .filter(({ ticket, imageUrls }) => {

        const statusMatches =

          statusFilter === 'all' || normalizeStatusKey(ticket.status) === statusFilter;

        const searchMatches =

          !needle ||

          `${ticket.heading ?? ''} ${ticket.problem ?? ''} ${ticket.ticket_no ?? ''}`

            .toLowerCase()

            .includes(needle);

        const bookingMatches =

          !bookingNeedle || `${ticket.booking_id ?? ''}`.toLowerCase().includes(bookingNeedle);

        const attachmentMatches = !attachmentsOnly || imageUrls.length > 0;

        return statusMatches && searchMatches && bookingMatches && attachmentMatches;

      })

      .sort((a, b) => {

        const aTime = toTimestamp(a.ticket.created_at ?? a.ticket.updated_at);

        const bTime = toTimestamp(b.ticket.created_at ?? b.ticket.updated_at);

        return bTime - aTime;

      });

  }, [attachmentsOnly, bookingFilter, searchTerm, statusFilter, tickets]);



  const handleRefresh = async () => {

    if (!customerId) return;

    setIsRefreshing(true);

    await fetchTickets({ showLoader: tickets.length === 0 });

    setIsRefreshing(false);

  };



  const clearFilters = () => {

    setStatusFilter('all');

    setSearchTerm('');

    setBookingFilter('');

    setAttachmentsOnly(false);

  };



  const resetFormFields = () => {

    setSubject('');

    setDescription('');

    setBookingId('');

    setFormAttachments([]);

    setExistingImagePaths([]);

    setFormTicketId(null);

    setFormMessage(null);

    setFileInputKey((prev) => prev + 1);

  };



  const openCreateModal = () => {

    resetFormFields();

    setFormMode('create');

    setIsFormModalOpen(true);

  };



  const openEditModal = (ticket: HelpdeskTicket) => {

    resetFormFields();

    setFormMode('edit');

    setFormTicketId(ticket.id ?? null);

    setSubject(ticket.heading ?? '');

    setDescription(ticket.problem ?? '');

    setBookingId(ticket.booking_id ? `${ticket.booking_id}` : '');

    setExistingImagePaths(parseTicketImages(ticket.image));

    setIsFormModalOpen(true);

  };



  const closeFormModal = () => {

    setIsFormModalOpen(false);

    setFormMessage(null);

  };



  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    setFormMessage(null);

    if (!subject.trim() || !description.trim()) {

      setFormMessage({ type: 'error', text: 'Add both a subject and a description before sending.' });

      return;

    }

    if (!customerId) {

      setFormMessage({ type: 'error', text: 'Unable to identify your account.' });

      return;

    }

    setIsSubmitting(true);

    const formData = new FormData();

    formData.append('customer_id', customerId.toString());

    formData.append('heading', subject.trim());

    formData.append('problem', description.trim());

    if (bookingId.trim()) {

      formData.append('booking_id', bookingId.trim());

    }

    formAttachments.forEach((file) => formData.append('images[]', file));

    existingImagePaths.forEach((path) => formData.append('keep_images[]', path));



    try {

      if (formMode === 'create') {

        // Use local API route (Prisma/trans_cms database)

        const response = await fetch('/api/customer/helpdesk/tickets', {

          method: 'POST',

          body: formData,

        });

        const data = await response.json();

        if (!data.success) throw new Error(data.message || 'Failed to create ticket');

        setFormMessage({ type: 'success', text: 'Ticket raised successfully!' });

      } else if (formTicketId) {

        // Use local API route for update

        const response = await fetch(`/api/customer/helpdesk/tickets/${formTicketId}`, {

          method: 'PUT',

          body: formData,

        });

        const data = await response.json();

        if (!data.success) throw new Error(data.message || 'Failed to update ticket');

        setFormMessage({ type: 'success', text: 'Ticket updated successfully!' });

      } else {

        setFormMessage({ type: 'error', text: 'Unable to identify the ticket to update.' });

        return;

      }

      await fetchTickets({ showLoader: false });

      setTimeout(() => {

        closeFormModal();

        resetFormFields();

      }, 1200);

    } catch (err) {

      const message = err instanceof Error ? err.message : 'Failed to submit ticket.';

      setFormMessage({ type: 'error', text: message });

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {

    const list = event.target.files;

    if (!list?.length) return;

    const files = Array.from(list);

    setFormAttachments((prev) => [...prev, ...files]);

    setFileInputKey((prev) => prev + 1);

  };



  const removeAttachment = (index: number) => {

    setFormAttachments((prev) => prev.filter((_, idx) => idx !== index));

  };



  const removeExistingImage = (path: string) => {

    setExistingImagePaths((prev) => prev.filter((item) => item !== path));

  };



  const handleEditFromDetails = (ticket: HelpdeskTicket) => {

    setSelectedTicket(null);

    openEditModal(ticket);

  };



  return (

      <div className="min-h-screen bg-gray-50">

        <CustomerHeader

          title="Helpdesk"

          showBackButton

          backHref="/customer/dashboard"

          onRefresh={handleRefresh}

          isRefreshing={isRefreshing}

        />



        <main className="pb-10 pt-20 mt-4 bg-gray-50 min-h-screen">

          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">

            {/* Stats Cards Row */}
            <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {statsCards.map((card, index) => {
                const colorSets = [
                  { border: 'border-l-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                  { border: 'border-l-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
                  { border: 'border-l-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
                  { border: 'border-l-violet-500', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
                ];
                const colors = colorSets[index % colorSets.length];
                return (
                  <div
                    key={`${card.label}-${index}`}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg} flex-shrink-0`}>
                        <card.icon className={`h-5 w-5 ${colors.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                        <p className="text-xs font-medium text-gray-500">{card.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>



            <div className="flex gap-6 items-start">

              <section className="flex-1 min-w-0 space-y-4">

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Tickets Header */}
                  <div className="px-6 py-5 border-b border-gray-100">

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                      <div>

                        <h2 className="text-lg font-bold text-slate-900">Support Requests</h2>

                        <p className="text-sm text-gray-500 mt-0.5">

                          Showing {filteredSortedTickets.length} of {tickets.length} total tickets

                        </p>

                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button

                          type="button"

                          onClick={handleRefresh}

                          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:border-gray-300"

                        >

                          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />

                          Refresh

                        </button>

                      </div>

                    </div>

                    {/* Status Filter Pills */}
                    <div className="mt-4 flex flex-wrap gap-2">

                      {statusFilters.map((filter) => (

                        <button

                          key={filter.key}

                          type="button"

                          onClick={() => setStatusFilter(filter.key)}

                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${

                            statusFilter === filter.key

                              ? 'bg-emerald-600 text-white shadow-sm'

                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'

                          }`}

                        >

                          {filter.label}

                        </button>

                      ))}

                    </div>

                    {/* Filters Row */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                      <div className="relative">

                        <label className="sr-only" htmlFor="ticket-search">

                          Search tickets

                        </label>

                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                        <input

                          id="ticket-search"

                          value={searchTerm}

                          onChange={(event) => setSearchTerm(event.target.value)}

                          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"

                          placeholder="Search tickets..."

                        />

                      </div>

                      <div className="relative">

                        <label className="sr-only" htmlFor="booking-filter">

                          Booking filter

                        </label>

                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                        <input

                          id="booking-filter"

                          value={bookingFilter}

                          onChange={(event) => setBookingFilter(event.target.value)}

                          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"

                          placeholder="Booking ID..."

                        />

                      </div>

                      <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition">

                        <input

                          type="checkbox"

                          checked={attachmentsOnly}

                          onChange={(event) => setAttachmentsOnly(event.target.checked)}

                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"

                        />

                        <Paperclip className="h-3.5 w-3.5 text-gray-400" />

                        Attachments only

                      </label>

                      <button

                        type="button"

                        onClick={clearFilters}

                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"

                      >

                        Clear filters

                      </button>

                    </div>

                  </div>



                  <div className="p-4 md:p-6">

                    {error && (

                      <div className="mb-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">

                        <AlertCircle className="h-4 w-4 flex-shrink-0" />

                        {error}

                      </div>

                    )}



                    {isLoading ? (

                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">

                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />

                        <p className="text-sm font-medium text-gray-500">Loading your tickets...</p>

                      </div>

                    ) : filteredSortedTickets.length === 0 ? (

                      <div className="flex flex-col items-center justify-center py-16 text-center">

                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">

                          <Inbox className="h-8 w-8 text-gray-400" />

                        </div>

                        <h3 className="text-base font-semibold text-gray-700">No tickets found</h3>

                        <p className="mt-1 text-sm text-gray-400 max-w-sm">

                          {tickets.length === 0 ? 'You haven\'t raised any support tickets yet. Click the button above to get started.' : 'No tickets match your current filters. Try adjusting your search.'}

                        </p>

                        {tickets.length === 0 && (
                          <button
                            type="button"
                            onClick={openCreateModal}
                            className="mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                          >
                            <Plus className="h-4 w-4" />
                            Raise Your First Ticket
                          </button>
                        )}

                      </div>

                    ) : (

                      <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">

                          <table className="min-w-full">

                            <thead>

                              <tr className="border-b border-gray-100">

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/80 rounded-tl-xl">

                                  Ticket

                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/80">

                                  Booking

                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/80">

                                  Status

                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/80">

                                  Attachments

                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/80">

                                  Created

                                </th>

                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/80 rounded-tr-xl">

                                  Actions

                                </th>

                              </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-50">

                              {filteredSortedTickets.map(({ ticket, imageUrls }) => {

                                const rowKey =

                                  ticket.id ?? ticket.ticket_no ?? `${ticket.heading}-${ticket.created_at ?? ''}`;

                                const badgeClass =

                                  badgeStyles[normalizeStatusKey(ticket.status)] ?? badgeStyles.unknown;

                                const createdAt = formatDateTime(ticket.created_at);

                                return (

                                  <tr key={rowKey} className="group transition hover:bg-emerald-50/40">

                                    <td className="px-4 py-4">

                                      <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition">

                                        {ticket.heading || 'Untitled ticket'}

                                      </p>

                                      <p className="text-xs text-gray-400 mt-0.5">

                                        #{ticket.ticket_no ?? ticket.id ?? 'TBD'}

                                      </p>

                                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">

                                        {ticket.problem || 'No description provided.'}

                                      </p>

                                    </td>

                                    <td className="px-4 py-4">

                                      {ticket.booking_id ? (
                                        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                          #{ticket.booking_id}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-300">&mdash;</span>
                                      )}

                                    </td>

                                    <td className="px-4 py-4">

                                      <span

                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${badgeClass}`}

                                      >

                                        {formatStatusLabel(ticket.status)}

                                      </span>

                                    </td>

                                    <td className="px-4 py-4">

                                      {imageUrls.length ? (

                                        <div className="flex -space-x-2">

                                          {imageUrls.slice(0, 3).map((image, index) => (

                                            <img

                                              key={`${rowKey}-${index}`}

                                              src={image}

                                              alt={`Attachment ${index + 1}`}

                                              className="h-9 w-9 rounded-lg border-2 border-white object-cover shadow-sm"

                                              loading="lazy"

                                            />

                                          ))}

                                          {imageUrls.length > 3 && (
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-gray-100 text-xs font-semibold text-gray-500 shadow-sm">
                                              +{imageUrls.length - 3}
                                            </span>
                                          )}

                                        </div>

                                      ) : (

                                        <span className="text-xs text-gray-300">&mdash;</span>

                                      )}

                                    </td>

                                    <td className="px-4 py-4">
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        {createdAt}
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button

                                          type="button"

                                          onClick={() => setSelectedTicket(ticket)}

                                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-emerald-100 hover:text-emerald-600"

                                          title="View details"

                                        >

                                          <Eye className="h-4 w-4" />

                                        </button>

                                        <button

                                          type="button"

                                          onClick={() => openEditModal(ticket)}

                                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-100 hover:text-blue-600"

                                          title="Edit ticket"

                                        >

                                          <Pencil className="h-4 w-4" />

                                        </button>
                                      </div>

                                    </td>

                                  </tr>

                                );

                              })}

                            </tbody>

                          </table>

                        </div>

                        {/* Mobile Card Layout */}
                        <div className="md:hidden space-y-3">
                          {filteredSortedTickets.map(({ ticket, imageUrls }) => {
                            const rowKey =
                              ticket.id ?? ticket.ticket_no ?? `${ticket.heading}-${ticket.created_at ?? ''}`;
                            const badgeClass =
                              badgeStyles[normalizeStatusKey(ticket.status)] ?? badgeStyles.unknown;
                            const createdAt = formatDateTime(ticket.created_at);
                            return (
                              <div
                                key={rowKey}
                                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md active:bg-gray-50"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                      {ticket.heading || 'Untitled ticket'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      #{ticket.ticket_no ?? ticket.id ?? 'TBD'}
                                      {ticket.booking_id ? ` \u00B7 Booking #${ticket.booking_id}` : ''}
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold whitespace-nowrap ${badgeClass}`}
                                  >
                                    {formatStatusLabel(ticket.status)}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                                  {ticket.problem || 'No description provided.'}
                                </p>
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                      <Clock className="h-3 w-3" />
                                      {createdAt}
                                    </div>
                                    {imageUrls.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <ImageIcon className="h-3 w-3" />
                                        {imageUrls.length}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTicket(ticket)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-emerald-100 hover:text-emerald-600"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(ticket)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-100 hover:text-blue-600"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>

                    )}

                  </div>

                </div>

              {/* Contact Inquiries Section */}
            <div className="mt-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Contact Form Inquiries</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Messages you sent via the contact form</p>
                  </div>
                  <a href="/contact"
                    className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 transition shadow-sm">
                    <Plus className="h-4 w-4" /> New Inquiry
                  </a>
                </div>

                <div className="p-4 md:p-6">
                  {isLoadingInquiries ? (
                    <div className="flex items-center justify-center gap-3 py-10 text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                      <p className="text-sm">Loading inquiries...</p>
                    </div>
                  ) : contactInquiries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 mb-3">
                        <MessageCircle className="h-7 w-7 text-orange-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700">No inquiries yet</h3>
                      <p className="mt-1 text-xs text-gray-400 max-w-xs">
                        Use the contact form to send us a message. Your submissions will appear here.
                      </p>
                      <a href="/contact"
                        className="mt-4 flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition">
                        <Plus className="h-3.5 w-3.5" /> Send an Inquiry
                      </a>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-100">
                              {['Ref', 'Subject', 'Message', 'Status', 'Date', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/80">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {contactInquiries.map((inq: any) => {
                              const statusMap: Record<string, { label: string; cls: string }> = {
                                NEW: { label: 'New', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                                IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                                RESOLVED: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                CLOSED: { label: 'Closed', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
                              };
                              const s = statusMap[inq.status] || statusMap.NEW;
                              return (
                                <tr key={inq.id} className="group hover:bg-orange-50/30 transition">
                                  <td className="px-4 py-4">
                                    <span className="text-xs font-mono font-semibold text-gray-400">
                                      INQ-{inq.id.slice(-6).toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 max-w-[180px]">
                                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-orange-700 transition">{inq.subject}</p>
                                  </td>
                                  <td className="px-4 py-4 max-w-[240px]">
                                    <p className="text-xs text-gray-500 line-clamp-2">{inq.message}</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold ${s.cls}`}>
                                      {s.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                      <Clock className="h-3.5 w-3.5" />
                                      {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(inq.createdAt))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedInquiry(inq)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-orange-100 hover:text-orange-600 transition"
                                      title="View details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="md:hidden space-y-3">
                        {contactInquiries.map((inq: any) => {
                          const statusMap: Record<string, { label: string; cls: string }> = {
                            NEW: { label: 'New', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                            IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                            RESOLVED: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                            CLOSED: { label: 'Closed', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
                          };
                          const s = statusMap[inq.status] || statusMap.NEW;
                          return (
                            <div key={inq.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{inq.subject}</p>
                                  <p className="text-xs text-gray-400 mt-0.5 font-mono">INQ-{inq.id.slice(-6).toUpperCase()}</p>
                                </div>
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold whitespace-nowrap ${s.cls}`}>
                                  {s.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{inq.message}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(inq.createdAt))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedInquiry(inq)}
                                  className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

              </section>

              {/* Right Sidebar */}
              <aside className="hidden lg:flex flex-col gap-4 w-[280px] flex-shrink-0 sticky top-20">

                {/* Raise a Ticket */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-br from-[#056040] to-[#09B368] px-5 py-4 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-6 -left-2 w-16 h-16 bg-white/10 rounded-full" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Headphones className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Need Help?</p>
                        <p className="text-white/70 text-xs">We respond in 2 hrs</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:from-emerald-700 hover:to-teal-600"
                    >
                      <Plus className="h-4 w-4" />
                      Raise a Ticket
                    </button>
                  </div>
                </div>

                {/* Call Support */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Call Support</p>
                      <p className="text-xs text-gray-400">Mon-Sat, 10am-8pm</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">+91-9737965551</p>
                  <p className="text-xs text-gray-500 mt-1">Keep your ticket number ready for faster resolution.</p>
                </div>

                {/* Response Time */}
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Avg. Response</p>
                    <p className="text-xs text-gray-400">Within 2 business hours</p>
                  </div>
                </div>

                {/* Back to Dashboard */}
                <a href="/customer/dashboard"
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3.5 hover:border-emerald-300 hover:shadow-sm transition group shadow-sm">
                  <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Dashboard</p>
                    <p className="text-xs text-gray-400">Back to overview</p>
                  </div>
                </a>

              </aside>

            </div>

          </div>

        </main>



        {/* Create/Edit Ticket Modal */}
        {isFormModalOpen && (

          <div

            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"

            aria-modal="true"

            role="dialog"

            onClick={closeFormModal}

          >

            <div

              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"

              onClick={(event) => event.stopPropagation()}

            >

              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">

                    {formMode === 'create' ? 'Create ticket' : 'Edit ticket'}

                  </p>

                  <h3 className="text-xl font-bold text-slate-900">

                    {formMode === 'create' ? 'Describe your issue' : 'Update the ticket'}

                  </h3>

                </div>

                <button

                  type="button"

                  onClick={closeFormModal}

                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"

                  aria-label="Close form"

                >

                  <X className="h-4 w-4" />

                </button>

              </div>

              <div className="px-6 py-5">

                {formMessage && (

                  <div

                    className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${

                      formMessage.type === 'success'

                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'

                        : 'border-rose-200 bg-rose-50 text-rose-700'

                    }`}

                  >

                    {formMessage.type === 'success' ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 flex-shrink-0">
                        <span className="text-xs text-emerald-700">&#10003;</span>
                      </div>
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}

                    {formMessage.text}

                  </div>

                )}



                <form className="space-y-5" onSubmit={handleFormSubmit}>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="form-subject">
                      Subject
                    </label>

                    <input

                      id="form-subject"

                      value={subject}

                      onChange={(event) => setSubject(event.target.value)}

                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"

                      placeholder="e.g. Booking confirmation issue"

                    />
                  </div>



                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="form-description">
                      Description
                    </label>

                    <textarea

                      id="form-description"

                      value={description}

                      onChange={(event) => setDescription(event.target.value)}

                      rows={4}

                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"

                      placeholder="Explain what happened and reference your booking if possible."

                    />
                  </div>



                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="form-booking-id">
                      Related Booking <span className="text-gray-400 font-normal">(optional)</span>
                    </label>

                    <select
                      id="form-booking-id"
                      value={bookingId}
                      onChange={(event) => setBookingId(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                    >
                      <option value="">None — General inquiry</option>
                      {customerBookings.map((b) => {
                        const route = b.from && b.to ? `${b.from} → ${b.to}` : b.from || '';
                        return (
                          <option key={b.booking_number} value={b.booking_number}>
                            #{b.booking_number}{route ? ` · ${route}` : ''} — {b.service_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </option>
                        );
                      })}
                    </select>
                    {customerBookings.length === 0 && bookingsLoaded && (
                      <p className="text-xs text-gray-400 mt-1">No bookings found. You can still raise a general ticket.</p>
                    )}
                  </div>



                  {/* File Upload Drop Zone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Attachments <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-8 cursor-pointer transition hover:border-emerald-400 hover:bg-emerald-50/30">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                        <Upload className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Click to upload images</p>
                        <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP up to 10MB each</p>
                      </div>

                      <input

                        key={fileInputKey}

                        type="file"

                        multiple

                        accept="image/*"

                        onChange={handleAttachmentChange}

                        className="hidden"

                      />

                    </label>
                  </div>



                  {existingImagePaths.length > 0 && (

                    <div>

                      <p className="text-sm font-medium text-gray-700 mb-2">

                        Existing attachments

                      </p>

                      <div className="grid grid-cols-4 gap-3">

                        {existingImagePaths.map((path) => (

                          <div key={path} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">

                            <img src={buildStorageUrl(path)} alt="Existing attachment" className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />

                            <button

                              type="button"

                              onClick={() => removeExistingImage(path)}

                              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"

                            >

                              <X className="h-3 w-3" />

                            </button>

                          </div>

                        ))}

                      </div>

                    </div>

                  )}



                  {formAttachments.length > 0 && (

                    <div>

                      <p className="text-sm font-medium text-gray-700 mb-2">Ready to upload</p>

                      <div className="flex flex-wrap gap-2">

                        {formAttachments.map((file, index) => (

                          <span

                            key={`${file.name}-${index}`}

                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600"

                          >

                            <FileImage className="h-3.5 w-3.5 text-gray-400" />

                            {file.name}

                            <button

                              type="button"

                              className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-rose-100 hover:text-rose-600 transition"

                              onClick={() => removeAttachment(index)}

                            >

                              <X className="h-2.5 w-2.5" />

                            </button>

                          </span>

                        ))}

                      </div>

                    </div>

                  )}



                  <div className="flex gap-3 pt-2">

                    <button

                      type="button"

                      onClick={closeFormModal}

                      className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:border-gray-300"

                    >

                      Cancel

                    </button>

                    <button

                      type="submit"

                      disabled={isSubmitting}

                      className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:from-emerald-700 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed"

                    >

                      {isSubmitting ? (

                        <>

                          <Loader2 className="h-4 w-4 animate-spin" />

                          {formMode === 'create' ? 'Sending\u2026' : 'Updating\u2026'}

                        </>

                      ) : formMode === 'create' ? (

                        'Submit Ticket'

                      ) : (

                        'Update Ticket'

                      )}

                    </button>

                  </div>

                </form>

              </div>

            </div>

          </div>

        )}



        {selectedTicket && (

          <TicketDetailsModal

            ticket={selectedTicket}

            onClose={() => setSelectedTicket(null)}

            onEdit={handleEditFromDetails}

          />

        )}

        {/* Inquiry Detail Modal */}
        {selectedInquiry && (
          <InquiryDetailModal
            inquiry={selectedInquiry}
            onClose={() => setSelectedInquiry(null)}
          />
        )}

      </div>

    );

}



function TicketDetailsModal({

  ticket,

  onClose,

  onEdit,

}: {

  ticket: HelpdeskTicket;

  onClose: () => void;

  onEdit?: (ticket: HelpdeskTicket) => void;

}) {

  const imageUrls = getTicketImageUrls(ticket);

  const badgeClass = badgeStyles[normalizeStatusKey(ticket.status)] ?? badgeStyles.unknown;

  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"

      aria-modal="true"

      role="dialog"

    >

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900">#{ticket.id ?? 'Unknown'}</h3>
                {ticket.ticket_no && (
                  <span className="text-xs text-gray-400 font-medium">#{ticket.ticket_no}</span>
                )}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${badgeClass}`}
                >
                  {formatStatusLabel(ticket.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500">{ticket.heading || 'Untitled'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(ticket)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 hover:border-gray-300"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
              onClick={onClose}
              aria-label="Close ticket details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Ticket Info Grid */}
          <div className="grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Subject</p>

              <p className="text-sm font-semibold text-slate-900">{ticket.heading || 'Untitled'}</p>

            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Created</p>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-sm text-gray-700">{formatDateTime(ticket.created_at)}</p>
              </div>
            </div>

            {ticket.booking_id && (

              <div className="rounded-xl bg-gray-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Booking ID</p>

                <p className="text-sm font-medium text-gray-700">#{ticket.booking_id}</p>

              </div>

            )}

          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Description</p>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{ticket.problem || 'No description provided.'}</p>
            </div>
          </div>

          {/* Admin Response / Resolution */}
          {ticket.resolution && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Admin Response</p>
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-200">
                    <MessageSquare className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900">Response from Support Team</p>
                    <p className="mt-1.5 text-sm text-emerald-800 whitespace-pre-line leading-relaxed">{ticket.resolution}</p>
                    {ticket.resolvedAt && (
                      <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(ticket.resolvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Attachments</p>

            {imageUrls.length > 0 ? (

              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">

                {imageUrls.map((image, index) => (

                  <a

                    key={`${ticket.id}-${index}`}

                    href={image}

                    target="_blank"

                    rel="noreferrer"

                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-50"

                  >

                    <img

                      src={image}

                      alt={`Attachment ${index + 1}`}

                      className="h-full w-full object-cover transition duration-300 group-hover:scale-110"

                      loading="lazy"

                    />

                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition duration-300">
                      <span className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition duration-300 shadow-lg">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </span>
                    </span>

                    <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">

                      {index + 1}/{imageUrls.length}

                    </span>

                  </a>

                ))}

              </div>

            ) : (

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-400">
                <ImageIcon className="h-5 w-5" />
                No attachments were uploaded.
              </div>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}

function InquiryDetailModal({ inquiry, onClose }: { inquiry: any; onClose: () => void }) {
  const statusMap: Record<string, { label: string; cls: string }> = {
    NEW: { label: 'New', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    RESOLVED: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CLOSED: { label: 'Closed', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  };
  const s = statusMap[inquiry.status] || statusMap.NEW;
  const ref = `INQ-${inquiry.id.slice(-6).toUpperCase()}`;
  const fmt = (v: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(v));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <MessageCircle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900">{ref}</h3>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold ${s.cls}`}>
                  {s.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">{inquiry.subject}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Meta */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Subject</p>
              <p className="text-sm font-semibold text-slate-900">{inquiry.subject}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Submitted On</p>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-sm text-gray-700">{fmt(inquiry.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Your Message</p>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{inquiry.message}</p>
            </div>
          </div>

          {/* Admin Response */}
          {inquiry.resolution ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Response from Team</p>
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-200">
                    <MessageSquare className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900">TransRentals Support Team</p>
                    <p className="mt-1.5 text-sm text-emerald-800 whitespace-pre-line leading-relaxed">{inquiry.resolution}</p>
                    {inquiry.resolvedAt && (
                      <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {fmt(inquiry.resolvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
              <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Awaiting Response</p>
              <p className="text-xs text-gray-400 mt-1">Our team will respond within 2 business hours.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';



import { ElementType, ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';

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

    hour12: true,

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




/** Presentational only — the tint each state wears in the redesigned list.
 *  Keyed by the normalised status from normalizeStatusKey(). */
const caseTone: Record<string, { text: string; chip: string; dot: string; fill: number }> = {
  open: { text: 'text-[#056B3E]', chip: 'border-[#C6E7D8] bg-[#EAF8F1] text-[#056B3E]', dot: 'bg-[#09B368]', fill: 25 },
  pending: { text: 'text-[#B4700F]', chip: 'border-[#F0E3C4] bg-[#FEF8EA] text-[#B4700F]', dot: 'bg-[#B4700F]', fill: 45 },
  ongoing: { text: 'text-[#B4700F]', chip: 'border-[#F0E3C4] bg-[#FEF8EA] text-[#B4700F]', dot: 'bg-[#B4700F]', fill: 60 },
  inprogress: { text: 'text-[#B4700F]', chip: 'border-[#F0E3C4] bg-[#FEF8EA] text-[#B4700F]', dot: 'bg-[#B4700F]', fill: 60 },
  'in progress': { text: 'text-[#B4700F]', chip: 'border-[#F0E3C4] bg-[#FEF8EA] text-[#B4700F]', dot: 'bg-[#B4700F]', fill: 60 },
  resolved: { text: 'text-[#0B7C74]', chip: 'border-[#BFE7E2] bg-[#F0FDFA] text-[#0B7C74]', dot: 'bg-[#0B7C74]', fill: 100 },
  completed: { text: 'text-[#0B7C74]', chip: 'border-[#BFE7E2] bg-[#F0FDFA] text-[#0B7C74]', dot: 'bg-[#0B7C74]', fill: 100 },
  closed: { text: 'text-[#B3253A]', chip: 'border-[#F3D3D9] bg-[#FDF4F5] text-[#B3253A]', dot: 'bg-[#B3253A]', fill: 100 },
  escalated: { text: 'text-[#B3253A]', chip: 'border-[#F3D3D9] bg-[#FDF4F5] text-[#B3253A]', dot: 'bg-[#B3253A]', fill: 80 },
  unknown: { text: 'text-[#78857C]', chip: 'border-[#D4DFD8] bg-[#F4F8F5] text-[#46524A]', dot: 'bg-[#A6B1AA]', fill: 12 },
};

/** Same idea for the contact-form inquiry states. */
const inquiryTone: Record<string, { label: string; chip: string; dot: string }> = {
  NEW: { label: 'New', chip: 'border-[#C3D6F5] bg-[#E7EFFD] text-[#1D4ED8]', dot: 'bg-[#1D4ED8]' },
  IN_PROGRESS: { label: 'In Progress', chip: 'border-[#F0E3C4] bg-[#FEF8EA] text-[#B4700F]', dot: 'bg-[#B4700F]' },
  RESOLVED: { label: 'Resolved', chip: 'border-[#BFE7E2] bg-[#F0FDFA] text-[#0B7C74]', dot: 'bg-[#0B7C74]' },
  CLOSED: { label: 'Closed', chip: 'border-[#D4DFD8] bg-[#F4F8F5] text-[#46524A]', dot: 'bg-[#A6B1AA]' },
};


/** The line under each head figure. */
const statFootnotes: Record<string, string> = {
  Total: 'Requests raised',
  Open: 'Waiting on us',
  'In Progress': 'Being worked on',
  Resolved: 'Closed out',
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



  // Same gutter maths as the dashboard hero, so a full-bleed panel still starts
  // its content on the page's content column.
  const GUTTER = { paddingLeft: 'max(24px, calc((100vw - 1240px) / 2))' } as const;
  const GUTTER_R = { paddingRight: 'max(24px, calc((100vw - 1240px) / 2))' } as const;

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-white`}>
      <CustomerHeader
        title="Helpdesk"
        showBackButton
        backHref="/customer/dashboard"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Header is fixed at h-16; the extra padding is the breathing room between
          it and the hero, matching the financials page. */}
      <main className="pt-[88px] sm:pt-[96px]">

        {/* ══════════════ HEAD — the dashboard's hero, at this page's subject ══════════════ */}
        <div className="relative grid grid-cols-1 overflow-hidden bg-gradient-to-br from-[#022B1A] via-[#045030] to-[#09B368] text-white lg:grid-cols-[0.74fr_auto_1.26fr]">
          {/* drifting grid */}
          <div
            className="fin-grid pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* key light from the top right, and a soft floor shadow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(760px 340px at 88% -25%, rgba(255,255,255,.20), transparent 62%), radial-gradient(520px 260px at 8% 130%, rgba(1,35,20,.55), transparent 60%)',
            }}
          />
          {/* glow blobs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#09B368]/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[#056040]/40 blur-2xl" />
          {/* lit top edge */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* the tape along the bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-10 overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-5 border-t border-white/[0.18] bg-[#01230F]/55" />
            <div
              className="absolute inset-x-0 bottom-0 h-5"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 1px, transparent 1px 26px)' }}
            />
          </div>

          {/* ── left: who is at the desk ── */}
          <div className="relative z-10 flex items-center pb-8 pr-6 pt-11 lg:pb-[88px] lg:pr-[46px] lg:pt-[54px]" style={GUTTER}>
            <div className="fin-rise flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="pointer-events-none absolute -inset-3 rounded-full bg-[#4ADE80]/25 blur-xl" />
                <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,.6)] backdrop-blur-sm">
                  <Headphones className="h-7 w-7" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-[15px] w-[15px] rounded-full border-[3px] border-[#022B1A] bg-[#4ADE80]" />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/[0.55]">
                  <span className="h-px w-6 bg-white/30" />
                  Support desk
                </p>
                <h1 className="quote-serif mt-1.5 text-[36px] font-medium leading-[1] tracking-[-0.02em] [text-shadow:0_2px_20px_rgba(0,0,0,.28)] sm:text-[42px]">
                  Helpdesk
                </h1>
              </div>
            </div>
          </div>

          <div className="fin-perf relative z-10 hidden w-px lg:block" />

          {/* ── right: the figures, and how the requests split ── */}
          <div className="relative z-10 flex items-center pb-[74px] pl-6 pt-0 lg:pb-[88px] lg:pl-10 lg:pt-[54px]" style={GUTTER_R}>
            <div className="fin-rise grid w-full grid-cols-2 gap-3 sm:grid-cols-4" style={{ ['--d' as any]: '.12s' }}>
              {statsCards.map((card, index) => (
                <div
                  key={`${card.label}-${index}`}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.08] px-3 pb-3 pt-3 backdrop-blur-sm sm:px-4"
                >
                  {/* lit top edge, same trick as the panel itself */}
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                  <div className="flex items-center gap-2">
                    <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-lg border border-white/20 bg-white/[0.14]">
                      <card.icon className="h-3 w-3" />
                    </span>
                    <p className="min-w-0 text-[9px] uppercase leading-[1.4] tracking-[0.08em] text-white/[0.66] sm:tracking-[0.16em]">
                      {card.label}
                    </p>
                  </div>
                  <p className="quote-serif mt-2 text-[32px] font-medium leading-none tabular-nums [text-shadow:0_2px_14px_rgba(0,0,0,.25)]">
                    {card.value}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-tight text-white/[0.5]">{statFootnotes[card.label] ?? ''}</p>
                </div>
              ))}

            </div>
          </div>
        </div>

        {/* ══════════════ BODY ══════════════ */}
        <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-11 sm:px-8 lg:px-10">
          <div>

            {/* ── MAIN ── */}
            <div className="min-w-0">

              {/* ── support requests ── */}
              <section>
                {/* The desk's one real action, sitting on top of the card it fills. */}
                <div className="mb-3.5 flex sm:justify-end">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#056B3E] to-[#09B368] px-5 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(4,50,31,.9)] transition hover:-translate-y-0.5"
                  >
                    <Plus className="h-4 w-4" />
                    Raise a Ticket
                  </button>
                </div>
                {/* One instrument, the way the financials expense log is built: a
                    tinted head, then the filters, then the rows — all inside a
                    single card rather than three loose blocks. */}
                <div className="overflow-hidden rounded-2xl border border-[#C6E7D8] bg-white">
                  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-[#C6E7D8] bg-gradient-to-r from-[#EAF8F1] to-[#FAFEFC] px-5 py-4">
                    <div>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#056B3E]">Raised by you</p>
                      <h3 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none text-[#04321F]">Support requests</h3>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="flex-none rounded-full bg-[#056B3E] px-2.5 py-[2px] text-[10px] font-bold tabular-nums text-white">
                        {filteredSortedTickets.length} of {tickets.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-2 rounded-full border border-[#C6E7D8] bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-[#056B3E] transition hover:border-[#09B368] hover:bg-[#EAF8F1]"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* state, then search, then narrowing */}
                  <div className="bg-[#FAFCFB]">
                    <div className="flex flex-wrap gap-1.5 border-b border-[#E7EEE9] px-5 py-3.5">
                    {statusFilters.map((filter) => {
                      const tone = caseTone[filter.key] ?? caseTone.unknown;
                      const active = statusFilter === filter.key;
                      return (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setStatusFilter(filter.key)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition ${
                            active
                              ? 'border-[#04321F] bg-[#04321F] text-white'
                              : 'border-[#D4DFD8] bg-white text-[#46524A] hover:border-[#09B368] hover:text-[#056B3E]'
                          }`}
                        >
                          {filter.key !== 'all' && (
                            <span className={`h-[6px] w-[6px] flex-none rounded-full ${active ? 'bg-[#5FD9A8]' : tone.dot}`} />
                          )}
                          {filter.label}
                          {filter.key !== 'all' && statusCounts[filter.key] !== undefined && (
                            <span className="tabular-nums opacity-60">{statusCounts[filter.key]}</span>
                          )}
                          {filter.key === 'all' && <span className="tabular-nums opacity-60">{tickets.length}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 items-center gap-2.5 border-b border-[#E7EEE9] px-5 py-3.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto_auto]">
                    <div className="relative flex items-center">
                      <label className="sr-only" htmlFor="ticket-search">
                        Search tickets
                      </label>
                      <Search className="pointer-events-none absolute left-4 h-3.5 w-3.5 text-[#A6B1AA]" />
                      <input
                        id="ticket-search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-full border border-[#D4DFD8] bg-white py-2 pl-10 pr-4 text-[12.5px] text-[#0B1610] transition placeholder:text-[#A6B1AA] hover:border-[#09B368] focus:border-[#09B368] focus:outline-none focus:ring-[3px] focus:ring-[#09B368]/[0.13]"
                        placeholder="Search tickets..."
                      />
                    </div>

                    <div className="relative flex items-center">
                      <label className="sr-only" htmlFor="booking-filter">
                        Booking filter
                      </label>
                      <Filter className="pointer-events-none absolute left-4 h-3.5 w-3.5 text-[#A6B1AA]" />
                      <input
                        id="booking-filter"
                        value={bookingFilter}
                        onChange={(event) => setBookingFilter(event.target.value)}
                        className="w-full rounded-full border border-[#D4DFD8] bg-white py-2 pl-10 pr-4 text-[12.5px] text-[#0B1610] transition placeholder:text-[#A6B1AA] hover:border-[#09B368] focus:border-[#09B368] focus:outline-none focus:ring-[3px] focus:ring-[#09B368]/[0.13]"
                        placeholder="Booking ID..."
                      />
                    </div>

                    {/* Reads as one of the status chips above rather than a form
                        checkbox. The real input stays for keyboard and screen
                        readers; focus-within paints the ring on the pill. */}
                    <label
                      className={`inline-flex cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-[11.5px] font-semibold transition focus-within:ring-[3px] focus-within:ring-[#09B368]/[0.13] ${
                        attachmentsOnly
                          ? 'border-[#04321F] bg-[#04321F] text-white'
                          : 'border-[#D4DFD8] bg-white text-[#46524A] hover:border-[#09B368] hover:text-[#056B3E]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={attachmentsOnly}
                        onChange={(event) => setAttachmentsOnly(event.target.checked)}
                        className="sr-only"
                      />
                      <Paperclip className={`h-3.5 w-3.5 ${attachmentsOnly ? 'text-white' : 'text-[#A6B1AA]'}`} />
                      Attachments only
                    </label>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[11.5px] font-semibold text-[#78857C] transition hover:bg-[#FDF4F5] hover:text-[#B3253A]"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear filters
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mx-5 mt-4 flex items-center gap-2.5 rounded-xl border border-[#F3D3D9] bg-[#FDF4F5] px-4 py-3 text-[12.5px] text-[#8C1C2E]">
                    <AlertCircle className="h-4 w-4 flex-none" />
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div aria-label="Loading your tickets">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-4 border-b border-[#E7EEE9] px-5 py-5 last:border-b-0">
                        <span className="h-10 w-10 flex-none animate-pulse rounded-xl bg-[#EAF0EC]" />
                        <div className="min-w-0 flex-1">
                          <span className="block h-3.5 w-2/5 animate-pulse rounded bg-[#EAF0EC]" />
                          <span className="mt-2.5 block h-2.5 w-3/5 animate-pulse rounded bg-[#F1F5F2]" />
                        </div>
                        <span className="hidden h-4 w-28 flex-none animate-pulse rounded bg-[#F1F5F2] lg:block" />
                        <span className="hidden h-4 w-20 flex-none animate-pulse rounded bg-[#EAF0EC] lg:block" />
                      </div>
                    ))}
                  </div>
                ) : filteredSortedTickets.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-[74px] text-center">
                    <Inbox className="h-7 w-7 text-[#C6E7D8]" />
                    <p className="quote-serif text-[24px] font-medium text-[#0B1610]">No tickets found</p>
                    <p className="max-w-sm text-[12.5px] text-[#A6B1AA]">
                      {tickets.length === 0
                        ? 'You haven\'t raised any support tickets yet. Click the button above to get started.'
                        : 'No tickets match your current filters. Try adjusting your search.'}
                    </p>
                    {tickets.length === 0 && (
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#056B3E] to-[#09B368] px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_12px_24px_-14px_rgba(4,50,31,.9)] transition hover:-translate-y-0.5"
                      >
                        <Plus className="h-4 w-4" />
                        Raise Your First Ticket
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {filteredSortedTickets.map(({ ticket, imageUrls }) => {
                      const rowKey = ticket.id ?? ticket.ticket_no ?? `${ticket.heading}-${ticket.created_at ?? ''}`;
                      const tone = caseTone[normalizeStatusKey(ticket.status)] ?? caseTone.unknown;
                      const createdAt = formatDateTime(ticket.created_at);
                      return (
                        <div
                          key={rowKey}
                          className={`group relative grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 overflow-hidden border-b border-[#E7EEE9] px-5 py-4 transition last:border-b-0 hover:bg-[#F4F8F5] after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:rounded-full after:bg-current after:transition-transform after:duration-200 hover:after:scale-y-100 lg:grid-cols-[44px_minmax(0,1fr)_142px_126px_66px] lg:gap-x-[18px] lg:gap-y-0 ${tone.text}`}
                        >
                          <span className={`grid h-10 w-10 flex-none place-items-center rounded-[13px] border bg-white ${tone.chip}`}>
                            {imageUrls.length > 0 ? <FileImage className="h-[18px] w-[18px]" /> : <LifeBuoy className="h-[18px] w-[18px]" />}
                          </span>

                          <div className="min-w-0">
                            <p className="flex flex-wrap items-baseline gap-x-3">
                              <span className="quote-serif min-w-0 truncate text-[20px] font-semibold leading-[1.15] text-[#0B1610]">
                                {ticket.heading || 'Untitled ticket'}
                              </span>
                              <span className="text-[10px] tracking-[0.08em] text-[#A6B1AA]">
                                #{ticket.ticket_no ?? ticket.id ?? 'TBD'}
                              </span>
                            </p>
                            <p className="mt-0.5 truncate text-[12px] text-[#78857C]">
                              {ticket.problem || 'No description provided.'}
                            </p>

                            <p className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] text-[#A6B1AA]">
                              {imageUrls.length > 0 ? (
                                <span className="flex items-center">
                                  {imageUrls.slice(0, 3).map((image, index) => (
                                    <img
                                      key={`${rowKey}-${index}`}
                                      src={image}
                                      alt={`Attachment ${index + 1}`}
                                      className="-ml-[7px] h-[26px] w-[26px] rounded-lg border-2 border-white object-cover shadow-[0_1px_3px_rgba(4,50,31,.14)] first:ml-0"
                                      loading="lazy"
                                    />
                                  ))}
                                  {imageUrls.length > 3 && (
                                    <span className="-ml-[7px] grid h-[26px] w-[26px] place-items-center rounded-lg border-2 border-white bg-[#F4F8F5] text-[10px] font-bold text-[#78857C]">
                                      +{imageUrls.length - 3}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5">
                                  <Paperclip className="h-3 w-3 flex-none" /> No attachments
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5 tabular-nums">
                                <Clock className="h-3 w-3 flex-none" /> {createdAt}
                              </span>
                            </p>
                          </div>

                          {/* below lg these ride under the title instead of in columns */}
                          <div className="col-start-2 flex flex-wrap items-center gap-3 lg:hidden">
                            {ticket.booking_id && (
                              <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#E7EEE9] bg-[#F4F8F5] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[#46524A]">
                                #{ticket.booking_id}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-2 text-[12px] font-semibold">
                              <i className={`h-[7px] w-[7px] flex-none rounded-full ${tone.dot}`} />
                              {formatStatusLabel(ticket.status)}
                            </span>
                          </div>

                          <div className="hidden min-w-0 lg:block">
                            {ticket.booking_id ? (
                              <span className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-[#E7EEE9] bg-[#F4F8F5] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[#46524A]">
                                #{ticket.booking_id}
                              </span>
                            ) : (
                              <span className="text-[#D4DFD8]">&mdash;</span>
                            )}
                          </div>

                          <div className="hidden lg:block">
                            <p className="flex items-center gap-2 text-[12px] font-semibold">
                              <i className={`h-[7px] w-[7px] flex-none rounded-full ${tone.dot}`} />
                              {formatStatusLabel(ticket.status)}
                            </p>
                            <span className="mt-2.5 block h-[3px] w-full overflow-hidden rounded-full bg-[#E7EEE9]">
                              <em className={`block h-full rounded-full not-italic ${tone.dot} opacity-90`} style={{ width: `${tone.fill}%` }} />
                            </span>
                          </div>

                          <div className="col-start-2 flex gap-1 lg:col-start-auto lg:justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(ticket)}
                              className="grid h-[30px] w-[30px] place-items-center rounded-[9px] text-[#A6B1AA] transition hover:bg-[#EAF8F1] hover:text-[#056B3E]"
                              title="View details"
                            >
                              <Eye className="h-[15px] w-[15px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(ticket)}
                              className="grid h-[30px] w-[30px] place-items-center rounded-[9px] text-[#A6B1AA] transition hover:bg-[#E7EFFD] hover:text-[#1D4ED8]"
                              title="Edit ticket"
                            >
                              <Pencil className="h-[15px] w-[15px]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </section>

              {/* ── contact form inquiries ── */}
              <section className="mt-14">
                {/* Same instrument as the support requests card above — a tinted
                    head, then the rows — only in the inquiries' amber. */}
                <div className="overflow-hidden rounded-2xl border border-[#F0E3C4] bg-white">
                  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-[#F0E3C4] bg-gradient-to-r from-[#FEF8EA] to-[#FFFDF7] px-5 py-4">
                    <div>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#B4700F]">Sent from the contact form</p>
                      <h2 className="quote-serif mt-[3px] text-[23px] font-semibold leading-none text-[#B45309]">Inquiries</h2>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="flex-none rounded-full bg-[#B4700F] px-2.5 py-[2px] text-[10px] font-bold tabular-nums text-white">
                        {contactInquiries.length}
                      </span>
                      <a
                        href="/contact"
                        className="group inline-flex items-center gap-2 rounded-full border border-[#F0E3C4] bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-[#B4700F] transition hover:border-[#B45309] hover:bg-[#FEF8EA]"
                      >
                        <Plus className="h-3.5 w-3.5" /> New Inquiry
                      </a>
                    </div>
                  </div>

                {isLoadingInquiries ? (
                  <div aria-label="Loading inquiries">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex items-center gap-4 border-b border-[#E7EEE9] px-4 py-5 last:border-b-0">
                        <span className="h-10 w-10 flex-none animate-pulse rounded-xl bg-[#F6EEDC]" />
                        <div className="min-w-0 flex-1">
                          <span className="block h-3.5 w-1/3 animate-pulse rounded bg-[#F6EEDC]" />
                          <span className="mt-2.5 block h-2.5 w-3/5 animate-pulse rounded bg-[#FBF5E8]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : contactInquiries.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-[74px] text-center">
                    <MessageCircle className="h-7 w-7 text-[#EBD5A3]" />
                    <p className="quote-serif text-[24px] font-medium text-[#0B1610]">No inquiries yet</p>
                    <p className="max-w-xs text-[12.5px] text-[#A6B1AA]">
                      Use the contact form to send us a message. Your submissions will appear here.
                    </p>
                    <a
                      href="/contact"
                      className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D9930F] to-[#B4700F] px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(180,112,15,.85)] transition hover:-translate-y-0.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Send an Inquiry
                    </a>
                  </div>
                ) : (
                  <div>
                    {contactInquiries.map((inq: any) => {
                      const s = inquiryTone[inq.status] || inquiryTone.NEW;
                      return (
                        <div
                          key={inq.id}
                          className="group relative grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 overflow-hidden border-b border-[#E7EEE9] px-5 py-4 text-[#B4700F] transition last:border-b-0 hover:bg-[#FFFDF7] after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:rounded-full after:bg-current after:transition-transform after:duration-200 hover:after:scale-y-100 lg:grid-cols-[44px_minmax(0,1fr)_168px_150px_104px_40px] lg:gap-x-[18px] lg:gap-y-0"
                        >
                          <span className="grid h-10 w-10 flex-none place-items-center rounded-[13px] border border-[#F0E3C4] bg-[#FEF8EA] text-[#B4700F]">
                            <MessageSquare className="h-[17px] w-[17px]" />
                          </span>

                          <div className="min-w-0">
                            <p className="flex flex-wrap items-baseline gap-x-3">
                              <span className="quote-serif min-w-0 truncate text-[18px] font-semibold leading-[1.15] text-[#0B1610]">
                                {inq.subject}
                              </span>
                              <span className="font-mono text-[10px] tracking-[0.06em] text-[#A6B1AA]">
                                INQ-{inq.id.slice(-6).toUpperCase()}
                              </span>
                            </p>
                            <p className="mt-1 line-clamp-2 break-words [overflow-wrap:anywhere] text-[12px] leading-[1.5] text-[#78857C]">{inq.message}</p>
                          </div>

                          {/* Sent-on sits in its own column. Left in the text block it
                              just trailed off, leaving the middle of the row empty. */}
                          <div className="col-start-2 min-w-0 lg:col-start-auto">
                            <p className="inline-flex items-center gap-1.5 text-[11.5px] tabular-nums text-[#A6B1AA]">
                              <Clock className="h-3 w-3 flex-none" />
                              {formatDateTime(inq.createdAt)}
                            </p>
                            {inq.resolvedAt && (
                              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] tabular-nums text-[#0B7C74]">
                                <CheckCircle className="h-3 w-3 flex-none" />
                                Closed {formatDateTime(inq.resolvedAt)}
                              </p>
                            )}
                          </div>

                          {/* Whether the desk has written back — the middle column was
                              empty, and this is the thing a sender actually wants. */}
                          <div className="col-start-2 lg:col-start-auto">
                            {inq.resolution ? (
                              <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#BFE7E2] bg-[#F0FDFA] px-2.5 py-1 text-[11px] font-medium text-[#0B7C74]">
                                <CheckCircle className="h-3 w-3 flex-none" /> Replied
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#E7EEE9] bg-[#F4F8F5] px-2.5 py-1 text-[11px] font-medium text-[#78857C]">
                                <Clock className="h-3 w-3 flex-none" /> Awaiting reply
                              </span>
                            )}
                          </div>

                          <p className="col-start-2 flex items-center gap-2 text-[12px] font-semibold lg:col-start-auto">
                            <i className={`h-[7px] w-[7px] flex-none rounded-full ${s.dot}`} />
                            {s.label}
                          </p>

                          <div className="col-start-2 flex lg:col-start-auto lg:justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedInquiry(inq)}
                              className="grid h-[30px] w-[30px] place-items-center rounded-[9px] text-[#A6B1AA] transition hover:bg-[#FEF8EA] hover:text-[#B4700F]"
                              title="View details"
                            >
                              <Eye className="h-[15px] w-[15px]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </section>
            </div>

            {/* ── REACH US — what used to be the right rail. Laid across the foot
                 so the two tables above get the full column width. ── */}
            <div className="mt-8">
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">Reach us</p>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-[20px] border border-[#E7EEE9] bg-white px-[18px] py-4 transition hover:-translate-y-0.5 hover:border-[#C6E7D8] hover:shadow-[0_16px_30px_-24px_rgba(4,50,31,.5)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-[#E7EFFD] text-[#1D4ED8]">
                      <Phone className="h-4 w-4" />
                    </span>
                    <p className="text-[12.5px] font-semibold text-[#0B1610]">Call Support</p>
                  </div>
                  <p className="quote-serif mt-2.5 text-[19px] font-semibold tabular-nums text-[#0B1610]">+91-9737965551</p>
                  <p className="mt-1 text-[11px] leading-[1.6] text-[#A6B1AA]">Mon-Sat, 10am-8pm. Keep your ticket number ready.</p>
                </div>

                <div className="rounded-[20px] border border-[#E7EEE9] bg-white px-[18px] py-4 transition hover:-translate-y-0.5 hover:border-[#C6E7D8] hover:shadow-[0_16px_30px_-24px_rgba(4,50,31,.5)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-[#FEF8EA] text-[#B4700F]">
                      <Clock className="h-4 w-4" />
                    </span>
                    <p className="text-[12.5px] font-semibold text-[#0B1610]">Avg. Response</p>
                  </div>
                  <p className="quote-serif mt-2.5 text-[19px] font-semibold text-[#0B1610]">Within 2 business hours</p>
                  <p className="mt-1 text-[11px] leading-[1.6] text-[#A6B1AA]">Tickets raised before 6pm are usually answered the same day.</p>
                </div>

                <a
                  href="/contact"
                  className="group rounded-[20px] border border-[#E7EEE9] bg-white px-[18px] py-4 transition hover:-translate-y-0.5 hover:border-[#C6E7D8] hover:shadow-[0_16px_30px_-24px_rgba(4,50,31,.5)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-[#EAF8F1] text-[#056B3E]">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <p className="text-[12.5px] font-semibold text-[#0B1610]">Contact form</p>
                    <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                  </div>
                  <p className="mt-2.5 text-[11px] leading-[1.6] text-[#A6B1AA]">For anything not tied to a booking — quotes, corporate rates, partnerships.</p>
                </a>

                <a
                  href="/customer/dashboard"
                  className="group rounded-[20px] border border-[#E7EEE9] bg-white px-[18px] py-4 transition hover:-translate-y-0.5 hover:border-[#C6E7D8] hover:shadow-[0_16px_30px_-24px_rgba(4,50,31,.5)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-[#F4F8F5] text-[#78857C]">
                      <ChevronRight className="h-4 w-4 rotate-180" />
                    </span>
                    <p className="text-[12.5px] font-semibold text-[#0B1610]">Dashboard</p>
                    <ChevronRight className="ml-auto h-4 w-4 flex-none text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                  </div>
                  <p className="mt-2.5 text-[11px] leading-[1.6] text-[#A6B1AA]">Bookings, trips and everything else on your account.</p>
                </a>

              </div>
            </div>
          </div>
        </div>
      </main>

        {/* Create/Edit Ticket Modal */}
        {isFormModalOpen && (
          <div
            className="hd-veil fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
            aria-modal="true"
            role="dialog"
            onClick={closeFormModal}
          >
            <div
              className="hd-panel relative max-h-[90vh] w-full max-w-[680px] overflow-hidden rounded-[24px] bg-white shadow-[0_50px_110px_-30px_rgba(0,0,0,.75)]"
              onClick={(event) => event.stopPropagation()}
            >
              {/* header band — the page's own hero, at panel scale */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#01200F] via-[#04331F] to-[#0A6B41] px-7 py-6 text-white">
                <span
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '34px 34px',
                  }}
                />
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundImage: 'radial-gradient(420px 200px at 92% -40%, rgba(255,255,255,.22), transparent 62%)' }}
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2.5 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/[0.55]">
                      <span className="h-px w-5 bg-white/30" />
                      {formMode === 'create' ? 'Create ticket' : 'Edit ticket'}
                    </p>
                    <h3 className="quote-serif mt-2 break-words [overflow-wrap:anywhere] text-[30px] font-medium leading-none tracking-[-0.02em] [text-shadow:0_2px_18px_rgba(0,0,0,.3)]">
                      {formMode === 'create' ? 'Describe your issue' : 'Update the ticket'}
                    </h3>
                    <p className="mt-2 text-[11.5px] text-white/[0.55]">
                      {formMode === 'create'
                        ? 'The more you tell us, the faster the desk can act.'
                        : 'Changes are visible to the desk right away.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="grid h-9 w-9 flex-none place-items-center rounded-full border border-white/20 bg-white/[0.12] text-white/80 backdrop-blur-sm transition hover:bg-white/25 hover:text-white"
                    aria-label="Close form"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-232px)] overflow-y-auto px-7 py-6">
                {formMessage && (
                  <div
                    className={`mb-6 flex items-start gap-3 rounded-[14px] border px-4 py-3.5 text-[12.5px] leading-relaxed ${
                      formMessage.type === 'success'
                        ? 'border-[#C6E7D8] bg-[#EAF8F1] text-[#056B3E]'
                        : 'border-[#F3D3D9] bg-[#FDF4F5] text-[#8C1C2E]'
                    }`}
                  >
                    {formMessage.type === 'success' ? (
                      <CheckCircle className="mt-px h-4 w-4 flex-none" />
                    ) : (
                      <AlertCircle className="mt-px h-4 w-4 flex-none" />
                    )}
                    {formMessage.text}
                  </div>
                )}

                <form id="helpdesk-ticket-form" className="divide-y divide-[#E7EEE9]" onSubmit={handleFormSubmit}>
                  <div className="grid gap-2 pb-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                    <label className="pt-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]" htmlFor="form-subject">
                      Subject
                    </label>
                    <input
                      id="form-subject"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="w-full rounded-[14px] border border-[#D4DFD8] bg-white px-4 py-3.5 text-[13.5px] text-[#0B1610] transition placeholder:text-[#A6B1AA] focus:border-[#09B368] focus:outline-none focus:ring-[3px] focus:ring-[#09B368]/[0.13]"
                      placeholder="e.g. Booking confirmation issue"
                    />
                  </div>

                  <div className="grid gap-2 py-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                    <label className="pt-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]" htmlFor="form-description">
                      Description
                    </label>
                    <textarea
                      id="form-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-[14px] border border-[#D4DFD8] bg-white px-4 py-3.5 text-[13.5px] leading-[1.7] text-[#0B1610] transition placeholder:text-[#A6B1AA] focus:border-[#09B368] focus:outline-none focus:ring-[3px] focus:ring-[#09B368]/[0.13]"
                      placeholder="Explain what happened and reference your booking if possible."
                    />
                  </div>

                  <div className="grid gap-2 py-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                    <label className="pt-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]" htmlFor="form-booking-id">
                      Related booking
                      <span className="mt-1 block tracking-normal text-[#D4DFD8]">optional</span>
                    </label>
                    <div className="min-w-0">
                      <select
                        id="form-booking-id"
                        value={bookingId}
                        onChange={(event) => setBookingId(event.target.value)}
                        className="w-full rounded-[14px] border border-[#D4DFD8] bg-white px-4 py-3.5 text-[13.5px] text-[#0B1610] transition focus:border-[#09B368] focus:outline-none focus:ring-[3px] focus:ring-[#09B368]/[0.13]"
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
                        <p className="mt-2 text-[11px] text-[#A6B1AA]">No bookings found. You can still raise a general ticket.</p>
                      )}
                    </div>
                  </div>

                  {/* File Upload Drop Zone */}
                  <div className="grid gap-2 py-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                    <p className="pt-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">
                      Attachments
                      <span className="mt-1 block tracking-normal text-[#D4DFD8]">optional</span>
                    </p>
                    <div className="min-w-0">
                      <label className="group flex cursor-pointer items-center gap-4 rounded-[16px] border border-dashed border-[#D4DFD8] bg-[#FAFCFB] px-5 py-5 transition hover:border-[#09B368] hover:bg-[#EAF8F1]/50">
                        <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] border border-[#C6E7D8] bg-white text-[#056B3E] transition group-hover:bg-[#EAF8F1]">
                          <Upload className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-[#0B1610]">Click to upload images</span>
                          <span className="mt-0.5 block text-[11px] text-[#A6B1AA]">PNG, JPG, WEBP — up to 10MB each</span>
                        </span>
                        <input
                          key={fileInputKey}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleAttachmentChange}
                          className="hidden"
                        />
                      </label>

                      {existingImagePaths.length > 0 && (
                        <div className="mt-5">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">Already attached</p>
                          <div className="mt-2.5 grid grid-cols-4 gap-2.5">
                            {existingImagePaths.map((path) => (
                              <div key={path} className="group relative aspect-square overflow-hidden rounded-[13px] border border-[#E7EEE9] bg-[#F4F8F5]">
                                <img src={buildStorageUrl(path)} alt="Existing attachment" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(path)}
                                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-[#B3253A]"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {formAttachments.length > 0 && (
                        <div className="mt-5">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">Ready to upload</p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {formAttachments.map((file, index) => (
                              <span
                                key={`${file.name}-${index}`}
                                className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#C6E7D8] bg-[#EAF8F1] py-1.5 pl-3 pr-1.5 text-[11.5px] font-medium text-[#056B3E]"
                              >
                                <FileImage className="h-3.5 w-3.5 flex-none" />
                                <span className="truncate">{file.name}</span>
                                <button
                                  type="button"
                                  className="grid h-5 w-5 flex-none place-items-center rounded-full bg-white/70 text-[#056B3E] transition hover:bg-[#FDF4F5] hover:text-[#B3253A]"
                                  onClick={() => removeAttachment(index)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* actions stay on screen however long the form runs */}
              <div className="flex items-center gap-3 border-t border-[#E7EEE9] bg-[#FAFCFB] px-7 py-4">
                <p className="mr-auto hidden text-[11px] text-[#A6B1AA] sm:block">
                  {formMode === 'create' ? 'The desk replies within 2 business hours.' : `Editing #${formTicketId ?? ''}`}
                </p>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-full border border-[#D4DFD8] bg-white px-6 py-3 text-[12.5px] font-semibold text-[#46524A] transition hover:border-[#B3253A] hover:text-[#B3253A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="helpdesk-ticket-form"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#056B3E] to-[#09B368] px-7 py-3 text-[12.5px] font-bold text-white shadow-[0_14px_28px_-14px_rgba(4,50,31,.95)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {formMode === 'create' ? 'Sending…' : 'Updating…'}
                    </>
                  ) : formMode === 'create' ? (
                    'Submit Ticket'
                  ) : (
                    'Update Ticket'
                  )}
                </button>
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
  const tone = caseTone[normalizeStatusKey(ticket.status)] ?? caseTone.unknown;
  // Presentational only: how far along the rail the state sits.
  const step = tone.fill >= 100 ? 3 : tone.fill > 30 ? 2 : 1;
  const stopped = ['closed', 'escalated'].includes(normalizeStatusKey(ticket.status));
  return (
    <div
      className="hd-veil fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
      aria-modal="true"
      role="dialog"
    >
      <div className="hd-panel relative max-h-[90vh] w-full max-w-[760px] overflow-hidden rounded-[24px] bg-white shadow-[0_50px_110px_-30px_rgba(0,0,0,.75)]">

        {/* header band */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#01200F] via-[#04331F] to-[#0A6B41] px-7 py-6 text-white">
          <span
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
          <span
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(460px 210px at 90% -40%, rgba(255,255,255,.22), transparent 62%)' }}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/[0.55]">
                <span className="h-px w-5 bg-white/30" />
                {ticket.ticket_no ? `#${ticket.ticket_no}` : `#${ticket.id ?? 'Unknown'}`}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.22] bg-white/[0.12] px-2.5 py-[3px] tracking-[0.06em] text-white/90 backdrop-blur-sm">
                  <i className="h-[6px] w-[6px] rounded-full bg-[#5FD9A8]" />
                  {formatStatusLabel(ticket.status)}
                </span>
              </p>
              <h3 className="quote-serif mt-2 break-words [overflow-wrap:anywhere] text-[30px] font-medium leading-[1.05] tracking-[-0.02em] [text-shadow:0_2px_18px_rgba(0,0,0,.3)]">
                {ticket.heading || 'Untitled'}
              </h3>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-white/[0.55]">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Clock className="h-3.5 w-3.5" /> Raised {formatDateTime(ticket.created_at)}
                </span>
                {ticket.booking_id && (
                  <>
                    <span className="h-3 w-px bg-white/25" />
                    <span className="tabular-nums">Booking #{ticket.booking_id}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-none items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(ticket)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.12] px-4 py-2 text-[11.5px] font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/25 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/[0.12] text-white/80 backdrop-blur-sm transition hover:bg-white/25 hover:text-white"
                onClick={onClose}
                aria-label="Close ticket details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* the state, as a line you can read left to right */}
        <div className="grid grid-cols-3 gap-3.5 border-b border-[#E7EEE9] px-7 py-5">
          {['Raised', stopped ? 'Stopped' : 'In progress', stopped ? 'Closed' : 'Resolved'].map((label, i) => {
            const at = i + 1;
            const done = !stopped && (at < step || at === 1);
            const now = !stopped && at === step && at > 1;
            const railed = stopped ? at === 1 : done || now;
            return (
              <div key={label} className="relative pt-[19px]">
                <span
                  className={`absolute inset-x-0 top-0 h-[3px] rounded-full ${
                    stopped && at > 1 ? 'bg-[#F3D3D9]' : done ? 'bg-[#09B368]' : now ? 'bg-[#B4700F]' : 'bg-[#E7EEE9]'
                  }`}
                />
                <p className={`flex items-center gap-2 text-[11px] font-semibold ${now ? 'text-[#B4700F]' : railed ? 'text-[#46524A]' : 'text-[#A6B1AA]'}`}>
                  <span
                    className={`grid h-4 w-4 flex-none place-items-center rounded-full ${
                      done ? 'bg-[#09B368] text-white' : now ? 'bg-[#B4700F] text-white' : 'bg-[#E7EEE9] text-white'
                    }`}
                  >
                    {done && <CheckCircle className="h-[9px] w-[9px]" />}
                  </span>
                  {label}
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-[#A6B1AA]">
                  {at === 1
                    ? formatDateTime(ticket.created_at)
                    : at === 3 && ticket.resolvedAt
                    ? formatDateTime(ticket.resolvedAt)
                    : now
                    ? 'In hand'
                    : '—'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="max-h-[calc(90vh-330px)] overflow-y-auto px-7 py-6">
          {/* Description */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">What you told us</p>
            <p className="mt-3 whitespace-pre-line break-words [overflow-wrap:anywhere] border-l-2 border-[#D4DFD8] py-0.5 pl-4 text-[13.5px] leading-[1.75] text-[#46524A]">
              {ticket.problem || 'No description provided.'}
            </p>
          </div>

          {/* Admin Response / Resolution */}
          {ticket.resolution && (
            <div className="mt-7">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">Admin response</p>
              <div className="mt-3 overflow-hidden rounded-[16px] border border-[#BFE7E2] bg-gradient-to-br from-[#F0FDFA] to-[#FAFEFD]">
                <div className="flex items-center gap-2.5 border-b border-[#BFE7E2] px-5 py-3">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] border border-[#BFE7E2] bg-white text-[#0B7C74]">
                    <Headphones className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-[#0B1610]">Response from Support Team</span>
                    {ticket.resolvedAt && (
                      <span className="block text-[11px] tabular-nums text-[#78857C]">{formatDateTime(ticket.resolvedAt)}</span>
                    )}
                  </span>
                </div>
                <p className="whitespace-pre-line break-words [overflow-wrap:anywhere] px-5 py-4 text-[13px] leading-[1.75] text-[#46524A]">{ticket.resolution}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="mt-7">
            <p className="flex items-center justify-between gap-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">
              Attachments
              {imageUrls.length > 0 && <span className="tabular-nums">{imageUrls.length}</span>}
            </p>
            {imageUrls.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imageUrls.map((image, index) => (
                  <a
                    key={`${ticket.id}-${index}`}
                    href={image}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[#E7EEE9] bg-[#F4F8F5]"
                  >
                    <img
                      src={image}
                      alt={`Attachment ${index + 1}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                      loading="lazy"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/45">
                      <span className="inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[11.5px] font-semibold text-[#0B1610] opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <Eye className="h-3.5 w-3.5" />
                        View full size
                      </span>
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm">
                      {index + 1}/{imageUrls.length}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-dashed border-[#D4DFD8] bg-[#FAFCFB] px-5 py-5">
                <ImageIcon className="h-5 w-5 flex-none text-[#D4DFD8]" />
                <p className="text-[12.5px] text-[#A6B1AA]">No attachments were uploaded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InquiryDetailModal({ inquiry, onClose }: { inquiry: any; onClose: () => void }) {
  const s = inquiryTone[inquiry.status] || inquiryTone.NEW;
  const ref = `INQ-${inquiry.id.slice(-6).toUpperCase()}`;
  const fmt = (v: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(new Date(v));

  return (
    <div className="hd-veil fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md" onClick={onClose}>
      <div
        className="hd-panel relative flex max-h-[90vh] min-h-[min(520px,80vh)] w-full max-w-[620px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_50px_110px_-30px_rgba(0,0,0,.75)]"
        onClick={e => e.stopPropagation()}
      >
        {/* The page hero's own treatment — emerald wash, drifting grid, glow
            blobs and the tape strip along the bottom — so the dialog opens into
            the same world the page lives in. Amber stays the inquiry's accent.
            The date sits in the thread below, next to the message it stamps. */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#022B1A] via-[#045030] to-[#09B368] px-6 pb-7 pt-5 text-white">
          <span
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
          <span
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(430px 200px at 88% -40%, rgba(255,255,255,.20), transparent 62%)' }}
          />
          <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#09B368]/30 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-10 left-1/3 h-36 w-36 rounded-full bg-[#056040]/40 blur-2xl" />
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* the tape, same motif that closes the page hero */}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] block h-6 overflow-hidden">
            <span className="absolute inset-x-0 bottom-0 block h-3 border-t border-white/[0.18] bg-[#01230F]/55" />
            <span
              className="absolute inset-x-0 bottom-0 block h-3"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 1px, transparent 1px 26px)' }}
            />
          </span>

          {/* z-20: the row below is positioned and comes later, so without this
              it paints over the button and swallows the click. */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/[0.12] text-white/85 backdrop-blur-sm transition hover:bg-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative z-10 flex items-center gap-3.5 pr-12">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] border border-white/[0.24] bg-white/[0.13] text-[#F3C77E]">
              <MessageSquare className="h-5 w-5" />
            </span>
            {/* The reference is the heading now; the subject reads once, in the
                Subject field below, instead of twice. */}
            <div className="min-w-0">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/[0.55]">
                Contact form inquiry
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                <h3 className="font-mono text-[19px] font-semibold tracking-[0.04em] [text-shadow:0_2px_18px_rgba(0,0,0,.3)]">
                  {ref}
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.24] bg-white/[0.13] px-2.5 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white/90 backdrop-blur-sm">
                  <i className="h-[6px] w-[6px] rounded-full bg-[#F0B45C]" />
                  {s.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* The fields the old dialog carried — Subject, Submitted on, Your
            message, Response from the team — kept, in the new language. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-[14px] border border-[#E7EEE9] bg-[#FAFCFB] px-4 py-3.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">Subject</p>
              <p className="mt-1.5 break-words [overflow-wrap:anywhere] text-[13.5px] font-semibold leading-snug text-[#0B1610]">
                {inquiry.subject}
              </p>
            </div>
            <div className="min-w-0 rounded-[14px] border border-[#E7EEE9] bg-[#FAFCFB] px-4 py-3.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">Submitted on</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] tabular-nums leading-snug text-[#46524A]">
                <Clock className="h-3.5 w-3.5 flex-none text-[#A6B1AA]" />
                {fmt(inquiry.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">Your message</p>
            <div className="mt-2 whitespace-pre-line break-words [overflow-wrap:anywhere] rounded-[14px] border border-[#F0E3C4] bg-[#FFFDF7] px-4 py-3.5 text-[13px] leading-[1.7] text-[#46524A]">
              {inquiry.message}
            </div>
          </div>

          {inquiry.resolution ? (
            <div className="mt-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#A6B1AA]">Response from the team</p>
              <div className="mt-2 overflow-hidden rounded-[14px] border border-[#BFE7E2] bg-gradient-to-br from-[#F0FDFA] to-[#FAFEFD]">
                <div className="flex items-center gap-2.5 border-b border-[#BFE7E2] px-4 py-3">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] border border-[#BFE7E2] bg-white text-[#0B7C74]">
                    <Headphones className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-[#0B1610]">TransRentals Support Team</span>
                    {inquiry.resolvedAt && (
                      <span className="block text-[11px] tabular-nums text-[#78857C]">{fmt(inquiry.resolvedAt)}</span>
                    )}
                  </span>
                </div>
                <p className="whitespace-pre-line break-words [overflow-wrap:anywhere] px-4 py-3.5 text-[13px] leading-[1.7] text-[#46524A]">
                  {inquiry.resolution}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-3 rounded-[14px] border border-dashed border-[#D4DFD8] bg-[#FAFCFB] px-4 py-3.5">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[11px] border border-[#D4DFD8] bg-white text-[#A6B1AA]">
                <Headphones className="h-[15px] w-[15px]" />
              </span>
              <p className="text-[12px] text-[#A6B1AA]">
                Awaiting a response — TransRentals typically replies within{' '}
                <b className="font-semibold text-[#46524A]">2 business hours</b>.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[#E7EEE9] bg-[#FAFCFB] px-6 py-4">
          <p className="mr-auto hidden text-[11px] text-[#A6B1AA] sm:block">
            {inquiry.resolution ? 'Answered by the desk.' : 'We will email you as soon as the desk replies.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#D4DFD8] bg-white px-6 py-3 text-[12.5px] font-semibold text-[#46524A] transition hover:border-[#B4700F] hover:text-[#B4700F]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

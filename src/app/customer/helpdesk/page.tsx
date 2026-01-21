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

  return `${STORAGE_BASE_URL}/${relative.replace(/^\/+/, '')}`;

};



const getTicketImageUrls = (ticket: HelpdeskTicket) => parseTicketImages(ticket.image).map(buildStorageUrl);



const badgeStyles: Record<string, string> = {

  open: 'bg-emerald-100 text-emerald-700 border border-emerald-200',

  pending: 'bg-amber-100 text-amber-700 border border-amber-200',

  completed: 'bg-blue-100 text-blue-700 border border-blue-200',

  resolved: 'bg-blue-100 text-blue-700 border border-blue-200',

  closed: 'bg-slate-100 text-slate-600 border border-slate-200',

  escalated: 'bg-rose-50 text-rose-600 border border-rose-200',

  ongoing: 'bg-amber-100 text-amber-700 border border-amber-200',

  inprogress: 'bg-amber-100 text-amber-700 border border-amber-200',

  unknown: 'bg-slate-50 text-slate-500 border border-slate-100',

};



interface HelpdeskTicket {

  id?: number;

  ticket_no?: string;

  heading?: string;

  problem?: string;

  status?: string;

  image?: string | null;

  booking_id?: number | string;

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

  const [customerName, setCustomerName] = useState('');

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

    const base: StatCard[] = [

      {

        label: 'Total tickets',

        value: tickets.length,

        helper: 'Open and resolved requests',

        icon: Inbox,

      },

    ];

    statusBreakdown.forEach(([status, count]) => {

      base.push({

        label: formatStatusLabel(status),

        value: count,

        helper: `${count} request${count === 1 ? '' : 's'}`,

        icon: MessageCircle,

      });

    });

    return base;

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

      <div className="min-h-screen bg-slate-50">

        <CustomerHeader

          title="Helpdesk"

          showBackButton

          backHref="/customer/dashboard"

          onRefresh={handleRefresh}

          isRefreshing={isRefreshing}

        />



        

        <main className="pt-20 md:pt-24 pb-10">

          <div className="container mx-auto px-4 max-w-6xl space-y-6">

            <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Helpdesk overview</p>

                  <p className="text-sm text-slate-500 mt-1">

                    {customerName ? `${customerName},` : 'Stay on top of'} every conversation you open with us.

                  </p>

                </div>

                <div className="flex flex-wrap gap-2">

                  <button

                    type="button"

                    onClick={handleRefresh}

                    className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"

                  >

                    <RefreshCw className="h-4 w-4" />

                    Refresh list

                  </button>

                  <button

                    type="button"

                    onClick={openCreateModal}

                    className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-indigo-700"

                  >

                    + New ticket

                  </button>

                </div>

              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">

                {statsCards.map((card, index) => (

                  <div

                    key={`${card.label}-${index}`}

                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm"

                  >

                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-slate-500">

                      <card.icon className="h-4 w-4 text-slate-400" />

                      <span>{card.label}</span>

                    </div>

                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>

                    {card.helper && <p className="text-xs text-slate-400">{card.helper}</p>}

                  </div>

                ))}

              </div>

            </section>



            <div className="grid gap-6 lg:grid-cols-[1.7fr,0.9fr] lg:items-start">

              <section className="space-y-4">

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                  <div className="px-6 py-5 border-b border-slate-100">

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                      <div>

                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Tickets</p>

                        <h2 className="text-xl font-semibold text-slate-900">Support requests</h2>

                        <p className="text-sm text-slate-500 mt-1">

                          Showing {filteredSortedTickets.length} of {tickets.length} total tickets

                        </p>

                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button

                          type="button"

                          onClick={openCreateModal}

                          className="rounded-2xl border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-indigo-700"

                        >

                          + New ticket

                        </button>

                        <button

                          type="button"

                          onClick={handleRefresh}

                          className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"

                        >

                          <RefreshCw className="h-4 w-4" />

                          Refresh

                        </button>

                      </div>

                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">

                      {statusFilters.map((filter) => (

                        <button

                          key={filter.key}

                          type="button"

                          onClick={() => setStatusFilter(filter.key)}

                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.3em] transition ${

                            statusFilter === filter.key

                              ? 'bg-indigo-600 text-white'

                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'

                          }`}

                        >

                          {filter.label}

                        </button>

                      ))}

                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                      <div>

                        <label className="sr-only" htmlFor="ticket-search">

                          Search tickets

                        </label>

                        <input

                          id="ticket-search"

                          value={searchTerm}

                          onChange={(event) => setSearchTerm(event.target.value)}

                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"

                          placeholder="Search by heading, ID or description"

                        />

                      </div>

                      <div>

                        <label className="sr-only" htmlFor="booking-filter">

                          Booking filter

                        </label>

                        <input

                          id="booking-filter"

                          value={bookingFilter}

                          onChange={(event) => setBookingFilter(event.target.value)}

                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"

                          placeholder="Filter by booking ID"

                        />

                      </div>

                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 cursor-pointer">

                        <input

                          type="checkbox"

                          checked={attachmentsOnly}

                          onChange={(event) => setAttachmentsOnly(event.target.checked)}

                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"

                        />

                        Attachments only

                      </label>

                      <button

                        type="button"

                        onClick={clearFilters}

                        className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:bg-slate-100"

                      >

                        Clear filters

                      </button>

                    </div>

                  </div>



                  <div className="px-4 pb-6 pt-4">

                    {error && (

                      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">

                        <AlertCircle className="h-4 w-4" />

                        {error}

                      </div>

                    )}



                    {isLoading ? (

                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-4 py-8 text-sm text-slate-500">

                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />

                        Loading tickets...

                      </div>

                    ) : filteredSortedTickets.length === 0 ? (

                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">

                        No helpdesk activity yet. Raise a ticket to get started.

                      </div>

                    ) : (

                      <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-slate-200">

                          <thead className="bg-gray-50">

                            <tr>

                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">

                                Ticket

                              </th>

                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">

                                Booking

                              </th>

                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">

                                Status

                              </th>

                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 hidden md:table-cell">

                                Attachments

                              </th>

                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">

                                Created

                              </th>

                              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">

                                Actions

                              </th>

                            </tr>

                          </thead>

                          <tbody className="divide-y divide-slate-100 bg-white">

                            {filteredSortedTickets.map(({ ticket, imageUrls }) => {

                              const rowKey =

                                ticket.id ?? ticket.ticket_no ?? `${ticket.heading}-${ticket.created_at ?? ''}`;

                              const badgeClass =

                                badgeStyles[normalizeStatusKey(ticket.status)] ?? badgeStyles.unknown;

                              const createdAt = formatDateTime(ticket.created_at);

                              return (

                                <tr key={rowKey}>

                                  <td className="px-6 py-4">

                                    <p className="text-sm font-semibold text-slate-900">

                                      {ticket.heading || 'Untitled ticket'}

                                    </p>

                                    <p className="text-xs text-slate-500">

                                      #{ticket.ticket_no ?? ticket.id ?? 'TBD'}

                                    </p>

                                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">

                                      {ticket.problem || 'No description provided.'}

                                    </p>

                                  </td>

                                  <td className="px-6 py-4 text-sm text-slate-700">

                                    {ticket.booking_id ? `#${ticket.booking_id}` : ''}

                                  </td>

                                  <td className="px-6 py-4">

                                    <span

                                      className={`inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] ${badgeClass}`}

                                    >

                                      {formatStatusLabel(ticket.status)}

                                    </span>

                                  </td>

                                  <td className="px-6 py-4 hidden md:table-cell">

                                    {imageUrls.length ? (

                                      <div className="flex -space-x-2">

                                        {imageUrls.slice(0, 3).map((image, index) => (

                                          <img

                                            key={`${rowKey}-${index}`}

                                            src={image}

                                            alt={`Attachment ${index + 1}`}

                                            className="h-10 w-10 rounded-lg border border-white object-cover shadow"

                                            loading="lazy"

                                          />

                                        ))}

                                      </div>

                                    ) : (

                                      <span className="text-xs text-slate-400">No image</span>

                                    )}

                                  </td>

                                  <td className="px-6 py-4 text-xs uppercase tracking-[0.3em] text-slate-500">

                                    {createdAt}

                                  </td>

                                  <td className="px-6 py-4 text-right space-y-1">

                                    <button

                                      type="button"

                                      onClick={() => setSelectedTicket(ticket)}

                                      className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600 hover:text-indigo-900"

                                    >

                                      View

                                    </button>

                                    <button

                                      type="button"

                                      onClick={() => openEditModal(ticket)}

                                      className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 hover:text-slate-900"

                                    >

                                      Edit

                                    </button>

                                  </td>

                                </tr>

                              );

                            })}

                          </tbody>

                        </table>

                      </div>

                    )}

                  </div>

                </div>

              </section>



              <aside className="space-y-6">

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Quick action</p>

                  <h3 className="text-xl font-semibold text-slate-900 mt-1">Need help now?</h3>

                  <p className="text-sm text-slate-500 mt-1">

                    Click the button below to open the support form in a modal. Add a description, attach screenshots,

                    and we will respond within 2 business hours.

                  </p>

                  <button

                    type="button"

                    onClick={openCreateModal}

                    className="mt-4 flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-indigo-700"

                  >

                    Raise a ticket

                  </button>

                </div>



                <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm">

                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Need faster help?</p>

                  <h4 className="text-lg font-semibold text-slate-900 mt-1">Call our support desk</h4>

                  <p className="text-sm text-slate-500 mt-1">

                    Reach us on <span className="font-semibold text-slate-900">+91-98208-87711</span> between 10am and

                    8pm, Monday to Saturday. Keep your booking or ticket number ready.

                  </p>

                  <p className="mt-4 text-xs text-slate-400">

                    We normally reply within 2 business hours. Use the refresh button to pull the latest replies.

                  </p>

                </div>

              </aside>

            </div>

          </div>

        </main>





        {isFormModalOpen && (

          <div

            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"

            aria-modal="true"

            role="dialog"

            onClick={closeFormModal}

          >

            <div

              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl"

              onClick={(event) => event.stopPropagation()}

            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">

                    {formMode === 'create' ? 'Create ticket' : 'Edit ticket'}

                  </p>

                  <h3 className="text-2xl font-semibold text-slate-900">

                    {formMode === 'create' ? 'Describe your issue' : 'Update the ticket'}

                  </h3>

                </div>

                <button

                  type="button"

                  onClick={closeFormModal}

                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-slate-400 hover:text-slate-900"

                  aria-label="Close form"

                >

                  <X className="h-4 w-4" />

                </button>

              </div>



              {formMessage && (

                <div

                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${

                    formMessage.type === 'success'

                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'

                      : 'border-rose-200 bg-rose-50 text-rose-700'

                  }`}

                >

                  {formMessage.text}

                </div>

              )}



              <form className="mt-5 space-y-4" onSubmit={handleFormSubmit}>

                <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">

                  Subject

                  <input

                    value={subject}

                    onChange={(event) => setSubject(event.target.value)}

                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"

                    placeholder="Booking confirmation issue"

                  />

                </label>



                <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">

                  Description

                  <textarea

                    value={description}

                    onChange={(event) => setDescription(event.target.value)}

                    rows={4}

                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"

                    placeholder="Explain what happened and reference your booking if possible."

                  />

                </label>



                <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">

                  Booking ID (optional)

                  <input

                    value={bookingId}

                    onChange={(event) => setBookingId(event.target.value)}

                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"

                    placeholder="101216"

                  />

                </label>



                <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">

                  Attach images (optional)

                  <input

                    key={fileInputKey}

                    type="file"

                    multiple

                    accept="image/*"

                    onChange={handleAttachmentChange}

                    className="w-full text-xs text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700"

                  />

                </label>



                {existingImagePaths.length > 0 && (

                  <div className="space-y-2">

                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">

                      Existing attachments

                    </p>

                    <div className="flex flex-wrap gap-3">

                      {existingImagePaths.map((path) => (

                        <div key={path} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                          <img src={buildStorageUrl(path)} alt="Existing attachment" className="h-full w-full object-cover" />

                          <button

                            type="button"

                            onClick={() => removeExistingImage(path)}

                            className="absolute right-1 top-1 rounded-full bg-black/60 px-1 text-xs text-white"

                          >

                            Remove

                          </button>

                        </div>

                      ))}

                    </div>

                  </div>

                )}



                {formAttachments.length > 0 && (

                  <div className="space-y-2">

                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Ready to upload</p>

                    <div className="flex flex-wrap gap-2">

                      {formAttachments.map((file, index) => (

                        <span

                          key={`${file.name}-${index}`}

                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"

                        >

                          {file.name}

                          <button

                            type="button"

                            className="text-rose-600 hover:text-rose-800"

                            onClick={() => removeAttachment(index)}

                          >

                            Remove

                          </button>

                        </span>

                      ))}

                    </div>

                  </div>

                )}



                <div className="flex justify-between gap-3 pt-4">

                  <button

                    type="button"

                    onClick={closeFormModal}

                    className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"

                  >

                    Cancel

                  </button>

                  <button

                    type="submit"

                    disabled={isSubmitting}

                    className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"

                  >

                    {isSubmitting ? (

                      <>

                        <Loader2 className="h-4 w-4 animate-spin" />

                        {formMode === 'create' ? 'Sendingâ¦' : 'Updatingâ¦'}

                      </>

                    ) : formMode === 'create' ? (

                      'Submit ticket'

                    ) : (

                      'Update ticket'

                    )}

                  </button>

                </div>

              </form>

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

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"

      aria-modal="true"

      role="dialog"

    >

      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">

        <button

          type="button"

          className="absolute right-4 top-4 rounded-full border border-slate-200 p-1 text-slate-500 hover:border-slate-400 hover:text-slate-900"

          onClick={onClose}

          aria-label="Close ticket details"

        >

          <X className="h-4 w-4" />

        </button>

        <div className="space-y-4">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Ticket ID</p>

              <h3 className="text-2xl font-semibold text-slate-900">#{ticket.id ?? 'Unknown'}</h3>

              {ticket.ticket_no && (

                <p className="text-xs text-slate-500 uppercase tracking-[0.3em]">#{ticket.ticket_no}</p>

              )}

            </div>

            {onEdit && (

              <button

                type="button"

                onClick={() => onEdit(ticket)}

                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-900"

              >

                Edit ticket

              </button>

            )}

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="space-y-2">

              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Subject</p>

              <p className="text-sm font-semibold text-slate-900">{ticket.heading || 'Untitled'}</p>

            </div>

            <div className="space-y-2">

              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Status</p>

              <span

                className={`inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] ${badgeClass}`}

              >

                {formatStatusLabel(ticket.status)}

              </span>

            </div>

            <div className="space-y-2 md:col-span-2">

              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Description</p>

              <p className="text-sm text-slate-700 whitespace-pre-line">{ticket.problem || 'No description provided.'}</p>

            </div>

            <div>

              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Created</p>

              <p className="text-sm text-slate-700">{formatDateTime(ticket.created_at)}</p>

            </div>

            {ticket.booking_id && (

              <div>

                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Booking ID</p>

                <p className="text-sm text-slate-700">{ticket.booking_id}</p>

              </div>

            )}

          </div>

          <div className="space-y-2">

            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Attachments</p>

            {imageUrls.length > 0 ? (

              <div className="grid gap-3 sm:grid-cols-2">

                {imageUrls.map((image, index) => (

                  <a

                    key={`${ticket.id}-${index}`}

                    href={image}

                    target="_blank"

                    rel="noreferrer"

                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"

                  >

                    <img

                      src={image}

                      alt={`Attachment ${index + 1}`}

                      className="h-44 w-full object-cover transition duration-200 group-hover:scale-105"

                      loading="lazy"

                    />

                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white">

                      View full size

                      <span>

                        {index + 1}/{imageUrls.length}

                      </span>

                    </span>

                  </a>

                ))}

              </div>

            ) : (

              <p className="text-sm text-slate-500 italic">No attachments were uploaded.</p>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}


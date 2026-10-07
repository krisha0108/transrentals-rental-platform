'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Ticket,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

interface FAQ { question: string; answer: string; }
interface SupportTicket {
  id: string;
  ticketNo: string;
  heading: string;
  status: string;
  priority: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

const faqs: FAQ[] = [
  {
    question: 'How do I get my travel agent account approved?',
    answer: 'After registration, upload all required documents (GST Certificate, PAN Card, Address Proof) in the Documents section. Once uploaded, your application will be reviewed within 1-2 business days. You will receive a notification once approved.',
  },
  {
    question: 'How do I add tours to my portfolio?',
    answer: 'Go to Tours > Add Tour from the sidebar. Fill in the tour details including name, description, itinerary, pricing, and photos. Once submitted, your tour will be live on the platform immediately.',
  },
  {
    question: 'How do I manage leads and follow-ups?',
    answer: 'All incoming leads appear in Lead Management. You can add notes, set follow-up reminders, and move leads through your pipeline. Use the Pipeline view for a kanban-style overview of your deals.',
  },
  {
    question: 'How do I create tour quote requests?',
    answer: 'When a customer requests a custom tour quote, it appears in Tour Quote Requests. Review the request, prepare your quote with pricing and itinerary, and submit it back to the customer through the platform.',
  },
  {
    question: 'When will I receive my earnings?',
    answer: 'Earnings are processed weekly on Mondays. Ensure your bank details are correctly added and a cancelled cheque is uploaded for verification. Minimum payout amount is Rs. 500.',
  },
  {
    question: 'How do I use the Social Network feature?',
    answer: 'The Social Network lets you connect with other travel agents and vendors. Post travel tips, destination info, deals, and partnership opportunities. Use SOS posts for urgent requests that need immediate attention from the community.',
  },
  {
    question: 'How do I set up capture links for leads?',
    answer: 'Go to Lead Management > Capture Links to create shareable links for your tours or services. When a potential customer fills out the form through your link, they become a lead automatically in your system.',
  },
  {
    question: 'What documents do I need to upload?',
    answer: 'Required documents: GST Certificate, PAN Card, Address Proof. Optional but recommended: Business Registration, Cancelled Cheque (for payouts), Owner Aadhaar. All documents should be clear and valid.',
  },
];

// All FIVE helpdesk statuses (prisma enum: OPEN | PENDING | IN_PROGRESS |
// RESOLVED | CLOSED). PENDING was previously missing here, so a pending
// ticket fell through to the OPEN styling and was mislabelled "Open".
const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  RESOLVED: 'bg-green-50 text-green-700 border-green-200',
  CLOSED: 'bg-gray-50 text-gray-600 border-gray-200',
};

// `priority` is a free-text column (default "NORMAL"). Only non-default
// values get a chip — a "NORMAL" badge on every ticket would just be noise.
const PRIORITY_STYLE: Record<string, string> = {
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-sky-50 text-sky-700 border-sky-200',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TravelAgentSupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'ticket' | 'mytickets'>('faq');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [contactSettings, setContactSettings] = useState({
    contactEmail: 'book@transrentals.in',
    contactPhone: '+91 97379 65551',
  });
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [ticketForm, setTicketForm] = useState({ subject: '', category: '', message: '' });

  useEffect(() => {
    fetch('/api/public/contact-settings')
      .then(r => r.json())
      .then(d => {
        setContactSettings(prev => ({
          contactEmail: d.contactEmail || prev.contactEmail,
          contactPhone: d.contactPhone || prev.contactPhone,
        }));
      })
      .catch(() => {});
  }, []);

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/travel-agent/support/tickets');
      const data = await res.json();
      if (res.ok) setMyTickets(data.tickets || []);
    } catch { /* ignore */ } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mytickets') fetchMyTickets();
  }, [activeTab]);

  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/travel-agent/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit ticket'); return; }
      setSuccess(true);
      setTicketForm({ subject: '', category: '', message: '' });
      setTimeout(() => setSuccess(false), 6000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useTravelAgentPageHeader('Help & Support', 'Get help with your travel agent account');

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Call Us</h3>
          <p className="text-sm text-gray-500 mt-1">Mon-Sat, 9AM-7PM</p>
          <a href="tel:+919737965551" className="text-blue-600 font-medium mt-2 block hover:underline">
            +91 9737965551
          </a>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">WhatsApp</h3>
          <p className="text-sm text-gray-500 mt-1">Direct support chat</p>
          <a href="https://wa.me/919737965551" target="_blank" rel="noopener noreferrer"
            className="text-green-600 font-medium mt-2 block hover:underline">
            Chat on WhatsApp
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
            <Mail className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Email Us</h3>
          <p className="text-sm text-gray-500 mt-1">We reply within 24hrs</p>
          <a href={`mailto:${contactSettings.contactEmail}`}
            className="text-purple-600 font-medium mt-2 block hover:underline">
            {contactSettings.contactEmail}
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          {[
            { key: 'faq',       icon: BookOpen, label: 'FAQs' },
            { key: 'ticket',    icon: FileText, label: 'Raise Ticket' },
            { key: 'mytickets', icon: Ticket,   label: 'My Tickets' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
                activeTab === key
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* FAQs */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition">
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFaq === index
                      ? <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      : <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Raise Ticket */}
          {activeTab === 'ticket' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Submit a Support Ticket</h3>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  Ticket submitted! You can track it under <button onClick={() => setActiveTab('mytickets')} className="font-semibold underline">My Tickets</button>.
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5" />{error}
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select name="category" value={ticketForm.category} onChange={handleTicketChange} required
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Select Category</option>
                    <option value="account">Account & Profile</option>
                    <option value="documents">Documents & Verification</option>
                    <option value="leads">Leads & Pipeline</option>
                    <option value="tours">Tours & Properties</option>
                    <option value="bookings">Bookings & Orders</option>
                    <option value="payments">Payments & Earnings</option>
                    <option value="technical">Technical Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="subject" value={ticketForm.subject} onChange={handleTicketChange} required
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea name="message" value={ticketForm.message} onChange={handleTicketChange} required rows={5}
                    placeholder="Please describe your issue in detail..."
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Expected response: Within 24 hours
                  </div>
                  <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                      : <><Send className="w-4 h-4 mr-2" />Submit Ticket</>}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* My Tickets */}
          {activeTab === 'mytickets' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">My Support Tickets</h3>
                <button onClick={fetchMyTickets}
                  className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700">
                  <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loadingTickets ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading tickets...
                </div>
              ) : myTickets.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No tickets yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Submit a ticket if you need help with anything.
                  </p>
                  <button onClick={() => setActiveTab('ticket')}
                    className="mt-3 text-sm text-emerald-600 hover:underline">
                    Raise a ticket →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTickets.map((t) => (
                    <div key={t.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-gray-400">{t.ticketNo}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[t.status] || STATUS_STYLE.OPEN}`}>
                              {t.status.replace('_', ' ')}
                            </span>
                            {PRIORITY_STYLE[t.priority?.toUpperCase()] && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[t.priority.toUpperCase()]}`}>
                                {t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-1 truncate">{t.heading}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Raised on {formatDate(t.createdAt)}</p>
                        </div>
                      </div>
                      {t.resolution && (
                        <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-700 mb-1">Admin Response:</p>
                          <p className="text-sm text-green-800">{t.resolution}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Helpful Resources */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Helpful Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: FileText, color: 'text-emerald-600', label: 'Travel Agent Guidelines', sub: 'Best practices for travel agents' },
            { icon: FileText, color: 'text-purple-600', label: 'Tour Pricing Guide', sub: 'How to set competitive tour prices' },
            { icon: FileText, color: 'text-blue-600', label: 'Terms & Conditions', sub: 'Travel agent partnership agreement' },
            { icon: FileText, color: 'text-orange-600', label: 'Privacy Policy', sub: 'How we handle your data' },
          ].map((r, i) => (
            <a key={i} href="#" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition">
              <r.icon className={`w-5 h-5 ${r.color}`} />
              <div className="flex-1">
                <span className="text-gray-900 font-medium">{r.label}</span>
                <p className="text-xs text-gray-500">{r.sub}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

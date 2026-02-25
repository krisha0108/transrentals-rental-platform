'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'How do I get my vendor account approved?',
    answer: 'After registration, upload all required documents (GST Certificate, PAN Card, Address Proof) in the Documents section. Once uploaded, your application will be reviewed within 1-2 business days. You will receive a notification once approved.',
  },
  {
    question: 'How do I request to offer a new service?',
    answer: 'Go to Services & Locations > Request Service from the sidebar. Select the service you want to offer, provide your experience details, and submit the request. Admin will review and approve your request.',
  },
  {
    question: 'How do I add vehicles to my fleet?',
    answer: 'Once your account and service requests are approved, go to Fleet Management > Add Vehicle. Select the vehicle model, add your vehicle details, set pricing, and submit. Make sure to upload vehicle documents as well.',
  },
  {
    question: 'When will I receive my payouts?',
    answer: 'Payouts are processed weekly on Mondays. Ensure your bank details are correctly added and a cancelled cheque is uploaded for verification. Minimum payout amount is Rs. 500.',
  },
  {
    question: 'How do I handle booking cancellations?',
    answer: 'Cancellation policies are set by TransRentals. For vendor-side cancellations, please contact support. Customer cancellations are handled automatically with refunds as per the cancellation policy.',
  },
  {
    question: 'What documents do I need to upload?',
    answer: 'Required documents: GST Certificate, PAN Card, Address Proof. Optional but recommended: Business Registration, Cancelled Cheque (for payouts), Owner Aadhaar. All documents should be clear and valid.',
  },
  {
    question: 'How do I update my pricing?',
    answer: 'Go to Fleet Management > select a vehicle > Edit Pricing. You can set different rates for different trip types (local, outstation, airport). Changes reflect immediately for new bookings.',
  },
  {
    question: 'What if a customer damages my vehicle?',
    answer: 'Document the damage with photos immediately. Report it through Insurance Claims in the sidebar. TransRentals provides damage protection coverage. Claims are processed within 7-10 business days.',
  },
];

export default function VendorSupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'ticket'>('faq');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [contactSettings, setContactSettings] = useState({
    contactEmail: 'book@transrentals.in',
    contactPhone: '+91 97379 65551',
  });

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    message: '',
  });

  // Fetch contact settings on mount
  React.useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await fetch('/api/public/contact-settings');
        if (response.ok) {
          const data = await response.json();
          setContactSettings((prev) => ({
            contactEmail: data.contactEmail || prev.contactEmail,
            contactPhone: data.contactPhone || prev.contactPhone,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch contact settings:', err);
      }
    };

    fetchContactSettings();
  }, []);

  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In production, this would call the support ticket API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTicketForm({ subject: '', category: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600">Get help with your vendor account</p>
      </div>

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
          <a
            href="https://wa.me/919737965551"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 font-medium mt-2 block hover:underline"
          >
            Chat on WhatsApp
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
            <Mail className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Email Us</h3>
          <p className="text-sm text-gray-500 mt-1">We reply within 24hrs</p>
          <a href={`mailto:${contactSettings.contactEmail}`} className="text-purple-600 font-medium mt-2 block hover:underline">
            {contactSettings.contactEmail}
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'faq'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            FAQs
          </button>
          <button
            onClick={() => setActiveTab('ticket')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${activeTab === 'ticket'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Raise Ticket
          </button>
        </div>

        <div className="p-6">
          {/* FAQs Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
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

          {/* Raise Ticket Tab */}
          {activeTab === 'ticket' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Submit a Support Ticket</h3>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  Ticket submitted successfully! We will get back to you within 24 hours.
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={ticketForm.category}
                    onChange={handleTicketChange}
                    required
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    <option value="account">Account & Profile</option>
                    <option value="documents">Documents & Verification</option>
                    <option value="bookings">Bookings & Orders</option>
                    <option value="payments">Payments & Payouts</option>
                    <option value="fleet">Fleet & Vehicles</option>
                    <option value="technical">Technical Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={ticketForm.subject}
                    onChange={handleTicketChange}
                    required
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={ticketForm.message}
                    onChange={handleTicketChange}
                    required
                    rows={5}
                    placeholder="Please describe your issue in detail..."
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Expected response: Within 24 hours
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Links */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Helpful Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="#"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition"
          >
            <FileText className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <span className="text-gray-900 font-medium">Vendor Guidelines</span>
              <p className="text-xs text-gray-500">Best practices for vendors</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition"
          >
            <FileText className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <span className="text-gray-900 font-medium">Pricing Guide</span>
              <p className="text-xs text-gray-500">How to set competitive prices</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition"
          >
            <FileText className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <span className="text-gray-900 font-medium">Terms & Conditions</span>
              <p className="text-xs text-gray-500">Vendor partnership agreement</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition"
          >
            <FileText className="w-5 h-5 text-orange-600" />
            <div className="flex-1">
              <span className="text-gray-900 font-medium">Privacy Policy</span>
              <p className="text-xs text-gray-500">How we handle your data</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}

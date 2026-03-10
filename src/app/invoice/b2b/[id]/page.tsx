// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2, Download, CheckCircle, Phone, Mail,
  Calendar, MapPin, CreditCard, FileText, Clock, Users, Car, Bell,
} from 'lucide-react';

declare global {
  interface Window { Razorpay: any; }
}

export default function B2BInvoicePage() {
  const params = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    fetchInvoice();
    // Detect viewer role:
    // If customer token exists in localStorage → customer view (show Pay button)
    // Else check NextAuth session → admin/manager view (show Reminder button)
    const customerData = localStorage.getItem('customer');
    if (customerData) {
      setViewerRole('CUSTOMER');
    } else {
      fetch('/api/auth/session')
        .then(r => r.json())
        .then(d => { if (d?.user?.role) setViewerRole(d.user.role); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  async function fetchInvoice() {
    try {
      const res = await fetch(`/api/b2b/invoices/${params.id}`);
      const data = await res.json();
      if (data.status === 'success') setInvoice(data.invoice);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handlePayment() {
    setPaying(true);
    try {
      const res = await fetch(`/api/b2b/invoices/${params.id}/pay`, { method: 'POST' });
      const data = await res.json();
      if (data.status !== 'success') { alert(data.error || 'Failed'); setPaying(false); return; }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'TransRentals',
        description: `Invoice ${data.invoice.invoiceNumber}`,
        order_id: data.order.id,
        prefill: {
          email: data.invoice.customerEmail || '',
          contact: data.invoice.customerPhone || '',
        },
        theme: { color: '#0d9488' },
        handler: async function (response: any) {
          await fetch(`/api/b2b/invoices/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'mark_paid',
              paymentId: response.razorpay_payment_id,
              transactionRef: response.razorpay_order_id,
              paidAmount: invoice.totalAmount,
            }),
          });
          setPaymentSuccess(true);
          fetchInvoice();
        },
        modal: { ondismiss: () => setPaying(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = invoiceRef.current;
      if (!element) return;

      const paySection = document.getElementById('pay-section');
      if (paySection) paySection.style.display = 'none';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      if (paySection) paySection.style.display = '';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  }

  async function sendReminder() {
    setSendingReminder(true);
    try {
      const res = await fetch(`/api/b2b/invoices/${params.id}/remind`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        alert('Payment reminder sent to the customer successfully!');
      } else {
        alert(data.error || 'Failed to send reminder');
      }
    } catch (e) {
      alert('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  }

  const isAdminOrManager = (viewerRole === 'ADMIN' || viewerRole === 'MANAGER' || viewerRole === 'SUPER_ADMIN' || viewerRole === 'SUB_ADMIN') && viewerRole !== 'CUSTOMER';

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const formatShortDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatCurrency = (v: number) => `₹${(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const TRIP_TYPE_LABELS: Record<string, string> = {
    ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  if (!invoice) return <div className="text-center py-20 text-gray-500">Invoice not found</div>;

  const booking = invoice.booking;
  const isPaid = invoice.status === 'PAID';

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Action Buttons */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-700 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" /> Invoice
        </h1>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <img src="/assets/logo-white.png" alt="TransRentals" className="h-8" />
              <p className="text-teal-200 text-[10px] mt-1 tracking-wide">Corporate Transport Solutions</p>
            </div>
            <div className="text-right">
              <div className="text-white text-2xl font-bold tracking-wider">INVOICE</div>
              <div className="text-teal-100 text-sm font-mono mt-1">{invoice.invoiceNumber}</div>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {isPaid && (
          <div className="bg-green-50 border-b border-green-200 px-8 py-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-semibold">PAID</span>
            <span className="text-green-600 text-sm ml-2">on {formatDate(invoice.paidAt)}</span>
            {invoice.transactionRef && <span className="text-green-500 text-xs ml-auto font-mono">Ref: {invoice.transactionRef}</span>}
          </div>
        )}

        <div className="px-8 py-6 space-y-6">
          {/* Bill To & Invoice Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Bill To</p>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">{invoice.companyName}</p>
                {booking?.customer?.name && <p className="text-sm text-gray-600">{booking.customer.name}</p>}
                {invoice.customerEmail && (
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {invoice.customerEmail}</p>
                )}
                {invoice.customerPhone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {invoice.customerPhone}</p>
                )}
                {booking?.customer?.gstin && (
                  <p className="text-sm text-gray-500">GSTIN: {booking.customer.gstin}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Invoice Date</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(invoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Due Date</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(invoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Booking Ref</p>
                  <p className="text-sm font-mono font-semibold text-teal-700">{booking?.bookingNumber}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Booking Details */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Booking Details</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Car className="w-3 h-3" /> Service Type</p>
                  <p className="font-semibold text-gray-900 capitalize text-sm mt-0.5">{booking?.serviceType === 'self-drive' ? 'Self Drive' : `${booking?.serviceType} Rental`}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trip Type</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">{TRIP_TYPE_LABELS[booking?.tripType] || booking?.tripType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" /> Vehicles</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">{booking?.vehiclesRequired}{booking?.passengerCount ? ` (${booking.passengerCount} passengers)` : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Pickup</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">{booking?.pickupLocation}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {booking?.dropLocation && (
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Drop</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">{booking.dropLocation}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Pickup Date</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">{formatShortDate(booking?.scheduledDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Pickup Time</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">{formatTime(booking?.scheduledTime)}</p>
                </div>
                {booking?.returnDate && (
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Return</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">
                      {formatShortDate(booking.returnDate)}{booking.returnTime ? ` ${formatTime(booking.returnTime)}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle & Trip Table */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Vehicles & Trips</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50">
                  <th className="text-left px-4 py-2.5 text-teal-700 font-semibold text-xs uppercase w-8">#</th>
                  <th className="text-left px-4 py-2.5 text-teal-700 font-semibold text-xs uppercase">Trip Code</th>
                  <th className="text-left px-4 py-2.5 text-teal-700 font-semibold text-xs uppercase">Vehicle</th>
                  <th className="text-left px-4 py-2.5 text-teal-700 font-semibold text-xs uppercase">Reg. No.</th>
                  <th className="text-left px-4 py-2.5 text-teal-700 font-semibold text-xs uppercase">Driver</th>
                  <th className="text-center px-4 py-2.5 text-teal-700 font-semibold text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {booking?.trips?.map((trip: any, i: number) => {
                  const modelName = trip.vehicle?.vehicle_models?.name || null;
                  const brandName = trip.vehicle?.brands?.name || null;
                  const vehName = trip.vehicleName
                    || trip.vehicle?.vehicleName
                    || [brandName, modelName].filter(Boolean).join(' ')
                    || booking?.serviceType?.replace(/-/g, ' ') || '-';
                  const vehNumber = trip.vehicleNumber || trip.vehicle?.registrationNumber || '-';
                  const drvName = trip.driverName || trip.driver?.name || '-';
                  return (
                    <tr key={trip.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{trip.tripCode}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium text-xs">{vehName}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{vehNumber}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs">{drvName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          trip.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          trip.status === 'STARTED' ? 'bg-blue-100 text-blue-700' :
                          trip.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{trip.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Vehicles</span>
                <span className="font-medium text-gray-800">{invoice.totalVehicles}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trips Completed</span>
                <span className="font-medium text-gray-800">{invoice.tripsCompleted}</span>
              </div>
              <div className="border-t border-gray-200 pt-2" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service Charges</span>
                <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="border-t-2 border-teal-600 pt-2" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-teal-700">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <p className="text-xs text-yellow-600 font-semibold mb-1">Notes</p>
              <p className="text-sm text-yellow-800">{invoice.notes}</p>
            </div>
          )}

          {/* Pay / Reminder Section - hidden in PDF */}
          <div id="pay-section">
            {/* Admin / Manager view: show reminder button instead of pay button */}
            {isAdminOrManager && !isPaid && (
              <div className={`border rounded-xl p-5 ${invoice.status === 'OVERDUE' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className={`font-semibold text-sm ${invoice.status === 'OVERDUE' ? 'text-red-700' : 'text-gray-700'}`}>
                      {invoice.status === 'OVERDUE' ? '⚠️ Invoice is Overdue' : 'Invoice Pending Payment'}
                    </p>
                    <p className={`text-xs mt-0.5 ${invoice.status === 'OVERDUE' ? 'text-red-500' : 'text-gray-500'}`}>
                      {invoice.status === 'OVERDUE'
                        ? 'Customer has not paid. Send a reminder notification.'
                        : 'Customer will pay via their invoice link. You can send a reminder if needed.'}
                    </p>
                  </div>
                  <button
                    onClick={sendReminder}
                    disabled={sendingReminder}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition ${
                      invoice.status === 'OVERDUE'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-700 text-white hover:bg-gray-800'
                    }`}
                  >
                    {sendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                    {sendingReminder ? 'Sending...' : 'Send Payment Reminder'}
                  </button>
                </div>
              </div>
            )}

            {/* Customer view: show Razorpay pay button */}
            {!isAdminOrManager && !isPaid && !paymentSuccess && (
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6 text-center">
                <p className="text-gray-600 text-sm mb-3">Pay securely using Razorpay</p>
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 text-lg shadow-lg shadow-teal-200 transition"
                >
                  {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  {paying ? 'Processing...' : `Pay ${formatCurrency(invoice.totalAmount)}`}
                </button>
                <p className="text-xs text-gray-400 mt-2">UPI / Cards / Net Banking / Wallets</p>
              </div>
            )}

            {paymentSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-800 font-bold text-lg">Payment Successful!</p>
                <p className="text-green-600 text-sm mt-1">Thank you for your payment. Your invoice has been marked as paid.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 text-center space-y-1">
            <p className="text-xs text-gray-400">This is a computer-generated invoice and does not require a signature.</p>
            <p className="text-xs text-gray-400">TransRentals | Corporate Transport Solutions</p>
            <p className="text-xs text-gray-400">For queries, contact book@transrentals.in | +91 9737965551</p>
          </div>
        </div>
      </div>
    </div>
  );
}

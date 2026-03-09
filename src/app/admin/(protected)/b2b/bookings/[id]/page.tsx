// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Building2, Truck, Calendar, MapPin, Clock, CheckCircle,
  XCircle, Users, FileText, DollarSign, Copy, ExternalLink, AlertCircle, Send, Eye
} from 'lucide-react';

const STATUS_COLORS = {
  OPEN_FOR_QUOTES: 'bg-blue-100 text-blue-700',
  QUOTES_RECEIVED: 'bg-indigo-100 text-indigo-700',
  SUPER_QUOTE_SENT: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  TRIPS_CREATED: 'bg-teal-100 text-teal-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  INVOICED: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

const TRIP_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  DRIVER_ARRIVED: 'bg-blue-100 text-blue-700',
  STARTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  VENDOR_CANCELLED: 'bg-red-100 text-red-700',
};

export default function AdminB2BBookingDetailPage() {
  const params = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [tripStats, setTripStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [invoiceForm, setInvoiceForm] = useState({ dueDate: '', notes: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchBooking(); }, []);

  async function generateInvoice() {
    if (!invoiceForm.dueDate) { alert('Please set a due date'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/b2b/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, dueDate: invoiceForm.dueDate, notes: invoiceForm.notes }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert(`Invoice ${data.invoice.invoiceNumber} generated successfully!`);
        fetchBooking();
      } else {
        alert(data.error || 'Failed to generate invoice');
      }
    } catch (e) {
      alert('Failed to generate invoice');
    } finally {
      setCreating(false);
    }
  }

  async function fetchBooking() {
    try {
      const res = await fetch(`/api/b2b/bookings/${params.id}`);
      const data = await res.json();
      if (data.status === 'success') {
        setBooking(data.booking);
        setTripStats(data.tripStats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function copyTripLink(tripCode: string) {
    navigator.clipboard.writeText(`${window.location.origin}/trip/${tripCode}`);
    alert('Trip link copied!');
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!booking) {
    return <div className="text-center py-20 text-gray-500">Booking not found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/b2b/bookings" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{booking.bookingNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[booking.status] || 'bg-gray-100'}`}>
              {booking.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-gray-500">{booking.companyName} | {booking.serviceType}</p>
        </div>
      </div>

      {/* Trip Stats Bar */}
      {tripStats && tripStats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total', value: tripStats.total, color: 'blue' },
            { label: 'Pending', value: tripStats.pending, color: 'yellow' },
            { label: 'Arrived', value: tripStats.driverArrived, color: 'indigo' },
            { label: 'Started', value: tripStats.started, color: 'green' },
            { label: 'Completed', value: tripStats.completed, color: 'gray' },
            { label: 'Cancelled', value: tripStats.cancelled, color: 'red' },
          ].map(s => (
            <div key={s.label} className={`bg-${s.color}-50 rounded-lg p-3 text-center`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {['overview', 'vendor-quotes', 'super-quotes', 'trips', 'invoices'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Booking Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium capitalize">{booking.serviceType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Vehicles Required</span><span className="font-medium">{booking.vehiclesRequired}</span></div>
              {booking.passengerCount && <div className="flex justify-between"><span className="text-gray-500">Passengers</span><span className="font-medium">{booking.passengerCount}</span></div>}
              {booking.vehicleCategory && <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{booking.vehicleCategory}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Trip Type</span><span className="font-medium">{booking.tripType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pickup</span><span className="font-medium">{booking.pickupLocation}</span></div>
              {booking.dropLocation && <div className="flex justify-between"><span className="text-gray-500">Drop</span><span className="font-medium">{booking.dropLocation}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{booking.scheduledTime}</span></div>
              {booking.specialNotes && <div className="pt-2 border-t"><span className="text-gray-500 block mb-1">Notes:</span><span>{booking.specialNotes}</span></div>}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Company</span><span className="font-medium">{booking.companyName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contact</span><span className="font-medium">{booking.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{booking.customerEmail}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{booking.customerPhone}</span></div>
            </div>
            {booking.finalAmount && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Financials</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Vendor Cost</span><span>₹{booking.vendorCostTotal?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Margin</span><span>₹{booking.companyMargin?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">GST</span><span>₹{booking.gstAmount?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>₹{booking.finalAmount?.toLocaleString('en-IN')}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'vendor-quotes' && (
        <div className="space-y-4">
          {booking.vendorQuotes?.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-500">No vendor quotes yet</div>
          ) : booking.vendorQuotes?.map((q: any) => (
            <div key={q.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold">{q.vendor?.businessName}</span>
                  <span className="text-sm text-gray-500 ml-2">({q.vendor?.ownerName})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-green-600">₹{q.totalPrice?.toLocaleString('en-IN')}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : q.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {q.status}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-2">{q.vehicleCount} vehicles | ₹{q.pricePerVehicle}/vehicle</div>
              {q.quoteVehicles?.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Assigned Vehicles & Drivers:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.quoteVehicles.map((v: any, i: number) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded p-2">
                        <span className="text-gray-400">{i + 1}.</span>
                        <span className="font-medium">{v.vehicleName || 'Vehicle'}</span>
                        {v.vehicleNumber && <span className="text-gray-500">({v.vehicleNumber})</span>}
                        {v.driverName && <span className="text-blue-600 ml-auto">{v.driverName}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'super-quotes' && (
        <div className="space-y-4">
          {booking.superQuotes?.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-500">No super quotes created</div>
          ) : booking.superQuotes?.map((sq: any) => (
            <div key={sq.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono font-bold text-purple-600">{sq.quoteNumber}</span>
                  <span className="text-sm text-gray-500 ml-2">by {sq.createdBy?.name}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${sq.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : sq.status === 'SENT' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                  {sq.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><div className="text-gray-500">Vendor Cost</div><div className="font-bold">₹{sq.vendorCostTotal?.toLocaleString('en-IN')}</div></div>
                <div><div className="text-gray-500">Margin</div><div className="font-bold">₹{sq.companyMargin?.toLocaleString('en-IN')}</div></div>
                <div><div className="text-gray-500">GST ({sq.gstPercent}%)</div><div className="font-bold">₹{sq.gstAmount?.toLocaleString('en-IN')}</div></div>
                <div><div className="text-gray-500">Final Amount</div><div className="font-bold text-green-600 text-lg">₹{sq.finalAmount?.toLocaleString('en-IN')}</div></div>
              </div>
              {sq.items?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs font-medium text-gray-500 mb-2">Vendor Breakdown:</div>
                  {sq.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>{item.vendorQuote?.quoteNumber} — {item.vehicleCount} vehicles</span>
                      <span className="font-medium">₹{item.vendorPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="space-y-2">
          {booking.trips?.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-500">No trips created yet</div>
          ) : booking.trips?.map((trip: any, i: number) => (
            <div key={trip.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="text-sm text-gray-400 w-8">{i + 1}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{trip.tripCode}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${TRIP_STATUS_COLORS[trip.status] || 'bg-gray-100'}`}>
                    {trip.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {trip.driverName || 'No driver'} | {trip.vehicleName || 'No vehicle'} {trip.vehicleNumber && `(${trip.vehicleNumber})`}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{trip.vendor?.businessName}</div>
              </div>
              <button onClick={() => copyTripLink(trip.tripCode)} className="p-2 hover:bg-gray-100 rounded-lg" title="Copy trip link">
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
              <a href={`/trip/${trip.tripCode}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg" title="Open trip page">
                <ExternalLink className="w-4 h-4 text-blue-500" />
              </a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Generate Invoice Form */}
          {['COMPLETED', 'IN_PROGRESS', 'TRIPS_CREATED'].includes(booking.status) && !booking.invoices?.find((i: any) => i.status !== 'CANCELLED') && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Generate Invoice
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={e => setInvoiceForm(f => ({ ...f, dueDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={invoiceForm.notes}
                    onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Payment terms, remarks..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={generateInvoice}
                  disabled={creating || !invoiceForm.dueDate}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {creating ? 'Generating...' : 'Generate Invoice'}
                </button>
                {booking.finalAmount && (
                  <span className="text-sm text-gray-500">Amount: <span className="font-semibold text-gray-800">₹{booking.finalAmount?.toLocaleString('en-IN')}</span></span>
                )}
              </div>
            </div>
          )}

          {/* Existing Invoices */}
          {booking.invoices?.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border text-gray-500">No invoices generated yet</div>
          ) : booking.invoices?.map((inv: any) => (
            <div key={inv.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-orange-600">{inv.invoiceNumber}</span>
                <div className="flex items-center gap-2">
                  <a href={`/invoice/b2b/${inv.id}`} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-200 rounded-lg">
                    <Eye className="w-3 h-3" /> View
                  </a>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><div className="text-gray-500">Total</div><div className="font-bold">₹{inv.totalAmount?.toLocaleString('en-IN')}</div></div>
                <div><div className="text-gray-500">Trips</div><div className="font-bold">{inv.tripsCompleted}/{inv.totalVehicles}</div></div>
                <div><div className="text-gray-500">Due Date</div><div className="font-bold">{new Date(inv.dueDate).toLocaleDateString('en-IN')}</div></div>
                <div><div className="text-gray-500">Paid</div><div className="font-bold">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('en-IN') : '-'}</div></div>
              </div>
              {inv.notes && <div className="mt-2 pt-2 border-t text-sm text-gray-500">{inv.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Inbox, Loader2, AlertCircle, Calendar, Users, MapPin, Clock,
  CheckCircle, ChevronLeft, Send, Plus, X, Info, Zap,
} from 'lucide-react';
import Link from 'next/link';

function parseJSON(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

export default function VendorWanderQuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    amount: '',
    perPersonAmount: '',
    extraInclusions: [],    // extra beyond listing defaults
    extraExclusions: [],
    extraInclusionInput: '',
    extraExclusionInput: '',
    validUntil: '',
    notes: '',
  });

  useEffect(() => { fetchRequest(); }, [id]);

  async function fetchRequest() {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/wander/quotes?status=all`);
      const data = await res.json();
      const found = (data.requests || []).find((r) => r.id === id);
      if (found) {
        setReq(found);
        // Pre-fill pricing from listing
        const listing = found.listing;
        const groupSize = parseInt(found.groupSize) || 1;
        let preAmount = '';
        let prePerPerson = '';
        if (listing?.priceType === 'PER_PERSON' && listing?.basePrice) {
          prePerPerson = String(listing.basePrice);
          preAmount = String(Math.round(Number(listing.basePrice) * groupSize));
        } else if (listing?.priceType === 'PER_GROUP' || listing?.priceType === 'GROUP_BASED') {
          const tiers = parseJSON(listing.priceTiers, []);
          const sorted = [...tiers].sort((a, b) => parseInt(a.groupSize) - parseInt(b.groupSize));
          const match = sorted.find(t => parseInt(t.groupSize) >= groupSize) || sorted[sorted.length - 1];
          if (match?.price) preAmount = String(match.price);
        }
        setQuoteForm(f => ({ ...f, amount: preAmount, perPersonAmount: prePerPerson }));
      } else {
        setError('Quote request not found');
      }
    } catch {
      setError('Failed to load request');
    } finally {
      setLoading(false);
    }
  }

  async function submitQuote() {
    if (!quoteForm.amount) { setError('Please enter a quote amount'); return; }
    setSubmitting(true);
    setError('');
    try {
      const listingInclusions = parseJSON(req?.listing?.inclusions, []);
      const listingExclusions = parseJSON(req?.listing?.exclusions, []);
      const allInclusions = [...new Set([...listingInclusions, ...quoteForm.extraInclusions])].filter(Boolean);
      const allExclusions = [...new Set([...listingExclusions, ...quoteForm.extraExclusions])].filter(Boolean);

      const res = await fetch(`/api/vendor/wander/quotes/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: quoteForm.amount,
          perPersonAmount: quoteForm.perPersonAmount || null,
          customInclusions: allInclusions,
          customExclusions: allExclusions,
          validUntil: quoteForm.validUntil || null,
          notes: quoteForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit quote'); return; }
      router.push('/vendor/wander/quotes');
    } catch {
      setError('Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
    </div>
  );

  if (error && !req) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
      </div>
    </div>
  );

  const myQuote = req?.quotes?.[0];
  const alreadyQuoted = !!myQuote;
  const travelDate = req ? new Date(req.travelDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const listing = req?.listing;
  const groupSize = parseInt(req?.groupSize) || 1;

  const listingInclusions = parseJSON(listing?.inclusions, []);
  const listingExclusions = parseJSON(listing?.exclusions, []);

  const isPP = listing?.priceType === 'PER_PERSON';

  const hasAdvance = listing?.requireAdvancePayment && listing?.advancePaymentValue;
  function calcAdvance(totalAmt) {
    if (!hasAdvance || !totalAmt) return null;
    return listing.advancePaymentType === 'PERCENTAGE'
      ? Math.round((Number(totalAmt) * listing.advancePaymentValue) / 100)
      : listing.advancePaymentValue;
  }

  function recalcTotal(ppVal) {
    if (isPP && ppVal) {
      setQuoteForm(f => ({ ...f, perPersonAmount: ppVal, amount: String(Math.round(Number(ppVal) * groupSize)) }));
    } else {
      setQuoteForm(f => ({ ...f, perPersonAmount: ppVal }));
    }
  }

  function addExtra(field, inputField) {
    const val = quoteForm[inputField]?.trim();
    if (!val) return;
    setQuoteForm(f => ({ ...f, [field]: [...f[field], val], [inputField]: '' }));
  }

  function removeExtra(field, item) {
    setQuoteForm(f => ({ ...f, [field]: f[field].filter(x => x !== item) }));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendor/wander/quotes" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quote Request</h1>
          <p className="text-sm text-gray-500">{req?.requestId}</p>
        </div>
      </div>

      {/* Request Details Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-lg">{listing?.title}</h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            req?.status === 'PENDING' ? 'bg-blue-50 text-blue-700' :
            req?.status === 'QUOTED' ? 'bg-amber-50 text-amber-700' :
            req?.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {req?.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500">Travel Date</p>
              <p className="font-medium">{travelDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500">Group Size</p>
              <p className="font-medium">{groupSize} traveler{groupSize > 1 ? 's' : ''}</p>
            </div>
          </div>
          {req?.pickupLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="text-xs text-gray-500">Pickup From</p>
                <p className="font-medium">{req.pickupLocation}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500">Requested On</p>
              <p className="font-medium">{req && new Date(req.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>

        {req?.customer && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-xs text-gray-500 mb-1">Customer</p>
            <p className="font-medium text-gray-800">{req.customer.name} — {req.customer.phone}</p>
          </div>
        )}

        {req?.requirements && (
          <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-indigo-600 font-medium mb-1">Special Requirements</p>
            <p className="text-sm text-indigo-800">{req.requirements}</p>
          </div>
        )}
      </div>

      {/* Quote already submitted */}
      {alreadyQuoted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-emerald-800">Quote Submitted</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="font-bold text-emerald-700 text-lg">₹{myQuote.amount?.toLocaleString('en-IN')}</p>
            </div>
            {myQuote.perPersonAmount && (
              <div>
                <p className="text-xs text-gray-500">Per Person</p>
                <p className="font-medium text-gray-800">₹{myQuote.perPersonAmount?.toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>
          {/* Advance payment info on submitted quote */}
          {(() => {
            const adv = calcAdvance(myQuote.amount);
            if (!adv) return null;
            return (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700">
                    Customer must pay ₹{adv.toLocaleString('en-IN')} advance
                    {listing.advancePaymentType === 'PERCENTAGE' ? ` (${listing.advancePaymentValue}% of your quote)` : ''}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Balance ₹{(Number(myQuote.amount) - adv).toLocaleString('en-IN')} due on trip day
                  </p>
                </div>
              </div>
            );
          })()}
          {myQuote.notes && (
            <p className="mt-3 text-sm text-gray-700 italic">"{myQuote.notes}"</p>
          )}
          <p className="mt-3 text-xs text-emerald-600">Waiting for customer to accept your quote.</p>
        </div>
      ) : req?.status === 'PENDING' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Submit Your Quote</h2>

          {/* Advance payment notice (always visible if set) */}
          {hasAdvance && (
            <div className="mb-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <span className="font-bold">Advance payment is enabled</span> for this tour —
                customer will be asked to pay{' '}
                {listing?.advancePaymentType === 'PERCENTAGE'
                  ? <><span className="font-bold">{listing.advancePaymentValue}%</span> of your quoted price upfront</>
                  : <><span className="font-bold">₹{Number(listing?.advancePaymentValue).toLocaleString('en-IN')}</span> fixed advance</>}
                {' '}and the balance on trip day.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-5">

            {/* Pricing */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pricing</label>
              <div className={`grid gap-3 ${isPP ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {isPP && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Per Person (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={quoteForm.perPersonAmount}
                        onChange={(e) => recalcTotal(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {isPP && listing?.basePrice && (
                      <p className="text-xs text-indigo-500 mt-1">
                        Listed price: ₹{Number(listing.basePrice).toLocaleString('en-IN')} / person
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Total Amount (₹) <span className="text-red-500">*</span>
                    {isPP && quoteForm.perPersonAmount && (
                      <span className="ml-1 text-indigo-500 font-normal">
                        (₹{quoteForm.perPersonAmount} × {groupSize})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={quoteForm.amount}
                      onChange={(e) => setQuoteForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="e.g. 12000"
                      className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Advance payment preview */}
            {hasAdvance && quoteForm.amount && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800 mb-1">
                    Advance Payment Required by This Tour
                  </p>
                  <p className="text-xs text-amber-600 mb-2">
                    {listing.advancePaymentType === 'PERCENTAGE'
                      ? `This tour requires ${listing.advancePaymentValue}% advance payment from the customer.`
                      : `This tour requires a fixed advance of ₹${Number(listing.advancePaymentValue).toLocaleString('en-IN')} from the customer.`}
                  </p>
                  {(() => {
                    const adv = calcAdvance(quoteForm.amount);
                    if (!adv) return null;
                    const balance = Number(quoteForm.amount) - adv;
                    return (
                      <div className="flex gap-4 text-sm">
                        <div>
                          <p className="text-[10px] text-amber-500 uppercase tracking-wider">Customer pays now</p>
                          <p className="font-black text-amber-700 text-base">₹{adv.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="border-l border-amber-200 pl-4">
                          <p className="text-[10px] text-amber-500 uppercase tracking-wider">Balance on trip day</p>
                          <p className="font-black text-amber-700 text-base">₹{balance.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Tour Inclusions (from listing — read-only) */}
            {listingInclusions.length > 0 && (
              <div className="border border-emerald-100 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Included in this tour</p>
                  <span className="ml-auto text-xs text-emerald-500 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Set in tour listing
                  </span>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {listingInclusions.map((inc) => (
                    <span key={inc} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700">
                      <CheckCircle className="w-3 h-3 text-emerald-500" /> {inc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extra inclusions for this quote */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Extra Inclusions <span className="text-gray-400 font-normal">(specific to this quote)</span></label>
              <div className="flex flex-wrap gap-2 mb-2">
                {quoteForm.extraInclusions.map((inc) => (
                  <span key={inc} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-700">
                    {inc}
                    <button onClick={() => removeExtra('extraInclusions', inc)} className="text-indigo-400 hover:text-red-500 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quoteForm.extraInclusionInput}
                  onChange={(e) => setQuoteForm(f => ({ ...f, extraInclusionInput: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtra('extraInclusions', 'extraInclusionInput'); } }}
                  placeholder="e.g. Welcome drink, Boat ride..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => addExtra('extraInclusions', 'extraInclusionInput')}
                  className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Extra exclusions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Exclusions <span className="text-gray-400 font-normal">(not included in this quote)</span></label>
              {listingExclusions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {listingExclusions.map((ex) => (
                    <span key={ex} className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-600">{ex}</span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                {quoteForm.extraExclusions.map((ex) => (
                  <span key={ex} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700">
                    {ex}
                    <button onClick={() => removeExtra('extraExclusions', ex)} className="text-red-400 hover:text-red-600 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quoteForm.extraExclusionInput}
                  onChange={(e) => setQuoteForm(f => ({ ...f, extraExclusionInput: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtra('extraExclusions', 'extraExclusionInput'); } }}
                  placeholder="e.g. Entry fees, Lunch..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => addExtra('extraExclusions', 'extraExclusionInput')}
                  className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Valid Until + Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quote Valid Until</label>
                <input
                  type="date"
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm(f => ({ ...f, validUntil: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes for Customer</label>
              <textarea
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Any special notes, terms, or details..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={submitQuote}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Quote
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 text-center">
          This request is {req?.status?.toLowerCase()} and cannot be responded to.
        </div>
      )}
    </div>
  );
}

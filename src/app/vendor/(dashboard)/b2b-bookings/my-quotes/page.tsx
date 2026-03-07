'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Car, Calendar, MapPin, RefreshCw, CheckCircle, Clock,
  AlertCircle, Users, Send, ChevronDown, ChevronUp, Shield, Fuel, Settings2,
} from 'lucide-react';

const QUOTE_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Send },
  REVISION_REQUESTED: { label: 'Revision Requested', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  REVISED: { label: 'Revised', color: 'bg-cyan-100 text-cyan-700', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { label: 'Not Selected', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
};

function parseQuoteNotes(notes: string | null) {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed.isSelfDriveQuote || parsed.isCarRentalQuote) return parsed;
    return null;
  } catch {
    return null;
  }
}

function getVehicleName(v: any) {
  if (!v) return null;
  const vehicle = v.vehicle;
  if (!vehicle) return v.vehicleName || null;
  return v.vehicleName
    || vehicle.vehicleName
    || [vehicle.brands?.name || vehicle.vehicle_models?.brands?.name, vehicle.vehicle_models?.name].filter(Boolean).join(' ')
    || vehicle.chauffeur_vehicle_categories?.name
    || null;
}

export default function VendorB2BMyQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/b2b-quotes?view=my');
      const data = await response.json();
      if (data.status === 'success') setQuotes(data.quotes || []);
    } catch (error) { console.error('Failed to fetch quotes:', error); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Send className="w-7 h-7 text-teal-600" />
            My B2B Quotes
          </h1>
          <p className="text-gray-500 mt-1">Track your submitted quotes for B2B corporate bookings</p>
        </div>
        <button onClick={fetchQuotes}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Quotes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No Quotes Yet</h3>
          <p className="text-gray-500 mt-1">Submit quotes on open B2B requests to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote: any) => {
            const statusConfig = QUOTE_STATUS[quote.status] || { label: quote.status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
            const StatusIcon = statusConfig.icon;
            const sdDetails = parseQuoteNotes(quote.notes);
            const isExpanded = expandedQuotes[quote.id];

            return (
              <div key={quote.id} className={`bg-white rounded-xl border overflow-hidden ${
                quote.status === 'CONFIRMED' ? 'border-green-200' :
                quote.status === 'REJECTED' ? 'border-red-200 opacity-80' : 'border-gray-200'
              }`}>
                {/* Header */}
                <div className={`border-b px-6 py-3 flex items-center justify-between ${
                  quote.status === 'CONFIRMED' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' :
                  quote.status === 'REJECTED' ? 'bg-gradient-to-r from-red-50 to-red-50/50 border-red-100' :
                  'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    <span className="text-xs font-mono text-gray-500">{quote.booking.bookingNumber}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" /> {statusConfig.label}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      {/* Quote Number & Booking Info */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-mono text-gray-500">{quote.quoteNumber}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {quote.booking.serviceType === 'self-drive' ? 'Self Drive' : quote.booking.serviceType}
                        </span>
                        <span className="text-xs text-gray-500">{TRIP_TYPE_LABELS[quote.booking.tripType] || quote.booking.tripType}</span>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-green-500" />
                          {quote.booking.pickupLocation}
                          {quote.booking.dropLocation && ` → ${quote.booking.dropLocation}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {formatDate(quote.booking.scheduledDate)}
                        </span>
                      </div>

                      {/* Vehicles Assigned */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">
                          Your Vehicles: {quote.vehicleCount} of {quote.booking.vehiclesRequired} required
                        </p>
                        <div className="grid md:grid-cols-2 gap-2">
                          {quote.quoteVehicles?.map((v: any, i: number) => {
                            const vName = getVehicleName(v);
                            const vNumber = v.vehicleNumber || v.vehicle?.registrationNumber || null;
                            return (
                              <div key={v.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-sm">
                                <Car className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-gray-900">{vName || 'Vehicle ' + (i + 1)}</span>
                                  {vNumber && <span className="text-gray-400 ml-1.5 text-xs">({vNumber})</span>}
                                </div>
                                {v.driverName && (
                                  <span className="text-gray-500 text-xs flex items-center gap-1">
                                    <Users className="w-3 h-3" />{v.driverName}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-teal-700">
                        ₹{quote.totalPrice.toLocaleString('en-IN')}
                      </p>
                      {quote.pricePerVehicle && (
                        <p className="text-sm text-gray-500">
                          ₹{quote.pricePerVehicle.toLocaleString('en-IN')}/vehicle
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Submitted {formatDate(quote.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Expand/Collapse for Quote Details */}
                  {sdDetails && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedQuotes(prev => ({ ...prev, [quote.id]: !prev[quote.id] }))}
                        className="text-sm text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Hide' : 'View'} Quote Details
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {/* Pricing Grid */}
                          {sdDetails.isSelfDriveQuote && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                              <div className="bg-teal-50 rounded-lg p-2.5 text-center">
                                <div className="text-xs text-teal-600">Per Vehicle ({sdDetails.rentalDays} days)</div>
                                <div className="font-bold text-teal-800">₹{sdDetails.pricePerVehicle?.toLocaleString('en-IN')}</div>
                                {sdDetails.dailyRate > 0 && <div className="text-xs text-teal-500">₹{sdDetails.dailyRate?.toLocaleString('en-IN')}/day</div>}
                              </div>
                              <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                                <div className="text-xs text-blue-600">Security Deposit</div>
                                <div className="font-bold text-blue-800">₹{sdDetails.securityDeposit?.toLocaleString('en-IN')}</div>
                                <div className="text-xs text-blue-500">Refundable</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                                <div className="text-xs text-gray-600">KM Limit</div>
                                <div className="font-bold text-gray-800">{sdDetails.kmLimitPerDay} km/day</div>
                                <div className="text-xs text-gray-500">Extra: ₹{sdDetails.extraKmRate}/km</div>
                              </div>
                              <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                                <div className="text-xs text-amber-600">Advance ({sdDetails.advancePercent}%)</div>
                                <div className="font-bold text-amber-800">₹{sdDetails.advanceAmount?.toLocaleString('en-IN')}</div>
                                <div className="text-xs text-amber-500">Valid {sdDetails.validityDays} days</div>
                              </div>
                            </div>
                          )}

                          {(sdDetails.deliveryCharges > 0 || sdDetails.pickupCharges > 0) && (
                            <div className="flex gap-3 text-xs text-gray-500">
                              {sdDetails.deliveryCharges > 0 && <span>Delivery: ₹{sdDetails.deliveryCharges?.toLocaleString('en-IN')}</span>}
                              {sdDetails.pickupCharges > 0 && <span>Pickup: ₹{sdDetails.pickupCharges?.toLocaleString('en-IN')}</span>}
                            </div>
                          )}

                          {/* Inclusions */}
                          {sdDetails.inclusions?.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Inclusions
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {sdDetails.inclusions.map((item: string, i: number) => (
                                  <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-100">{item}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Exclusions */}
                          {sdDetails.exclusions?.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Exclusions
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {sdDetails.exclusions.map((item: string, i: number) => (
                                  <span key={i} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs border border-red-100">{item}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Terms & Conditions */}
                          {sdDetails.termsConditions?.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-gray-600 mb-1.5">Terms & Conditions</div>
                              <div className="space-y-1">
                                {sdDetails.termsConditions.map((item: string, i: number) => (
                                  <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                    <span className="text-gray-400 font-medium mt-px">{i + 1}.</span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Vendor Message */}
                          {sdDetails.vendorMessage && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                              <p className="text-xs text-yellow-800">{sdDetails.vendorMessage}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plain text notes (non-JSON) */}
                  {quote.notes && !sdDetails && (
                    <p className="text-sm text-gray-500 italic mt-3">{quote.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

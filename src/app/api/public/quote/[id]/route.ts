// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function parseJson(f: any, fallback: any[] = []): any[] {
  if (!f) return fallback;
  if (Array.isArray(f)) return f;
  try { return JSON.parse(f); } catch { return fallback; }
}

function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '****' + digits.slice(-4);
}

const VENDOR_SELECT = { businessName: true, phone: true, logo: true, city: true, state: true, description: true };

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // Fan out all 7 quote lookups in parallel — same id can only ever match one table,
  // but we don't know which, so query all at once instead of sequential cascade.
  // Cuts worst-case latency from ~7 roundtrips to 1.
  const [bike, bus, eq, pk, sd, tk, wq] = await Promise.all([
    prisma.bike_quotes.findUnique({
      where: { id },
      include: {
        vendors: { select: VENDOR_SELECT },
        bike_quote_requests_bike_quotes_requestIdTobike_quote_requests: {
          select: { id: true, customerName: true, customerPhone: true, pickupDate: true, dropDate: true, locationName: true, totalDays: true, requestNumber: true, status: true, acceptedQuoteId: true },
        },
      },
    }).catch(() => null),
    prisma.bus_quotes.findUnique({
      where: { id },
      include: {
        vendors: { select: VENDOR_SELECT },
        bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: {
          select: { id: true, customerName: true, customerPhone: true, pickupDate: true, pickupCity: true, dropCity: true, tripDays: true, requestNumber: true, passengers: true, status: true },
        },
      },
    }).catch(() => null),
    prisma.equipment_quotes.findUnique({
      where: { id },
      include: {
        vendors: { select: VENDOR_SELECT },
        equipment_quote_requests: { select: { id: true, customerName: true, customerPhone: true, startDate: true, endDate: true, deliveryCity: true, equipmentType: true, rentalDuration: true, requestNumber: true, status: true } },
      },
    }).catch(() => null),
    prisma.packers_quotes.findUnique({
      where: { id },
      include: {
        vendors: { select: VENDOR_SELECT },
        packers_quote_requests: { select: { id: true, customerName: true, customerPhone: true, preferredDate: true, pickupCity: true, dropCity: true, serviceType: true, requestNumber: true, status: true } },
      },
    }).catch(() => null),
    prisma.self_drive_quotes.findUnique({
      where: { id },
      include: {
        vendors: { select: VENDOR_SELECT },
        self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: {
          select: { id: true, customerName: true, customerPhone: true, pickupDate: true, dropDate: true, locationName: true, totalDays: true, requestNumber: true, vehicleCategoryName: true, status: true },
        },
      },
    }).catch(() => null),
    prisma.truck_quotes.findUnique({
      where: { id },
      include: {
        vendors: { select: VENDOR_SELECT },
        truck_quote_requests: { select: { id: true, customerName: true, customerPhone: true, pickupDate: true, pickupCity: true, dropCity: true, serviceType: true, requestNumber: true, status: true } },
      },
    }).catch(() => null),
    (prisma as any).wander_quotes.findUnique({
      where: { id },
      include: {
        vendor: { select: VENDOR_SELECT },
        quoteRequest: {
          include: {
            listing: { select: { title: true, inclusions: true, exclusions: true, requireAdvancePayment: true, advancePaymentType: true, advancePaymentValue: true } },
            customer: { select: { name: true, phone: true, email: true } },
          },
        },
      },
    }).catch(() => null),
  ]);

  // ── Bike ──────────────────────────────────────────────────────────
  if (bike) {
    const r = bike.bike_quote_requests_bike_quotes_requestIdTobike_quote_requests;
    const advanceAmount = bike.advanceAmount || Math.round((bike.grandTotal || 0) * (bike.advancePercent || 30) / 100);
    const pricing = [
      { label: `Daily Rate (₹${bike.dailyRate?.toLocaleString('en-IN')} × ${r?.totalDays || 1} days)`, amount: bike.totalAmount },
      bike.gstAmount > 0 ? { label: 'GST', amount: bike.gstAmount } : null,
      bike.securityDeposit > 0 ? { label: 'Security Deposit', amount: bike.securityDeposit, note: 'Refundable' } : null,
      { label: 'Grand Total', amount: bike.grandTotal, isTotal: true },
      { label: `Advance (${bike.advancePercent || 30}%)`, amount: advanceAmount, isAdvance: true },
      { label: 'Balance on Pickup', amount: (bike.grandTotal || 0) - advanceAmount },
    ].filter(Boolean);
    const alreadyAccepted = r?.acceptedQuoteId === id;
    let existingBooking = null;
    if (alreadyAccepted) {
      existingBooking = await prisma.bike_bookings.findFirst({ where: { acceptedQuoteId: id }, select: { id: true, bookingNumber: true, status: true, paymentStatus: true } }).catch(() => null);
    }
    return NextResponse.json({
      serviceType: 'bike', serviceName: 'Bike Rental', bookingType: 'bike',
      vendorName: bike.vendors?.businessName || '', vendorPhone: bike.vendors?.phone || '',
      vendorLogo: bike.vendors?.logo || null, vendorCity: bike.vendors?.city || '', vendorState: bike.vendors?.state || '',
      vendorDescription: bike.vendors?.description || null,
      quoteNumber: bike.quoteNumber, amount: bike.grandTotal, advanceAmount, balanceAmount: (bike.grandTotal || 0) - advanceAmount,
      validTill: bike.validTill, status: bike.status, serviceDetail: bike.vehicleName || bike.vehicleCategory || '',
      inclusions: parseJson(bike.inclusions), exclusions: parseJson(bike.exclusions), termsConditions: parseJson(bike.termsConditions),
      pricing, requestId: r?.id,
      request: { customerName: r?.customerName, customerPhone: maskPhone(r?.customerPhone), date: r?.pickupDate, endDate: r?.dropDate, location: r?.locationName, duration: r?.totalDays ? `${r.totalDays} day${r.totalDays > 1 ? 's' : ''}` : null, requestNumber: r?.requestNumber },
      existingBooking,
    });
  }

  // ── Bus ───────────────────────────────────────────────────────────
  if (bus) {
    const r = bus.bus_quote_requests_bus_quotes_requestIdTobus_quote_requests;
    const advanceAmount = bus.advanceAmount || Math.round((bus.totalAmount || 0) * 0.3);
    const additionalCharges = (bus.driverAllowance || 0) + (bus.tollEstimate || 0) + (bus.parkingEstimate || 0) + (bus.nightHaltCharges || 0) + (bus.permitCharges || 0);
    const pricing = [
      { label: 'Base Amount', amount: bus.baseAmount },
      additionalCharges > 0 ? { label: 'Additional Charges', amount: additionalCharges } : null,
      bus.gstAmount > 0 ? { label: 'GST', amount: bus.gstAmount } : null,
      { label: 'Total Amount', amount: bus.totalAmount, isTotal: true },
      { label: 'Advance (30%)', amount: advanceAmount, isAdvance: true },
      { label: 'Balance on Trip Day', amount: (bus.totalAmount || 0) - advanceAmount },
    ].filter(Boolean);
    const existingBooking = await prisma.bus_bookings.findFirst({ where: { acceptedQuoteId: id }, select: { id: true, bookingNumber: true, status: true, paymentStatus: true } }).catch(() => null);
    return NextResponse.json({
      serviceType: 'bus', serviceName: 'Bus Rental', bookingType: 'bus',
      vendorName: bus.vendors?.businessName || '', vendorPhone: bus.vendors?.phone || '',
      vendorLogo: bus.vendors?.logo || null, vendorCity: bus.vendors?.city || '', vendorState: bus.vendors?.state || '',
      vendorDescription: bus.vendors?.description || null,
      quoteNumber: bus.quoteNumber, amount: bus.totalAmount, advanceAmount, balanceAmount: (bus.totalAmount || 0) - advanceAmount,
      validTill: bus.validTill, status: bus.status, serviceDetail: bus.vehicleName || bus.vehicleCategory || '',
      inclusions: parseJson(bus.inclusions), exclusions: parseJson(bus.exclusions), termsConditions: parseJson(bus.termsConditions),
      pricing, requestId: r?.id,
      request: { customerName: r?.customerName, customerPhone: maskPhone(r?.customerPhone), date: r?.pickupDate, location: r?.pickupCity && r?.dropCity ? `${r.pickupCity} → ${r.dropCity}` : r?.pickupCity || '', duration: r?.tripDays ? `${r.tripDays} day${r.tripDays > 1 ? 's' : ''}` : null, groupSize: r?.passengers, requestNumber: r?.requestNumber },
      existingBooking,
    });
  }

  // ── Equipment ─────────────────────────────────────────────────────
  if (eq) {
    const r = eq.equipment_quote_requests;
    const advanceAmount = Math.round((eq.totalAmount || 0) * 0.3) + (eq.securityDeposit || 0);
    const pricing = [
      { label: 'Base Amount', amount: eq.baseAmount },
      eq.deliveryCharges > 0 ? { label: 'Delivery Charges', amount: eq.deliveryCharges } : null,
      eq.operatorCharges > 0 ? { label: 'Operator Charges', amount: eq.operatorCharges } : null,
      eq.securityDeposit > 0 ? { label: 'Security Deposit', amount: eq.securityDeposit, note: 'Refundable' } : null,
      eq.gstAmount > 0 ? { label: 'GST', amount: eq.gstAmount } : null,
      { label: 'Total Amount', amount: eq.totalAmount, isTotal: true },
      { label: 'Advance (30% + Security)', amount: advanceAmount, isAdvance: true },
      { label: 'Balance on Delivery', amount: (eq.totalAmount || 0) - Math.round((eq.totalAmount || 0) * 0.3) },
    ].filter(Boolean);
    const existingBooking = await prisma.equipment_bookings.findFirst({ where: { acceptedQuoteId: id }, select: { id: true, bookingNumber: true, status: true, paymentStatus: true } }).catch(() => null);
    return NextResponse.json({
      serviceType: 'equipment', serviceName: 'Equipment Rental', bookingType: 'equipment',
      vendorName: eq.vendors?.businessName || '', vendorPhone: eq.vendors?.phone || '',
      vendorLogo: eq.vendors?.logo || null, vendorCity: eq.vendors?.city || '', vendorState: eq.vendors?.state || '',
      vendorDescription: eq.vendors?.description || null,
      quoteNumber: eq.quoteNumber, amount: eq.totalAmount, advanceAmount, balanceAmount: (eq.totalAmount || 0) - Math.round((eq.totalAmount || 0) * 0.3),
      validTill: eq.validTill, status: eq.status, serviceDetail: eq.equipmentName || r?.equipmentType || '',
      inclusions: parseJson(eq.inclusions), exclusions: parseJson(eq.exclusions), termsConditions: parseJson(eq.termsConditions),
      pricing, requestId: r?.id,
      request: { customerName: r?.customerName, customerPhone: maskPhone(r?.customerPhone), date: r?.startDate, endDate: r?.endDate, location: r?.deliveryCity || '', duration: r?.rentalDuration || null, requestNumber: r?.requestNumber },
      existingBooking,
    });
  }

  // ── Packers ───────────────────────────────────────────────────────
  if (pk) {
    const r = pk.packers_quote_requests;
    const advanceAmount = Math.round((pk.totalAmount || 0) * 0.3);
    const pricing = [
      pk.packingCharges > 0 ? { label: 'Packing', amount: pk.packingCharges } : null,
      pk.loadingCharges > 0 ? { label: 'Loading', amount: pk.loadingCharges } : null,
      { label: 'Transport', amount: pk.transportCharges },
      pk.unloadingCharges > 0 ? { label: 'Unloading', amount: pk.unloadingCharges } : null,
      pk.unpackingCharges > 0 ? { label: 'Unpacking', amount: pk.unpackingCharges } : null,
      pk.storageCharges > 0 ? { label: 'Storage', amount: pk.storageCharges } : null,
      pk.insuranceCharges > 0 ? { label: 'Insurance', amount: pk.insuranceCharges } : null,
      pk.materialCharges > 0 ? { label: 'Packing Materials', amount: pk.materialCharges } : null,
      pk.gstAmount > 0 ? { label: 'GST', amount: pk.gstAmount } : null,
      { label: 'Total Amount', amount: pk.totalAmount, isTotal: true },
      { label: 'Advance (30%)', amount: advanceAmount, isAdvance: true },
      { label: 'Balance on Moving Day', amount: (pk.totalAmount || 0) - advanceAmount },
    ].filter(Boolean);
    const existingBooking = await prisma.packers_bookings.findFirst({ where: { acceptedQuoteId: id }, select: { id: true, bookingNumber: true, status: true, paymentStatus: true } }).catch(() => null);
    return NextResponse.json({
      serviceType: 'packers', serviceName: 'Packers & Movers', bookingType: 'packers',
      vendorName: pk.vendors?.businessName || '', vendorPhone: pk.vendors?.phone || '',
      vendorLogo: pk.vendors?.logo || null, vendorCity: pk.vendors?.city || '', vendorState: pk.vendors?.state || '',
      vendorDescription: pk.vendors?.description || null,
      quoteNumber: pk.quoteNumber, amount: pk.totalAmount, advanceAmount, balanceAmount: (pk.totalAmount || 0) - advanceAmount,
      validTill: pk.validTill, status: pk.status, serviceDetail: pk.vehicleType || r?.serviceType || '',
      inclusions: parseJson(pk.inclusions), exclusions: parseJson(pk.exclusions), termsConditions: parseJson(pk.termsConditions),
      pricing, requestId: r?.id,
      request: { customerName: r?.customerName, customerPhone: maskPhone(r?.customerPhone), date: r?.preferredDate, location: r?.pickupCity && r?.dropCity ? `${r.pickupCity} → ${r.dropCity}` : r?.pickupCity || '', requestNumber: r?.requestNumber },
      existingBooking,
    });
  }

  // ── Self Drive ────────────────────────────────────────────────────
  if (sd) {
    const r = sd.self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests;
    const advanceAmount = sd.advanceAmount || Math.round((sd.grandTotal || 0) * (sd.advancePercent || 30) / 100);
    const pricing = [
      { label: `Daily Rate (₹${sd.dailyRate?.toLocaleString('en-IN')} × ${r?.totalDays || 1} days)`, amount: sd.baseAmount },
      sd.deliveryCharges > 0 ? { label: 'Delivery Charges', amount: sd.deliveryCharges } : null,
      sd.pickupCharges > 0 ? { label: 'Pickup Charges', amount: sd.pickupCharges } : null,
      sd.platformFee > 0 ? { label: 'Platform Fee', amount: sd.platformFee } : null,
      sd.gstAmount > 0 ? { label: 'GST', amount: sd.gstAmount } : null,
      sd.securityDeposit > 0 ? { label: 'Security Deposit', amount: sd.securityDeposit, note: 'Refundable' } : null,
      { label: 'Grand Total', amount: sd.grandTotal, isTotal: true },
      { label: `Advance (${sd.advancePercent || 30}%)`, amount: advanceAmount, isAdvance: true },
      { label: 'Balance on Pickup', amount: (sd.grandTotal || 0) - advanceAmount },
    ].filter(Boolean);
    const existingBooking = await prisma.car_bookings.findFirst({ where: { acceptedQuoteId: id }, select: { id: true, bookingNumber: true, status: true, paymentStatus: true } }).catch(() => null);
    return NextResponse.json({
      serviceType: 'selfdrive', serviceName: 'Self Drive', bookingType: 'self-drive',
      vendorName: sd.vendors?.businessName || '', vendorPhone: sd.vendors?.phone || '',
      vendorLogo: sd.vendors?.logo || null, vendorCity: sd.vendors?.city || '', vendorState: sd.vendors?.state || '',
      vendorDescription: sd.vendors?.description || null,
      quoteNumber: sd.quoteNumber, amount: sd.grandTotal, advanceAmount, balanceAmount: (sd.grandTotal || 0) - advanceAmount,
      validTill: sd.validTill, status: sd.status, serviceDetail: sd.vehicleName || r?.vehicleCategoryName || '',
      inclusions: parseJson(sd.inclusions), exclusions: parseJson(sd.exclusions),
      pricing, requestId: r?.id,
      request: { customerName: r?.customerName, customerPhone: maskPhone(r?.customerPhone), date: r?.pickupDate, endDate: r?.dropDate, location: r?.locationName || '', duration: r?.totalDays ? `${r.totalDays} day${r.totalDays > 1 ? 's' : ''}` : null, requestNumber: r?.requestNumber },
      existingBooking,
    });
  }

  // ── Transporter / Truck ───────────────────────────────────────────
  if (tk) {
    const r = tk.truck_quote_requests;
    const advanceAmount = Math.round((tk.totalAmount || 0) * 0.5);
    const pricing = [
      { label: 'Base Amount', amount: tk.baseAmount },
      tk.labourCharges > 0 ? { label: 'Labour Charges', amount: tk.labourCharges } : null,
      tk.loadingCharges > 0 ? { label: 'Loading', amount: tk.loadingCharges } : null,
      tk.unloadingCharges > 0 ? { label: 'Unloading', amount: tk.unloadingCharges } : null,
      tk.packagingCharges > 0 ? { label: 'Packaging', amount: tk.packagingCharges } : null,
      tk.insuranceCharges > 0 ? { label: 'Insurance', amount: tk.insuranceCharges } : null,
      tk.tollEstimate > 0 ? { label: 'Toll Estimate', amount: tk.tollEstimate } : null,
      tk.gstAmount > 0 ? { label: 'GST', amount: tk.gstAmount } : null,
      { label: 'Total Amount', amount: tk.totalAmount, isTotal: true },
      { label: 'Advance (50%)', amount: advanceAmount, isAdvance: true },
      { label: 'Balance on Delivery', amount: (tk.totalAmount || 0) - advanceAmount },
    ].filter(Boolean);
    const existingBooking = await prisma.truck_bookings.findFirst({ where: { acceptedQuoteId: id }, select: { id: true, bookingNumber: true, status: true, paymentStatus: true } }).catch(() => null);
    return NextResponse.json({
      serviceType: 'transporter', serviceName: 'Transporter', bookingType: 'truck',
      vendorName: tk.vendors?.businessName || '', vendorPhone: tk.vendors?.phone || '',
      vendorLogo: tk.vendors?.logo || null, vendorCity: tk.vendors?.city || '', vendorState: tk.vendors?.state || '',
      vendorDescription: tk.vendors?.description || null,
      quoteNumber: tk.quoteNumber, amount: tk.totalAmount, advanceAmount, balanceAmount: (tk.totalAmount || 0) - advanceAmount,
      validTill: tk.validTill, status: tk.status, serviceDetail: tk.vehicleName || tk.vehicleCategory || '',
      inclusions: parseJson(tk.inclusions), exclusions: parseJson(tk.exclusions), termsConditions: parseJson(tk.termsConditions),
      pricing, requestId: r?.id,
      request: { customerName: r?.customerName, customerPhone: maskPhone(r?.customerPhone), date: r?.pickupDate, location: r?.pickupCity && r?.dropCity ? `${r.pickupCity} → ${r.dropCity}` : r?.pickupCity || '', requestNumber: r?.requestNumber },
      existingBooking,
    });
  }

  // ── Wander ────────────────────────────────────────────────────────
  if (wq) {
    const req = wq.quoteRequest;
    const listing = req?.listing;
    let advanceAmount = 0;
    if (listing?.requireAdvancePayment && listing?.advancePaymentValue) {
      advanceAmount = listing.advancePaymentType === 'PERCENTAGE'
        ? Math.round((Number(wq.amount) * listing.advancePaymentValue) / 100)
        : Number(listing.advancePaymentValue);
    }
    const inclusions = parseJson(wq.customInclusions)?.length ? parseJson(wq.customInclusions) : parseJson(listing?.inclusions);
    const exclusions = parseJson(wq.customExclusions)?.length ? parseJson(wq.customExclusions) : parseJson(listing?.exclusions);
    const pricing = [
      wq.perPersonAmount ? { label: `Per Person (₹${wq.perPersonAmount?.toLocaleString('en-IN')} × ${req?.groupSize} travellers)`, amount: wq.amount } : { label: 'Total Tour Amount', amount: wq.amount },
      advanceAmount > 0 ? { label: `Advance (${listing?.advancePaymentType === 'PERCENTAGE' ? listing.advancePaymentValue + '%' : 'Fixed'})`, amount: advanceAmount, isAdvance: true } : null,
      advanceAmount > 0 ? { label: 'Balance on Tour Day', amount: wq.amount - advanceAmount } : null,
    ].filter(Boolean);
    let existingBooking = await (prisma as any).wander_bookings.findFirst({ where: { quoteId: id }, select: { id: true, bookingId: true, status: true } }).catch(() => null);
    if (existingBooking) existingBooking = { ...existingBooking, bookingNumber: existingBooking.bookingId };
    return NextResponse.json({
      serviceType: 'wander', serviceName: 'Wander Tour', bookingType: 'wander_quote',
      vendorName: wq.vendor?.businessName || '', vendorPhone: wq.vendor?.phone || '',
      vendorLogo: wq.vendor?.logo || null, vendorCity: wq.vendor?.city || '', vendorState: wq.vendor?.state || '',
      vendorDescription: wq.vendor?.description || null,
      quoteNumber: wq.id.slice(-8).toUpperCase(), amount: wq.amount, advanceAmount, balanceAmount: wq.amount - advanceAmount,
      validTill: wq.validUntil, status: wq.status, serviceDetail: listing?.title || '',
      inclusions, exclusions, termsConditions: [],
      pricing, requestId: req?.id, notes: wq.notes || null, perPersonAmount: wq.perPersonAmount || null,
      request: { customerName: req?.customer?.name, customerPhone: maskPhone(req?.customer?.phone), date: req?.travelDate, groupSize: req?.groupSize, location: req?.pickupLocation || '' },
      existingBooking,
    });
  }

  return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
}

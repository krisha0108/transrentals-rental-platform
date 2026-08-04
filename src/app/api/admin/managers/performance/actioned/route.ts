import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getDateRange } from '@/lib/manager-performance';

export const dynamic = 'force-dynamic';

const SERVICE_NAMES: Record<string, string> = {
  'bike-rental': 'Bike Rental',
  'bus-rental': 'Bus Rental',
  'self-drive': 'Self Drive',
  'equipment-rental': 'Equipment Rental',
  'luxury-car-rental': 'Luxury Cars',
  'packers-and-movers': 'Packers & Movers',
  'truck-transport': 'Truck Transport',
  'contact-inquiry': 'Contact Inquiry',
};

// contact_inquiries has no location field — the subject line fills the
// "locationName" slot in the shared UI ("Contact Inquiry · <subject> · INQ-xxxxxx").
async function fetchContactInquirySummary(id: string) {
  const r = await prisma.contact_inquiries.findUnique({
    where: { id },
    select: { name: true, phone: true, subject: true, createdAt: true },
  });
  if (!r) return null;
  return {
    requestNumber: `INQ-${id.slice(-6).toUpperCase()}`,
    customerName: r.name,
    customerPhone: r.phone,
    locationName: r.subject,
    createdAt: r.createdAt,
  };
}

// Driver action logs store the driver's storage table ('standalone' | 'vendor')
// in serviceType, exactly like inquiry logs store the service slug there.
async function fetchDriverSummary(id: string, source: string) {
  if (source === 'vendor') {
    const s = await prisma.vendor_staff.findUnique({
      where: { id },
      select: { name: true, phone: true, did: true, city: true, createdAt: true },
    });
    if (!s) return null;
    return {
      requestNumber: s.did || `DRV-${id.slice(-6).toUpperCase()}`,
      customerName: s.name,
      customerPhone: s.phone,
      locationName: s.city,
      createdAt: s.createdAt,
    };
  }
  const d = await prisma.drivers.findUnique({
    where: { id },
    select: { name: true, phone: true, did: true, city: true, createdAt: true },
  });
  if (!d) return null;
  return {
    requestNumber: d.did || `DRV-${id.slice(-6).toUpperCase()}`,
    customerName: d.name,
    customerPhone: d.phone,
    locationName: d.city,
    createdAt: d.createdAt,
  };
}

async function fetchVendorSummary(id: string) {
  const v = await prisma.vendors.findUnique({
    where: { id },
    select: { vid: true, businessName: true, ownerName: true, phone: true, city: true, createdAt: true },
  });
  if (!v) return null;
  return {
    requestNumber: v.vid || `VEN-${id.slice(-6).toUpperCase()}`,
    customerName: v.businessName || v.ownerName,
    customerPhone: v.phone,
    locationName: v.city,
    createdAt: v.createdAt,
  };
}

async function fetchTravelAgentSummary(id: string) {
  const a = await prisma.travel_agents.findUnique({
    where: { id },
    select: { tid: true, agencyName: true, ownerName: true, phone: true, city: true, createdAt: true },
  }).catch(() => null);
  if (!a) return null;
  return {
    requestNumber: a.tid || `TA-${id.slice(-6).toUpperCase()}`,
    customerName: a.agencyName || a.ownerName,
    customerPhone: a.phone,
    locationName: a.city,
    createdAt: a.createdAt,
  };
}

async function fetchHelpdeskSummary(id: string) {
  const t = await prisma.helpdesk_tickets.findUnique({
    where: { id },
    select: { ticketNo: true, heading: true, createdAt: true, customers: { select: { name: true, phone: true } } },
  });
  if (!t) return null;
  return {
    requestNumber: t.ticketNo,
    customerName: t.customers?.name || 'Unknown',
    customerPhone: t.customers?.phone || '',
    locationName: t.heading,
    createdAt: t.createdAt,
  };
}

// Look up a single quote-request's customer/location details by its known serviceType
// (stored on the action log itself, so no need to search all 7 tables blindly).
async function fetchInquirySummary(id: string, serviceType: string) {
  const customerSelect = { select: { name: true, phone: true } } as const;
  switch (serviceType) {
    case 'bike-rental': {
      const r = await prisma.bike_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, locationName: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.locationName, createdAt: r.createdAt };
    }
    case 'bus-rental': {
      const r = await prisma.bus_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, pickupCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.pickupCity, createdAt: r.createdAt };
    }
    case 'self-drive': {
      const r = await prisma.self_drive_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, locationName: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.locationName, createdAt: r.createdAt };
    }
    case 'equipment-rental': {
      const r = await prisma.equipment_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, deliveryCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.deliveryCity, createdAt: r.createdAt };
    }
    case 'luxury-car-rental': {
      const r = await prisma.luxury_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, pickupCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.pickupCity, createdAt: r.createdAt };
    }
    case 'packers-and-movers': {
      const r = await prisma.packers_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, pickupCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.pickupCity, createdAt: r.createdAt };
    }
    case 'truck-transport': {
      const r = await prisma.truck_quote_requests.findUnique({ where: { id }, select: { requestNumber: true, customerName: true, customerPhone: true, pickupCity: true, createdAt: true, customers: customerSelect } });
      return r && { requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, locationName: r.pickupCity, createdAt: r.createdAt };
    }
    default:
      return null;
  }
}

// GET — which inquiries a manager actually took action on in a date range, and
// what those actions were. Complements /untouched (which shows the opposite).
// ?managerId=&filter=&dateFrom=&dateTo=
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');
    if (!managerId) {
      return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
    }
    const filter = searchParams.get('filter') || 'today';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');
    const dateFilter = getDateRange(filter, customFrom, customTo);
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const logs = await prisma.manager_action_logs.findMany({
      where: { recordType: { in: ['INQUIRY', 'CONTACT_INQUIRY', 'DRIVER', 'VENDOR', 'TRAVEL_AGENT', 'HELPDESK_TICKET'] }, managerId, ...dateFilterObj },
      orderBy: { createdAt: 'desc' },
    });

    // Group log entries by record, keep each record's own action history.
    const byRecord = new Map<string, { recordType: string; serviceType: string; actions: { actionType: string; note: string | null; createdAt: Date }[] }>();
    for (const log of logs) {
      if (!byRecord.has(log.recordId)) byRecord.set(log.recordId, { recordType: log.recordType, serviceType: log.serviceType, actions: [] });
      byRecord.get(log.recordId)!.actions.push({ actionType: log.actionType, note: log.note, createdAt: log.createdAt });
    }

    const entries = await Promise.all(
      Array.from(byRecord.entries()).map(async ([id, { recordType, serviceType, actions }]) => {
        const summary = recordType === 'CONTACT_INQUIRY'
          ? await fetchContactInquirySummary(id).catch(() => null)
          : recordType === 'DRIVER'
          ? await fetchDriverSummary(id, serviceType).catch(() => null)
          : recordType === 'VENDOR'
          ? await fetchVendorSummary(id).catch(() => null)
          : recordType === 'TRAVEL_AGENT'
          ? await fetchTravelAgentSummary(id).catch(() => null)
          : recordType === 'HELPDESK_TICKET'
          ? await fetchHelpdeskSummary(id).catch(() => null)
          : await fetchInquirySummary(id, serviceType).catch(() => null);
        if (!summary) return null;
        const SERVICE_LABELS: Record<string, string> = {
          DRIVER: serviceType === 'vendor' ? 'Vendor Driver' : 'Standalone Driver',
          VENDOR: 'Vendor',
          TRAVEL_AGENT: 'Travel Agent',
          HELPDESK_TICKET: 'Helpdesk Ticket',
        };
        return {
          id,
          recordType,
          source: recordType === 'DRIVER' ? serviceType : undefined,
          requestNumber: summary.requestNumber,
          customerName: summary.customerName,
          customerPhone: summary.customerPhone,
          serviceName: SERVICE_LABELS[recordType] || (SERVICE_NAMES[serviceType] || serviceType),
          locationName: summary.locationName,
          submittedAt: summary.createdAt,
          actions: actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        };
      })
    );

    const sortByLastAction = (a: any, b: any) => new Date(b.actions[0].createdAt).getTime() - new Date(a.actions[0].createdAt).getTime();

    // Every non-INQUIRY recordType is its own separate, unscoped queue —
    // kept out of `actioned` so its count stays in sync with the `inquiries.actioned`
    // stat above (which only counts recordType 'INQUIRY'), and gets its own list
    // instead of being invisibly mixed in.
    const nonInquiryTypes = ['CONTACT_INQUIRY', 'DRIVER', 'VENDOR', 'TRAVEL_AGENT', 'HELPDESK_TICKET'];
    const byType = (t: string) => entries.filter(Boolean).filter((e: any) => e.recordType === t).sort(sortByLastAction);
    const actioned = entries.filter(Boolean).filter((e: any) => !nonInquiryTypes.includes(e.recordType)).sort(sortByLastAction);
    const contactInquiries = byType('CONTACT_INQUIRY');
    const driverActions = byType('DRIVER');
    const vendorActions = byType('VENDOR');
    const travelAgentActions = byType('TRAVEL_AGENT');
    const helpdeskActions = byType('HELPDESK_TICKET');

    return NextResponse.json({ actioned, contactInquiries, driverActions, vendorActions, travelAgentActions, helpdeskActions });
  } catch (error: any) {
    logger.error('Manager actioned-inquiries fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch actioned inquiries', details: error?.message },
      { status: 500 }
    );
  }
}

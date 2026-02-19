// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

// Maps service DB id → booking link service type key
// These IDs are stable (same as used in VendorSidebar serviceId)
const SERVICE_ID_MAP: Record<string, { key: string; label: string }> = {
  SVC_1: { key: 'bike',            label: 'Bike Rental' },
  SVC_2: { key: 'self-drive',      label: 'Self-Drive Car' },
  SVC_3: { key: 'bus',             label: 'Bus & Tempo' },
  SVC_4: { key: 'transporter',     label: 'Transporter / Truck' },
  SVC_5: { key: 'car-with-driver', label: 'Car with Driver' },
  SVC_6: { key: 'packers-movers',  label: 'Packers & Movers' },
  SVC_7: { key: 'equipment',       label: 'Equipment Rental' },
  SVC_8: { key: 'luxury',          label: 'Luxury Car' },
};

const ALL_SERVICE_TYPES = [
  { key: 'bike',            label: 'Bike Rental' },
  { key: 'bus',             label: 'Bus & Tempo' },
  { key: 'car-with-driver', label: 'Car with Driver' },
  { key: 'self-drive',      label: 'Self-Drive Car' },
  { key: 'luxury',          label: 'Luxury Car' },
  { key: 'transporter',     label: 'Transporter / Truck' },
  { key: 'packers-movers',  label: 'Packers & Movers' },
  { key: 'equipment',       label: 'Equipment Rental' },
  { key: 'all',             label: 'All Services' },
];

// GET — fetch booking links for vendor (only approved services + 'all')
export async function GET(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vendorId = auth.vendorId;

  // Fetch vendor profile + approved services in one query
  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      businessName: true,
      city: true,
      slug: true,
      vendor_approved_services: {
        where: { isActive: true },
        select: { serviceId: true },
      },
    },
  });

  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  // Auto-generate slug if missing
  let slug = vendor.slug;
  if (!slug) {
    const base = (vendor.businessName + (vendor.city ? '-' + vendor.city : ''))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const existing = await prisma.vendors.findUnique({ where: { slug: base } });
    slug = existing && existing.id !== vendorId ? `${base}-${vendorId.slice(-5)}` : base;
    await prisma.vendors.update({ where: { id: vendorId }, data: { slug } });
  }

  // Derive which service type keys this vendor is approved for
  const approvedKeys = new Set<string>();
  for (const { serviceId } of vendor.vendor_approved_services) {
    const mapped = SERVICE_ID_MAP[serviceId];
    if (mapped) approvedKeys.add(mapped.key);
  }

  // Build list: approved services + always 'all'
  const allowedTypes = ALL_SERVICE_TYPES.filter(
    (s) => s.key === 'all' || approvedKeys.has(s.key)
  );

  // Auto-create link records only for allowed service types
  for (const svc of allowedTypes) {
    await prisma.vendor_booking_links.upsert({
      where: { vendorId_serviceType: { vendorId, serviceType: svc.key } },
      create: { vendorId, serviceType: svc.key, isActive: true },
      update: {},
    });
  }

  // Fetch only the allowed links (skip any leftover links for non-approved services)
  const links = await prisma.vendor_booking_links.findMany({
    where: {
      vendorId,
      serviceType: { in: allowedTypes.map((s) => s.key) },
    },
    orderBy: { serviceType: 'asc' },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://transrentals.in';

  return NextResponse.json({
    slug,
    links: links.map((l) => ({
      ...l,
      url: l.serviceType === 'all'
        ? `${baseUrl}/book/${slug}`
        : `${baseUrl}/book/${slug}/${l.serviceType}`,
      serviceLabel: ALL_SERVICE_TYPES.find((s) => s.key === l.serviceType)?.label ?? l.serviceType,
    })),
  });
}

import { prisma } from '@/lib/db/prisma';

// Maps the short serviceType key used across quote-request routes/notifiers
// to the real `services.slug` row.
export const SERVICE_TYPE_SLUGS: Record<string, string> = {
  bike: 'bike-on-rent',
  'self-drive': 'self-drive-car-rentals',
  bus: 'bus-rental',
  truck: 'transporter',
  luxury: 'luxury-car-rental',
  packers: 'packers-and-movers',
  equipment: 'equipment-rental',
};

/**
 * Whether a vendor currently has `serviceType` switched ON in
 * /vendor/services. Defaults to true when the vendor has no explicit
 * vendor_approved_services row (or the service can't be resolved) — this
 * only ever suppresses new leads for vendors who deliberately deactivated
 * the service, never for vendors who simply haven't touched the toggle.
 */
export async function isVendorServiceActive(vendorId: string, serviceType: string): Promise<boolean> {
  const slug = SERVICE_TYPE_SLUGS[serviceType];
  if (!slug) return true;
  const service = await prisma.services.findFirst({ where: { slug }, select: { id: true } });
  if (!service) return true;
  const approval = await prisma.vendor_approved_services.findUnique({
    where: { vendorId_serviceId: { vendorId, serviceId: service.id } },
    select: { isActive: true },
  });
  return approval?.isActive ?? true;
}

export interface CoreServiceRecord {
  key: string;
  slug: string;
  id: string;
  name: string;
}

/**
 * Resolves the 7 quote-based service keys (SERVICE_TYPE_SLUGS) to their real
 * `services` rows. Used to build location×service coverage matrices — every
 * caller needs the same fixed 7-service universe, so this is the single
 * source of truth for that lookup.
 */
export async function getCoreServiceCatalog(): Promise<CoreServiceRecord[]> {
  const slugs = Object.values(SERVICE_TYPE_SLUGS);
  const records = await prisma.services.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, name: true },
  });
  const bySlug = new Map(records.map((r) => [r.slug, r]));
  return Object.entries(SERVICE_TYPE_SLUGS)
    .map(([key, slug]) => {
      const rec = bySlug.get(slug);
      return rec ? { key, slug, id: rec.id, name: rec.name } : null;
    })
    .filter((r): r is CoreServiceRecord => r !== null);
}

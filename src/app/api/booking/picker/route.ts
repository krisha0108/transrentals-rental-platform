import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Services where the user-facing page shows category cards (e.g. /car-rental/<city>)
// rather than individual vehicle_models. Pickers for these services should mirror that.
// If the category source is empty for a service, we fall back to vehicle_models so the
// picker still has something to show.
const CATEGORY_BASED_SERVICES = new Set(['car-rental', 'luxury-car-rental']);

interface PickerItem {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  brandLogo?: string | null;
  image?: string | null;
  category?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  seatingCapacity?: number | null;
  engineCC?: number | null;
  mileage?: string | null;
  luggageCapacity?: string | null;
  acType?: string | null;
  exampleVehicles?: string[];
  basePricePerDay?: number | null;
  source: 'vehicle_model' | 'category';
}

function parseExamples(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s)).filter(Boolean);
  } catch {
    // Not JSON — try comma-separated
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceSlug = searchParams.get('service') || '';
    const locationSlug = searchParams.get('location') || '';

    if (!serviceSlug) {
      return NextResponse.json({ success: false, error: 'service param required' }, { status: 400 });
    }

    const service = await prisma.services.findUnique({ where: { slug: serviceSlug } });
    if (!service) {
      return NextResponse.json({ success: true, items: [], source: 'none' });
    }

    // ---------- Category-based services (car-rental, luxury-car-rental etc.) ----------
    if (CATEGORY_BASED_SERVICES.has(serviceSlug)) {
      const categories = await prisma.chauffeur_vehicle_categories.findMany({
        where: { serviceId: service.id, isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      if (categories.length > 0) {
        const items: PickerItem[] = categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image,
          category: c.bodyType || 'Category',
          fuelType: c.fuelType,
          seatingCapacity: c.seatingCapacity,
          luggageCapacity: c.luggageCapacity,
          acType: c.acType,
          exampleVehicles: parseExamples(c.exampleVehicles),
          basePricePerDay: c.dailyRate,
          source: 'category',
        }));
        return NextResponse.json({ success: true, items, source: 'category' });
      }
      // No categories defined → fall through to vehicle_models lookup
    }

    // ---------- Model-based services (bike, bus, transporter etc.) ----------
    let location: { id: string } | null = null;
    if (locationSlug) {
      location = await prisma.locations.findUnique({
        where: { slug: locationSlug },
        select: { id: true },
      });
    }

    const where: any = {
      serviceId: service.id,
      isActive: true,
      brands: { isActive: true },
      AND: [
        { OR: [{ vehicleCategoryId: null }, { chauffeur_vehicle_categories: { isActive: true } }] },
        { OR: [{ subServiceId: null }, { services_vehicle_models_subServiceIdToservices: { isActive: true } }] },
      ],
    };

    if (location) {
      where.vehicle_model_locations = {
        some: { locationId: location.id, isActive: true },
      };
    }

    const models = await prisma.vehicle_models.findMany({
      where,
      include: {
        brands: { select: { name: true, slug: true, logo: true } },
        chauffeur_vehicle_categories: { select: { name: true, slug: true } },
        services_vehicle_models_subServiceIdToservices: { select: { name: true, slug: true } },
        vehicle_model_locations: location
          ? { where: { locationId: location.id, isActive: true }, select: { basePricePerDay: true } }
          : false,
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    const items: PickerItem[] = models.map((m: any) => {
      const locPrice = m.vehicle_model_locations?.[0]?.basePricePerDay;
      const subSvc = m.services_vehicle_models_subServiceIdToservices;
      const cat = m.chauffeur_vehicle_categories;
      let categoryName: string | null = null;
      if (subSvc?.name) categoryName = subSvc.name;
      else if (cat?.name && cat.name.length > 3 && !/^[a-z0-9]+$/i.test(cat.name)) categoryName = cat.name;
      else if (m.bodyType) categoryName = m.bodyType;
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        brand: m.brands?.name || null,
        brandLogo: m.brands?.logo || null,
        image: m.sideImage,
        category: categoryName,
        fuelType: m.fuelType,
        transmission: m.transmission,
        seatingCapacity: m.seatingCapacity,
        engineCC: m.engineCC,
        mileage: m.mileage,
        basePricePerDay: locPrice ?? m.basePricePerDay ?? null,
        source: 'vehicle_model',
      };
    });

    return NextResponse.json({ success: true, items, source: 'vehicle_model' });
  } catch (error: any) {
    console.error('Booking picker API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch items', details: error?.message },
      { status: 500 }
    );
  }
}

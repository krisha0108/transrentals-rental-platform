// @ts-nocheck
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import VendorBookingFormClient from '@/components/vendor/public/VendorBookingFormClient';

const SERVICE_LABELS: Record<string, string> = {
  bike:             'Bike Rental',
  bus:              'Bus & Tempo Traveller',
  'car-with-driver':'Car with Driver',
  'self-drive':     'Self-Drive Car',
  luxury:           'Luxury Car',
  transporter:      'Transporter / Truck',
  'packers-movers': 'Packers & Movers',
  equipment:        'Equipment Rental',
  all:              'All Services',
};

const SERVICE_VEHICLES: Record<string, string[]> = {
  bike:              ['Activa', 'Royal Enfield', 'KTM', 'Pulsar', 'Apache', 'Splendor', 'Other'],
  bus:               ['12 Seater Tempo', '17 Seater Tempo', '20 Seater Tempo', '26 Seater Bus', '32 Seater Bus', '45 Seater Bus', 'Other'],
  'car-with-driver': ['Sedan', 'SUV', 'Hatchback', 'Innova', 'Fortuner', 'Ertiga', 'Other'],
  'self-drive':      ['Hatchback', 'Sedan', 'SUV', 'Creta', 'Seltos', 'Other'],
  luxury:            ['BMW', 'Mercedes', 'Audi', 'Jaguar', 'Range Rover', 'Other'],
  transporter:       ['Mini Truck', 'Pickup Van', 'Tata Ace', 'Tata 407', 'Truck (1 ton)', 'Truck (2 ton)', 'Truck (5 ton)', 'Other'],
  'packers-movers':  ['Small Move (1BHK)', 'Medium Move (2BHK)', 'Large Move (3BHK+)', 'Office Relocation', 'Other'],
  equipment:         ['JCB / Excavator', 'Crane', 'Hydra Crane', 'Generator', 'Concrete Mixer', 'Other'],
  all:               [],
};

export async function generateMetadata({
  params,
}: {
  params: { vendorSlug: string; service: string };
}): Promise<Metadata> {
  const vendor = await prisma.vendors.findUnique({
    where: { slug: params.vendorSlug },
    select: { businessName: true, city: true },
  });
  if (!vendor) return { title: 'Book Now' };
  const serviceName = SERVICE_LABELS[params.service] ?? params.service;
  return {
    title: `Book ${serviceName} | ${vendor.businessName}`,
    description: `Book ${serviceName} with ${vendor.businessName}${vendor.city ? ` in ${vendor.city}` : ''}. Fill the form and we'll contact you shortly.`,
    robots: 'noindex',
  };
}

export default async function VendorServiceBookingPage({
  params,
}: {
  params: { vendorSlug: string; service: string };
}) {
  const vendor = await prisma.vendors.findUnique({
    where: { slug: params.vendorSlug },
    select: { id: true, businessName: true, logo: true, city: true, phone: true },
  });
  if (!vendor) notFound();

  const link = await prisma.vendor_booking_links.findFirst({
    where: { vendorId: vendor.id, serviceType: params.service },
  });

  // If link explicitly deactivated, show inactive message
  if (link && !link.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl">
            🚫
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Form Not Available</h1>
          <p className="text-blue-200/70">
            This booking form has been temporarily disabled by{' '}
            <span className="text-white font-semibold">{vendor.businessName}</span>.
          </p>
        </div>
      </div>
    );
  }

  const serviceName = SERVICE_LABELS[params.service] ?? params.service;
  const vehicles = SERVICE_VEHICLES[params.service] ?? [];

  return (
    <VendorBookingFormClient
      vendorSlug={params.vendorSlug}
      serviceType={params.service}
      serviceName={serviceName}
      vehicles={vehicles}
      vendor={vendor}
      link={link}
    />
  );
}

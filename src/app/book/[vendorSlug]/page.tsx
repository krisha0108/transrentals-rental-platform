// @ts-nocheck
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import VendorBookingFormClient from '@/components/vendor/public/VendorBookingFormClient';

export async function generateMetadata({
  params,
}: {
  params: { vendorSlug: string };
}): Promise<Metadata> {
  const vendor = await prisma.vendors.findUnique({
    where: { slug: params.vendorSlug },
    select: { businessName: true, city: true },
  });
  if (!vendor) return { title: 'Book Now' };
  return {
    title: `Book a Ride | ${vendor.businessName}`,
    description: `Book a ride with ${vendor.businessName}${vendor.city ? ` in ${vendor.city}` : ''}. Fill the form and we'll contact you shortly.`,
    robots: 'noindex',
  };
}

export default async function VendorGeneralBookingPage({
  params,
}: {
  params: { vendorSlug: string };
}) {
  const vendor = await prisma.vendors.findUnique({
    where: { slug: params.vendorSlug },
    select: { id: true, businessName: true, logo: true, city: true, phone: true },
  });
  if (!vendor) notFound();

  const link = await prisma.vendor_booking_links.findFirst({
    where: { vendorId: vendor.id, serviceType: 'all' },
  });

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

  return (
    <VendorBookingFormClient
      vendorSlug={params.vendorSlug}
      serviceType="all"
      serviceName="All Services"
      vehicles={[]}
      vendor={vendor}
      link={link}
    />
  );
}

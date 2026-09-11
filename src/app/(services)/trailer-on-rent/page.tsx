import Link from 'next/link';
import { MapPin, ArrowRight, Truck, PackageOpen, Bus } from 'lucide-react';
import { TrailerBookingHero } from '@/components/services/trailer/TrailerBookingHero';
import { TrailerTypes } from '@/components/services/trailer/TrailerTypes';
import { TrailerBookingProcess } from '@/components/services/trailer/TrailerBookingProcess';
import { TrailerFAQ } from '@/components/services/trailer/TrailerFAQ';
import { StaticServicePopularCitiesGrid } from '@/components/services/StaticServicePopularCitiesGrid';

import { HowToSchema } from '@/components/seo/schemas';

export const metadata = {
  title: 'Trailer on Rent - Heavy Duty Trailer Rental Services',
  description: 'Rent trailers for heavy cargo transportation. 20ft, 28ft, 32ft, 40ft trailers available. Book now for best rates across India.',
};

const TOP_CITIES = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Nagpur', slug: 'nagpur' },
  { name: 'Indore', slug: 'indore' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Kolkata', slug: 'kolkata' },
];

export default function TrailerRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Trailer on TransRentals"
        description="Book a heavy-duty trailer for cargo transport in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Cargo & Route Details', text: 'Specify cargo type, weight, dimensions, pickup, and delivery location. Choose 20ft, 28ft, 32ft, or 40ft trailer.' },
          { name: 'Select Trailer Type', text: 'Choose flatbed trailer for machinery, container trailer for goods, or lowbed for oversized equipment.' },
          { name: 'Get Freight Quotes', text: 'Receive quotes from verified transporters. Check per-km rate, loading/unloading charges, and escort requirements.' },
          { name: 'Confirm & Track', text: 'Pay advance to confirm shipment. Driver picks up cargo on scheduled date. GPS tracking during transit.' },
        ]}
      />

      <TrailerBookingHero city="India" citySlug="" />

      <TrailerTypes />
      <TrailerBookingProcess />

      <StaticServicePopularCitiesGrid serviceSlug="trailer-on-rent" title="Trailer Rental in Available Cities" />

      {/* Internal City Links */}
      <section className="relative py-16 bg-white border-t border-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(#ecfdf5 1px, transparent 1px), linear-gradient(90deg, #ecfdf5 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              Browse by City
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Trailer on Rent by City</h2>
            <p className="text-gray-500">Jump straight to a city&apos;s dedicated page</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto mb-8">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/trailer-on-rent/${city.slug}`}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {city.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
            {[
              { href: '/mini-truck-rental', label: 'Mini Truck Rental', icon: Truck },
              { href: '/transporter', label: 'Truck & Transport', icon: Truck },
              { href: '/packers-and-movers', label: 'Packers and Movers', icon: PackageOpen },
              { href: '/bus-rental', label: 'Bus Rental', icon: Bus },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 bg-white border border-gray-100 hover:border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors"
              >
                <link.icon className="w-4 h-4 text-emerald-600" />
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TrailerFAQ />
    </>
  );
}

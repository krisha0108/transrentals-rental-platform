import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';
import { SpecialtyCarBookingHero } from '@/components/car-rental/SpecialtyCarBookingHero';
import { prisma } from '@/lib/db/prisma';
import { getCarRentalServiceId } from '@/lib/db/build-cache';
import { LocalTaxiPackages } from '@/components/local-taxi/LocalTaxiPackages';

export const metadata: Metadata = {
  title: 'Local Taxi | Hourly Cab @₹399 | 4 Hour 8 Hour Taxi Package India',
  description: 'Book local taxi for hourly rental. 4 hour, 8 hour, 12 hour packages. City cab service, local car rental. AC sedan, SUV. Affordable hourly taxi @₹399.',
  keywords: [
    'local taxi',
    'hourly taxi',
    'local cab service',
    'taxi for 4 hours',
    '8 hour taxi package',
    'city taxi',
    'local car rental',
    'hourly cab',
    'local taxi service',
    'city cab booking',
    'hourly car rental',
    'half day taxi',
  ],
  openGraph: {
    title: 'Local Taxi India | Hourly Cab @₹399 | 4-8 Hour Package',
    description: 'Book local taxi for city travel. Hourly packages starting @₹399. AC cars available.',
  },
};

export default async function LocalTaxiPage() {
  const carRentalServiceId = await getCarRentalServiceId();
  const localPackages = carRentalServiceId ? await prisma.chauffeur_local_packages.findMany({
    where: {
      isActive: true,
      isPopular: true,
      chauffeur_vehicle_categories: { serviceId: carRentalServiceId, isActive: true },
    },
    select: {
      id: true, hours: true, kms: true, basePrice: true,
      extraKmCharge: true, isPopular: true,
      chauffeur_vehicle_categories: {
        select: { id: true, name: true, image: true, seatingCapacity: true, acType: true, exampleVehicles: true, isPopular: true },
      },
      locations: { select: { name: true } },
    },
    orderBy: [{ chauffeur_vehicle_categories: { displayOrder: 'asc' } }, { hours: 'asc' }],
  }) : [];

  const packagesWithLocation = localPackages.map((pkg) => ({
    ...pkg,
    locationName: (pkg.locations as { name: string } | null)?.name ?? null,
  }));

  const packagesByHour = new Map<number, { hours: number; kms: number; vehicles: typeof packagesWithLocation }>();
  for (const pkg of packagesWithLocation) {
    const existing = packagesByHour.get(pkg.hours);
    if (!existing) {
      packagesByHour.set(pkg.hours, { hours: pkg.hours, kms: pkg.kms, vehicles: [pkg] });
    } else {
      existing.vehicles.push(pkg);
    }
  }
  const hourGroups = Array.from(packagesByHour.values()).sort((a, b) => a.hours - b.hours);
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      {/* Hero with booking form */}
      <SpecialtyCarBookingHero service="local-taxi" />

      {/* Why Local Taxi */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Local Taxi Service?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Affordable', desc: 'Starting @₹399 for 4 hours' },
              { icon: '⏰', title: 'Time-Based', desc: 'Pay only for hours used' },
              { icon: '🚗', title: 'Multiple Stops', desc: 'Visit multiple locations' },
              { icon: '👨‍✈️', title: 'Local Drivers', desc: 'Know city routes well' },
              { icon: '❄️', title: 'AC Comfort', desc: 'Air-conditioned vehicles' },
              { icon: '📱', title: 'Easy Booking', desc: 'Book in 2 minutes' },
              { icon: '🛡️', title: 'Safe & Secure', desc: 'Fully insured vehicles' },
              { icon: '🆘', title: '24/7 Available', desc: 'Round the clock service' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities Grid */}
      <section id="locations" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Local Taxi in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/local-taxi/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <h3 className="font-semibold text-lg group-hover:text-green-700 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {hourGroups.length > 0 && (
        <LocalTaxiPackages hourGroups={hourGroups} locationName="India" />
      )}

      {/* Perfect Occasions */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect for Every Occasion
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Shopping', icon: '🛍️', desc: 'Mall hopping, markets' },
              { occasion: 'Sightseeing', icon: '📸', desc: 'City tours, monuments' },
              { occasion: 'Business Meetings', icon: '💼', desc: 'Multiple office visits' },
              { occasion: 'Hospital Visits', icon: '🏥', desc: 'Medical appointments' },
              { occasion: 'Family Outings', icon: '👨‍👩‍👧‍👦', desc: 'Restaurants, parks' },
              { occasion: 'Airport Drop/Pick', icon: '✈️', desc: 'Airport transfers' },
              { occasion: 'Running Errands', icon: '📋', desc: 'Bank, post office, etc' },
              { occasion: 'Party/Events', icon: '🎉', desc: 'Attend functions' },
            ].map((item) => (
              <div key={item.occasion} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features & Amenities */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Local Taxi Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-green-900">Package Includes</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Professional driver</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Fuel charges included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>AC car (Sedan/SUV)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Multiple pickup/drops</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>GST included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Full insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-emerald-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-emerald-900">Service Features</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Doorstep pickup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Clean & sanitized cars</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Flexible timings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>No waiting charges (within limit)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>24/7 customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Easy online booking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Local Taxi Works
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Package', desc: 'Select 4hr, 8hr, or 12hr package' },
              { step: '2', title: 'Select Car Type', desc: 'Choose Sedan or SUV' },
              { step: '3', title: 'Book Online', desc: 'Enter pickup location and time' },
              { step: '4', title: 'Driver Arrives', desc: 'Driver reaches your doorstep' },
              { step: '5', title: 'Multiple Stops', desc: 'Visit as many places within city' },
              { step: '6', title: 'Pay at End', desc: 'Pay package + extra charges if any' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much does local taxi cost?',
                a: 'Local taxi starts from ₹399 for 4 hours/40km in sedan. 8 hour package costs ₹799. SUV costs around ₹599 for 4 hours. Extra charges: ₹10/km and ₹100/hour.',
              },
              {
                q: 'What is included in local taxi package?',
                a: 'Package includes driver, fuel, AC car, GST, and insurance. You can make multiple stops within city limits during the booked hours and kilometers.',
              },
              {
                q: 'How many stops can I make in local taxi?',
                a: 'You can make unlimited stops within your booked hours and kilometers. Perfect for shopping, errands, or sightseeing with multiple destinations.',
              },
              {
                q: 'What if I exceed time or kilometer limit?',
                a: 'Extra charges apply: ₹10 per additional kilometer and ₹100 per additional hour. You can extend your booking if needed.',
              },
              {
                q: 'Can I book local taxi for half day?',
                a: 'Yes! Our 4-hour and 8-hour packages are perfect for half day usage. 4 hours is ideal for quick trips, 8 hours for extended city travel.',
              },
              {
                q: 'Is local taxi available at night?',
                a: 'Yes, local taxi is available 24/7. Night charges (11 PM - 6 AM) may apply. Book anytime for your convenience.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

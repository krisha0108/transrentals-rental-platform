import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { VehicleGrid } from '@/components/location/VehicleGrid';
import { getAllIndiaFleet } from '@/lib/fleet-utils';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { prisma } from '@/lib/db/prisma';
import { formatPriceHighlight } from '@/lib/utils';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only enabled locations
export async function generateStaticParams() {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      console.log('[tempo-traveller] Skipping database calls during build');
      return [];
    }

    // Fetch enabled locations from database
    const service = await prisma.services.findUnique({
      where: { slug: 'tempo-traveller' },
      include: {
        service_locations: {
          where: { isActive: true },
          include: {
            locations: {
              select: { slug: true, name: true }
            }
          }
        }
      }
    });

    if (!service) {
      console.log('[tempo-traveller] Service not found in database');
      return [];
    }

    const locations = service.service_locations.map((sl) => ({
      location: sl.locations.slug,
    }));

    console.log(`[tempo-traveller] Generating ${locations.length} location pages from database`);
    return locations;
  } catch (error) {
    console.error('[tempo-traveller] Error fetching locations:', error);
    // Fallback to empty array if database error
    return [];
  }
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);

  if (!city) {
    return { title: 'Tempo Traveller on Rent | TransRentals' };
  }

  const locationName = city.name;

  return {
    title: formatPriceHighlight(`Tempo Traveller ${locationName} | 12-17 Seater @₹18/Km | Force Traveller`),
    description: formatPriceHighlight(`Rent Tempo Traveller in ${locationName}. 12, 17, 20 seater AC tempo. Group travel, family trips, corporate events. Book online @₹18/km.`),
    keywords: [
      `tempo traveller ${locationName.toLowerCase()}`,
      `12 seater tempo ${locationName.toLowerCase()}`,
      `17 seater tempo ${locationName.toLowerCase()}`,
      `force traveller ${locationName.toLowerCase()}`,
      `tempo on rent ${locationName.toLowerCase()}`,
      `tempo booking ${locationName.toLowerCase()}`,
      `group travel ${locationName.toLowerCase()}`,
      `traveller hire ${locationName.toLowerCase()}`,
      `tempo for outstation ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `tempo traveller ${k}`),
    ],
    openGraph: {
      title: formatPriceHighlight(`Tempo Traveller in ${locationName} - 12-17 Seater @₹18/Km`),
      description: formatPriceHighlight(`Book Tempo Traveller in ${locationName}. AC vehicles for group travel and outstation trips.`),
      url: `https://transrentals.in/tempo-traveller/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/tempo-traveller/${params.location}`,
    },
  };
}

export default async function TempoTravellerLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('tempo-traveller', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="tempo-traveller" serviceName="Tempo Traveller" />;
  const city = pageContext.city;
  const locationName = city.name;

  // Fetch tempo traveller fleet from database (ALL_INDIA type vehicles)
  const vehicles = await getAllIndiaFleet(
    ['tempo', 'tempo-traveller', 'bus', 'Bus Rental', 'Bus', 'Tempo Traveller']
  );

  return (
    <>
      <ServiceHeroWithChat
        badge={`Tempo Traveller in ${locationName}`}
        title="Tempo Traveller Rental"
        titleHighlight="12-20 Seater @₹18/Km"
        description={`Book comfortable AC Tempo Traveller in ${locationName}. Perfect for group travel, family trips, corporate events, and pilgrimages.`}
        features={[
          { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Vehicles', color: 'text-orange-600' },
          { icon: 'zap', text: 'Instant Booking', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="amber-50"
      />

      {/* Why Tempo Traveller in This City */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Tempo Traveller in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '👥', title: 'Group Travel', desc: `Perfect for ${locationName} tours` },
              { icon: '❄️', title: 'AC Comfort', desc: 'Fully air-conditioned' },
              { icon: '💺', title: 'Comfortable Seats', desc: 'Push-back seating' },
              { icon: '🗺️', title: 'Outstation Ready', desc: 'Multi-city trips allowed' },
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

      {/* Available Tempo Travellers from Database */}
      {vehicles.length > 0 ? (
        <VehicleGrid
          vehicles={vehicles}
          title={`Tempo Travellers Available in ${locationName}`}
          locationSlug={params.location}
          serviceSlug="tempo-traveller"
        />
      ) : (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8">
              Tempo Travellers Available in {locationName}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { vehicle: '12 Seater Tempo', price: '18', capacity: '12 Passengers' },
                { vehicle: '14 Seater Tempo', price: '20', capacity: '14 Passengers' },
                { vehicle: '17 Seater Tempo', price: '22', capacity: '17 Passengers' },
                { vehicle: '20 Seater Tempo', price: '25', capacity: '20 Passengers' },
                { vehicle: 'Luxury Tempo', price: '30', capacity: '12-14 Passengers' },
                { vehicle: 'Force Urbania', price: '35', capacity: '13-17 Passengers' },
              ].map((item) => (
                <div key={item.vehicle} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-orange-600">
                  <p className="text-sm text-orange-700 font-semibold mb-2">{item.capacity}</p>
                  <h3 className="text-xl font-bold mb-2">{item.vehicle}</h3>
                  <p className="text-2xl font-bold text-orange-700 mb-4">₹{item.price}/km</p>
                  <button className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition">
                    Book Tempo
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Perfect Occasions in City */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Events in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Family Trips', icon: '👨‍👩‍👧‍👦', desc: `${locationName} outstation tours` },
              { occasion: 'Corporate Events', icon: '💼', desc: 'Team outings & meetings' },
              { occasion: 'Pilgrimages', icon: '🛕', desc: 'Temple tours from city' },
              { occasion: 'Weddings', icon: '💒', desc: 'Guest transport service' },
            ].map((item) => (
              <div key={item.occasion} className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Tempo Traveller Features in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-orange-700">Included Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Fully air-conditioned</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Push-back/reclining seats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Music system included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Ample luggage space</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-700 mt-1">✓</span>
                  <span>Experienced driver in {locationName}</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-amber-900">Service Amenities</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>24/7 pickup available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Flexible rental packages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Outstation trips allowed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Full vehicle insurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 mt-1">✓</span>
                  <span>Customer support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Rental Packages */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Tempo Traveller Packages in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { duration: 'Local (8 hrs)', price: '2500-4000', desc: '80 km' },
              { duration: 'Outstation', price: '18-35/km', desc: 'Per km rate' },
              { duration: 'Multi-Day', price: '3000-5500/day', desc: '250-300 km/day' },
            ].map((plan) => (
              <div key={plan.duration} className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.duration}</h3>
                <p className="text-2xl font-bold text-orange-700 mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-600">{plan.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book Tempo Traveller in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Select Vehicle', desc: 'Choose seating capacity (12-20 seater)' },
              { step: '2', title: 'Choose Package', desc: `Local or outstation from ${locationName}` },
              { step: '3', title: 'Book Online', desc: 'Enter trip details and confirm' },
              { step: '4', title: 'Get Confirmation', desc: 'Driver details shared via SMS' },
              { step: '5', title: 'Enjoy Your Trip', desc: 'Comfortable group travel' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
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
                q: `How much does tempo traveller cost in ${locationName}?`,
                a: `Tempo traveller in ${locationName} costs ₹18-35/km for outstation. Local packages start from ₹2500 for 8 hours.`,
              },
              {
                q: `Which tempo travellers are available in ${locationName}?`,
                a: `We have 12 seater, 14 seater, 17 seater, 20 seater, and luxury tempo travellers in ${locationName}.`,
              },
              {
                q: `Is driver included in tempo rental in ${locationName}?`,
                a: `Yes, experienced driver is included. For outstation trips from ${locationName}, driver allowance is extra.`,
              },
              {
                q: `Can I book tempo for outstation from ${locationName}?`,
                a: `Yes! You can book tempo traveller from ${locationName} for any outstation destination across India.`,
              },
              {
                q: `How to book tempo traveller in ${locationName}?`,
                a: `You can book online on our website. Select ${locationName}, choose vehicle type, dates and complete booking.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Tempo Traveller in ${locationName}`,
            description: `Rent tempo traveller in ${locationName}. 12-20 seater AC vehicles for group travel.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '18',
              highPrice: '35',
              priceSuffix: '/km',
            },
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
          }),
        }}
      />

    </>
  );
}

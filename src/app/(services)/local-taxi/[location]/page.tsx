import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

interface PageProps {
  params: {
    location: string;
  };
}

// Generate static params from DATABASE - Only locations where car-rental is available
export async function generateStaticParams() {
  return getServiceLocations('car-rental');
}

// Enable ISR - Revalidate every hour
export const revalidate = 3600;

// Allow dynamic params for new cities without rebuild
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  // Fallback: getAllCities().find(c => c.slug === params.location);

  if (!city) {
    return { title: 'Local Taxi | TransRentals' };
  }

  const locationName = city.name;

  const _seoDb = await resolvePageMeta(`local-taxi:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Local Taxi ${locationName} | Hourly Cab @₹399 | 4 Hour 8 Hour Package`,
    description: _seoDb?.metaDescription || `Book local taxi in ${locationName}. Hourly cab rental - 4hr, 8hr, 12hr packages. City taxi service. AC sedan, SUV @₹399.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `local taxi ${locationName.toLowerCase()}`,
      `hourly taxi ${locationName.toLowerCase()}`,
      `local cab ${locationName.toLowerCase()}`,
      `taxi for 4 hours ${locationName.toLowerCase()}`,
      `8 hour taxi ${locationName.toLowerCase()}`,
      `city taxi ${locationName.toLowerCase()}`,
      `hourly cab ${locationName.toLowerCase()}`,
      `local car rental ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `local taxi ${k}`),
    ],
    openGraph: {
      title: `Local Taxi in ${locationName} - Hourly Cab @₹399`,
      description: `Book hourly taxi in ${locationName}. 4hr, 8hr, 12hr packages available.`,
      url: `https://transrentals.in/local-taxi/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/local-taxi/${params.location}`,
    },
  };
}

export default async function LocalTaxiLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('local-taxi', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="local-taxi" serviceName="Local Taxi" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/local-taxi" className="hover:text-primary">Local Taxi</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{locationName}</span>
          </nav>
        </div>
      </div>

      {/* Booking Hero - Same as Car Rental */}
      <CarRentalBookingHero
        city={locationName}
        citySlug={params.location}
        serviceSlug="car-rental"
        serviceTitle="Local Taxi"
      />

      {/* Why Local Taxi */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Local Taxi in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💰', title: 'Affordable', desc: 'Starting @₹399' },
              { icon: '⏰', title: 'Flexible Packages', desc: '4hr, 8hr, 12hr' },
              { icon: '🚗', title: 'Multiple Stops', desc: `Around ${locationName}` },
              { icon: '👨‍✈️', title: 'Local Drivers', desc: `Know ${locationName} well` },
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

      {/* Hourly Packages */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Local Taxi Packages in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { duration: '4 Hours / 40 Km', sedan: '399', suv: '599' },
              { duration: '8 Hours / 80 Km', sedan: '799', suv: '1199' },
              { duration: '12 Hours / 120 Km', sedan: '1199', suv: '1799' },
            ].map((pkg) => (
              <div key={pkg.duration} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-600">
                <h3 className="text-xl font-bold mb-4">{pkg.duration}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sedan</span>
                    <span className="text-2xl font-bold text-green-700">₹{pkg.sedan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SUV</span>
                    <span className="text-2xl font-bold text-green-700">₹{pkg.suv}</span>
                  </div>
                </div>
                <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect Occasions */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Activities in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Shopping', icon: '🛍️', desc: `${locationName} malls & markets` },
              { occasion: 'Sightseeing', icon: '📸', desc: 'City tours' },
              { occasion: 'Business Meetings', icon: '💼', desc: 'Office visits' },
              { occasion: 'Running Errands', icon: '📋', desc: 'Multiple stops' },
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
            Local Taxi Features in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-green-700">Package Includes</h3>
              <ul className="space-y-2 text-gray-700">
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
                  <span>Multiple pickup/drops in {locationName}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-700 mt-1">✓</span>
                  <span>Full insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-emerald-900">Service Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Doorstep pickup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Clean & sanitized</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>Flexible timings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 mt-1">✓</span>
                  <span>24/7 availability</span>
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

      {/* How to Book */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book Local Taxi in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Package', desc: 'Select 4hr, 8hr or 12hr' },
              { step: '2', title: 'Select Car', desc: 'Sedan or SUV' },
              { step: '3', title: 'Book Online', desc: `Enter pickup location in ${locationName}` },
              { step: '4', title: 'Driver Arrives', desc: 'At your doorstep' },
              { step: '5', title: 'Travel Around', desc: `Visit multiple places in ${locationName}` },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-gray-50 p-4 rounded-lg shadow-md">
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
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How much does local taxi cost in ${locationName}?`,
                a: `Local taxi in ${locationName} starts from ₹399 for 4 hours/40km in sedan. 8 hour package costs ₹799. SUV costs ₹599 for 4 hours.`,
              },
              {
                q: `Can I make multiple stops in ${locationName}?`,
                a: `Yes! You can make unlimited stops within ${locationName} during your booked hours and kilometers. Perfect for shopping or errands.`,
              },
              {
                q: `What if I exceed the time limit in ${locationName}?`,
                a: `Extra charges apply: ₹10 per additional kilometer and ₹100 per additional hour beyond your package limit.`,
              },
              {
                q: `Is local taxi available 24/7 in ${locationName}?`,
                a: `Yes, local taxi service is available 24/7 in ${locationName}. Night charges may apply for bookings between 11 PM - 6 AM.`,
              },
              {
                q: `How to book local taxi in ${locationName}?`,
                a: `You can book online on our website. Select ${locationName}, choose package (4hr/8hr/12hr), car type and complete booking.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <CityContentSection
        citySlug={params.location}
        serviceSlug="local-taxi"
        cityName={locationName}
        stateCode={city?.stateCode}
      />

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Local Taxi in ${locationName}`,
            description: `Book local hourly taxi in ${locationName}. 4hr, 8hr, 12hr packages available.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '399',
              highPrice: '1799',
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

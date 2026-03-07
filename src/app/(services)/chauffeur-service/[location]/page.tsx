import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { CarRentalBookingHero } from '@/components/car-rental/CarRentalBookingHero';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';
import { CityContentSection } from '@/components/location/CityContentSection';

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
    return { title: 'Chauffeur Service | TransRentals' };
  }

  const locationName = city.name;

  return {
    title: `Chauffeur Service ${locationName} | Driver on Hire @₹599 | Car Driver`,
    description: `Hire professional chauffeur in ${locationName}. Driver on hire for daily use, outstation. Verified car drivers @₹599/day.`,
    keywords: [
      `chauffeur service ${locationName.toLowerCase()}`,
      `driver on hire ${locationName.toLowerCase()}`,
      `car driver ${locationName.toLowerCase()}`,
      `professional driver ${locationName.toLowerCase()}`,
      `personal driver ${locationName.toLowerCase()}`,
      `driver booking ${locationName.toLowerCase()}`,
      `chauffeur ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `chauffeur service ${k}`),
    ],
    openGraph: {
      title: `Chauffeur Service in ${locationName} - Driver on Hire @₹599`,
      description: `Book professional chauffeur in ${locationName}. Verified drivers for daily & outstation.`,
      url: `https://transrentals.in/chauffeur-service/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/chauffeur-service/${params.location}`,
    },
  };
}

export default async function ChauffeurServiceLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('chauffeur-service', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="chauffeur-service" serviceName="Chauffeur Service" />;
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
            <a href="/chauffeur-service" className="hover:text-primary">Chauffeur Service</a>
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
        serviceTitle="Chauffeur Service"
      />

      {/* Why Chauffeur Service */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Hire Chauffeur in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '✅', title: 'Verified Drivers', desc: `Police verified in ${locationName}` },
              { icon: '🎓', title: 'Experienced', desc: '5+ years experience' },
              { icon: '🗺️', title: 'Local Knowledge', desc: `Know ${locationName} routes` },
              { icon: '🤵', title: 'Professional', desc: 'Well-groomed & trained' },
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

      {/* Chauffeur Packages */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Chauffeur Packages in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { type: 'Daily (8-10 hrs)', price: '599-899' },
              { type: 'Outstation', price: '800-1200/day' },
              { type: 'Monthly', price: '15000-25000' },
              { type: 'Event/Wedding', price: '1500-2500' },
              { type: 'Luxury Car', price: '1200-2000' },
              { type: 'Airport Transfer', price: '400-600' },
            ].map((item) => (
              <div key={item.type} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-600">
                <h3 className="text-xl font-bold mb-2">{item.type}</h3>
                <p className="text-2xl font-bold text-indigo-700 mb-4">₹{item.price}</p>
                <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
                  Book Chauffeur
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Perfect for Your Needs in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Daily Commute', icon: '💼', desc: `Office in ${locationName}` },
              { occasion: 'Outstation', icon: '🗺️', desc: `Trips from ${locationName}` },
              { occasion: 'Weddings', icon: '💒', desc: 'Wedding car driver' },
              { occasion: 'Events', icon: '🎉', desc: 'Special occasions' },
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

      {/* Driver Qualities */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Our Chauffeurs in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-indigo-700">Professional Skills</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>5+ years experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Valid driving license</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Know all car types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Local route knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-700 mt-1">✓</span>
                  <span>Safe driving skills</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-purple-900">Personal Qualities</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Police verified</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Well-groomed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Punctual & reliable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Good communication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-700 mt-1">✓</span>
                  <span>Courteous behavior</span>
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
            How to Hire Chauffeur in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Choose Package', desc: 'Daily, outstation, or monthly' },
              { step: '2', title: 'Provide Details', desc: `Car type & location in ${locationName}` },
              { step: '3', title: 'Verify Driver', desc: 'Check driver documents' },
              { step: '4', title: 'Confirm Booking', desc: 'Pay & confirm' },
              { step: '5', title: 'Driver Arrives', desc: 'Professional chauffeur at service' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-gray-50 p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
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
                q: `How much does chauffeur cost in ${locationName}?`,
                a: `Chauffeur service in ${locationName} starts from ₹599/day for 8-10 hours. Outstation drivers cost ₹800-1200/day.`,
              },
              {
                q: `Are chauffeurs in ${locationName} verified?`,
                a: `Yes! All chauffeurs in ${locationName} are police verified with valid driving licenses and background checks.`,
              },
              {
                q: `Can I hire driver for outstation from ${locationName}?`,
                a: `Yes, we provide drivers for outstation trips from ${locationName}. Charges are ₹800-1200/day plus driver allowance.`,
              },
              {
                q: `What is monthly chauffeur package in ${locationName}?`,
                a: `Monthly package in ${locationName} costs ₹15,000-25,000 for 26 days, 8-10 hours per day.`,
              },
              {
                q: `How to book chauffeur in ${locationName}?`,
                a: `Book online on our website. Select ${locationName}, choose package, provide car details and complete booking.`,
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
        serviceSlug="chauffeur-service"
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
            name: `Chauffeur Service in ${locationName}`,
            description: `Hire professional chauffeur in ${locationName}. Verified drivers for daily & outstation use.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '599',
              highPrice: '2500',
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

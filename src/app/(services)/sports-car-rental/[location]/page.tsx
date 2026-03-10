import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
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
    return { title: 'Sports Car Rental | TransRentals' };
  }

  const locationName = city.name;

  const _seoDb = await resolvePageMeta(`sports-car-rental:${params.location}`);
  return {
    title: _seoDb?.metaTitle || `Sports Car Rental ${locationName} | Supercar Hire @₹25k | Ferrari Lamborghini`,
    description: _seoDb?.metaDescription || `Rent sports cars in ${locationName}. Ferrari, Lamborghini, Porsche available. Luxury supercar hire @₹25000/day. Self-drive & chauffeur.`,
    keywords: _seoDb?.metaKeywords ? _seoDb.metaKeywords.split(',').map((k) => k.trim()) : [
      `sports car rental ${locationName.toLowerCase()}`,
      `supercar rental ${locationName.toLowerCase()}`,
      `Ferrari rental ${locationName.toLowerCase()}`,
      `Lamborghini ${locationName.toLowerCase()}`,
      `sports car hire ${locationName.toLowerCase()}`,
      `luxury car ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `sports car ${k}`),
    ],
    openGraph: {
      title: `Sports Car Rental in ${locationName} - Ferrari, Lamborghini @₹25k`,
      description: `Rent exotic supercars in ${locationName}. Ultimate luxury sports car experience.`,
      url: `https://transrentals.in/sports-car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/sports-car-rental/${params.location}`,
    },
  };
}

export default async function SportsCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('sports-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="sports-car-rental" serviceName="Sports Car Rental" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  const seoData = await resolvePageMeta(`sports-car-rental:${params.location}`);


  return (
    <>
      <ServiceHeroWithChat
        pageHeading={seoData?.pageHeading || undefined}
        pageDescription={seoData?.pageDescription || undefined}
        badge={`Sports Car Rental in ${locationName}`}
        title="Exotic Sports Car Rental"
        titleHighlight="Ferrari, Lamborghini @₹25k/day"
        description={`Rent exotic supercars in ${locationName}. Ferrari, Lamborghini, Porsche, McLaren. Perfect for weddings, celebrations, and making memories.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Premium Fleet', color: 'text-red-600' },
          { icon: 'zap', text: 'Instant Booking', color: 'text-orange-600' },
        ]}
        gradientFrom="red-50"
        gradientTo="orange-50"
      />

      {/* Why Sports Car */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Rent Sports Car in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🏆', title: 'Ultimate Experience', desc: `Dream driving in ${locationName}` },
              { icon: '💎', title: 'Luxury & Style', desc: 'Arrive in elegance' },
              { icon: '📸', title: 'Photo Perfect', desc: 'Instagram-worthy' },
              { icon: '🎉', title: 'Special Events', desc: 'Weddings, parties' },
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

      {/* Sports Cars Available */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Supercars Available in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { car: 'Lamborghini Huracan', price: '75000', category: 'Italian Supercar' },
              { car: 'Ferrari 488', price: '80000', category: 'Italian Legend' },
              { car: 'Porsche 911', price: '35000', category: 'German Excellence' },
              { car: 'McLaren 570S', price: '70000', category: 'British Supercar' },
              { car: 'Audi R8', price: '40000', category: 'German Supercar' },
              { car: 'Nissan GT-R', price: '25000', category: 'JDM Legend' },
            ].map((item) => (
              <div key={item.car} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-red-700">
                <p className="text-sm text-red-800 font-semibold mb-2">{item.category}</p>
                <h3 className="text-xl font-bold mb-2">{item.car}</h3>
                <p className="text-2xl font-bold text-red-800 mb-4">₹{item.price}/day</p>
                <button className="w-full bg-red-700 text-white py-2 rounded hover:bg-red-800 transition">
                  Book Supercar
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
            Perfect for Events in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Weddings', icon: '💒', desc: `Grand entry in ${locationName}` },
              { occasion: 'Birthdays', icon: '🎂', desc: 'Celebration' },
              { occasion: 'Proposals', icon: '💍', desc: 'Romantic surprise' },
              { occasion: 'Photo Shoots', icon: '📸', desc: 'Luxury backdrops' },
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
            Sports Car Features in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-red-800">Car Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Latest supercar models</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Pristine condition</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>High-performance engines</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Exotic interiors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-800 mt-1">✓</span>
                  <span>Advanced safety</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-orange-900">Rental Options</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Self-drive available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Chauffeur service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Hourly/daily rentals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>Full insurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-800 mt-1">✓</span>
                  <span>24/7 support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Sports Car Packages in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { duration: 'Hourly (4 hrs)', price: '15000-40000', desc: 'Min 4 hours' },
              { duration: 'Daily (24 hrs)', price: '25000-80000', desc: 'Full day' },
              { duration: 'Weekend', price: '50000-150000', desc: '2-3 days' },
            ].map((plan) => (
              <div key={plan.duration} className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-semibold text-lg mb-2">{plan.duration}</h3>
                <p className="text-2xl font-bold text-red-800 mb-2">₹{plan.price}</p>
                <p className="text-sm text-gray-600">{plan.desc}</p>
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
                q: `How much does sports car rental cost in ${locationName}?`,
                a: `Sports car rental in ${locationName} starts from ₹25,000/day for GT-R. Ferrari costs ₹80,000/day, Lamborghini ₹75,000/day.`,
              },
              {
                q: `Can I self-drive sports car in ${locationName}?`,
                a: `Yes, self-drive available in ${locationName} with 3+ years license and security deposit. Chauffeur also available.`,
              },
              {
                q: `Which supercars available in ${locationName}?`,
                a: `We have Lamborghini, Ferrari, Porsche, McLaren, Audi R8, and GT-R in ${locationName}. Availability varies.`,
              },
              {
                q: `What documents needed in ${locationName}?`,
                a: `You need driving license (3+ years), Aadhar, PAN, address proof, and security deposit in ${locationName}.`,
              },
              {
                q: `How to book sports car in ${locationName}?`,
                a: `Book online. Select ${locationName}, choose supercar, provide documents and pay deposit.`,
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
        serviceSlug="sports-car-rental"
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
            name: `Sports Car Rental in ${locationName}`,
            description: `Rent exotic supercars in ${locationName}. Ferrari, Lamborghini, Porsche available.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '25000',
              highPrice: '80000',
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

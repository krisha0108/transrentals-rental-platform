import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getCityBySlug } from '@/data/indian-cities';
import { getServiceLocations } from '@/lib/services/service-locations';;
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { resolveServicePage } from '@/lib/services/service-availability';
import { StateServicePage } from '@/components/location/StateServicePage';

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
    return { title: 'Corporate Car Rental | TransRentals' };
  }

  const locationName = city.name;

  return {
    title: `Corporate Car Rental ${locationName} | Employee Transport @₹15k | Business Taxi`,
    description: `Corporate car rental in ${locationName}. Employee transport, business meetings, fleet management. Professional service @₹15000/month.`,
    keywords: [
      `corporate car rental ${locationName.toLowerCase()}`,
      `corporate taxi ${locationName.toLowerCase()}`,
      `employee transport ${locationName.toLowerCase()}`,
      `business car rental ${locationName.toLowerCase()}`,
      `company car lease ${locationName.toLowerCase()}`,
      `office cab ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `corporate car ${k}`),
    ],
    openGraph: {
      title: `Corporate Car Rental in ${locationName} - Employee Transport @₹15k`,
      description: `Professional corporate car rental in ${locationName}. Business fleet management.`,
      url: `https://transrentals.in/corporate-car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/corporate-car-rental/${params.location}`,
    },
  };
}

export default async function CorporateCarRentalLocationPage({ params }: PageProps) {
  const pageContext = await resolveServicePage('corporate-car-rental', params.location);
  if (pageContext.type === 'redirect') permanentRedirect(pageContext.to);
  if (pageContext.type === 'state') return <StateServicePage state={pageContext.state} activeCities={pageContext.activeCities} serviceSlug="corporate-car-rental" serviceName="Corporate Car Rental" />;
  const city = pageContext.city;
  // Fallback: getAllCities().find(c => c.slug === params.location);

  const locationName = city.name;

  return (
    <>
      <ServiceHeroWithChat
        badge={`Corporate Car Rental in ${locationName}`}
        title="Corporate Car Services"
        titleHighlight="Employee Transport @₹15k/month"
        description={`Professional corporate car rental in ${locationName}. Employee transport, business meetings, fleet management with GST invoices and monthly billing.`}
        features={[
          { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Professional Service', color: 'text-slate-600' },
          { icon: 'zap', text: 'Fleet Management', color: 'text-blue-600' },
        ]}
        gradientFrom="slate-50"
        gradientTo="zinc-50"
      />

      {/* Why Corporate Car */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Why Choose Corporate Car Rental in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💼', title: 'Professional', desc: `Enhance image in ${locationName}` },
              { icon: '⏰', title: 'Punctual', desc: 'Always on-time' },
              { icon: '💰', title: 'Cost Effective', desc: 'Save money' },
              { icon: '📊', title: 'Reports', desc: 'Monthly statements' },
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

      {/* Corporate Solutions */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8">
            Corporate Solutions in {locationName}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { solution: 'Employee Transport', price: '15000-25000' },
              { solution: 'Executive Car', price: '25000-40000' },
              { solution: 'Airport Transfer', price: '500-1500/trip' },
              { solution: 'Client Meetings', price: '2000-4000/day' },
              { solution: 'Event Transport', price: '3000-8000/day' },
              { solution: 'Fleet Management', price: 'Custom' },
            ].map((item) => (
              <div key={item.solution} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-gray-700">
                <h3 className="text-xl font-bold mb-2">{item.solution}</h3>
                <p className="text-2xl font-bold text-gray-800 mb-4">₹{item.price}</p>
                <button className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 transition">
                  Get Quote
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
            Perfect for Businesses in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Employee Commute', icon: '🚗', desc: `Office transport in ${locationName}` },
              { occasion: 'Client Meetings', icon: '🤝', desc: 'Professional service' },
              { occasion: 'Airport Transfers', icon: '✈️', desc: 'Business travelers' },
              { occasion: 'Events', icon: '🎯', desc: 'Corporate events' },
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

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Corporate Benefits in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-slate-700">Service Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Professional chauffeurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Well-maintained vehicles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>GPS tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>24/7 support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Full insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl mb-4 text-gray-800">Business Benefits</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Monthly billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Detailed reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>GST invoices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>No maintenance cost</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Scalable fleet</span>
                </li>
              </ul>
            </div>
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
                q: `How much does corporate car rental cost in ${locationName}?`,
                a: `Corporate car rental in ${locationName} starts from ₹15,000/month for employee transport. Executive cars cost ₹25,000-40,000/month.`,
              },
              {
                q: `Do you provide GST invoice in ${locationName}?`,
                a: `Yes! We provide proper GST invoices for all corporate bookings in ${locationName} for tax benefits.`,
              },
              {
                q: `Can we rent multiple cars in ${locationName}?`,
                a: `Yes, we provide fleet management in ${locationName} with centralized billing and reports.`,
              },
              {
                q: `What is minimum contract in ${locationName}?`,
                a: `Minimum contract is 1 month for monthly packages in ${locationName}. Daily bookings have no minimum commitment.`,
              },
              {
                q: `How to book corporate car in ${locationName}?`,
                a: `Contact us for requirements. We'll create custom proposal for ${locationName}. After agreement, vehicles deployed.`,
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
            name: `Corporate Car Rental in ${locationName}`,
            description: `Professional corporate car rental in ${locationName}. Employee transport and business fleet management.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: '15000',
              highPrice: '40000',
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

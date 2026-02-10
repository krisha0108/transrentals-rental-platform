import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ALL_CITIES, STATIC_CITIES, getCityBySlug } from '@/data/indian-cities';
import { Crown, Star, Shield, Clock, Phone } from 'lucide-react';
import { LuxuryBookingHero } from '@/components/luxury';
import { ServiceComingSoon } from '@/components/location/ServiceComingSoon';
import { isServiceAvailableInLocation, getNearbyAvailableLocations } from '@/lib/services/service-availability';
import { prisma } from '@/lib/db/prisma';

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
      console.log('[luxury-car-rental] Skipping database calls during build');
      return [];
    }

    // Fetch enabled locations from database
    const service = await prisma.services.findUnique({
      where: { slug: 'luxury-car-rental' },
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
      console.log('[luxury-car-rental] Service not found in database');
      return [];
    }

    const locations = service.service_locations.map((sl) => ({
      location: sl.locations.slug,
    }));

    console.log(`[luxury-car-rental] Generating ${locations.length} location pages from database`);
    return locations;
  } catch (error) {
    console.error('[luxury-car-rental] Error fetching locations:', error);
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
    return { title: 'Luxury Car Rental | TransRentals' };
  }

  const locationName = city.name;

  return {
    title: `Luxury Car Rental in ${locationName} | BMW, Mercedes, Audi, Ferrari | TransRentals`,
    description: `Rent luxury & exotic cars in ${locationName}. BMW, Mercedes, Audi, Jaguar, Range Rover, Ferrari, Lamborghini. Premium car hire with professional chauffeur. Wedding, corporate events.`,
    keywords: [
      `luxury car rental ${locationName.toLowerCase()}`,
      `exotic car hire ${locationName.toLowerCase()}`,
      `BMW rental ${locationName.toLowerCase()}`,
      `Mercedes rental ${locationName.toLowerCase()}`,
      `Ferrari rental ${locationName.toLowerCase()}`,
      `wedding car ${locationName.toLowerCase()}`,
      ...(city.keywords || []).map(k => `luxury car ${k}`),
    ],
    openGraph: {
      title: `Luxury Car Rental in ${locationName} - BMW, Mercedes, Audi, Ferrari`,
      description: `Book luxury & exotic cars in ${locationName}. Premium vehicles with chauffeur service for weddings, corporate events, and special occasions.`,
      url: `https://transrentals.in/luxury-car-rental/${params.location}`,
    },
    alternates: {
      canonical: `https://transrentals.in/luxury-car-rental/${params.location}`,
    },
  };
}


export default async function LuxuryCarRentalLocationPage({ params }: PageProps) {
  const city = getCityBySlug(params.location);

  if (!city) {
    notFound();
  }

  const locationName = city.name;

  // Check if luxury-car-rental service is available in this location
  const isAvailable = await isServiceAvailableInLocation('luxury-car-rental', params.location);

  // If service not available, show coming soon page
  if (!isAvailable) {
    const nearbyLocations = await getNearbyAvailableLocations('luxury-car-rental', params.location, 6);
    return (
      <ServiceComingSoon
        serviceName="Luxury Car Rental"
        serviceSlug="luxury-car-rental"
        locationName={locationName}
        locationSlug={params.location}
        nearbyLocations={nearbyLocations}
      />
    );
  }

  // Get nearby cities for internal linking
  const nearbyCities = ALL_CITIES
    .filter(c => c.state === city.state && c.slug !== city.slug)
    .slice(0, 6);

  return (
    <>
      {/* Luxury Booking Hero */}
      <LuxuryBookingHero
        city={locationName}
        citySlug={params.location}
      />

      {/* Why Choose Luxury Cars in This City */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Why Rent Luxury Cars in {locationName}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Crown, title: 'Premium Fleet', desc: `Latest luxury models available in ${locationName}`, color: 'text-amber-500 bg-amber-50' },
              { icon: Star, title: 'Expert Chauffeurs', desc: 'Trained, professional drivers who know the city', color: 'text-purple-500 bg-purple-50' },
              { icon: Clock, title: 'Flexible Timing', desc: 'Book by hour, day, or week as per your need', color: 'text-blue-500 bg-blue-50' },
              { icon: Shield, title: 'Fully Insured', desc: 'Complete peace of mind with comprehensive coverage', color: 'text-green-500 bg-green-50' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${feature.color} flex items-center justify-center`}>
                  <feature.icon className={`w-7 h-7 ${feature.color.split(' ')[0]}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect Occasions */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Perfect for Events in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Weddings', icon: '💒', desc: `Grand arrivals at ${locationName} weddings` },
              { occasion: 'Corporate Events', icon: '💼', desc: 'Impress clients and partners' },
              { occasion: 'Airport Transfers', icon: '✈️', desc: `VIP service to ${locationName} airport` },
              { occasion: 'Photoshoots', icon: '📸', desc: 'Perfect backdrop for your shoot' },
            ].map((item) => (
              <div key={item.occasion} className="bg-white p-6 rounded-xl text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Services Included */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-5xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            What&apos;s Included in {locationName}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
              <h3 className="font-bold text-xl mb-4 text-purple-900 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Standard Features
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  'Professional chauffeur service',
                  'Fuel charges included',
                  `Doorstep delivery in ${locationName}`,
                  'Complimentary water & tissues',
                  'Full insurance coverage',
                  '24/7 customer support',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl border border-amber-100">
              <h3 className="font-bold text-xl mb-4 text-amber-900 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Premium Amenities
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  'Latest model luxury vehicles',
                  'Premium leather interiors',
                  'Advanced infotainment system',
                  'Climate control AC',
                  'Premium sound system',
                  'Wi-Fi connectivity (select cars)',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* How to Book */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            How to Book in {locationName}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Fill Details', desc: 'Tell us your trip type, date & time', icon: Clock },
              { step: '2', title: 'Get Quotes', desc: 'Receive quotes from verified vendors', icon: Star },
              { step: '3', title: 'Accept Quote', desc: 'Choose the best quote for you', icon: Shield },
              { step: '4', title: 'Enjoy Luxury', desc: 'We deliver to your doorstep', icon: Crown },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-purple-900 text-white rounded-full flex items-center justify-center">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Luxury Cars in Nearby Cities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {nearbyCities.map((nearbyCity) => (
                <Link
                  key={nearbyCity.slug}
                  href={`/luxury-car-rental/${nearbyCity.slug}`}
                  className="bg-white p-4 rounded-xl text-center hover:shadow-lg transition-all duration-300 hover:border-purple-200 border border-transparent"
                >
                  <h3 className="font-semibold text-gray-900 hover:text-purple-900 transition-colors">
                    {nearbyCity.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Premium Luxury Cars</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            FAQs - Luxury Car Rental in {locationName}
          </h2>
          <div className="space-y-4">
            {[
              {
                q: `How does luxury car booking work in ${locationName}?`,
                a: `Simply fill in your trip details (date, time, type of trip), and our verified vendors will send you customized quotes. Compare quotes and choose the best one for your needs.`,
              },
              {
                q: `Which luxury cars are available in ${locationName}?`,
                a: `We offer Mercedes E-Class, S-Class, BMW 5/7 Series, Audi A6/A8, Jaguar XF, Range Rover, Porsche 911/Cayenne, Bentley, Rolls-Royce, Ferrari, and Lamborghini in ${locationName}.`,
              },
              {
                q: `Is chauffeur service included in ${locationName}?`,
                a: `Yes, professional chauffeur service is included with all luxury car rentals in ${locationName}. Our chauffeurs are trained, well-groomed, and know the city well.`,
              },
              {
                q: `Do you deliver luxury cars to my location in ${locationName}?`,
                a: `Yes, we provide doorstep delivery anywhere in ${locationName} - home, office, hotel, airport, or event venue. Delivery arrangements are included in vendor quotes.`,
              },
              {
                q: `Can I rent exotic cars like Ferrari or Lamborghini in ${locationName}?`,
                a: `Yes, exotic supercars including Ferrari 488, Lamborghini Huracan, Porsche 911 are available in ${locationName} for special occasions, photoshoots, and events.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-purple-900 via-purple-800 to-gray-900 text-white">
        <div className="container-custom text-center">
          <Crown className="w-12 h-12 mx-auto text-amber-400 mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience Luxury in {locationName}?
          </h2>
          <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
            Fill in your requirements and get personalized quotes from verified vendors. Doorstep delivery guaranteed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`/luxury-car-rental/${params.location}/book`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300"
            >
              <Crown className="w-5 h-5" />
              Get Quotes Now
            </a>
            <a
              href="tel:+919737965551"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 border border-white/20"
            >
              <Phone className="w-5 h-5" />
              +91 97379 65551
            </a>
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: `Luxury Car Rental in ${locationName}`,
            description: `Rent luxury and exotic cars in ${locationName}. BMW, Mercedes, Audi, Ferrari, Lamborghini, Rolls-Royce with professional chauffeur.`,
            provider: {
              '@type': 'Organization',
              name: 'TransRentals',
              url: 'https://transrentals.in',
            },
            areaServed: {
              '@type': 'City',
              name: locationName,
              containedInPlace: {
                '@type': 'State',
                name: city.state,
              },
            },
          }),
        }}
      />
    </>
  );
}

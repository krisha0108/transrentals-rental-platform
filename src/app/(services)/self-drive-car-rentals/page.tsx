import { Metadata } from 'next';
import Image from 'next/image';
import { CarSearchHero } from '@/components/car';
import { CarRentalPopularCitiesGrid } from '@/components/car-rental/CarRentalPopularCitiesGrid';
import { ServiceFleetDisplay } from '@/components/services/ServiceFleetDisplay';
import { HowToSchema } from '@/components/seo/schemas';
import {
  ShieldCheck, CalendarClock, Wallet, Map, Car, Smartphone, Wrench, Headphones,
  CarFront, MapPin, MessageCircleQuestion, Plus, FileCheck2, UserCheck, Check,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Self Drive Car Rental - Rent Cars @₹899/Day',
  description: 'Self-drive car rentals across India. No driver needed. Drive yourself. Hatchbacks, sedans, SUVs available. Book online instantly. 24/7 support.',
  keywords: ['self drive car rental', 'self drive cars', 'car rental without driver', 'self drive car hire', 'drive yourself car rental', 'car rental no driver'],
  openGraph: {
    title: 'Self Drive Car Rental India - Starting @₹899/Day | TransRentals',
    description: 'Rent self-drive cars across 250+ Indian cities. No driver needed. Freedom to drive yourself. Book online.',
    type: 'website',
    url: 'https://transrentals.in/self-drive-car-rentals',
    images: [{ url: 'https://transrentals.in/images/og/self-drive.jpg', width: 1200, height: 630, alt: 'Self Drive Car Rental - TransRentals' }],
    locale: 'en_IN',
    siteName: 'TransRentals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Self Drive Car Rental India - Starting @₹899/Day | TransRentals',
    description: 'Rent self-drive cars across 250+ Indian cities. No driver needed. Freedom to drive yourself.',
    images: ['https://transrentals.in/images/og/self-drive.jpg'],
  },
  alternates: { canonical: 'https://transrentals.in/self-drive-car-rentals' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

type IconProps = { className?: string };

/* Saare custom icons ek hi optical size ke hain: shapes 3.5–20.5 ke beech
   rehti hain, taaki 20px par bhi kinare na chhuen. */

/* Steering wheel — lucide me nahi hai */
function SteeringWheelIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M4.4 10.9h15.2" />
      <path d="M10.6 14.1 9.2 19.4" />
      <path d="M13.4 14.1l1.4 5.3" />
    </svg>
  );
}

/* Form + cursor — "Book Online" */
function DocCursorIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13.5 3.5H7a1.8 1.8 0 0 0-1.8 1.8v13.4A1.8 1.8 0 0 0 7 20.5h4" />
      <path d="M13.5 3.5 18 8v3.5" />
      <path d="M8.4 9h6M8.4 12h5M8.4 15h3" />
      <path d="m14.2 14 6 2.6-2.4.9-.9 2.4-2.7-5.9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Car + tick — "Return Car".
   Car neeche-baayin, tick upar-daayin. Tick ke neeche safed halo hai taaki
   dono shapes chhote size par bhi alag-alag padhi jaayen. */
function CarCheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* car */}
      <path d="M4 17.6v1.5M12.6 17.6v1.5" />
      <path d="M3.2 17.6v-3.1a1.7 1.7 0 0 1 .26-.9l1.7-2.7a1.7 1.7 0 0 1 1.44-.8h5.1" />
      <path d="M13.4 14.1H3.2" />
      <path d="M13.4 14.1v3.5" />
      <circle cx="5.9" cy="16.5" r="0.85" />
      <circle cx="10.9" cy="16.5" r="0.85" />
      {/* tick — pehle safed halo, phir hara chakkar */}
      <circle cx="17.6" cy="6.6" r="4.4" stroke="#fff" strokeWidth={3} />
      <circle cx="17.6" cy="6.6" r="3.5" />
      <path d="m16.1 6.6 1.1 1.1 2.1-2.2" />
    </svg>
  );
}

export default function SelfDriveCarRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Book a Self-Drive Car Rental on TransRentals"
        description="Rent a car without a driver in 4 simple steps. Drive yourself."
        totalTime="PT10M"
        steps={[
          { name: 'Choose City & Dates', text: 'Select city, pickup date, return date, and preferred pickup location (home delivery or vendor pickup).' },
          { name: 'Pick a Car', text: 'Choose from hatchback, sedan, SUV, or luxury car. View fuel type — petrol, diesel, or CNG.' },
          { name: 'Complete KYC', text: 'Upload driving licence, Aadhaar/PAN, and selfie. Pay refundable security deposit online.' },
          { name: 'Pick Up & Drive', text: 'Collect car from vendor at the scheduled time. Do pre-rental inspection and start your trip.' },
        ]}
      />
      {/* Hero Section */}
      <CarSearchHero
        city=""
        citySlug=""
        citySelectable
        pageDescription="Rent self-drive cars across 250+ cities. No driver needed — complete freedom. Hatchbacks, Sedans, SUVs available!"
      />

      {/* Fleet Display from Database */}
      <ServiceFleetDisplay
        serviceSlug="self-drive-car-rentals"
        title="Self Drive Cars Available"
        showCategories={true}
        limit={12}
        priceUnit="/day"
      />

      {/* Locations from Database — same cities grid the car-rental and
          bus-rental pages use, so the whole family looks alike. */}
      <CarRentalPopularCitiesGrid
        serviceSlug="self-drive-car-rentals"
        title="Self Drive Cars in Popular Cities"
        startingPrice="₹899"
        priceUnit="/day"
      />

      {/* Why Self Drive */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        {/* Halka dotted pattern — upar baayin aur neeche daayin kone me */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
          }}
        />

        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
            <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900">
              Why Choose Self-Drive
              <br />
              <span className="text-primary">With TransRentals?</span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-gray-600">
              Experience the freedom of driving on your terms with complete privacy,
              flexibility, and peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[
              { Icon: ShieldCheck, title: 'Privacy', desc: 'Drive alone or with family, no third person' },
              { Icon: CalendarClock, title: 'Flexibility', desc: 'Your schedule, your route, your stops' },
              { Icon: Wallet, title: 'Cost Effective', desc: 'No driver charges, save money' },
              { Icon: Map, title: 'Freedom', desc: 'Explore at your own pace' },
              { Icon: Car, title: 'Wide Selection', desc: 'Hatchbacks to SUVs available' },
              { Icon: Smartphone, title: 'Easy Booking', desc: 'Book online in 2 minutes' },
              { Icon: Wrench, title: 'Well Maintained', desc: 'All cars regularly serviced' },
              { Icon: Headphones, title: '24/7 Support', desc: 'Round the clock assistance' },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 px-4 py-5 text-center"
              >
                {/* Hara gol icon, uske chaaron taraf dashed halka chakkar */}
                <div className="relative w-14 h-14 mx-auto mb-3.5">
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-primary-200 rotate-[18deg] group-hover:rotate-[78deg] transition-transform duration-500" />
                  <span className="absolute inset-[5px] rounded-full bg-primary-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" strokeWidth={1.9} />
                  </span>
                </div>
                <h3 className="font-bold text-[15px] text-gray-900 leading-snug">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-gray-500">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        {/* Halka dotted pattern kono me */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#BBF7D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(360px 300px at 4% 20%, #000 0%, transparent 70%), radial-gradient(360px 300px at 96% 80%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(360px 300px at 4% 20%, #000 0%, transparent 70%), radial-gradient(360px 300px at 96% 80%, #000 0%, transparent 70%)',
          }}
        />

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-primary-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              EASY &amp; CONVENIENT
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              How Self-Drive Car Rental <span className="text-primary">Works</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Renting your favorite car is simple and hassle-free. Just follow these
              easy steps and hit the road with complete freedom.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Baayin taraf ki dotted lakeer, jispar step ke number tike hain */}
            <span
              aria-hidden
              className="hidden sm:block absolute left-[23px] top-10 bottom-10 border-l-2 border-dashed border-primary-200"
            />

            <div className="space-y-3.5">
              {[
                { no: '01', Icon: CarFront, img: '/images/steps/self-drive/step-1-choose-car.webp', title: 'Choose Your Car', desc: 'Select from our wide range of self-drive cars based on your needs and budget' },
                { no: '02', Icon: DocCursorIcon, img: '/images/steps/self-drive/step-2-book-online.webp', title: 'Book Online', desc: 'Book instantly on our website or app. Provide basic details and documents' },
                { no: '03', Icon: MapPin, img: '/images/steps/self-drive/step-3-pickup.webp', title: 'Pick Up Car', desc: 'Pick up the car from our location or get it delivered to your doorstep' },
                { no: '04', Icon: SteeringWheelIcon, img: '/images/steps/self-drive/step-4-drive.webp', title: 'Drive & Enjoy', desc: 'Drive wherever you want, whenever you want. Complete freedom and privacy' },
                { no: '05', Icon: CarCheckIcon, img: '/images/steps/self-drive/step-5-return.webp', title: 'Return Car', desc: 'Return the car at the end of your rental period. Simple and hassle-free' },
              ].map(({ no, Icon, img, title, desc }) => (
                <div key={no} className="relative flex items-stretch gap-4 sm:gap-6">
                  {/* Lakeer par ka gol number */}
                  <div className="hidden sm:grid relative shrink-0 w-12 place-items-center">
                    <span className="relative w-12 h-12 grid place-items-center">
                      <span className="absolute inset-0 rounded-full border-2 border-dashed border-primary-200 bg-white" />
                      <span className="absolute inset-[5px] rounded-full bg-primary text-white grid place-items-center text-xs font-bold">
                        {no}
                      </span>
                    </span>
                  </div>

                  {/* Step ka card */}
                  <div className="group flex-1 flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-4 sm:px-5 py-4">
                    <span className="shrink-0 w-11 h-11 rounded-full bg-white border border-gray-100 shadow-sm grid place-items-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </span>

                    <span className="shrink-0 text-3xl font-black text-primary tabular-nums">{no}</span>
                    <span aria-hidden className="shrink-0 w-px self-stretch bg-gray-100" />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[18px] md:text-[19px] leading-snug text-gray-900">{title}</h3>
                      <p className="mt-1.5 text-[14.5px] md:text-[15px] leading-relaxed text-gray-600">{desc}</p>
                    </div>

                    {/* Daayin taraf step ki apni tasveer — sabka khaana ek hi naap ka */}
                    <span className="hidden md:grid shrink-0 w-24 h-24 rounded-xl bg-primary-50/40 place-items-center overflow-hidden">
                      <Image
                        src={img}
                        alt=""
                        width={240}
                        height={240}
                        /* chhoti tasveerein (~6 KB) — lazy rakhne se khaali
                           khaana ek pal ke liye dikhta tha */
                        loading="eager"
                        className="w-full h-full object-contain"
                      />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Requirements */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#BBF7D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(360px 300px at 5% 15%, #000 0%, transparent 70%), radial-gradient(360px 300px at 95% 85%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(360px 300px at 5% 15%, #000 0%, transparent 70%), radial-gradient(360px 300px at 95% 85%, #000 0%, transparent 70%)',
          }}
        />

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-primary-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              BEFORE YOU BOOK
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Requirements for <span className="text-primary">Self Drive</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Keep these ready and the handover takes just a few minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {[
              {
                Icon: FileCheck2,
                title: 'Documents Required',
                note: 'Carry the originals at pickup',
                items: [
                  'Valid Driving License (minimum 1 year old)',
                  'Aadhar Card / PAN Card (ID proof)',
                  'Address Proof (Aadhar/Utility Bill)',
                  'Refundable Security Deposit',
                ],
              },
              {
                Icon: UserCheck,
                title: 'Age & Experience',
                note: 'Checked once, at the time of booking',
                items: [
                  'Minimum age: 21 years',
                  'Driving license: Minimum 1 year old',
                  'Clean driving record preferred',
                  'For luxury cars: 3+ years experience',
                ],
              },
            ].map(({ Icon, title, note, items }) => (
              <div
                key={title}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-3.5 px-5 py-4 border-b border-gray-100 bg-primary-50/50">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-white border border-gray-100 shadow-sm grid place-items-center">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[17px] text-gray-900 leading-snug">{title}</h3>
                    <p className="text-[12.5px] text-gray-500">{note}</p>
                  </div>
                </div>

                <ul className="px-5 py-2">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 py-3 border-t border-gray-100 first:border-t-0"
                    >
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary-50 grid place-items-center">
                        <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                      </span>
                      <span className="text-[14.5px] leading-snug text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/25 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(380px 300px at 3% 12%, #000 0%, transparent 70%), radial-gradient(380px 300px at 97% 88%, #000 0%, transparent 70%)',
          }}
        />

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-primary-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              GOOD TO KNOW
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Everything people usually ask before booking a self-drive car.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-3">
            {[
              {
                q: 'What is self-drive car rental?',
                a: 'Self-drive car rental means you rent a car and drive it yourself without a driver. You have complete control and privacy during your trip.',
              },
              {
                q: 'How much does self-drive car rental cost?',
                a: 'Self-drive car rental starts from ₹899/day for hatchbacks. Sedans cost around ₹1299/day and SUVs from ₹2199/day. Long-term rentals get additional discounts.',
              },
              {
                q: 'Do I need a driving license?',
                a: 'Yes, a valid driving license (minimum 1 year old) is mandatory for self-drive car rentals. International license holders can also rent with valid documents.',
              },
              {
                q: 'Is fuel included in the rental price?',
                a: 'No, fuel is not included. The car will be provided with some fuel, and you need to refill and return with the same fuel level.',
              },
              {
                q: 'What is the security deposit?',
                a: 'Security deposit ranges from ₹3,000 to ₹15,000 depending on the car type. It is fully refundable if there is no damage to the vehicle.',
              },
              {
                q: 'Can I take the self-drive car outside the city?',
                a: 'Yes, you can take self-drive cars for outstation trips. Additional charges may apply for inter-state travel.',
              },
            ].map((faq, idx) => (
              /* <details> — bina kisi client JS ke khulta-band hota hai */
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-primary-200 open:shadow-md transition-all"
              >
                <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-primary-50 grid place-items-center">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-primary" />
                  </span>
                  <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">
                    {faq.q}
                  </h3>
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-primary group-open:text-white">
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

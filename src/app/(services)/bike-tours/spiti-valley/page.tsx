import { Metadata } from 'next';
import Link from 'next/link';
import { BikeTourHero } from '@/components/bike-tours/BikeTourHero';
import { FAQSection } from '@/components/services/FAQSection';

export const metadata: Metadata = {
  title: 'Spiti Valley Bike Tour 2025 | Guided Motorcycle Tour from ₹26,999 | TransRentals',
  description: 'Book Spiti Valley guided bike tour. 8 days Shimla-Spiti-Manali with ride captain, Royal Enfield, backup vehicle, accommodation & meals. Key Monastery, Chandratal included.',
  keywords: [
    'spiti valley bike tour',
    'spiti motorcycle tour',
    'chandratal bike tour',
    'guided spiti tour',
    'spiti bike trip package',
    'key monastery bike tour',
  ],
  openGraph: {
    title: 'Spiti Valley Guided Bike Tour 2025 | ₹26,999 All-Inclusive | TransRentals',
    description: '8-day guided motorcycle tour through the cold desert with ride captain and backup vehicle.',
    type: 'website',
    url: 'https://transrentals.in/bike-tours/spiti-valley',
  },
  alternates: {
    canonical: 'https://transrentals.in/bike-tours/spiti-valley',
  },
};

const FAQS = [
  { question: 'When does the Spiti Valley road open for bike tours?', answer: 'Spiti\'s high passes, including Kunzum (14,931 ft), stay snowbound for much of the year and typically open around June and stay rideable through October. TransRentals schedules this 8-day tour within that window to avoid road closures.' },
  { question: 'Is fuel easily available throughout the Spiti route?', answer: 'Petrol pumps are scarce beyond Kaza, which has the last reliable pump before Chandratal. TransRentals covers fuel for the entire trip, and the backup vehicle also carries reserve fuel for the Kaza-Chandratal-Manali stretch.' },
  { question: 'What kind of accommodation is provided in Spiti?', answer: 'The ₹26,999 package includes 7 nights of stays that mix hotels in Shimla and Kaza, homestays in Sangla and Nako, and a night of camping under the stars at Chandratal Lake.' },
  { question: 'How difficult is the riding in Spiti compared to Ladakh?', answer: 'Spiti involves rougher, narrower roads in places (especially Kaza to Chandratal) but tops out lower at 14,931 ft versus Ladakh\'s 18,380 ft, making it a slightly less extreme but still adventurous high-altitude ride.' },
  { question: 'What is the group size and what bike is used?', answer: 'Groups are limited to 6–12 riders on Royal Enfield Himalayan or Classic 350 motorcycles, led by an experienced ride captain with a backup vehicle and mechanic for the full 800 km circuit.' },
];

const itinerary = [
  { day: 1, title: 'Shimla Arrival', desc: 'Arrive Shimla, bike allocation, briefing. Evening Mall Road visit.', stay: 'Hotel in Shimla' },
  { day: 2, title: 'Shimla to Sangla', desc: 'Ride through apple orchards. Enter Kinnaur Valley.', distance: '210 km', stay: 'Homestay in Sangla' },
  { day: 3, title: 'Sangla to Nako', desc: 'Cross Kinnaur, enter Spiti. Visit Nako Lake.', distance: '130 km', stay: 'Homestay in Nako' },
  { day: 4, title: 'Nako to Kaza', desc: 'Enter Spiti Valley. Visit Tabo Monastery (1000 years old).', distance: '110 km', stay: 'Hotel in Kaza' },
  { day: 5, title: 'Kaza Exploration', desc: 'Visit Key Monastery, Kibber, Chicham Bridge. Local village tour.', stay: 'Hotel in Kaza' },
  { day: 6, title: 'Kaza to Chandratal', desc: 'Ride to Chandratal Lake. Camp under stars.', distance: '80 km', stay: 'Camp at Chandratal' },
  { day: 7, title: 'Chandratal to Manali', desc: 'Cross Kunzum Pass (14,931 ft) and Rohtang Pass.', distance: '130 km', stay: 'Hotel in Manali' },
  { day: 8, title: 'Departure', desc: 'Farewell breakfast. Tour ends.', stay: 'Tour ends' },
];

export default function SpitiValleyTourPage() {
  return (
    <>
      <BikeTourHero
        badge="Cold Desert Adventure"
        title="Spiti Valley Bike Tour"
        price="₹26,999 All-Inclusive"
        description="Explore the mystical cold desert of Himachal. Ancient monasteries, pristine lakes, and raw Himalayan beauty. A spiritual motorcycle journey."
        gradient="from-teal-800 via-emerald-900 to-green-900"
        accentColor="teal-400"
        stats={[
          { icon: 'clock', label: 'Duration', value: '8 Days' },
          { icon: 'mappin', label: 'Distance', value: '800 km' },
          { icon: 'mountain', label: 'Max Altitude', value: '14,931 ft' },
          { icon: 'users', label: 'Group Size', value: '6–12' },
        ]}
        features={[
          { text: 'Ride Captain' },
          { text: 'Backup Vehicle' },
          { text: 'Homestays' },
          { text: 'Meals Included' },
          { text: 'Riding Gear' },
          { text: 'All Permits' },
        ]}
      />


      {/* Highlights */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Tour Highlights</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: '🏔️', title: 'Kunzum Pass', desc: '14,931 ft' },
              { icon: '🛕', title: 'Key Monastery', desc: '1000 years old' },
              { icon: '💧', title: 'Chandratal Lake', desc: 'Moon Lake' },
              { icon: '🌉', title: 'Chicham Bridge', desc: 'Asia\'s highest' },
              { icon: '🏘️', title: 'Kaza', desc: 'Spiti capital' },
            ].map((h) => (
              <div key={h.title} className="text-center p-4 bg-teal-50 rounded-lg">
                <div className="text-3xl mb-2">{h.icon}</div>
                <h3 className="font-bold text-sm">{h.title}</h3>
                <p className="text-xs text-gray-600">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-4">Day-by-Day Itinerary</h2>
          <p className="text-center text-gray-600 mb-12">Shimla - Spiti - Manali Circuit</p>
          <div className="max-w-3xl mx-auto">
            {itinerary.map((day, index) => (
              <div key={day.day} className="flex gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                    {day.day}
                  </div>
                  {index < itinerary.length - 1 && <div className="w-0.5 h-full bg-teal-200 mt-2" />}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="font-bold text-lg">{day.title}</h3>
                  <p className="text-gray-600 mb-2">{day.desc}</p>
                  <div className="flex gap-4 text-sm">
                    {day.distance && <span className="text-teal-600">📍 {day.distance}</span>}
                    <span className="text-gray-500">🏨 {day.stay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">What&apos;s Included</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🏍️', title: 'Royal Enfield', desc: 'Himalayan or Classic 350' },
              { icon: '👨‍✈️', title: 'Ride Captain', desc: 'Expert local guide' },
              { icon: '🚐', title: 'Backup Vehicle', desc: 'With mechanic' },
              { icon: '🏨', title: '7 Nights Stay', desc: 'Hotels + Camps' },
              { icon: '🍽️', title: 'Meals', desc: 'Breakfast & Dinner' },
              { icon: '⛽', title: 'Fuel', desc: 'Entire trip' },
              { icon: '🧥', title: 'Riding Gear', desc: 'Jacket, gloves' },
              { icon: '📸', title: 'Memories', desc: 'Photo documentation' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4 bg-white rounded-lg shadow">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-900 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Spiti?</h2>
          <p className="text-xl opacity-90 mb-8">Limited batches. Book early for 2025 season.</p>
          <div className="flex gap-4 justify-center">
            <button className="bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition">
              Book Now
            </button>
            <Link href="/bike-tours" className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-teal-900 transition">
              View All Tours
            </Link>
          </div>
        </div>
      </section>

      <FAQSection service="bike-on-rent" customFaqs={FAQS} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />
    </>
  );
}

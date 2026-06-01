'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface RouteFAQsProps {
  fromCity: string;
  toCity: string;
  distance: number;
  estimatedTime?: string | null;
  minPrice?: number;
  tollCharges?: number | null;
  routeType?: 'one-way' | 'round-trip';
}

function generateFAQs(
  fromCity: string,
  toCity: string,
  distance: number,
  estimatedTime: string,
  minPrice: number,
  tollCharges: number,
  routeType: 'one-way' | 'round-trip'
) {
  if (routeType === 'round-trip') {
    return [
      {
        question: `How much does a round trip cab from ${fromCity} to ${toCity} cost?`,
        answer: `Round trip cab from ${fromCity} to ${toCity} starts from ₹${minPrice}. This includes both ways - ${fromCity} to ${toCity} and back to ${fromCity}. Price varies by vehicle type (sedan, SUV, etc.). All charges included - fuel, driver, tolls (₹${tollCharges || 'applicable'}), taxes. No hidden charges.`,
      },
      {
        question: `What is the round trip distance from ${fromCity} to ${toCity}?`,
        answer: `The round trip distance is approximately ${distance} km (${distance / 2} km each way). The journey takes around ${estimatedTime} one way, so plan for travel time both ways.`,
      },
      {
        question: `How is round trip cheaper than one-way?`,
        answer: `Round trip is 20-30% cheaper because you avoid return empty km charges. In one-way trips, customers pay for driver's return journey. In round trip, the driver returns with you, saving those charges. Plus you get same driver both ways!`,
      },
      {
        question: `What is included in the round trip package?`,
        answer: `Round trip package includes: (1) Both way travel (${fromCity} ↔ ${toCity}), (2) Complete fuel charges, (3) Professional driver, (4) Driver allowance & accommodation, (5) Toll charges (₹${tollCharges || 'as applicable'}), (6) State permits and taxes, (7) GST 5%. Driver stays at your arrangement.`,
      },
      {
        question: `Can I return on a different day?`,
        answer: `Yes! Round trip packages are flexible. Typically 2-3 days duration. You can return anytime within package period. Driver waits at destination. Just coordinate return time with driver a few hours in advance.`,
      },
      {
        question: `Where does the driver stay during the trip?`,
        answer: `Driver accommodation is your responsibility. Most budget hotels provide complimentary driver rooms. Alternatively, driver can arrange their own stay at their expense. Just provide meal allowance as per industry standards.`,
      },
      {
        question: `Is there a minimum km limit per day?`,
        answer: `Yes, round trip packages have 250 km/day minimum usage. For ${distance} km round trip, if completed in 2 days, you have ${distance} km included. Extra km beyond package limits charged at per km rate.`,
      },
      {
        question: `Can I make stops during the round trip journey?`,
        answer: `Absolutely! You can make flexible stops for meals, sightseeing, rest, or shopping. All reasonable stops are included. Just inform driver in advance for better time management. Extended stops (over 2 hours) may incur waiting charges.`,
      },
      {
        question: `What payment methods are accepted for round trip?`,
        answer: `We accept: (1) Online payment - UPI, cards, net banking (get instant confirmation), (2) Partial online + cash to driver, (3) Corporate billing. We recommend 50% advance online and rest to driver after journey completion.`,
      },
      {
        question: `What is the cancellation policy for round trip?`,
        answer: `Free cancellation up to 48 hours before journey. Cancellation within 48-24 hours: 25% charge. Within 24 hours: 50% charge. No-show: 75% charge. Refunds processed within 5-7 business days. More flexible than one-way bookings.`,
      },
    ];
  }

  // One-way FAQs (original)
  return [
    {
      question: `How much does a cab from ${fromCity} to ${toCity} cost?`,
      answer: `A one-way cab from ${fromCity} to ${toCity} starts from ₹${minPrice}. The price varies based on vehicle type (sedan, SUV, etc.). All prices include fuel, driver charges, toll (₹${tollCharges || 'applicable'}), and taxes. No hidden charges.`,
    },
    {
      question: `What is the distance from ${fromCity} to ${toCity}?`,
      answer: `The distance from ${fromCity} to ${toCity} is approximately ${distance} km. The journey takes around ${estimatedTime} depending on traffic and route conditions.`,
    },
    {
      question: `Is this a one-way or round trip service?`,
      answer: `This is a ONE-WAY service. You pay only for ${fromCity} to ${toCity} journey. No return charges. If you need round trip, we also offer ${fromCity}-${toCity} round trip packages at discounted rates.`,
    },
    {
      question: `What is included in the ${fromCity} to ${toCity} cab fare?`,
      answer: `The fare includes: (1) Base fare for ${distance} km journey, (2) Complete fuel charges, (3) Driver charges and allowance, (4) Toll and parking charges (₹${tollCharges || 'as applicable'}), (5) State permits and taxes, (6) GST 5%. There are NO hidden charges.`,
    },
    {
      question: `How do I book a cab from ${fromCity} to ${toCity}?`,
      answer: `Booking is simple: (1) Select your pickup date and time above, (2) Choose your vehicle type, (3) Enter passenger details, (4) Make payment. You'll receive instant confirmation with driver details via SMS and email.`,
    },
    {
      question: `Can I change my pickup time after booking?`,
      answer: `Yes, you can change pickup time up to 6 hours before journey. Contact our support team or use the "Modify Booking" option in your confirmation email. No charges for time changes.`,
    },
    {
      question: `What if I want to make stops during ${fromCity} to ${toCity} journey?`,
      answer: `You can make stops for refreshments, meals, or sightseeing. Inform your driver in advance. Most stops (15-30 minutes) are complimentary. Extended stops may incur minimal waiting charges.`,
    },
    {
      question: `Are the drivers experienced with ${fromCity} to ${toCity} route?`,
      answer: `Yes! All our drivers are verified, experienced, and familiar with the ${fromCity}-${toCity} route. They know the best routes, rest stops, and can guide you about local attractions.`,
    },
    {
      question: `What payment methods are accepted?`,
      answer: `We accept: (1) Online payment (UPI, credit/debit cards, net banking), (2) Cash to driver (after journey), (3) Corporate accounts. Online payment gets instant confirmation.`,
    },
    {
      question: `Is there a cancellation policy?`,
      answer: `Free cancellation up to 24 hours before journey. Cancellation within 24 hours: 25% charge. No-show: 50% charge. Refunds processed within 5-7 business days.`,
    },
  ];
}

export function RouteFAQs({
  fromCity,
  toCity,
  distance,
  estimatedTime,
  minPrice = 0,
  tollCharges,
  routeType = 'one-way',
}: RouteFAQsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = generateFAQs(
    fromCity,
    toCity,
    distance,
    estimatedTime || '3-4 hours',
    minPrice,
    tollCharges || 0,
    routeType
  );

  return (
    <section className="py-16 bg-white">
      <div className="container-custom max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-600 mb-10">
          Everything you need to know about {fromCity} to {toCity} cab booking
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 transition"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-6 flex items-center justify-between gap-4"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-600 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 text-center border border-emerald-200">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our customer support team is available 24/7 to help you
          </p>
        </div>
      </div>
    </section>
  );
}

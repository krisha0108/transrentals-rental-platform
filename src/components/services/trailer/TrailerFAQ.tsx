import React from 'react';
import { MessageCircleQuestion, Plus } from 'lucide-react';

const FAQS = [
  { q: 'What types of trailers are available for rent?', a: 'We offer flatbed, lowbed, container, curtain-side, skeletal, and refrigerated trailers — ranging from 15 to 60 ton capacity depending on the trailer type.' },
  { q: 'What is the difference between a flatbed and a lowbed trailer?', a: 'A flatbed trailer has a standard-height platform, suitable for general cargo and machinery. A lowbed trailer sits much closer to the ground, making it ideal for oversized or very heavy equipment that exceeds standard height limits.' },
  { q: 'Do oversized loads need a police escort?', a: 'Yes, loads exceeding standard width/height limits typically require a pilot/escort vehicle and route permits. Your vendor will help arrange the necessary permits and escort based on your cargo dimensions.' },
  { q: 'Is the driver included in trailer rental?', a: 'Yes, all trailer rentals include an experienced driver familiar with heavy-load handling and route restrictions for oversized cargo.' },
  { q: 'How is trailer rental priced?', a: 'Pricing depends on trailer type, distance, load weight, and any escort/permit requirements. You will receive a detailed quote from verified transporters before confirming your booking.' },
  { q: 'What documents are required to book a trailer?', a: 'A valid ID proof and, for business shipments, GST details are typically required. For oversized cargo, additional route permit documentation may be needed — your vendor will guide you through this.' },
  { q: 'Can I track my shipment during transit?', a: 'Yes, GPS tracking is available during transit so you can monitor your cargo’s location in real time.' },
];

export function TrailerFAQ() {
  return (
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
      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            GOOD TO KNOW
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          <h2 className="mt-4 text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
            Trailer Rental <span className="text-emerald-600">FAQs</span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => (
            <details
              key={idx}
              open={idx === 0}
              className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
            >
              <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                  <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                </span>
                <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">{faq.q}</h3>
                <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
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
  );
}

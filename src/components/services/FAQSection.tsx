'use client';

import { MessageCircleQuestion, Plus } from 'lucide-react';

const FAQS = [
  {
    question: 'What documents are required to rent a vehicle?',
    answer: 'Valid driving license, Aadhar card, and a security deposit are required.',
  },
  {
    question: 'Is helmet provided with bike rental?',
    answer: 'Yes, we provide complimentary helmets with all bike rentals.',
  },
  {
    question: 'What is the cancellation policy?',
    answer: 'Free cancellation up to 24 hours before pickup time.',
  },
  {
    question: 'Do you offer door delivery?',
    answer: 'Yes, door delivery is available in select cities.',
  },
];

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  service: string;
  location?: string;
  customFaqs?: FAQ[];
}

export function FAQSection({ service, location, customFaqs }: FAQSectionProps) {
  const faqs = customFaqs && customFaqs.length > 0 ? customFaqs : FAQS;

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
      <div className="container-custom max-w-3xl relative">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            GOOD TO KNOW
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          <h2 className="mt-4 text-2xl md:text-3xl font-black tracking-tight text-gray-900">
            Frequently Asked <span className="text-emerald-600">Questions</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={index}
              open={index === 0}
              className="group rounded-2xl bg-white border border-gray-100 shadow-sm open:border-emerald-200 open:shadow-md transition-all"
            >
              <summary className="flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 grid place-items-center">
                  <MessageCircleQuestion className="w-[18px] h-[18px] text-emerald-600" />
                </span>
                <h3 className="flex-1 font-bold text-[15px] leading-snug text-gray-900">
                  {faq.question}
                </h3>
                <span className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 text-gray-500 grid place-items-center transition-all duration-200 group-open:rotate-45 group-open:bg-emerald-600 group-open:text-white">
                  <Plus className="w-4 h-4" />
                </span>
              </summary>
              <p className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] text-[14px] leading-relaxed text-gray-500">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

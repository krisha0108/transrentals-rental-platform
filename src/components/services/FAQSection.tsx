'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, Plus } from 'lucide-react';

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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 bg-white">
      <div className="container-custom max-w-3xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            FAQs
          </span>
          <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-xl border transition-colors ${
                  isOpen ? 'border-green-200 bg-green-50/40' : 'border-slate-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isOpen ? 'bg-green-600 text-white rotate-45' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-slate-600 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

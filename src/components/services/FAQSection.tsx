import React from 'react';

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
    <section className="py-16 bg-white">
      <div className="container-custom max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2 text-gray-900">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

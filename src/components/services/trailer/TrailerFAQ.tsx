import React from 'react';

export function TrailerFAQ() {
  const faqs = [
    {
      q: 'What types of trailers are available?',
      a: 'We offer open trailers, closed trailers, and flatbed trailers for various needs.',
    },
    {
      q: 'How do I book a trailer?',
      a: 'Simply fill out the booking form, get quotes from vendors, and confirm your booking.',
    },
    {
      q: 'What documents are required?',
      a: 'You need a valid driving license and ID proof to rent a trailer.',
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom max-w-4xl">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

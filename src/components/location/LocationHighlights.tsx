import React from 'react';

interface Highlight {
  title: string;
  description: string;
}

interface LocationHighlightsProps {
  location: string;
  service?: string;
  highlights?: Highlight[];
}

export function LocationHighlights({ location, service, highlights }: LocationHighlightsProps) {
  const defaultHighlights = [
    {
      title: 'Verified Vendors',
      description: `All vendors in ${location} are verified and trusted`,
    },
    {
      title: 'Best Prices',
      description: `Competitive pricing from multiple vendors in ${location}`,
    },
  ];

  const displayHighlights = highlights || defaultHighlights;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom max-w-4xl">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {service ? `Why Choose ${service} in ${location}?` : `Why Choose ${location}?`}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {displayHighlights.map((highlight, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">{highlight.title}</h3>
              <p className="text-gray-600">{highlight.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

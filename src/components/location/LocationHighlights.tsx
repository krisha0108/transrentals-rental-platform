import React from 'react';
import { CheckCircle2 } from 'lucide-react';

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
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 text-center mb-10">
          {service ? (
            <>Why Choose {service} in <span className="text-emerald-600">{location}</span>?</>
          ) : (
            <>Why Choose <span className="text-emerald-600">{location}</span>?</>
          )}
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {displayHighlights.map((highlight, index) => (
            <div
              key={index}
              className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              style={{ animation: `lch-rise .6s cubic-bezier(.22,1,.36,1) ${index * 90}ms forwards`, opacity: 0 }}
            >
              <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </span>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">{highlight.title}</h3>
              <p className="text-sm text-gray-500">{highlight.description}</p>
            </div>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes lch-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { [style*="lch-rise"] { animation: none !important; opacity: 1 !important; } }
      ` }} />
    </section>
  );
}

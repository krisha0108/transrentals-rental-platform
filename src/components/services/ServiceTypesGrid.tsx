import React from 'react';
import Link from 'next/link';

interface ServiceType {
  name: string;
  slug?: string;
  description: string;
  price?: string;
  features?: string[];
  popular?: boolean;
}

interface ServiceTypesGridProps {
  types: ServiceType[];
  title?: string;
  subtitle?: string;
}

export function ServiceTypesGrid({ types, title, subtitle }: ServiceTypesGridProps) {
  return (
    <section className="py-16">
      <div className="container-custom">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {subtitle && <p className="text-xl text-gray-600">{subtitle}</p>}
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type, index) => {
            if (type.slug) {
              return (
                <Link
                  key={type.slug}
                  href={`/${type.slug}`}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition relative"
                >
                {type.popular && (
                  <span className="absolute top-4 right-4 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{type.name}</h3>
                <p className="text-gray-600 mb-4">{type.description}</p>
                {type.price && (
                  <p className="text-2xl font-bold text-primary-600 mb-4">{type.price}</p>
                )}
                {type.features && type.features.length > 0 && (
                  <ul className="space-y-2">
                    {type.features.map((feature, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-primary-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                </Link>
              );
            }

            return (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition relative"
              >
                {type.popular && (
                  <span className="absolute top-4 right-4 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{type.name}</h3>
                <p className="text-gray-600 mb-4">{type.description}</p>
                {type.price && (
                  <p className="text-2xl font-bold text-primary-600 mb-4">{type.price}</p>
                )}
                {type.features && type.features.length > 0 && (
                  <ul className="space-y-2">
                    {type.features.map((feature, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-primary-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

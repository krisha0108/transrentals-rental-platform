import React from 'react';

interface ServiceHeroProps {
  title: string;
  subtitle: string;
  description?: string;
  backgroundImage?: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  availableCities?: string;
  stats?: { value: string; label: string; }[];
}

export function ServiceHero({
  title,
  subtitle,
  description,
  backgroundImage,
  primaryCTA,
  secondaryCTA,
  availableCities,
  stats
}: ServiceHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary-600 to-primary-700 text-white py-20">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-white/90 mb-4">{subtitle}</p>
          {description && <p className="text-lg text-white/80 mb-6">{description}</p>}
          {availableCities && <p className="text-sm text-white/70">{availableCities}</p>}

          {(primaryCTA || secondaryCTA) && (
            <div className="flex gap-4 justify-center mt-8">
              {primaryCTA && (
                <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                  {primaryCTA}
                </button>
              )}
              {secondaryCTA && (
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition">
                  {secondaryCTA}
                </button>
              )}
            </div>
          )}

          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

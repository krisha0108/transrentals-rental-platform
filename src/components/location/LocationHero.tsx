import React from 'react';

interface LocationHeroProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
}

export function LocationHero({ title, subtitle, backgroundImage }: LocationHeroProps) {
  return (
    <section className="relative h-[400px] md:h-[500px] overflow-hidden">
      {/* Background Image/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-400">
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="container-custom relative h-full flex items-center justify-center text-center">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fadeIn">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 animate-slideUp">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Decorative Element */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

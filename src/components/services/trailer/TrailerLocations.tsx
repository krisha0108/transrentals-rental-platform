import React from 'react';
import Link from 'next/link';

export function TrailerLocations() {
  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai'];

  return (
    <section className="py-16">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Available Locations
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cities.map((city) => (
            <Link
              key={city}
              href={`/trailer-on-rent/${city.toLowerCase()}`}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition text-center"
            >
              <p className="font-semibold">{city}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

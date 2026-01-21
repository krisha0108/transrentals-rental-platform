import React from 'react';

interface WhyRentHereProps {
  location?: string;
  locationName?: string;
}

export function WhyRentHere({ location, locationName }: WhyRentHereProps) {
  const displayLocation = locationName || location || 'this location';

  return (
    <section className="py-16">
      <div className="container-custom max-w-4xl">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Why Rent in {displayLocation}?
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Best Prices</h3>
            <p className="text-gray-600">
              Get competitive rates from verified vendors in {displayLocation}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">24/7 Support</h3>
            <p className="text-gray-600">
              Round the clock customer support for all your needs
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

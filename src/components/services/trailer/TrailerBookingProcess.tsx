import React from 'react';

export function TrailerBookingProcess() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom max-w-4xl">
        <h2 className="text-3xl font-bold mb-8 text-center">How to Book</h2>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">1. Select Trailer Type</h3>
            <p className="text-gray-600">Choose the trailer that fits your needs</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">2. Get Quotes</h3>
            <p className="text-gray-600">Receive quotes from verified vendors</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">3. Book & Enjoy</h3>
            <p className="text-gray-600">Confirm booking and get your trailer</p>
          </div>
        </div>
      </div>
    </section>
  );
}

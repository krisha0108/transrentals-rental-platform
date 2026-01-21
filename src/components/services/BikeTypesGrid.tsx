import React from 'react';
import { BIKE_TYPES } from '@/lib/constants/services';

export function BikeTypesGrid() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-center mb-12">Popular Bike Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {BIKE_TYPES.map((type) => (
            <div
              key={type.id}
              className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="text-4xl mb-3">{type.icon}</div>
              <h3 className="font-semibold text-gray-900">{type.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

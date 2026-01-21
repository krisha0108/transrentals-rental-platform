import React from 'react';

const POPULAR_BIKES = [
  { name: 'Royal Enfield Classic 350', price: '₹699/day', image: '🏍️' },
  { name: 'KTM Duke 390', price: '₹1,299/day', image: '🏍️' },
  { name: 'Honda Activa', price: '₹399/day', image: '🛵' },
  { name: 'Yamaha FZ', price: '₹799/day', image: '🏍️' },
];

export function BikeFleetShowcase() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-center mb-12">Popular Bikes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {POPULAR_BIKES.map((bike) => (
            <div
              key={bike.name}
              className="bg-white rounded-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-6xl text-center mb-4">{bike.image}</div>
              <h3 className="font-bold text-lg mb-2">{bike.name}</h3>
              <p className="text-primary font-semibold text-xl">{bike.price}</p>
              <button className="w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-primary/90">
                Get Quotes
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React from 'react';

export function TrailerTypes() {
  const types = [
    { name: 'Open Trailer', desc: 'For general cargo' },
    { name: 'Closed Trailer', desc: 'For secure transport' },
    { name: 'Flatbed Trailer', desc: 'For heavy equipment' },
  ];

  return (
    <section className="py-16">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-8 text-center">Trailer Types</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {types.map((type) => (
            <div key={type.name} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">{type.name}</h3>
              <p className="text-gray-600">{type.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

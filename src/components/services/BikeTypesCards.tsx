'use client';

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const BIKE_SUB_SERVICES = [
  {
    id: "activa-on-rent",
    name: "Activa on Rent",
    icon: "🛵",
    description: "Easy to ride scooters for city commute",
    features: ["110-125cc", "Automatic", "Fuel efficient"],
    price: "Starting @₹299/day",
    url: "/activa-on-rent",
    gradient: "from-blue-500 to-cyan-500",
    popular: true,
  },
  {
    id: "royal-enfield",
    name: "Royal Enfield",
    icon: "🏍️",
    description: "Classic bikes for road trips",
    features: ["Classic 350", "Himalayan", "Perfect for tours"],
    price: "Starting @₹599/day",
    url: "/royal-enfield-on-rent",
    gradient: "from-amber-600 to-yellow-500",
    popular: true,
  },
];

const BIKE_TYPES = [
  {
    id: "sport",
    name: "Sport Bikes",
    icon: "🏍️",
    description: "High performance racing bikes",
    features: ["200cc+", "Racing position", "High speed"],
    price: "Starting @₹699/day",
    gradient: "from-red-500 to-orange-500",
  },
  {
    id: "scooter",
    name: "Scooters",
    icon: "🛵",
    description: "Easy & convenient city rides",
    features: ["110-125cc", "Automatic", "Fuel efficient"],
    price: "Starting @₹299/day",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "cruiser",
    name: "Cruiser Bikes",
    icon: "🏍️",
    description: "Comfortable long-distance rides",
    features: ["Royal Enfield", "Relaxed riding", "Classic style"],
    price: "Starting @₹599/day",
    gradient: "from-amber-600 to-yellow-500",
  },
  {
    id: "street",
    name: "Street/Naked Bikes",
    icon: "🏍️",
    description: "Urban commuting champions",
    features: ["150-200cc", "Upright position", "City friendly"],
    price: "Starting @₹499/day",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "adventure",
    name: "Adventure Tourers",
    icon: "🏍️",
    description: "Built for long journeys",
    features: ["200cc+", "Long range", "All terrain"],
    price: "Starting @₹799/day",
    gradient: "from-green-600 to-teal-500",
  },
  {
    id: "dirt",
    name: "Dirt Bikes",
    icon: "🏍️",
    description: "Off-road adventure bikes",
    features: ["Off-road", "Trail riding", "Adventure ready"],
    price: "Starting @₹899/day",
    gradient: "from-orange-600 to-red-500",
  },
];

export function BikeTypesCards() {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Bike Type
          </h2>
          <p className="text-lg text-gray-600">
            From city scooters to adventure bikes, find the perfect two-wheeler
            for your journey
          </p>
        </div>

        {/* Featured Sub-Services */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Popular Choices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {BIKE_SUB_SERVICES.map((service) => (
              <Link
                key={service.id}
                href={service.url}
                className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex items-center gap-6"
              >
                {service.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                <div
                  className={`w-20 h-20 bg-gradient-to-br ${service.gradient} rounded-lg flex items-center justify-center text-5xl group-hover:scale-110 transition-transform flex-shrink-0`}
                >
                  {service.icon}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-3">{service.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <p className="text-primary font-bold">{service.price}</p>
                </div>

                <div className="flex items-center text-primary font-medium">
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Bike Types */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            All Bike Types
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BIKE_TYPES.map((bike) => (
              <div
                key={bike.id}
                className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${bike.gradient} rounded-lg flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  {bike.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {bike.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{bike.description}</p>

                <ul className="space-y-1 mb-4">
                  {bike.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-xs text-gray-600 flex items-center gap-2"
                    >
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <p className="text-primary font-bold text-sm">{bike.price}</p>

                <div
                  className={`absolute inset-0 bg-gradient-to-br ${bike.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-xl pointer-events-none`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 max-w-4xl mx-auto bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-2">
                All bike types available!
              </h4>
              <p className="text-gray-700">
                Use the booking form above to specify your preferred bike type,
                or let us recommend the best bike for your journey based on
                distance and duration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

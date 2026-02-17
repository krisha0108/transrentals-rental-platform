import { Car, Users, Zap } from 'lucide-react';

interface RoutePricingProps {
  packages: Array<{
    id: string;
    basePrice: number;
    chauffeur_vehicle_categories: {
      name: string;
      seatingCapacity: number;
      exampleVehicles?: string | null;
      image?: string | null;
    };
  }>;
  fromCity: string;
  toCity: string;
  routeSlug?: string;
}

export function RoutePricing({ packages, fromCity, toCity }: RoutePricingProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-center mb-4">
          Choose Your Cab for {fromCity} to {toCity}
        </h2>
        <p className="text-center text-gray-600 mb-10">
          Select from our range of well-maintained vehicles
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {packages.map((pkg, index) => {
            const isPopular = index === 1; // Mark second option as popular
            const examples = pkg.chauffeur_vehicle_categories.exampleVehicles
              ? JSON.parse(pkg.chauffeur_vehicle_categories.exampleVehicles)
              : [];

            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition ${
                  isPopular ? 'ring-2 ring-emerald-500 scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                      ⭐ POPULAR
                    </span>
                  </div>
                )}

                {/* Vehicle Icon */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Car className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {pkg.chauffeur_vehicle_categories.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {pkg.chauffeur_vehicle_categories.seatingCapacity} Seater
                  </p>
                </div>

                {/* Examples */}
                {examples.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 text-center">
                      {examples.slice(0, 3).join(', ')}
                    </p>
                  </div>
                )}

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-emerald-600">
                      ₹{pkg.basePrice}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Per journey (all inclusive)</p>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {[
                    { icon: Users, text: `${pkg.chauffeur_vehicle_categories.seatingCapacity} passengers` },
                    { icon: Zap, text: 'AC & comfortable' },
                    { icon: Car, text: 'Professional driver' },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <feature.icon className="w-4 h-4 text-emerald-600" />
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

        {/* Price Breakdown Info */}
        <div className="mt-12 max-w-4xl mx-auto bg-white rounded-xl p-8 shadow-md">
          <h3 className="text-xl font-bold mb-4 text-center">Price Breakdown</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-emerald-600 mb-3">✓ Included in Price</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Base fare for journey</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Fuel charges (complete)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Driver charges & allowance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Toll & parking charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>State permits & taxes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>GST (5%)</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-600 mb-3">ℹ️ Good to Know</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>No hidden charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Pay only for one-way journey</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>No return fare charged</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Advance booking recommended</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>24/7 customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Instant booking confirmation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

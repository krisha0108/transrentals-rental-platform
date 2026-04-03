'use client';

import { useEffect, useState } from 'react';
import { Car, Users, Timer, Gauge, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PopularPackage {
  id: string;
  name: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
  isPopular: boolean;
  vehicleCategory: {
    name: string;
    seatingCapacity: number;
    acType: string | null;
    fuelType: string | null;
    image: string | null;
    exampleVehicles: string[];
  };
}

export function HourlyPopularPackages() {
  const [packages, setPackages] = useState<PopularPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/services/hourly-car-rental/packages?popular=true')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPackages(d.packages || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container-custom flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </section>
    );
  }

  if (packages.length === 0) return null;

  return (
    <section id="packages" className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Hourly Packages</h2>
          <p className="text-gray-500">Most booked packages across all cities</p>
        </div>

        <div className={`grid gap-5 items-start ${
          packages.length === 1 ? 'max-w-sm mx-auto' :
          packages.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
          packages.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto' :
          'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {packages.map((pkg) => {
            const cat = pkg.vehicleCategory;
            const isExpanded = expandedId === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col ${
                  isExpanded ? 'ring-2 ring-blue-500' : ''
                } ${pkg.isPopular ? 'ring-2 ring-emerald-500' : ''}`}
              >
                {pkg.isPopular && (
                  <div className="absolute" style={{ display: 'none' }} />
                )}
                <div className="relative">
                  {pkg.isPopular && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">⭐ POPULAR</span>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 pt-6 pb-3 flex items-center justify-center min-h-[100px]">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="h-20 object-contain drop-shadow-sm" />
                    ) : (
                      <Car className="w-14 h-14 text-blue-300" />
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mb-1">{cat.seatingCapacity} Seater</p>

                  {cat.exampleVehicles?.length > 0 && (
                    <p className="text-sm text-gray-500 mb-3">{cat.exampleVehicles.slice(0, 3).join(' / ')}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {cat.acType && <span className="bg-blue-50 text-blue-600 text-[11px] font-medium px-2 py-0.5 rounded-full">{cat.acType}</span>}
                    {cat.fuelType && <span className="bg-green-50 text-green-600 text-[11px] font-medium px-2 py-0.5 rounded-full">{cat.fuelType}</span>}
                    <span className="bg-indigo-50 text-indigo-600 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"><Timer className="w-2.5 h-2.5" />{pkg.hours}hr</span>
                    <span className="bg-indigo-50 text-indigo-600 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"><Gauge className="w-2.5 h-2.5" />{pkg.kms}km</span>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className="text-3xl font-bold text-gray-900">₹{pkg.basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">All inclusive · driver + fuel</p>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : pkg.id)}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 mb-3"
                    >
                      {isExpanded ? 'Hide' : 'View'} fare breakdown
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-2 mb-4">
                            <div className="flex justify-between font-semibold text-gray-800">
                              <span>Base fare ({pkg.hours}hr / {pkg.kms}km)</span>
                              <span>₹{pkg.basePrice.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>Extra km charge</span>
                              <span>₹{pkg.extraKmCharge}/km</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>Extra hour charge</span>
                              <span>₹{pkg.extraHourCharge}/hr</span>
                            </div>
                            <div className="flex justify-between text-amber-600 pt-1 border-t border-gray-200">
                              <span>Toll / Parking</span>
                              <span>Extra (as applicable)</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

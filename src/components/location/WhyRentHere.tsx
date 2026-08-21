import React from 'react';
import { IndianRupee, Wallet, Headphones } from 'lucide-react';

interface WhyRentHereProps {
  location?: string;
  locationName?: string;
}

export function WhyRentHere({ location, locationName }: WhyRentHereProps) {
  const displayLocation = locationName || location || 'this location';

  return (
    <section className="py-16 bg-white">
      <div className="container-custom max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 text-center">
          Why Rent in <span className="text-emerald-600">{displayLocation}</span>?
        </h2>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Best Prices */}
          <div className="relative flex items-center justify-between gap-4 bg-emerald-50 rounded-2xl p-6 md:p-7 overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                <IndianRupee className="w-6 h-6 text-white" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Best Prices</h3>
                <p className="text-gray-600 text-sm max-w-[220px]">
                  Get competitive rates from verified vendors in {displayLocation}
                </p>
              </div>
            </div>
            <Wallet className="hidden sm:block w-20 h-20 text-emerald-600/20 shrink-0" strokeWidth={1.5} />
          </div>

          {/* 24/7 Support */}
          <div className="relative flex items-center justify-between gap-4 bg-emerald-50 rounded-2xl p-6 md:p-7 overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                <Headphones className="w-6 h-6 text-white" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">24/7 Support</h3>
                <p className="text-gray-600 text-sm max-w-[220px]">
                  Round the clock customer support for all your needs
                </p>
              </div>
            </div>
            <div className="hidden sm:flex relative shrink-0 w-20 h-20 items-center justify-center">
              <Headphones className="w-20 h-20 text-emerald-600/20" strokeWidth={1.5} />
              <span className="absolute bottom-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                24/7
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

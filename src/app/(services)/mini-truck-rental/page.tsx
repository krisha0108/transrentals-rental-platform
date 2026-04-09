import React from 'react';
import type { Metadata } from 'next';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';
import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { formatPriceHighlight } from '@/lib/utils';

export const metadata: Metadata = {
  title: formatPriceHighlight('Mini Truck Rental - Tata Ace on Rent Starting @₹799/Day | TransRentals'),
  description:
    formatPriceHighlight('Rent mini trucks and Tata Ace for goods transport. 750 KG to 1.5 TON capacity. Perfect for city deliveries. Affordable rates. Book now!'),
  keywords: [
    'mini truck rental',
    'tata ace on rent',
    'tata ace rental',
    'mini truck hire',
    'small truck rental',
    'goods carrier rental',
    'pickup truck rental',
  ],
  openGraph: {
    title: formatPriceHighlight('Mini Truck Rental - Tata Ace @₹799/Day | TransRentals'),
    description: formatPriceHighlight('Rent mini trucks for city deliveries and goods transport.'),
  },
};

export default function MiniTruckRentalPage() {
  return (
    <div className="flex flex-col">
      {/* Hero with Chat Booking System - Same as Transporter */}
      <ServiceHeroWithChat
        badge="Mini Truck Rental in 250+ Cities"
        title="Mini Truck on Rent | Chhota Hathi"
        titleHighlight="Starting @₹799/Day"
        description="Rent mini trucks for local goods transport, house shifting, and small cargo. Tata Ace, Mahindra Pickup available. Get quotes now!"
        features={[
          { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
          { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600' },
          { icon: 'zap', text: 'Quick Booking', color: 'text-green-600' },
        ]}
        gradientFrom="orange-50"
        gradientTo="red-50"
      />

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📦', title: 'Local Deliveries', desc: 'Last-mile & city-wide delivery' },
              { icon: '🏠', title: 'Home Shifting', desc: 'Small household goods moving' },
              { icon: '🏪', title: 'Business Transport', desc: 'Inventory & stock movement' },
              { icon: '🛒', title: 'E-commerce', desc: 'Online order fulfillment' },
              { icon: '🏗️', title: 'Construction Sites', desc: 'Material transport to sites' },
              { icon: '🍕', title: 'Food & Catering', desc: 'Bulk food delivery' },
              { icon: '📚', title: 'Furniture Moving', desc: 'Small furniture items' },
              { icon: '♻️', title: 'Waste Disposal', desc: 'Junk & waste removal' },
            ].map((use) => (
              <div key={use.title} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-center border-2 border-blue-200">
                <div className="text-4xl mb-3">{use.icon}</div>
                <h3 className="font-bold mb-2">{use.title}</h3>
                <p className="text-sm text-gray-600">{use.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Mini Trucks?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                💰
              </div>
              <h3 className="text-xl font-bold mb-2">Cost Effective</h3>
              <p className="text-gray-600">Lower rental and operating costs compared to large trucks</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🎯
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Access</h3>
              <p className="text-gray-600">Navigate narrow lanes and crowded city areas easily</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-2">Quick Loading</h3>
              <p className="text-gray-600">Low deck height for easy loading and unloading</p>
            </div>
          </div>
        </div>
      </section>

      <LocationsGrid service="mini-truck-rental" />

      <FAQSection service="transporter" />

    </div>
  );
}

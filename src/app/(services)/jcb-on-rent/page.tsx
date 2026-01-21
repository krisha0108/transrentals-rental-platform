import React from 'react';
import type { Metadata } from 'next';
import { JCBRentalServiceHero } from '@/components/services/JCBRentalServiceHero';
import { LocationsGrid } from '@/components/services/LocationsGrid';
import { FAQSection } from '@/components/services/FAQSection';

import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
export const metadata: Metadata = {
  title: 'JCB on Rent - Backhoe Loader Rental Starting @₹2499/Day | TransRentals',
  description:
    'Rent JCB backhoe loaders for construction, excavation & road work. Expert operators included. Well-maintained machines. Book JCB rental now!',
  keywords: [
    'jcb on rent',
    'jcb rental',
    'backhoe loader rental',
    'jcb hire',
    'excavator jcb',
    'jcb machine rental',
    'construction equipment rental',
  ],
  openGraph: {
    title: 'JCB on Rent - Starting @₹2499/Day | TransRentals',
    description: 'Rent JCB backhoe loaders with expert operators.',
  },
};

export default function JCBOnRentPage() {
  return (
    <div className="flex flex-col">
      <ServiceHeroWithChat
        badge="JCB Rental in 250+ Cities"
        title="JCB on Rent | Excavator Hire"
        titleHighlight="Starting @₹2999/Day"
        description="Rent JCB excavators for construction, digging, and earthmoving projects. Well-maintained equipment with skilled operators."
        gradientFrom="yellow-50"
        gradientTo="orange-50"
      />

      <JCBRentalServiceHero />

      {/* Applications */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            JCB Applications
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '⛏️', title: 'Excavation', desc: 'Digging foundations, basements & trenches' },
              { icon: '🏗️', title: 'Construction Sites', desc: 'Material handling & site preparation' },
              { icon: '🛣️', title: 'Road Construction', desc: 'Road laying, repair & maintenance work' },
              { icon: '🌳', title: 'Land Clearing', desc: 'Clearing vegetation & leveling land' },
              { icon: '🏠', title: 'Building Foundations', desc: 'Digging & preparing building bases' },
              { icon: '💧', title: 'Pipeline Laying', desc: 'Trenching for water & drainage pipes' },
              { icon: '🚧', title: 'Demolition', desc: 'Breaking & removing concrete structures' },
              { icon: '🏞️', title: 'Landscaping', desc: 'Earth moving & terrain modification' },
              { icon: '⚙️', title: 'Material Loading', desc: 'Loading trucks with earth & materials' },
            ].map((app) => (
              <div key={app.title} className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-lg shadow-md hover:shadow-xl transition border-2 border-yellow-200">
                <div className="text-4xl mb-3">{app.icon}</div>
                <h3 className="text-lg font-bold mb-2">{app.title}</h3>
                <p className="text-sm text-gray-600">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JCB Models */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Available JCB Models
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'JCB 3DX',
                desc: 'Most popular & versatile backhoe loader',
                features: [
                  'Front loader bucket',
                  'Rear excavator arm',
                  'All-terrain capability',
                  '4WD available',
                ],
                price: '₹2,499/day',
              },
              {
                name: 'JCB 3DX Super',
                desc: 'Enhanced performance & capacity',
                features: [
                  'Higher dig depth',
                  'Powerful engine',
                  'Better hydraulics',
                  'Extended reach',
                ],
                price: '₹2,999/day',
              },
            ].map((model) => (
              <div key={model.name} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition border-2 border-yellow-300">
                <div className="text-6xl mb-4">🚜</div>
                <h3 className="text-2xl font-bold mb-2">{model.name}</h3>
                <p className="text-gray-600 mb-4">{model.desc}</p>
                <ul className="space-y-2 mb-6">
                  {model.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-3xl font-bold text-primary">{model.price}</p>
                <p className="text-sm text-gray-600 mt-2">+ Operator charges</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What&apos;s Included in JCB Rental?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚜', title: 'Well-Maintained Machine', desc: 'Serviced & ready to work' },
              { icon: '👷', title: 'Expert Operator', desc: 'Certified & experienced' },
              { icon: '⛽', title: 'Fuel Options', desc: 'With/without fuel available' },
              { icon: '🛠️', title: 'Basic Tools', desc: 'Essential attachments included' },
              { icon: '🚚', title: 'Transportation', desc: 'Delivery to site available' },
              { icon: '🛡️', title: 'Insurance', desc: 'Comprehensive coverage' },
              { icon: '⏰', title: 'Flexible Hours', desc: '8/12/24 hour rentals' },
              { icon: '📞', title: 'Support', desc: 'On-call assistance' },
            ].map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-lg shadow-md text-center border border-yellow-200">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-12 bg-amber-50">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-lg border-2 border-amber-300">
            <h3 className="text-2xl font-bold mb-4 text-center">Pricing Information</h3>
            <div className="space-y-3 text-gray-700">
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Machine Rental:</strong> ₹2,499/day onwards</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Operator Charges:</strong> ₹500-800/day (separate)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Fuel:</strong> Can be included or excluded based on requirement</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Transportation:</strong> Charged based on distance from depot</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Duration:</strong> 8-hour, 12-hour, or 24-hour rentals available</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <LocationsGrid service="jcb-on-rent" />

      <FAQSection service="equipment-rental" />

    </div>
  );
}

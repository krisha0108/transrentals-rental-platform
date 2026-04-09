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

      <LocationsGrid service="jcb-on-rent" />

      <FAQSection service="equipment-rental" />

    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { getCitiesByPriority } from '@/data/indian-cities';

import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
export const metadata: Metadata = {
  title: 'Corporate Car Rental | Employee Transport @₹15000/Month | Business Taxi',
  description: 'Corporate car rental for employee transport, business meetings. Monthly car lease for companies. Professional chauffeur. Fleet management @₹15000/month.',
  keywords: [
    'corporate car rental',
    'corporate taxi',
    'employee transport',
    'business car rental',
    'company car lease',
    'office cab service',
    'corporate fleet',
    'business taxi service',
    'employee cab',
    'corporate chauffeur',
    'business car hire',
    'office transport',
  ],
  openGraph: {
    title: 'Corporate Car Rental India | Employee Transport @₹15000/Month',
    description: 'Professional corporate car rental for businesses. Employee transport, meetings, airport transfers.',
  },
};

export default function CorporateCarRentalPage() {
  const popularCities = getCitiesByPriority(8);

  return (
    <>
      <ServiceHeroWithChat
        badge="Corporate Car Services in 250+ Cities"
        title="Corporate Car Rental | Business Travel"
        titleHighlight="Starting @₹2499/Day"
        description="Premium cars for business travel, client meetings, and corporate events. Professional service with experienced drivers."
        gradientFrom="slate-50"
        gradientTo="zinc-50"
      />


      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-700 to-gray-800 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Corporate Car Rental | Business Transport
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Employee Transport & Business Fleet | Starting @₹15,000/Month
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="font-semibold mb-1">For Businesses</h3>
                <p className="text-sm opacity-90">Dedicated corporate fleet</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">👔</div>
                <h3 className="font-semibold mb-1">Professional Service</h3>
                <p className="text-sm opacity-90">Executive chauffeurs</p>
              </div>
              <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold mb-1">Fleet Management</h3>
                <p className="text-sm opacity-90">Reports & billing support</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="#locations"
                className="bg-white text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Browse Locations
              </Link>
              <Link
                href="#solutions"
                className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-800 transition"
              >
                View Solutions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Corporate Car Rental */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Corporate Car Rental?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '💼', title: 'Professional Image', desc: 'Enhance company reputation' },
              { icon: '⏰', title: 'Punctuality', desc: 'Always on-time service' },
              { icon: '💰', title: 'Cost Effective', desc: 'Save on vehicle costs' },
              { icon: '📱', title: 'Easy Management', desc: 'Online booking & tracking' },
              { icon: '🚗', title: 'Well-Maintained', desc: 'Premium vehicles' },
              { icon: '👨‍✈️', title: 'Professional Drivers', desc: 'Courteous chauffeurs' },
              { icon: '📊', title: 'Detailed Reports', desc: 'Monthly billing statements' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'Complete coverage' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities Grid */}
      <section id="locations" className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Corporate Car Rental in Popular Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.map((city) => (
              <Link
                key={city.slug}
                href={`/corporate-car-rental/${city.slug}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition group"
              >
                <h3 className="font-semibold text-lg group-hover:text-gray-800 transition">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-600">{city.state}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect for All Business Needs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { occasion: 'Employee Commute', icon: '🚗', desc: 'Daily office transport' },
              { occasion: 'Client Meetings', icon: '🤝', desc: 'Professional image' },
              { occasion: 'Airport Transfers', icon: '✈️', desc: 'Business travelers' },
              { occasion: 'Events & Conferences', icon: '🎯', desc: 'Group coordination' },
              { occasion: 'Site Visits', icon: '🏗️', desc: 'Field operations' },
              { occasion: 'Guest Transport', icon: '👔', desc: 'VIP guests' },
              { occasion: 'Sales Team', icon: '📊', desc: 'Multiple client visits' },
              { occasion: 'Night Shifts', icon: '🌙', desc: '24/7 operations' },
            ].map((item) => (
              <div key={item.occasion} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.occasion}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features & Benefits */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Corporate Car Rental Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-slate-800">Service Features</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Professional chauffeurs in uniform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Well-maintained AC vehicles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>GPS tracking & monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Punctuality guaranteed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>24/7 customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 mt-1">✓</span>
                  <span>Full vehicle insurance</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4 text-gray-800">Business Benefits</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Monthly consolidated billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Detailed trip reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>GST invoices for tax benefits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>No maintenance headaches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Scalable fleet size</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-800 mt-1">✓</span>
                  <span>Dedicated account manager</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Corporate Car Rental Works
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Understand Requirements', desc: 'Discuss your corporate transport needs' },
              { step: '2', title: 'Custom Proposal', desc: 'We create tailored solution & pricing' },
              { step: '3', title: 'Agreement', desc: 'Sign corporate agreement & terms' },
              { step: '4', title: 'Fleet Deployment', desc: 'Vehicles & drivers assigned' },
              { step: '5', title: 'Ongoing Service', desc: 'Regular service with reports' },
              { step: '6', title: 'Monthly Billing', desc: 'Consolidated invoice & payment' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much does corporate car rental cost?',
                a: 'Corporate car rental starts from ₹15,000/month for employee transport. Executive cars cost ₹25,000-40,000/month. Pricing depends on usage, vehicle type, and service hours.',
              },
              {
                q: 'What is included in corporate car rental?',
                a: 'Package includes vehicle, professional driver, fuel, maintenance, insurance, GPS tracking, and dedicated support. Monthly billing with detailed reports provided.',
              },
              {
                q: 'Can we rent cars for multiple employees?',
                a: 'Yes! We provide fleet management for companies. You can rent multiple vehicles for different employees or teams with centralized billing and management.',
              },
              {
                q: 'Do you provide cars for corporate events?',
                a: 'Yes, we provide dedicated transport for corporate events, conferences, seminars. Options from sedans to tempo travellers for group transport.',
              },
              {
                q: 'Is GST invoice provided for corporate bookings?',
                a: 'Yes! We provide proper GST invoices for all corporate bookings. This helps companies claim tax benefits and maintain proper accounts.',
              },
              {
                q: 'What is the minimum contract period?',
                a: 'Minimum contract is 1 month for monthly packages. For daily bookings, no minimum commitment required. Flexible terms for long-term contracts.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

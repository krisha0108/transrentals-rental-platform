import React from 'react';
import {
  ShieldCheck,
  IndianRupee,
  Clock,
  Star,
  Headphones,
  MapPin,
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Vendors',
    description: '500+ verified vendors across India ensuring quality service',
  },
  {
    icon: IndianRupee,
    title: 'Best Price Guarantee',
    description: 'Get the most competitive prices with our price match guarantee',
  },
  {
    icon: Clock,
    title: 'Instant Booking',
    description: 'Book your vehicle in minutes with our quick and easy process',
  },
  {
    icon: Star,
    title: '40K+ Happy Customers',
    description: 'Join thousands of satisfied customers who trust TransRentals',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Round-the-clock customer support for all your queries',
  },
  {
    icon: MapPin,
    title: '500+ Cities',
    description: 'Pan-India presence with services in 500+ cities',
  },
];

export function FeaturesSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose TransRentals?
          </h2>
          <p className="text-lg text-gray-600">
            Experience the best vehicle rental service in India with unmatched benefits
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import {
  ShieldCheck,
  IndianRupee,
  Zap,
  Star,
  Headphones,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: ShieldCheck,
    gradient: 'from-emerald-500 to-teal-500',
    title: 'Verified Vendors',
    description: '500+ verified vendors across India ensuring quality service',
  },
  {
    icon: IndianRupee,
    gradient: 'from-blue-500 to-cyan-500',
    title: 'Best Price Guarantee',
    description: 'Get the most competitive prices with our price match guarantee',
  },
  {
    icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
    title: 'Instant Booking',
    description: 'Book your vehicle in minutes with our quick and easy process',
  },
  {
    icon: Star,
    gradient: 'from-yellow-400 to-amber-500',
    title: '50K+ Happy Customers',
    description: 'Join thousands of satisfied customers who trust TransRentals',
  },
  {
    icon: Headphones,
    gradient: 'from-purple-500 to-violet-500',
    title: '24/7 Support',
    description: 'Round-the-clock customer support for all your queries',
  },
  {
    icon: MapPin,
    gradient: 'from-rose-500 to-pink-500',
    title: '150+ Cities',
    description: 'Pan-India presence with services in 150+ cities',
  },
];

export function FeaturesSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Why Choose TransRentals?
          </h2>
          <p className="text-gray-500">
            Experience the best vehicle rental service in India with unmatched benefits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300 shadow-sm"
            >
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-md bg-gradient-to-br group-hover:scale-110 transition-transform duration-300',
                feature.gradient
              )}>
                <feature.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

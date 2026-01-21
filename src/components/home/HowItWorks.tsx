import React from 'react';
import { Search, FileText, CheckCircle, Bike } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Search & Compare',
    description: 'Browse through our wide range of vehicles and compare prices from verified vendors',
    step: '01',
  },
  {
    icon: FileText,
    title: 'Book Online',
    description: 'Fill in your details and submit your booking request in just a few clicks',
    step: '02',
  },
  {
    icon: CheckCircle,
    title: 'Get Quotes',
    description: 'Receive competitive quotes from multiple vendors and choose the best one',
    step: '03',
  },
  {
    icon: Bike,
    title: 'Ride & Enjoy',
    description: 'Pick up your vehicle and hit the road for an amazing experience',
    step: '04',
  },
];

export function HowItWorks() {
  return (
    <section className="section-padding bg-gradient-to-br from-primary-50 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Book your vehicle in 4 simple steps and start your journey
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                {/* Step Number */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

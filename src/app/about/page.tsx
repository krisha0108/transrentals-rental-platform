import React from 'react';
import type { Metadata } from 'next';
import { Users, Target, Award, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us - India&apos;s #1 Vehicle Rental Marketplace | TransRentals',
  description:
    'TransRentals is India&apos;s largest vehicle rental marketplace connecting customers with verified vendors across 150+ cities. Learn about our mission and values.',
};

export default function AboutPage() {
  const stats = [
    { icon: Users, value: '50K+', label: 'Happy Customers' },
    { icon: TrendingUp, value: '500+', label: 'Verified Vendors' },
    { icon: Award, value: '150+', label: 'Cities Covered' },
    { icon: Target, value: '2.5K+', label: 'Daily Inquiries' },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-400 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About TransRentals
            </h1>
            <p className="text-xl md:text-2xl opacity-90">
              India&apos;s most trusted vehicle rental marketplace
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-lg leading-relaxed mb-4">
              TransRentals was founded with a simple mission: to make vehicle rentals
              accessible, affordable, and hassle-free for everyone across India. We
              recognized the challenges customers faced in finding reliable rental
              services and the difficulties vendors had in reaching potential customers.
            </p>
            <p className="text-lg leading-relaxed mb-4">
              Today, we are proud to be India&apos;s largest vehicle rental marketplace,
              connecting thousands of customers with verified vendors across 150+ cities.
              From bikes and cars to buses and equipment, we offer a comprehensive
              platform for all your rental needs.
            </p>
            <p className="text-lg leading-relaxed">
              Our platform empowers both customers and vendors. Customers get access to
              competitive quotes from multiple vendors, ensuring the best deals. Vendors
              gain visibility and connect with genuine customers looking for their services.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-blue-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                To revolutionize the vehicle rental industry in India by creating a
                transparent, efficient, and customer-centric marketplace that benefits
                both renters and vendors. We strive to make every journey smooth,
                affordable, and memorable.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                To become the go-to platform for all vehicle rental needs across India
                and beyond. We envision a future where finding the perfect rental is
                as easy as a few clicks, backed by trust, quality, and excellent service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose TransRentals?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Verified Vendors',
                description:
                  'All our vendors are thoroughly verified to ensure quality and reliability.',
              },
              {
                title: 'Best Prices',
                description:
                  'Get competitive quotes from multiple vendors and choose the best deal.',
              },
              {
                title: 'Wide Coverage',
                description:
                  'Available in 150+ cities across India with expanding reach.',
              },
              {
                title: 'Easy Booking',
                description:
                  'Simple inquiry process with quick responses from vendors.',
              },
              {
                title: '24/7 Support',
                description:
                  'Our customer support team is available round the clock to help you.',
              },
              {
                title: 'Transparent Process',
                description:
                  'No hidden charges. Clear pricing and terms for every rental.',
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* <Footer /> */}
    </>
  );
}

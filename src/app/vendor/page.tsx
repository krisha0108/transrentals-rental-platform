import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Shield,
  Clock,
  Smartphone,
  BarChart,
  Bell,
  MapPin,
  CheckCircle,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { WHATSAPP_LINK } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Partner with TransRentals - Grow Your Vehicle Rental Business',
  description:
    'Join India\'s largest vehicle rental marketplace. Get verified customers, manage bookings, and grow your business. Download the vendor app now!',
  keywords: [
    'vehicle rental business',
    'vendor partner',
    'rental marketplace',
    'grow rental business',
    'vehicle rental partner',
  ],
};

export default function VendorLandingPage() {
  return (
    <>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <div className="container-custom relative py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                <span>Trusted by 10,000+ Vendors Across India</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Grow Your Vehicle Rental Business with TransRentals
              </h1>

              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                Join India's largest vehicle rental marketplace. Get instant bookings,
                verified customers, and manage everything from your mobile app.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/vendor/register"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300 flex items-center justify-center gap-2"
                >
                  Register as Vendor
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/vendor/login"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition flex items-center justify-center gap-2"
                >
                  Login to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {[
                  { number: '10,000+', label: 'Active Vendors' },
                  { number: '1,50,000+', label: 'Bookings/Month' },
                  { number: '150+', label: 'Cities Covered' },
                  { number: '4.8/5', label: 'Average Rating' },
                ].map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-3xl font-bold mb-1">{stat.number}</div>
                    <div className="text-sm text-white/80">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Partner with TransRentals?
              </h2>
              <p className="text-lg text-gray-600">
                Everything you need to grow and manage your vehicle rental business
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="w-8 h-8" />,
                  title: 'Verified Customers',
                  description: 'Get instant bookings from verified customers across India. No more waiting for leads.',
                  gradient: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: <TrendingUp className="w-8 h-8" />,
                  title: 'Grow Your Business',
                  description: 'Increase your revenue by 3x with access to our massive customer base.',
                  gradient: 'from-green-500 to-emerald-500',
                },
                {
                  icon: <Smartphone className="w-8 h-8" />,
                  title: 'Mobile App Management',
                  description: 'Manage bookings, quotations, and customers on-the-go with our dedicated vendor app.',
                  gradient: 'from-purple-500 to-pink-500',
                },
                {
                  icon: <Bell className="w-8 h-8" />,
                  title: 'Instant Notifications',
                  description: 'Get real-time alerts for new booking requests and never miss an opportunity.',
                  gradient: 'from-orange-500 to-red-500',
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: 'Trust & Safety',
                  description: 'Verified badge for your business. Build trust and attract more customers.',
                  gradient: 'from-indigo-500 to-blue-500',
                },
                {
                  icon: <BarChart className="w-8 h-8" />,
                  title: 'Business Analytics',
                  description: 'Track your performance with detailed analytics and insights.',
                  gradient: 'from-amber-500 to-yellow-500',
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${benefit.gradient} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
                  >
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600">
                Get started in 3 simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: '1',
                  title: 'Register Your Business',
                  description: 'Sign up with your business details and vehicle inventory. Get verified within 24 hours.',
                  icon: <CheckCircle className="w-12 h-12" />,
                },
                {
                  step: '2',
                  title: 'Receive Booking Requests',
                  description: 'Get instant notifications for booking requests matching your vehicle types and locations.',
                  icon: <Bell className="w-12 h-12" />,
                },
                {
                  step: '3',
                  title: 'Send Quotations & Confirm',
                  description: 'Send competitive quotations through the app. Customers choose you and booking is confirmed!',
                  icon: <Zap className="w-12 h-12" />,
                },
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto text-white">
                      {step.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Categories */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                List Your Vehicles
              </h2>
              <p className="text-lg text-gray-600">
                We support all types of vehicle rentals
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { icon: '🚗', name: 'Car Rental', color: 'from-blue-500 to-cyan-500' },
                { icon: '🏍️', name: 'Bike Rental', color: 'from-orange-500 to-red-500' },
                { icon: '🚌', name: 'Bus Rental', color: 'from-green-500 to-emerald-500' },
                { icon: '🚚', name: 'Truck Rental', color: 'from-purple-500 to-pink-500' },
                { icon: '🏗️', name: 'Equipment Rental', color: 'from-amber-500 to-yellow-500' },
              ].map((category, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
                >
                  <div className={`text-5xl mb-3 group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <h3 className="font-bold text-gray-900">{category.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile App Features */}
        <section className="py-20 bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 text-white">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Manage Everything from Our Mobile App
                </h2>
                <p className="text-xl text-white/90 mb-8">
                  Download the TransRentals Vendor App and take control of your business
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    'Real-time booking notifications',
                    'Quick quotation submission',
                    'Customer chat & support',
                    'Earnings & analytics dashboard',
                    'Vehicle inventory management',
                    'Document & verification upload',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
                      <span className="text-lg">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={process.env.NEXT_PUBLIC_VENDOR_APP_ANDROID || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition font-semibold"
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">GET IT ON</div>
                      <div className="text-sm font-bold">Google Play</div>
                    </div>
                  </a>

                  {/* <a
                    href={process.env.NEXT_PUBLIC_VENDOR_APP_IOS || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition font-semibold"
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">Download on the</div>
                      <div className="text-sm font-bold">App Store</div>
                    </div>
                  </a> */}
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                  <Smartphone className="w-32 h-32 mx-auto text-white/80 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Available on Android & iOS</h3>
                  <p className="text-white/80">Manage your business anytime, anywhere</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="container-custom max-w-4xl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center border-2 border-gray-200">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Ready to Grow Your Business?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Join thousands of successful vendors already earning more with TransRentals.
                Register now and start receiving bookings today!
              </p>

              <Link
                href="/vendor/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300"
              >
                Register as Vendor Now
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="mt-6 text-sm text-gray-600">
                Already a vendor?{' '}
                <Link
                  href="/vendor/login"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Login to Dashboard
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-16 bg-white border-t border-gray-200">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Need Help Getting Started?
              </h3>
              <p className="text-gray-600 mb-6">
                Our support team is here to help you every step of the way
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={WHATSAPP_LINK ?? '#'}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
                  WhatsApp Support
                </a>
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition"
                >
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}

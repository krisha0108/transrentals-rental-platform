import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  Clock,
  Smartphone,
  BarChart,
  Bell,
  MapPin,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Car,
  Wallet,
  FileText,
  Navigation,
  IndianRupee,
} from 'lucide-react';
import { WHATSAPP_LINK } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Become a Driver with TransRentals - Earn on Your Own Schedule',
  description:
    "Join TransRentals as a professional driver. Accept chauffeur bookings, earn flexible income, and manage everything from our driver app. Register now!",
  keywords: [
    'become a driver',
    'driver job',
    'chauffeur driver',
    'earn as driver',
    'driver partner',
    'TransRentals driver',
    'professional driver India',
  ],
};

export default function DriverLandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              <span>Trusted by Professional Drivers Across India</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Drive. Earn. Grow — on Your Own Terms
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Join TransRentals as a professional driver. Accept chauffeur &amp; rental trips,
              earn flexible income, and manage your schedule from our driver app.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/driver/register"
                className="px-8 py-4 bg-white text-emerald-700 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300 flex items-center justify-center gap-2"
              >
                Register as Driver
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/driver/login"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-emerald-700 transition flex items-center justify-center gap-2"
              >
                Login to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { number: '5,000+', label: 'Active Drivers' },
                { number: '50,000+', label: 'Trips/Month' },
                { number: '500+', label: 'Cities Covered' },
                { number: '₹40,000+', label: 'Avg. Monthly Earn' },
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
              Why Drive with TransRentals?
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to earn more and work smarter as a professional driver
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <IndianRupee className="w-8 h-8" />,
                title: 'Guaranteed Earnings',
                description: 'Earn ₹40,000+ per month with consistent chauffeur bookings and performance bonuses.',
                gradient: 'from-emerald-500 to-teal-500',
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: 'Flexible Schedule',
                description: 'You choose when you work. Accept or reject trips based on your availability — total freedom.',
                gradient: 'from-cyan-500 to-blue-500',
              },
              {
                icon: <Bell className="w-8 h-8" />,
                title: 'Instant Trip Alerts',
                description: 'Get real-time push notifications for nearby trips. Never miss a booking opportunity.',
                gradient: 'from-orange-500 to-red-500',
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: 'Dedicated Driver App',
                description: 'Manage trips, track earnings, and handle your vehicle — all from one powerful mobile app.',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Verified & Safe Trips',
                description: 'Every booking is from a verified customer. Your safety and payment are always protected.',
                gradient: 'from-indigo-500 to-blue-500',
              },
              {
                icon: <BarChart className="w-8 h-8" />,
                title: 'Earnings Analytics',
                description: 'Track daily, weekly, and monthly earnings. Know exactly how much you\'ve made and when you\'ll be paid.',
                gradient: 'from-amber-500 to-yellow-500',
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${benefit.gradient} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
                >
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Start earning in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Register Your Profile',
                description: 'Sign up with your name, phone, driving license, and bank details. Takes less than 5 minutes — completely free.',
                icon: <FileText className="w-12 h-12" />,
              },
              {
                step: '2',
                title: 'Add Your Fleet',
                description: 'Register your vehicle on the driver app. If you are a vendor\'s driver, your vendor will assign a vehicle to you — no vehicle needed from your side.',
                icon: <Car className="w-12 h-12" />,
              },
              {
                step: '3',
                title: 'Accept Trips & Earn',
                description: 'Go online on the driver app, accept nearby bookings instantly, and get paid weekly directly to your bank account.',
                icon: <Zap className="w-12 h-12" />,
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto text-white">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types You Can Drive */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vehicles You Can Drive
            </h2>
            <p className="text-lg text-gray-600">
              Accept trips across multiple vehicle categories based on your license type
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: '🚗', name: 'Sedan & Hatchback', license: 'LMV' },
              { icon: '🚙', name: 'SUV & MUV', license: 'LMV' },
              { icon: '🚐', name: 'Tempo Traveller', license: 'HMV' },
              { icon: '🚌', name: 'Luxury Coach', license: 'PSV' },
              { icon: '🏎️', name: 'Luxury Cars', license: 'LMV' },
            ].map((category, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{category.name}</h3>
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {category.license}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver App Features */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Everything in One Driver App
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Download the TransRentals Driver App and manage your entire driving career from your phone
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'Instant trip notifications with route details',
                  'Live earnings tracker & trip history',
                  'Turn-by-turn navigation for every trip',
                  'Add & manage your vehicle fleet',
                  'Vehicle fuel & maintenance log',
                  'Weekly payout to your bank account',
                  'In-app support & help center',
                  'Performance ratings & badges',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-300 flex-shrink-0" />
                    <span className="text-lg">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={process.env.NEXT_PUBLIC_DRIVER_APP_ANDROID || '#'}
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
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                <Smartphone className="w-32 h-32 mx-auto text-white/80 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Available on Android</h3>
                <p className="text-white/80">Accept trips and manage earnings anytime, anywhere</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { icon: <Navigation className="w-5 h-5" />, label: 'Live Navigation' },
                    { icon: <Wallet className="w-5 h-5" />, label: 'Instant Payouts' },
                    { icon: <Bell className="w-5 h-5" />, label: 'Trip Alerts' },
                    { icon: <BarChart className="w-5 h-5" />, label: 'Earnings Stats' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You Need to Get Started
            </h2>
            <p className="text-lg text-gray-600">
              Simple requirements — if you have a valid license and a clean record, you're good to go
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                category: 'Identity Documents',
                emoji: '🪪',
                items: [
                  'Valid Aadhar Card (12-digit)',
                  'PAN Card (for payment setup)',
                  'Passport-size photograph',
                  'Active mobile number',
                ],
              },
              {
                category: 'Driving License',
                emoji: '🚗',
                items: [
                  'Valid LMV / HMV / PSV license',
                  'Minimum 2 years driving experience',
                  'Clean driving record',
                  'License should be valid for at least 6 months',
                ],
              },
              {
                category: 'Bank Account',
                emoji: '🏦',
                items: [
                  'Savings or current bank account',
                  'IFSC code of your branch',
                  'Account holder name matching Aadhar',
                  'Account must be operational',
                ],
              },
              {
                category: 'Your Vehicle',
                emoji: '🚙',
                items: [
                  'Independent driver: own vehicle required',
                  'Vendor\'s driver: vendor provides the vehicle',
                  'Own vehicle needs valid RC & insurance',
                  'Add your fleet directly from the driver app',
                ],
              },
            ].map((req, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-emerald-400 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{req.emoji}</span>
                  <h3 className="text-lg font-bold text-gray-900">{req.category}</h3>
                </div>
                <ul className="space-y-2">
                  {req.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator Banner */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="container-custom max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border border-emerald-100 p-8 md:p-10">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">💰</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                Earning Potential
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                How Much Can You Earn?
              </h2>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
                Full-time drivers on TransRentals earn ₹35,000–₹60,000/month. Part-time drivers
                (4–5 hrs/day) earn ₹15,000–₹25,000/month. Your earnings depend on your city,
                trip count, and vehicle type.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link
                  href="/driver/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 transition shadow-md hover:shadow-lg hover:scale-105 transform duration-200"
                >
                  Start Earning Today
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/driver/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition duration-200"
                >
                  Already a Driver? Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-3 flex-shrink-0">
              {['🕐 Flexible Hours', '📍 500+ Cities', '⚡ Daily Trips', '💳 Weekly Payouts'].map((item) => (
                <div key={item} className="flex items-center gap-2 bg-white border border-emerald-100 rounded-lg px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container-custom max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">Everything you need to know before joining</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Do I need my own vehicle to become a driver?',
                a: 'It depends on your type. If you are registering as a vendor\'s driver, your vendor will assign a vehicle to you — you don\'t need your own. If you are registering as an independent driver, you must have your own vehicle, add it to your fleet on the driver app, and then you can start accepting trips.',
              },
              {
                q: 'How quickly can I start getting trips?',
                a: 'As soon as you register and add your vehicle to the fleet (or get assigned by your vendor), you can go online on the driver app and start receiving trip requests in your city right away.',
              },
              {
                q: 'When and how do I get paid?',
                a: 'Earnings are settled weekly directly to your bank account. You can track every rupee in real-time from the driver app earnings dashboard.',
              },
              {
                q: 'What license types are accepted?',
                a: 'We accept LMV, MCWG, HMV, HPMV, TRANS, and PSV license types. The type of vehicle you can drive depends on your license category.',
              },
              {
                q: 'Can I drive in multiple cities?',
                a: 'Yes! You can accept trips across multiple cities. Just update your availability and location in the app and you\'ll receive requests from nearby customers.',
              },
              {
                q: 'Is there any registration fee?',
                a: 'Absolutely not. Registering as a driver on TransRentals is completely free. We only earn when you earn — no hidden charges.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-emerald-300 transition-colors"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="container-custom max-w-4xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center border-2 border-gray-200">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Start Your Driver Journey?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of professional drivers already earning with TransRentals.
              Register in 5 minutes — free, fast, and simple.
            </p>

            <Link
              href="/driver/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-lg hover:from-emerald-700 hover:to-teal-700 transition shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300"
            >
              Register as Driver — It&apos;s Free
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="mt-6 text-sm text-gray-600">
              Already a driver?{' '}
              <Link href="/driver/login" className="text-emerald-600 hover:underline font-semibold">
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
              Our driver support team is available 7 days a week to help you register and get on the road
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
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-emerald-600 hover:text-emerald-600 transition"
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

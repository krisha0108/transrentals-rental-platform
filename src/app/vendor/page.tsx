import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp,
  Users,
  Shield,
  Smartphone,
  BarChart,
  Bell,
  CheckCircle,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  Sparkles,
  ShieldCheck,
  Headphones,
  Store,
  Wallet,
  MapPin,
  BookOpen,
  ChevronRight,
  Car,
  UserPlus,
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

const STATS = [
  { number: '10,000+', label: 'Active Vendors' },
  { number: '1,50,000+', label: 'Bookings / Month' },
  { number: '150+', label: 'Cities Covered' },
  { number: '4.8/5', label: 'Average Rating' },
];

const BENEFITS = [
  {
    icon: Users,
    title: 'Verified Customers',
    description: 'Get instant bookings from verified customers across India. No more waiting for leads.',
    gradient: 'from-blue-500 to-cyan-500',
    bar: 'from-blue-500 to-cyan-500',
    blob: 'bg-blue-200/40',
    ring: 'hover:border-blue-300',
    shadow: 'hover:shadow-blue-200/40',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    description: 'Increase your revenue by 3x with access to our massive customer base.',
    gradient: 'from-emerald-500 to-green-600',
    bar: 'from-emerald-500 to-green-500',
    blob: 'bg-emerald-200/40',
    ring: 'hover:border-emerald-300',
    shadow: 'hover:shadow-emerald-200/40',
  },
  {
    icon: Smartphone,
    title: 'Mobile App Management',
    description: 'Manage bookings, quotations, and customers on-the-go with our dedicated vendor app.',
    gradient: 'from-purple-500 to-fuchsia-600',
    bar: 'from-purple-500 to-fuchsia-500',
    blob: 'bg-purple-200/40',
    ring: 'hover:border-purple-300',
    shadow: 'hover:shadow-purple-200/40',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Get real-time alerts for new booking requests and never miss an opportunity.',
    gradient: 'from-orange-500 to-red-500',
    bar: 'from-orange-500 to-red-500',
    blob: 'bg-orange-200/40',
    ring: 'hover:border-orange-300',
    shadow: 'hover:shadow-orange-200/40',
  },
  {
    icon: Shield,
    title: 'Trust & Safety',
    description: 'Verified badge for your business. Build trust and attract more customers.',
    gradient: 'from-indigo-500 to-blue-600',
    bar: 'from-indigo-500 to-blue-500',
    blob: 'bg-indigo-200/40',
    ring: 'hover:border-indigo-300',
    shadow: 'hover:shadow-indigo-200/40',
  },
  {
    icon: BarChart,
    title: 'Business Analytics',
    description: 'Track your performance with detailed analytics and insights.',
    gradient: 'from-amber-500 to-yellow-500',
    bar: 'from-amber-500 to-yellow-500',
    blob: 'bg-amber-200/40',
    ring: 'hover:border-amber-300',
    shadow: 'hover:shadow-amber-200/40',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Register Your Business',
    description: 'Sign up with your business details and vehicle inventory. Get verified within 24 hours.',
    icon: CheckCircle,
  },
  {
    step: '02',
    title: 'Receive Booking Requests',
    description: 'Get instant notifications for booking requests matching your vehicle types and locations.',
    icon: Bell,
  },
  {
    step: '03',
    title: 'Send Quotations & Confirm',
    description: 'Send competitive quotations through the app. Customers choose you and booking is confirmed!',
    icon: Zap,
  },
];

const CATEGORIES = [
  { icon: '🚗', name: 'Car Rental', color: 'from-blue-500 to-cyan-500' },
  { icon: '🏍️', name: 'Bike Rental', color: 'from-orange-500 to-red-500' },
  { icon: '🚌', name: 'Bus Rental', color: 'from-emerald-500 to-green-600' },
  { icon: '🚚', name: 'Truck Rental', color: 'from-purple-500 to-fuchsia-600' },
  { icon: '🏗️', name: 'Equipment Rental', color: 'from-amber-500 to-yellow-500' },
];

const APP_FEATURES = [
  'Real-time booking notifications',
  'Quick quotation submission',
  'Customer chat & support',
  'Earnings & analytics dashboard',
  'Vehicle inventory management',
  'Document & verification upload',
];

const GUIDE_PHASES = [
  {
    letter: 'A',
    icon: UserPlus,
    title: 'Onboarding',
    desc: 'Register · Login · KYC · Get verified',
    steps: 4,
  },
  {
    letter: 'B',
    icon: Car,
    title: 'List Your Fleet',
    desc: 'Services · Vehicle details · Locations · Pricing',
    steps: 5,
  },
  {
    letter: 'C',
    icon: Bell,
    title: 'Get Quote Requests',
    desc: 'See & open incoming customer requests',
    steps: 1,
  },
  {
    letter: 'D',
    icon: TrendingUp,
    title: 'Send & Win Quotes',
    desc: 'Quote · Track · Convert to bookings',
    steps: 2,
  },
  {
    letter: 'E',
    icon: BarChart,
    title: 'Run Trips & Grow',
    desc: 'OTP trips · Dashboard · Earnings',
    steps: 2,
  },
];

export default function VendorLandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-indigo-700 via-blue-700 to-emerald-700 text-white overflow-hidden">
        {/* Radial color glows */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 18%, #818cf8 0%, transparent 38%), radial-gradient(circle at 88% 8%, #38bdf8 0%, transparent 40%), radial-gradient(circle at 72% 85%, #10b981 0%, transparent 45%)',
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* Soft floating shapes */}
        <div className="absolute top-16 left-[6%] w-36 h-12 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute top-28 right-[10%] w-44 h-14 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="container-custom relative pt-16 sm:pt-24 pb-24 sm:pb-36">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
            {/* Copy */}
            <div className="lg:col-span-3 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 backdrop-blur border border-amber-300/40 text-amber-100 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                <Star className="w-3 h-3" /> Trusted by 10,000+ vendors across India
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Grow your vehicle rental <br className="hidden sm:block" />
                business with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">
                  TransRentals
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-blue-50/90 mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Join India&apos;s largest vehicle rental marketplace. Get instant bookings, verified
                customers, and manage everything from your mobile app.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/vendor/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-amber-50 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
                >
                  Register as Vendor <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/vendor/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-bold text-base px-6 py-3.5 rounded-xl"
                >
                  Login to Dashboard
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 text-xs text-blue-100 justify-center lg:justify-start">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" /> Free to join
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" /> Verified in 24 hrs
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" /> No setup cost
                </span>
              </div>
            </div>

            {/* Dashboard preview mock */}
            <div className="lg:col-span-2 relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-400/30 to-sky-400/30 rounded-3xl blur-2xl pointer-events-none" />

              {/* Floating live chip */}
              <div className="absolute -top-4 -left-3 sm:-left-5 z-20 hidden sm:flex items-center gap-1.5 bg-white rounded-xl shadow-xl shadow-blue-900/10 px-3 py-2 border border-blue-100 -rotate-3">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-[11px] font-extrabold text-gray-900">New request!</p>
                  <p className="text-[9px] text-gray-500">Swift · 3 days · just now</p>
                </div>
              </div>

              <div className="relative bg-white rounded-3xl p-5 shadow-2xl text-gray-900 transform sm:rotate-1 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-extrabold text-sm">Your Rental Business</p>
                      <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-2 h-2" /> VERIFIED
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> Your City, India
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <Bell className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                    <p className="text-lg font-extrabold text-blue-700">8</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Today</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <Wallet className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <p className="text-lg font-extrabold text-emerald-700">₹1.2L</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Month</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <Star className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                    <p className="text-lg font-extrabold text-amber-700">4.8</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Rating</p>
                  </div>
                </div>

                {/* Mini weekly bars */}
                <div className="mt-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex items-end justify-between gap-1.5 h-14">
                    {[40, 65, 50, 80, 60, 95, 72].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-blue-500 to-indigo-400"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 text-center uppercase tracking-widest font-bold">
                    Bookings this week
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg
          className="absolute bottom-0 left-0 w-full h-14 sm:h-20 text-white"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,120 L0,70 C240,110 480,30 720,55 C960,80 1200,30 1440,65 L1440,120 Z"
            opacity="0.25"
          />
          <path
            fill="currentColor"
            d="M0,120 L0,90 C240,120 480,60 720,80 C960,100 1200,60 1440,90 L1440,120 Z"
          />
        </svg>
      </section>

      {/* ── Stats strip ── */}
      <section className="container-custom -mt-2 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-blue-100 px-4 py-5 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {s.number}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Benefits ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/50 to-indigo-50/40 py-16 sm:py-24">
        <div className="absolute top-20 -left-10 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-10 w-80 h-80 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #1d4ed8 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <TrendingUp className="absolute -bottom-10 -right-10 w-72 h-72 text-blue-600/[0.04] pointer-events-none hidden lg:block" />

        <div className="relative container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur border border-blue-200 text-blue-700 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 shadow-sm">
              <Sparkles className="w-3 h-3" /> Why partner with us
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Why partner with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                TransRentals?
              </span>
            </h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Everything you need to grow and manage your vehicle rental business.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className={`group relative bg-white/90 backdrop-blur border border-gray-200 ${b.ring} hover:shadow-2xl ${b.shadow} rounded-2xl p-6 transition-all overflow-hidden hover:-translate-y-1`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${b.bar} opacity-70 group-hover:opacity-100 transition-opacity`} />
                <div className={`absolute -top-12 -right-12 w-36 h-36 ${b.blob} rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${b.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                  <b.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="relative text-lg font-extrabold text-gray-900 mt-4">{b.title}</h3>
                <p className="relative text-sm text-gray-600 mt-1.5 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-emerald-700 py-16 sm:py-24 text-white">
        <div className="absolute top-0 -left-20 w-80 h-80 bg-amber-400/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-sky-400/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 bg-amber-400/20 backdrop-blur border border-amber-300/40 text-amber-100 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              <Zap className="w-3 h-3" /> How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
              Get started in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">
                3 simple steps
              </span>
            </h2>
            <p className="text-blue-100/90 mt-4">No technical skills required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto relative">
            <div
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px border-t-2 border-dashed border-amber-300/40"
              aria-hidden="true"
            />
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="group relative bg-white/10 hover:bg-white/15 backdrop-blur border border-white/20 hover:border-amber-300/50 rounded-2xl p-6 text-center shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
              >
                <span className="absolute -top-3 right-3 text-8xl font-black text-white/[0.07] select-none pointer-events-none leading-none">
                  {s.step}
                </span>
                <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/40 ring-4 ring-white/20 group-hover:scale-110 transition-transform">
                  <s.icon className="w-7 h-7" />
                </div>
                <p className="mt-4 inline-block text-[11px] font-extrabold text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Step {s.step}
                </p>
                <h3 className="mt-2 text-lg font-extrabold text-white">{s.title}</h3>
                <p className="text-sm text-blue-100/90 mt-1.5 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service Categories ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-blue-50/40 py-16 sm:py-24">
        <div className="absolute top-10 left-[8%] w-72 h-72 bg-indigo-300/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-[5%] w-80 h-80 bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #4338ca 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur border border-indigo-200 text-indigo-700 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 shadow-sm">
              <Store className="w-3 h-3" /> List your vehicles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              We support{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                all types
              </span>{' '}
              of vehicle rentals
            </h2>
            <p className="text-gray-600 mt-4">From two-wheelers to heavy equipment — list it all.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {CATEGORIES.map((category) => (
              <div
                key={category.name}
                className="group relative bg-white/90 backdrop-blur rounded-2xl border border-gray-200 p-6 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1.5 text-center overflow-hidden"
              >
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none`} />
                <div className={`relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="relative mt-4 font-extrabold text-gray-900 text-sm">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile App Features ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-emerald-700 py-16 sm:py-24 text-white">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #818cf8 0%, transparent 35%), radial-gradient(circle at 85% 80%, #10b981 0%, transparent 40%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <Smartphone className="absolute top-10 right-[6%] w-44 h-44 text-white/5 -rotate-12 pointer-events-none hidden md:block" />

        <div className="relative container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 backdrop-blur border border-amber-300/40 text-amber-100 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <Smartphone className="w-3 h-3" /> Vendor app
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 leading-tight tracking-tight">
                Manage everything from our mobile app
              </h2>
              <p className="text-lg text-blue-50/90 mb-8">
                Download the TransRentals Vendor App and take control of your business.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {APP_FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2.5 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2.5"
                  >
                    <CheckCircle2 className="w-5 h-5 text-amber-300 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={process.env.NEXT_PUBLIC_VENDOR_APP_ANDROID || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-100 transition font-semibold shadow-lg hover:scale-[1.02]"
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
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-400/20 to-sky-400/20 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8 text-center shadow-2xl">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-900/40 ring-4 ring-white/20 mb-5">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-extrabold mb-2">Available on Android &amp; iOS</h3>
                <p className="text-blue-100/90 text-sm">Manage your business anytime, anywhere.</p>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Uptime', value: '99.9%' },
                    { label: 'Rating', value: '4.8★' },
                    { label: 'Installs', value: '50k+' },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/10 border border-white/20 rounded-xl py-3">
                      <p className="text-lg font-extrabold">{m.value}</p>
                      <p className="text-[10px] uppercase tracking-widest text-blue-100/80">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vendor Guide CTA ── */}
      <section className="container-custom py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-8 sm:p-12 text-white shadow-2xl">
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 20%, #6366f1 0%, transparent 35%), radial-gradient(circle at 85% 80%, #3b82f6 0%, transparent 40%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            {/* Left — copy + CTA */}
            <div className="lg:col-span-2">
              <span className="inline-flex items-center gap-1.5 bg-blue-400/20 backdrop-blur border border-blue-300/30 text-blue-100 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <BookOpen className="w-3 h-3" /> Official Guide
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                The complete vendor journey
              </h2>
              <p className="text-blue-100/90 mt-4 leading-relaxed">
                14 steps across 5 phases — from registration to running daily operations. Every
                screen previewed, with direct links straight into the dashboard.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/guide/vendor"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
                >
                  Open full guide <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="/vendor-guide.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-bold text-base px-6 py-3.5 rounded-xl"
                >
                  📖 Read PDF guide
                </a>
              </div>
              <p className="mt-4 text-sm text-blue-200/80">
                Or{' '}
                <Link href="/vendor/register" className="font-bold text-white underline underline-offset-2 hover:text-blue-100">
                  skip and register now
                </Link>
                .
              </p>
            </div>

            {/* Right — 5 phase chips */}
            <div className="lg:col-span-3 space-y-2.5">
              {GUIDE_PHASES.map((p) => (
                <Link
                  key={p.letter}
                  href="/guide/vendor"
                  className="group flex items-center gap-4 bg-white/10 hover:bg-white/15 backdrop-blur border border-white/20 hover:border-blue-300/50 rounded-2xl px-4 py-3 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-extrabold text-lg shrink-0 shadow-lg shadow-amber-900/30">
                    {p.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p.icon className="w-3.5 h-3.5 text-blue-200" />
                      <p className="text-base font-extrabold text-white">{p.title}</p>
                    </div>
                    <p className="text-[12px] text-blue-100/80 mt-0.5">{p.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-blue-100 bg-white/10 border border-white/20 px-2 py-1 rounded-full whitespace-nowrap">
                      {p.steps} step{p.steps > 1 ? 's' : ''}
                    </span>
                    <ChevronRight className="w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="container-custom py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-8 sm:p-14 text-white shadow-2xl shadow-orange-900/30 max-w-4xl mx-auto">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, #ffffff 0%, transparent 35%), radial-gradient(circle at 90% 10%, #ffffff 0%, transparent 30%)',
            }}
          />
          <TrendingUp className="absolute -right-8 -top-8 w-52 h-52 text-white/10 pointer-events-none" />
          <div className="relative text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Sparkles className="w-3 h-3" /> Ready to grow?
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.1]">
              Ready to grow your business?
            </h2>
            <p className="text-white/90 mt-4 text-lg">
              Join thousands of successful vendors already earning more with TransRentals. Register
              now and start receiving bookings today!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/vendor/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-amber-50 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-lg hover:scale-[1.02] transition-all"
              >
                Register as Vendor Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vendor/login"
                className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/40 text-white font-bold text-base px-6 py-3.5 rounded-xl"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Download the app now ── */}
      <section className="container-custom py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-emerald-700 text-white shadow-2xl">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 12% 20%, #818cf8 0%, transparent 38%), radial-gradient(circle at 88% 85%, #10b981 0%, transparent 42%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center p-8 sm:p-12">
            {/* Left — copy + CTA */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 backdrop-blur border border-amber-300/40 text-amber-100 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <Smartphone className="w-3 h-3" /> Vendor App
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                Download the app now
              </h2>
              <p className="text-blue-50/90 mt-4 leading-relaxed max-w-md mx-auto lg:mx-0">
                Run your rental business from your pocket — accept bookings, send quotes, and track
                earnings on the go.
              </p>

              {/* Rating row */}
              <div className="mt-5 flex items-center gap-5 justify-center lg:justify-start">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-bold">4.8</span>
                </div>
                <span className="text-sm text-blue-100/80">50,000+ installs</span>
              </div>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href={process.env.NEXT_PUBLIC_VENDOR_APP_ANDROID || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-100 transition font-semibold shadow-lg hover:scale-[1.02]"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs">GET IT ON</div>
                    <div className="text-sm font-bold">Google Play</div>
                  </div>
                </a>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur text-white/90 px-5 py-3 rounded-xl text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" /> Free download
                </div>
              </div>
            </div>

            {/* Right — phone + scan card */}
            <div className="flex items-center justify-center gap-6">
              {/* Phone */}
              <div className="relative w-44 sm:w-48 shrink-0">
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-400/30 to-sky-400/30 rounded-[2.5rem] blur-2xl pointer-events-none" />
                <div className="relative rounded-[2rem] bg-slate-900 border-4 border-white/20 shadow-2xl p-2 overflow-hidden">
                  <Image
                    src="/assets/vendorappss.png"
                    alt="TransRentals Vendor app home screen"
                    width={1080}
                    height={2254}
                    className="w-full h-auto rounded-[1.45rem]"
                  />
                </div>
              </div>

              {/* Scan-to-download card */}
              <div className="hidden sm:block bg-white rounded-2xl p-4 text-center shadow-xl">
                <Image
                  src="/assets/vendorapp.png"
                  alt="Scan to download the TransRentals Vendor app"
                  width={128}
                  height={128}
                  className="w-28 h-28 mx-auto"
                />
                <p className="text-[11px] font-bold text-gray-700 mt-2">Scan to download</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Support ── */}
      <section className="bg-gray-50 py-14 border-t border-gray-200">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-3">
              Need help getting started?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={WHATSAPP_LINK ?? '#'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-lg hover:scale-[1.02]"
              >
                <ShieldCheck className="w-5 h-5" /> WhatsApp Support
              </a>
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition"
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

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
  TrendingUp,
  Users,
  Shield,
  Smartphone,
  BarChart,
  Bell,
  CheckCircle2,
  ArrowRight,
  Star,
  Sparkles,
  ShieldCheck,
  Headphones,
  MapPin,
  BookOpen,
  ChevronRight,
  Car,
  Calendar,
  Rocket,
  UserPlus,
  Clock,
} from 'lucide-react';
import { WHATSAPP_LINK } from '@/lib/contact';
import { VehicleCategoryShowcase } from '@/components/vendor/VehicleCategoryShowcase';

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
  { number: '10,000+', label: 'Active Vendors', icon: Users },
  { number: '1,50,000+', label: 'Bookings / Month', icon: Calendar },
  { number: '500+', label: 'Cities Covered', icon: MapPin },
  { number: '4.8/5', label: 'Average Rating', icon: Star },
];

const BENEFITS = [
  {
    icon: Users,
    title: 'Verified Customers',
    description: 'Get instant bookings from verified customers across India. No more waiting for leads.',
    image: '/images/vendor/benefits/verified-customers.png',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    description: 'Increase your revenue by 3x with access to our massive customer base.',
    image: '/images/vendor/benefits/grow-business.png',
  },
  {
    icon: Smartphone,
    title: 'Mobile App Management',
    description: 'Manage bookings, quotations, and customers on-the-go with our dedicated vendor app.',
    image: '/images/vendor/benefits/mobile-app.png',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Get real-time alerts for new booking requests and never miss an opportunity.',
    image: '/images/vendor/benefits/notifications.png',
  },
  {
    icon: Shield,
    title: 'Trust & Safety',
    description: 'Verified badge for your business. Build trust and attract more customers.',
    image: '/images/vendor/benefits/trust-safety.png',
  },
  {
    icon: BarChart,
    title: 'Business Analytics',
    description: 'Track your performance with detailed analytics and insights.',
    image: '/images/vendor/benefits/business-analytics.png',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Register Your Business',
    description: 'Sign up with your business details and vehicle inventory. Get verified within 24 hours.',
    image: '/images/vendor/how-it-works/step-1-register-business.png',
  },
  {
    step: '02',
    title: 'Receive Booking Requests',
    description: 'Get instant notifications for booking requests matching your vehicle types and locations.',
    image: '/images/vendor/how-it-works/step-2-booking-request.png',
  },
  {
    step: '03',
    title: 'Send Quotations & Confirm',
    description: 'Send competitive quotations through the app. Customers choose you and booking is confirmed!',
    image: '/images/vendor/how-it-works/step-3-send-quote.png',
  },
];

const ONBOARDING_HIGHLIGHTS = [
  { icon: Clock, label: 'Quick Onboarding', value: 'Verified in 24 hrs' },
  { icon: UserPlus, label: 'Instant Leads', value: 'Real booking requests' },
  { icon: TrendingUp, label: 'Grow Business', value: 'Increase your earnings' },
  { icon: ShieldCheck, label: 'Safe & Secure', value: 'Trusted by thousands' },
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

export default async function VendorLandingPage() {
  const vendorAppUrl =
    process.env.NEXT_PUBLIC_VENDOR_APP_ANDROID ||
    'https://play.google.com/store/apps/details?id=com.transrentals.vendor';
  const vendorAppQrDataUrl = await QRCode.toDataURL(vendorAppUrl, {
    margin: 1,
    width: 256,
    errorCorrectionLevel: 'M',
  });

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white min-h-[560px] sm:min-h-[600px] lg:min-h-[620px]">
        {/* Full-bleed background — covers the whole section, not just a boxed-in corner */}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            backgroundImage: "url('/images/vendor/hero-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{ backgroundImage: 'linear-gradient(to right, rgba(230,249,241,0.92) 0%, rgba(230,249,241,0.55) 30%, transparent 48%)' }}
        />
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            backgroundImage: "url('/images/vendor/hero-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.12,
          }}
        />

        <div className="container-custom relative pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
            {/* Copy */}
            <div className="lg:col-span-3 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 text-primary-700 text-xs font-extrabold uppercase tracking-widest">
                <Star className="w-3.5 h-3.5 fill-primary-500 text-primary-500" /> Trusted by 10,000+ vendors across India
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-gray-900">
                Grow your vehicle rental <br className="hidden sm:block" />
                business with{' '}
                <span className="text-primary-600">TransRentals</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Join India&apos;s largest vehicle rental marketplace. Get instant bookings, verified
                customers, and manage everything from your mobile app.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/vendor/register"
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-xl shadow-primary-600/20 hover:scale-[1.02] transition-all"
                >
                  Register as Vendor <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/vendor/login"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 font-bold text-base px-6 py-3.5 rounded-xl"
                >
                  Login to Dashboard
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 text-xs text-gray-500 justify-center lg:justify-start">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary-600" /> Free to join
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary-600" /> Verified in 24 hrs
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary-600" /> No setup cost
                </span>
              </div>
            </div>

            {/* Background image carries the visual on this side; just float
                the live-request chip over it, matching the reference. */}
            <div className="lg:col-span-2 relative hidden lg:block min-h-[420px]">
              <div className="absolute top-6 right-2 z-20 flex items-center gap-1.5 bg-white rounded-xl shadow-xl shadow-gray-900/10 px-3 py-2 border border-gray-100">
                <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-[11px] font-extrabold text-gray-900">New request!</p>
                  <p className="text-[9px] text-gray-500">Swift · 3 days · just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="container-custom -mt-2 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 px-4 py-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="w-5 h-5 mx-auto text-primary-600 mb-2" />
                <p className="text-lg sm:text-xl font-extrabold text-gray-900">
                  {s.number}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Benefits ── */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary-50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-primary-50 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute top-6 left-4 w-24 h-24 opacity-[0.15] pointer-events-none hidden sm:block"
          style={{ backgroundImage: 'radial-gradient(circle, #09B368 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }}
        />
        <div
          className="absolute top-6 right-4 w-24 h-24 opacity-[0.15] pointer-events-none hidden sm:block"
          style={{ backgroundImage: 'radial-gradient(circle, #09B368 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }}
        />

        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-primary-300" />
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary-600">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Why partner with us
              </span>
              <span className="h-px w-10 bg-primary-300" />
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Why partner with <span className="text-primary-600">TransRentals</span>?
            </h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Everything you need to grow and manage your vehicle rental business.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="group relative border border-gray-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/5 rounded-2xl transition-all overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image}
                  alt=""
                  className="pointer-events-none absolute inset-y-0 right-0 w-[51%] h-full object-cover object-right"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundImage: 'linear-gradient(to right, white 0%, white 42%, transparent 67%)' }}
                />

                <div className="relative z-10 p-6 pr-4 max-w-[62%]">
                  <h3 className="text-lg font-extrabold text-gray-900">{b.title}</h3>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative bg-primary-50/60 py-16 sm:py-24">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary-600">
              How it works
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-gray-900">
              Get started in 3 simple steps
            </h2>
            <p className="text-gray-600 mt-4">No technical skills required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-5 lg:gap-4 max-w-6xl mx-auto items-start">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.step}>
                <div className="relative bg-white rounded-3xl shadow-md ring-1 ring-black/5 pt-9 pb-6 px-5">
                  <div className="absolute -top-4 left-6 w-11 h-11 rounded-full bg-primary-600 text-white flex items-center justify-center font-extrabold text-base shadow-lg ring-4 ring-primary-50">
                    {s.step}
                  </div>

                  <div className="relative rounded-2xl overflow-hidden bg-white aspect-[4/5]">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      className="object-contain p-1.5"
                    />
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold text-gray-900 text-center">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed text-center">{s.description}</p>
                </div>

                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex items-center justify-center pt-32">
                    <ArrowRight className="w-6 h-6 text-primary-400" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6 sm:gap-4">
            {ONBOARDING_HIGHLIGHTS.map((h) => (
              <div key={h.label} className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:text-left sm:gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-primary-600 flex items-center justify-center shadow-sm ring-1 ring-primary-100 flex-shrink-0">
                  <h.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900 leading-tight">{h.label}</p>
                  <p className="text-xs text-gray-500">{h.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service Categories ── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary-600">
              List your vehicles
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              We support all types of vehicle rentals
            </h2>
            <p className="text-gray-600 mt-4">From two-wheelers to heavy equipment — list it all.</p>
          </div>

          <VehicleCategoryShowcase />
        </div>
      </section>

      {/* ── Mobile App Features ── */}
      <section className="relative overflow-hidden bg-primary-50/60 py-16 sm:py-24">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary-600">
                Vendor app
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold mb-5 leading-tight tracking-tight text-gray-900">
                Manage everything from our mobile app
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Download the TransRentals Vendor App and take control of your business.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {APP_FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2.5"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={vendorAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-black transition font-semibold shadow-lg hover:scale-[1.02]"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs">GET IT ON</div>
                    <div className="text-sm font-bold">Google Play</div>
                  </div>
                </a>

                <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vendorAppQrDataUrl}
                    alt="Scan to download the TransRentals Vendor app"
                    className="w-20 h-20 mx-auto"
                  />
                  <p className="text-[10px] font-bold text-gray-500 mt-1.5">Scan to download</p>
                </div>

                <div className="flex gap-2">
                  {[
                    { label: 'Uptime', value: '99.9%' },
                    { label: 'Rating', value: '4.8★' },
                    { label: 'Installs', value: '50k+' },
                  ].map((m) => (
                    <div key={m.label} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-center shadow-sm">
                      <p className="text-sm font-extrabold text-gray-900">{m.value}</p>
                      <p className="text-[9px] uppercase tracking-widest text-gray-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary-200/30 blur-3xl pointer-events-none" />
              <div className="relative w-52 sm:w-60 mx-auto">
                <div className="relative rounded-[2.5rem] bg-slate-900 border-4 border-white shadow-2xl p-2 overflow-hidden">
                  <Image
                    src="/assets/vendorappss.png"
                    alt="TransRentals Vendor app home screen"
                    width={1080}
                    height={2254}
                    className="w-full h-auto rounded-[1.85rem]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vendor Guide CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 py-16 sm:py-20 text-white">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #09B368 0%, transparent 35%), radial-gradient(circle at 85% 80%, #2AD291 0%, transparent 40%)',
          }}
        />

        <div className="relative container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            {/* Left — copy + CTA */}
            <div className="lg:col-span-2">
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 text-primary-100 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <BookOpen className="w-3 h-3" /> Official Guide
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                The complete vendor journey
              </h2>
              <p className="text-primary-100/90 mt-4 leading-relaxed">
                14 steps across 5 phases — from registration to running daily operations. Every
                screen previewed, with direct links straight into the dashboard.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/guide/vendor"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
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
              <p className="mt-4 text-sm text-primary-200/80">
                Or{' '}
                <Link href="/vendor/register" className="font-bold text-white underline underline-offset-2 hover:text-primary-100">
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
                  className="group flex items-center gap-4 bg-white/10 hover:bg-white/15 backdrop-blur border border-white/20 hover:border-primary-300/50 rounded-2xl px-4 py-3 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-400 text-primary-950 flex items-center justify-center font-extrabold text-lg shrink-0 shadow-lg">
                    {p.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p.icon className="w-3.5 h-3.5 text-primary-200" />
                      <p className="text-base font-extrabold text-white">{p.title}</p>
                    </div>
                    <p className="text-[12px] text-primary-100/80 mt-0.5">{p.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-primary-100 bg-white/10 border border-white/20 px-2 py-1 rounded-full whitespace-nowrap">
                      {p.steps} step{p.steps > 1 ? 's' : ''}
                    </span>
                    <ChevronRight className="w-4 h-4 text-primary-200 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA + Support ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-900 py-16 sm:py-20 text-white">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #ffffff 0%, transparent 35%), radial-gradient(circle at 85% 85%, #052e1c 0%, transparent 45%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative container-custom text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            <Rocket className="w-7 h-7" />
          </div>
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
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-lg hover:scale-[1.02] transition-all"
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

          <div className="mt-14 pt-10 border-t border-white/15">
            <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold">Need help getting started?</h3>
            <p className="text-white/80 text-sm mt-2">
              Our support team is here to help you every step of the way.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={WHATSAPP_LINK ?? '#'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition shadow-lg hover:scale-[1.02]"
              >
                <ShieldCheck className="w-5 h-5" /> WhatsApp Support
              </a>
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white rounded-xl font-semibold transition"
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

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Clock,
  Smartphone,
  BarChart,
  Bell,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Car,
  FileText,
  IndianRupee,
  Bus,
  Truck,
  Gem,
  MessageCircle,
  Mail,
  Users,
} from 'lucide-react';
import { WHATSAPP_LINK } from '@/lib/contact';
import { FAQSection } from '@/components/services/FAQSection';
import { DriverEarningsBanner } from '@/components/driver/DriverEarningsBanner';
import { DriverRequirementsChecklist } from '@/components/driver/DriverRequirementsChecklist';
import { DriverAppShowcase } from '@/components/driver/DriverAppShowcase';
import { DriverTestimonials } from '@/components/driver/DriverTestimonials';
import { DriverCities } from '@/components/driver/DriverCities';
import { DriverSafety } from '@/components/driver/DriverSafety';
import { Reveal } from '@/components/driver/Reveal';

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

/* Each icon moves on its own — plain Tailwind group-hover, no custom keyframes.
   Same vocabulary the service pages use, so the driver page reads as part of
   the same product rather than a one-off. */
const ICON_HOVER: Record<string, string> = {
  rise: 'group-hover:-translate-y-1.5',
  spin: 'group-hover:rotate-[360deg]',
  ring: 'group-hover:rotate-12',
  pulse: 'group-hover:scale-125',
  drive: 'group-hover:translate-x-1.5',
  grow: 'group-hover:-translate-y-1 group-hover:scale-110',
};

const BENEFITS = [
  {
    Icon: IndianRupee,
    anim: 'grow',
    title: 'Guaranteed Earnings',
    description:
      'Consistent chauffeur bookings plus performance bonuses, settled weekly straight to your bank.',
  },
  { Icon: Clock, anim: 'spin', title: 'Flexible Schedule', description: 'You choose when you work. Accept or reject trips based on your availability — total freedom.' },
  { Icon: Bell, anim: 'ring', title: 'Instant Trip Alerts', description: 'Real-time push notifications for nearby trips. Never miss a booking opportunity.' },
  { Icon: Smartphone, anim: 'rise', title: 'Dedicated Driver App', description: 'Manage trips, track earnings and handle your vehicle — all from one app.' },
  { Icon: Shield, anim: 'pulse', title: 'Verified & Safe Trips', description: 'Every booking comes from a verified customer. Your safety and payment stay protected.' },
  { Icon: BarChart, anim: 'rise', title: 'Earnings Analytics', description: 'Track daily, weekly and monthly earnings. Know what you made and when you get paid.' },
];

const STEPS = [
  {
    step: '1',
    Icon: FileText,
    title: 'Register Your Profile',
    description:
      'Sign up with your name, phone, driving licence and bank details. Under 5 minutes, completely free.',
  },
  {
    step: '2',
    Icon: Car,
    title: 'Add Your Fleet',
    description:
      "Register your vehicle on the driver app. Driving for a vendor? They assign one to you — no vehicle needed from your side.",
  },
  {
    step: '3',
    Icon: Zap,
    title: 'Accept Trips & Earn',
    description:
      'Go online, accept nearby bookings instantly, and get paid weekly directly to your bank account.',
  },
];

const VEHICLE_CLASSES = [
  { Icon: Car, name: 'Sedan & Hatchback', licence: 'LMV', detail: 'City rides, airport runs and daily chauffeur duty.' },
  { Icon: Car, name: 'SUV & MUV', licence: 'LMV', detail: 'Family trips and outstation runs — the highest demand class.' },
  { Icon: Truck, name: 'Tempo Traveller', licence: 'HMV', detail: 'Group travel and multi-day tour packages.' },
  { Icon: Bus, name: 'Luxury Coach', licence: 'PSV', detail: 'Weddings, corporate transport and event charters.' },
  { Icon: Gem, name: 'Luxury Cars', licence: 'LMV', detail: 'Premium chauffeur work with the best per-trip earnings.' },
];

const DRIVER_FAQS = [
  {
    question: 'Do I need my own vehicle to become a driver?',
    answer:
      "It depends on your type. Registering as a vendor's driver means your vendor assigns a vehicle to you — you don't need your own. Registering as an independent driver means you bring your own vehicle, add it to your fleet on the driver app, and then start accepting trips.",
  },
  {
    question: 'How quickly can I start getting trips?',
    answer:
      'As soon as you register and add your vehicle to the fleet (or get assigned one by your vendor), you can go online on the driver app and start receiving trip requests in your city right away.',
  },
  {
    question: 'When and how do I get paid?',
    answer:
      'Earnings are settled weekly directly to your bank account. You can track every rupee in real time from the driver app earnings dashboard.',
  },
  {
    question: 'What licence types are accepted?',
    answer:
      'We accept LMV, MCWG, HMV, HPMV, TRANS and PSV licence types. The vehicles you can drive depend on your licence category.',
  },
  {
    question: 'Can I drive in multiple cities?',
    answer:
      "Yes. You can accept trips across multiple cities — just update your availability and location in the app and you'll receive requests from nearby customers.",
  },
  {
    question: 'Is there any registration fee?',
    answer:
      'No. Registering as a driver on TransRentals is completely free. We only earn when you earn — no hidden charges.',
  },
];

export default function DriverLandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────
          Full-bleed photograph rather than a split: the shot already has the
          driver on the right and open road on the left, so the copy sits in
          the space the picture leaves for it.

          The wash is kept light — the previous version dimmed the whole thing
          to near-black and lost the daylight that makes the photo work. Only
          the left side is darkened, and only as far as the text needs. */}
      <section className="relative isolate overflow-hidden bg-[#dfeaf2]">
        {/* desktop art */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-cover bg-center bg-no-repeat sm:block"
          style={{ backgroundImage: "url('/images/sections/driver-hero.webp')" }}
        />
        {/* phone art — a tighter crop, so a narrow screen still shows a person */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat sm:hidden"
          style={{
            backgroundImage: "url('/images/sections/driver-hero-mobile.webp')",
            backgroundPosition: 'center center',
          }}
        />

        {/* readability wash: strong at the left edge, gone by the middle */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            // Explicit stops rather than Tailwind's 0/50/100: the copy runs to
            // roughly 45% of the width and the photo is bright right up to the
            // left edge, so the wash has to stay heavy well past halfway and
            // then clear completely before it reaches the driver.
            background:
              // The shot is brightest at the top (sky and sunrise), so the wash
              // is angled down-right: heavy behind the copy, clearing well
              // before the steering wheel and the sun.
              'linear-gradient(105deg, rgba(2,40,31,.93) 0%, rgba(2,40,31,.86) 24%, rgba(2,40,31,.64) 42%, rgba(2,40,31,.22) 60%, rgba(2,40,31,0) 76%)',
          }}
        />
        {/* a touch of brand at the very bottom so the section hands off cleanly */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-emerald-950/85 to-transparent"
        />

        <div className="container-custom relative py-20 md:py-28 lg:py-36">
          <div className="max-w-xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200 backdrop-blur-sm">
              <Star className="h-3.5 w-3.5" />
              Trusted by drivers across India
            </span>

            <h1 className="mt-6 text-[2.6rem] leading-[1.06] md:text-6xl lg:text-[4.2rem] lg:leading-[1.02] font-black tracking-tight drop-shadow-[0_4px_28px_rgba(2,35,26,0.55)]">
              Your car.<br />
              Your hours.<br />
              <span className="text-emerald-300">Your earnings.</span>
            </h1>

            <p className="mt-6 max-w-md text-[15px] md:text-lg leading-relaxed text-emerald-50/90 drop-shadow-[0_2px_12px_rgba(2,35,26,0.5)]">
              Drive with TransRentals — accept the trips you want, follow the route in the
              app, and get paid into your bank every week. No joining fee, ever.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link
                href="/driver/register"
                className="group/cta inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-emerald-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Start driving today
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
              </Link>
              <Link
                href="/driver/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-[15px] font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Login to Dashboard
              </Link>
            </div>

            <p className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-emerald-100/85">
              {['Free to join', 'No registration fee', 'Register in 5 minutes'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
                  {t}
                </span>
              ))}
            </p>
          </div>
        </div>

      </section>

      {/* ── How it works ─────────────────────────────────────────────────
          Dashed connector between the steps, the same device the service
          pages use, so the three stages read as one path. */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              Simple Process
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900">How It Works</h2>
            <p className="mt-3 text-gray-500">Start earning in just 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {STEPS.map(({ step, Icon, title, description }, idx) => (
              <div key={step} className="relative">
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-1/2 w-full border-t-2 border-dashed border-emerald-200" />
                )}
                <div className="group relative z-10 text-center">
                  <div className="relative mx-auto mb-5 h-14 w-14">
                    <span
                      className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75"
                      style={{ animationDelay: `${idx * 0.3}s`, animationDuration: '2.5s' }}
                    />
                    <div className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-100 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6 text-white" />
                      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-emerald-500 bg-white text-[10px] font-extrabold text-emerald-700">
                        {step}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DriverCities />

      <DriverRequirementsChecklist />

      <DriverSafety />

      {/* ── Why drive with us ─────────────────────────────────────────────
          One accent colour, not six. The first card spans two columns so the
          grid has a lead rather than six equal tiles. */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
            maskImage:
              'radial-gradient(420px 320px at 6% 8%, #000 0%, transparent 70%), radial-gradient(420px 320px at 94% 92%, #000 0%, transparent 70%)',
          }}
        />
        <div className="container-custom relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Why Drive with <span className="text-emerald-600">TransRentals?</span>
            </h2>
            <p className="mt-3 text-gray-500">
              Everything you need to earn more and work smarter as a professional driver.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {BENEFITS.map(({ Icon, anim, title, description }) => (
              <div
                key={title}
                className="group relative rounded-2xl border-[1.5px] border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-100"
              >
                <div className="relative mb-4 h-14 w-14">
                  <span className="absolute inset-0 rotate-[18deg] rounded-full border-2 border-dashed border-emerald-200 transition-transform duration-700 group-hover:rotate-[198deg]" />
                  <span className="absolute inset-[5px] grid place-items-center rounded-full bg-emerald-50 transition-colors duration-300 group-hover:bg-emerald-600">
                    <Icon
                      className={`h-5 w-5 text-emerald-600 transition-transform duration-500 group-hover:text-white ${ICON_HOVER[anim]}`}
                    />
                  </span>
                </div>
                <h3 className="text-[17px] font-bold leading-snug text-gray-900">{title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DriverTestimonials />

      {/* ── Vehicle classes ──────────────────────────────────────────────
          The emoji tiles carried no information beyond the name. Each card
          now says what that class is actually good for. */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/70 to-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-[2.5rem] leading-[1.12] font-black tracking-tight text-gray-900">
              Vehicles You Can <span className="text-emerald-600">Drive</span>
            </h2>
            <p className="mt-3 text-gray-500">
              Accept trips across multiple vehicle categories, based on your licence type.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {VEHICLE_CLASSES.map(({ Icon, name, licence, detail }) => (
              <div
                key={name}
                className="group rounded-2xl border-[1.5px] border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-lg"
              >
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 transition-colors duration-300 group-hover:bg-emerald-600">
                  <Icon className="h-6 w-6 text-emerald-600 transition-colors duration-300 group-hover:text-white" />
                </span>
                <h3 className="text-[14px] font-bold leading-snug text-gray-900">{name}</h3>
                <span className="mt-1.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {licence}
                </span>
                <p className="mt-2.5 text-[12px] leading-relaxed text-gray-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DriverAppShowcase />

      {/* Tick-off readiness check, then the earnings pitch. */}
      <DriverEarningsBanner />

      {/* The site-wide accordion, so this page's FAQ behaves like every other. */}
      <FAQSection service="driver" customFaqs={DRIVER_FAQS} />

      {/* ── Closing ──────────────────────────────────────────────────────
          The old page ended with three near-identical blocks (earnings
          banner, CTA, support). One closing section: register on the left,
          get help on the right. */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/40 to-white">
        <div className="container-custom max-w-5xl">
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-8 md:p-10 text-white shadow-lg">
              <h2 className="text-2xl md:text-[2rem] leading-tight font-black tracking-tight">
                Ready to start your<br />
                <span className="text-emerald-300">driver journey?</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-emerald-100/80">
                Join thousands of professional drivers already earning with TransRentals.
                Register in 5 minutes — free, fast and simple.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/driver/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-900 shadow-lg shadow-emerald-950/30 transition-transform hover:-translate-y-0.5"
                >
                  Register as Driver
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/driver/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border-[1.5px] border-gray-100 bg-white p-8 shadow-sm">
              <h3 className="text-[17px] font-bold text-gray-900">Need help getting started?</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                Our driver support team is available 7 days a week to help you register and
                get on the road.
              </p>
              <div className="mt-6 space-y-2.5">
                <a
                  href={WHATSAPP_LINK ?? '#'}
                  className="flex items-center gap-3 rounded-xl border-[1.5px] border-gray-100 bg-gray-50/60 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  WhatsApp Support
                </a>
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
                  className="flex items-center gap-3 rounded-xl border-[1.5px] border-gray-100 bg-gray-50/60 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

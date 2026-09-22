'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  MapPin, Car, ArrowRight, Sparkles,
  Target, Telescope, ShieldCheck, Tag, Globe2, Calendar, Zap, Truck, Bike, Bus,
} from 'lucide-react';

const IMPACT_STATS = [
  { icon: Sparkles, target: 50000, suffix: '+', label: 'Happy Customers' },
  { icon: Car, target: 1000, suffix: '+', label: 'Verified Vehicles' },
  { icon: MapPin, target: 500, suffix: '+', label: 'Cities Covered' },
  { icon: Zap, target: 2500, suffix: '+', label: 'Daily Inquiries' },
];

const WHY_CHOOSE = [
  { icon: ShieldCheck, color: 'emerald', title: 'Verified Vendors', desc: 'All vendors are thoroughly verified for quality & trust.' },
  { icon: Tag, color: 'amber', title: 'Best Prices', desc: 'Compare multiple quotes and book the most affordable deal.' },
  { icon: Globe2, color: 'blue', title: 'Wide Coverage', desc: 'Available in 500+ cities across India.' },
  { icon: Calendar, color: 'violet', title: '24/7 Support', desc: 'Our support team is always ready to help you.' },
  { icon: Zap, color: 'rose', title: 'Easy Booking', desc: 'Book your ride or equipment in just a few clicks.' },
  { icon: Truck, color: 'teal', title: 'Transparent Process', desc: 'No hidden costs, clear pricing and secure payments.' },
];

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50 group-hover:bg-emerald-600', text: 'text-emerald-600 group-hover:text-white' },
  amber: { bg: 'bg-amber-50 group-hover:bg-amber-600', text: 'text-amber-600 group-hover:text-white' },
  blue: { bg: 'bg-blue-50 group-hover:bg-blue-600', text: 'text-blue-600 group-hover:text-white' },
  violet: { bg: 'bg-violet-50 group-hover:bg-violet-600', text: 'text-violet-600 group-hover:text-white' },
  rose: { bg: 'bg-rose-50 group-hover:bg-rose-600', text: 'text-rose-600 group-hover:text-white' },
  teal: { bg: 'bg-teal-50 group-hover:bg-teal-600', text: 'text-teal-600 group-hover:text-white' },
};

const MARQUEE_ICONS = [Car, Bike, Bus, Truck];

function CountUp({ target, suffix = '', duration = 1.6 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target, duration]);

  return <span ref={ref}>{value.toLocaleString('en-IN')}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export function AboutPageClient() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-no-repeat bg-right bg-cover"
            style={{ backgroundImage: "url('/images/sections/about-hero-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent md:via-slate-950/40" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative container-custom pt-32 md:pt-40 pb-32 md:pb-40 min-h-[520px] md:min-h-[620px] flex flex-col items-start justify-center"
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-emerald-300 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            ABOUT US
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight max-w-xl">
            About Trans<span className="text-emerald-400">Rentals</span>
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-md">
            India&apos;s most trusted vehicle rental marketplace
          </p>
        </motion.div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full mb-4">
              OUR STORY
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-3">
              Built for Every <span className="text-emerald-600">Journey</span>
            </h2>
            <p className="text-gray-500">
              From everyday rides to heavy equipment — rent anything, anywhere in India.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-10 md:gap-6 items-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:col-span-2 space-y-4 text-gray-600 leading-relaxed"
            >
              <p>
                <strong className="text-gray-900">TransRentals</strong> was founded with a simple mission — to make
                vehicle rental easy, affordable and reliable for everyone. We saw a gap between people who need
                vehicles and those who have them, so we built a smart platform to connect both sides.
              </p>
              <p>
                Today, we are proud to be India&apos;s fastest growing vehicle rental marketplace, serving individuals,
                businesses and industries across <span className="font-bold text-emerald-700">500+ cities</span> with
                trust, technology and transparency.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="md:col-span-3 relative flex items-center justify-center py-4"
            >
              {/* Soft glow so the cutout's edges blend into the white section instead of reading as a pasted rectangle */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_center,theme(colors.emerald.50)_0%,transparent_70%)] blur-2xl" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/10 blur-2xl rounded-full" />

              <motion.img
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                src="/images/sections/about-story-fleet.png"
                alt="TransRentals fleet — bikes, cars, buses, trucks and equipment"
                className="relative w-full h-auto object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Impact */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/sections/about-impact-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-emerald-950/45 to-slate-950/85" />
        </div>

        <div className="relative container-custom">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl mx-auto mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-black text-white mb-2">Our Impact</h2>
            <p className="text-white/60">Numbers that drive our success</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {IMPACT_STATS.map(({ icon: Icon, target, suffix, label }, i) => (
              <motion.div
                key={label}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5.5 h-5.5 text-emerald-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mb-1">
                  <CountUp target={target} suffix={suffix} />
                </div>
                <div className="text-white/50 text-xs md:text-sm">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-white to-emerald-50/40 overflow-hidden">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8 md:gap-4 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-7 order-2 md:order-1"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                To revolutionize the vehicle rental industry by creating a transparent, efficient and
                customer-centric marketplace that makes mobility simple for everyone.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="relative order-1 md:order-2 flex justify-center"
            >
              <div className="relative w-56 h-56 md:w-64 md:h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-3 rounded-full border-2 border-dashed border-emerald-200"
                />
                <div className="absolute inset-0 rounded-full overflow-hidden shadow-xl border-4 border-white">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/sections/about-handshake.png')" }}
                  />
                </div>
                <motion.span
                  animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0.4, 0.9] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -left-2 top-1/3 w-3 h-3 rounded-full bg-emerald-500"
                />
                <motion.span
                  animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0.4, 0.9] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                  className="absolute -right-2 top-1/3 w-3 h-3 rounded-full bg-violet-500"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
              className="bg-violet-50 border border-violet-100 rounded-2xl p-7 order-3"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mb-4">
                <Telescope className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                To become the go-to platform for all vehicle rental needs across India and beyond — where
                travel, work and business move faster with TransRentals.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-24 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl mx-auto mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-2">
              Why Choose <span className="text-emerald-600">TransRentals</span>?
            </h2>
            <p className="text-gray-500">The smarter, easier and safer way to rent any vehicle</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_CHOOSE.map(({ icon: Icon, color, title, desc }, i) => {
              const c = COLOR_MAP[color];
              return (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: (i % 3) * 0.1 }}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6 flex items-start gap-4"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${c.bg}`}>
                    <Icon className={`w-5 h-5 transition-colors ${c.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-gray-900">{title}</h3>
                      <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 text-white">
        <div className="container-custom py-14 md:py-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-black mb-2">Driving India&apos;s Mobility, Together</h2>
              <p className="text-white/60">More than rentals, we build connections for a smarter and better journey.</p>
            </div>
            <Link
              href="/services"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-colors shrink-0"
            >
              Explore Our Services
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>

        {/* Decorative animated road line + vehicle icons */}
        <div className="relative border-t border-white/10 overflow-hidden h-16">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 64" preserveAspectRatio="none" fill="none">
            <path d="M0,32 C 200,10 300,54 500,32 S 800,10 1200,32" stroke="url(#roadGrad)" strokeWidth="1.5" />
            <defs>
              <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.15 }}
            className="absolute left-4 md:left-8 bottom-4 flex items-center gap-5"
          >
            {MARQUEE_ICONS.map((Icon, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                >
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-white/25" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}

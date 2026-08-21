'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rahul Sharma',
    location: 'Goa',
    service: 'Bike Rental',
    rating: 5,
    comment:
      'Amazing experience! Rented a Royal Enfield for my Goa trip. The bike was in perfect condition and the vendor was very helpful. Highly recommended!',
    date: 'Dec 2024',
  },
  {
    name: 'Priya Patel',
    location: 'Manali',
    service: 'Car Rental',
    rating: 5,
    comment:
      'Best car rental service in Manali. Got a well-maintained SUV at a great price. The entire process was smooth and hassle-free.',
    date: 'Nov 2024',
  },
  {
    name: 'Amit Kumar',
    location: 'Bangalore',
    service: 'Bus Rental',
    rating: 5,
    comment:
      'Booked a 40-seater bus for our company outing. Excellent service, professional driver, and competitive pricing. Will use again!',
    date: 'Oct 2024',
  },
  {
    name: 'Sneha Reddy',
    location: 'Udaipur',
    service: 'Bike Rental',
    rating: 5,
    comment:
      'Loved the variety of bikes available. Rented a Himalayan for exploring Udaipur. The booking process was super easy through TransRentals.',
    date: 'Dec 2024',
  },
];

const AVATAR_STYLES = [
  'from-primary-400 to-primary-600',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-600',
  'from-fuchsia-400 to-purple-600',
];

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[#0b1420] py-20 text-white sm:py-24">
      {/* Background texture + glow, matching the loyalty rewards section */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary-500/10 blur-[120px]" />

      <div className="container-custom relative">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-300">
            <Star className="h-3.5 w-3.5 fill-primary-300" /> Loved by thousands
          </span>
          <h2 className="mt-5 font-heading text-3xl font-extrabold sm:text-4xl">What Our Customers Say</h2>
          <p className="mt-4 text-slate-300">Don&rsquo;t just take our word for it — hear from our happy customers</p>
        </div>

        {/* Testimonial cards */}
        <div className="mt-14 -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 scrollbar-hide lg:mx-0 lg:grid lg:snap-none lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative w-[280px] shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.06] lg:w-auto"
            >
              <Quote className="absolute right-5 top-5 h-8 w-8 text-white/10" />

              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${
                    AVATAR_STYLES[testimonials.indexOf(t) % AVATAR_STYLES.length]
                  }`}
                >
                  {initialsOf(t.name)}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{t.name}</h3>
                  <p className="text-xs text-slate-400">
                    {t.service} in {t.location}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="mt-3 text-[14px] leading-relaxed text-slate-300">&ldquo;{t.comment}&rdquo;</p>

              <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">{t.date}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

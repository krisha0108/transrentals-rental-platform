'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { BusRentalBookingForm } from '@/components/booking/BusRentalBookingForm';

export function CorporateBusRentalServiceHero() {
  return (
    <>
      <Header />
      <section className="relative bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900 text-white pt-32 pb-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block mb-4">
                <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                  💼 Business Transportation Solutions
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Corporate Bus
                <span className="block text-gray-300">Rental Services</span>
              </h1>

              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Reliable Transport for Your Business
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Employee Transportation</h3>
                    <p className="text-gray-300">Daily commute solutions for your team</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Corporate Events</h3>
                    <p className="text-gray-300">Conferences, seminars & team outings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Flexible Contracts</h3>
                    <p className="text-gray-300">Daily, monthly, or annual rental plans</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="block font-semibold">Daily Commute</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="block font-semibold">Office Events</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="block font-semibold">Team Outings</span>
                </div>
              </div>
            </div>

            {/* Right Booking Form */}
            <div className="lg:ml-auto w-full lg:max-w-md">
              <BusRentalBookingForm />
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
      </section>
    </>
  );
}

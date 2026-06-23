'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Coins, Gift, Wallet, Zap, TrendingUp, ArrowRight } from 'lucide-react';

export function BackrTokenSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-amber-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-yellow-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container-custom relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Animated Coin */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* Floating Coins Animation */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                {/* Main Coin */}
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-full shadow-2xl flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent rounded-full" />
                  <div className="text-white text-center">
                    <div className="text-6xl font-bold mb-2">B</div>
                    <div className="text-xl font-semibold">BACKR</div>
                    <div className="text-sm opacity-80">TOKEN</div>
                  </div>
                </div>

                {/* Orbiting Small Coins */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full shadow-lg flex items-center justify-center text-white font-bold">
                    +50
                  </div>
                </motion.div>

                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg flex items-center justify-center text-white font-bold">
                    +10
                  </div>
                </motion.div>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute -left-4 top-1/3 bg-white rounded-xl shadow-xl p-4 max-w-[140px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-gray-700">upto</span>
                  <span className="text-2xl font-bold text-gray-900">50</span>
                </div>
                <p className="text-xs text-gray-600">Tokens per Booking</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -right-4 top-2/3 bg-white rounded-xl shadow-xl p-4 max-w-[140px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-gray-700">upto</span>
                  <span className="text-2xl font-bold text-gray-900">100</span>
                </div>
                <p className="text-xs text-gray-600">Daily Spin Bonus</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900">Loyalty Rewards Program</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Backr Tokens</span> on Every Booking
            </h2>

            <p className="text-xl text-gray-700 mb-8">
              Complete bookings, spin the daily wheel, and earn cryptocurrency rewards that you can redeem for real value!
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                {
                  icon: <Coins className="w-6 h-6" />,
                  title: 'Earn Tokens',
                  description: 'Get a Backr tokens for every completed booking',
                  gradient: 'from-amber-500 to-yellow-500',
                },
                {
                  icon: <Gift className="w-6 h-6" />,
                  title: 'Daily Spin Wheel',
                  description: 'Spin once every 24 hours to win up to 100 tokens',
                  gradient: 'from-orange-500 to-red-500',
                },
                {
                  icon: <Wallet className="w-6 h-6" />,
                  title: 'Redeem for Crypto',
                  description: 'Convert your tokens to Solana cryptocurrency',
                  gradient: 'from-purple-500 to-pink-500',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={process.env.NEXT_PUBLIC_CUSTOMER_APP_ANDROID || 'https://play.google.com/store/apps/details?id=com.transrentals.customer'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold hover:from-amber-700 hover:to-orange-700 transition shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300"
              >
                <TrendingUp className="w-5 h-5" />
                Download App to Earn
                <ArrowRight className="w-5 h-5" />
              </a>

              <Link
                href="https://backrcoin.org/"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-amber-600 text-amber-700 rounded-xl font-bold hover:bg-amber-50 transition"
              >
                Learn More
              </Link>
            </div>

            {/* Info */}
            <p className="mt-6 text-sm text-gray-600">
              💡 <span className="font-semibold">How it works:</span> Complete bookings → Earn tokens → Connect Solana wallet → Redeem for cryptocurrency
            </p>
          </motion.div>
        </div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Tokens Distributed', value: '50K+', icon: <Coins className="w-6 h-6" /> },
              { label: 'Active Users', value: '2,500+', icon: <TrendingUp className="w-6 h-6" /> },
              { label: 'Daily Spins', value: '1,000+', icon: <Gift className="w-6 h-6" /> },
              { label: 'Redemptions', value: '500+', icon: <Wallet className="w-6 h-6" /> },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

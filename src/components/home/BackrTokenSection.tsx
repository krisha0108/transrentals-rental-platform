'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Coins, Gift, Wallet, Zap, TrendingUp, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Coins,
    title: 'Earn Tokens',
    description: 'Get a Backr tokens for every completed booking',
    accent: 'text-amber-300',
    chip: 'bg-amber-500/15',
  },
  {
    icon: Gift,
    title: 'Daily Spin Wheel',
    description: 'Spin once every 24 hours to win up to 100 tokens',
    accent: 'text-orange-300',
    chip: 'bg-orange-500/15',
  },
  {
    icon: Wallet,
    title: 'Redeem for Crypto',
    description: 'Convert your tokens to Solana cryptocurrency',
    accent: 'text-primary-400',
    chip: 'bg-primary-500/15',
  },
];

const STATS = [
  { label: 'Tokens Distributed', value: '50K+' },
  { label: 'Active Users', value: '2,500+' },
  { label: 'Daily Spins', value: '1,000+' },
  { label: 'Redemptions', value: '500+' },
];

const HOW_IT_WORKS = ['Complete bookings', 'Earn tokens', 'Connect Solana wallet', 'Redeem for cryptocurrency'];

export function BackrTokenSection() {
  return (
    <section className="relative overflow-hidden bg-[#0b1420] py-20 text-white sm:py-24">
      {/* Background texture + glows */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/4 rounded-full bg-amber-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] translate-x-1/3 translate-y-1/4 rounded-full bg-primary-500/15 blur-[120px]" />

      {/* Seam divider — this section sits directly on top of another
          dark (#0b1420) section (Testimonials) with no gap between them,
          so without this the two blur into one indistinguishable block. */}
      <div className="absolute inset-x-0 top-0 mx-auto h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="container-custom relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
            <Zap className="h-3.5 w-3.5" /> Loyalty Rewards Program
          </span>
          <h2 className="mt-5 font-heading text-3xl font-extrabold sm:text-4xl">
            Earn <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Backr Tokens</span> on Every Booking
          </h2>
          <p className="mt-4 text-slate-300">
            Complete bookings, spin the daily wheel, and earn cryptocurrency rewards that you can redeem for real value!
          </p>
        </motion.div>

        {/* Main content */}
        <div className="mt-14 grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
          {/* Coin */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-full max-w-sm"
          >
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mx-auto h-72 w-72"
            >
              <Image
                src="/images/backr/backr-coin.png"
                alt="BackrCoin"
                fill
                sizes="288px"
                className="object-contain drop-shadow-[0_25px_60px_rgba(245,158,11,0.35)]"
                priority
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute -left-2 top-4 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md sm:-left-6"
            >
              <Coins className="h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="text-sm font-bold leading-none text-white">Up to 50</p>
                <p className="mt-1 text-[11px] text-slate-400">Tokens / booking</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute -right-2 bottom-6 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md sm:-right-6"
            >
              <Gift className="h-5 w-5 shrink-0 text-orange-300" />
              <div>
                <p className="text-sm font-bold leading-none text-white">Up to 100</p>
                <p className="mt-1 text-[11px] text-slate-400">Daily spin bonus</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Features + CTA */}
          <div>
            <div className="space-y-3">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${feature.chip} ${feature.accent}`}>
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                    <p className="mt-0.5 text-[13px] text-slate-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={process.env.NEXT_PUBLIC_CUSTOMER_APP_ANDROID || 'https://play.google.com/store/apps/details?id=com.transrentals.customer'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-900/30 transition-transform hover:-translate-y-0.5 hover:bg-primary-600"
              >
                <TrendingUp className="h-4 w-4" />
                Download App to Earn
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="https://backrcoin.org/"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Learn More
              </Link>
            </div>

            {/* How it works flow */}
            <div className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-slate-300">
              {HOW_IT_WORKS.map((step, index) => (
                <React.Fragment key={step}>
                  <span className={index === 0 ? 'font-semibold text-white' : ''}>{step}</span>
                  {index < HOW_IT_WORKS.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-500" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-2 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-4 sm:divide-x sm:divide-white/10"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-3xl font-extrabold text-white sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

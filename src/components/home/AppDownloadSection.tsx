'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Smartphone, Star, Zap, Shield, Download } from 'lucide-react';

export function AppDownloadSection() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const playStoreUrl =
    process.env.NEXT_PUBLIC_CUSTOMER_APP_ANDROID ||
    'https://play.google.com/store/apps/details?id=com.transrentals.customer';

  useEffect(() => {
    QRCode.toDataURL(playStoreUrl, { margin: 1, width: 160, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [playStoreUrl]);

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, #09B368 0%, transparent 35%), radial-gradient(circle at 85% 80%, #2AD291 0%, transparent 40%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Download className="w-4 h-4" />
              <span>Download Our Mobile App</span>
            </div>

            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">
              Experience Seamless Rentals On-The-Go
            </h2>

            <p className="text-sm md:text-base text-white/90 mb-6">
              Download the TransRentals app for a faster, easier booking experience.
              Track bookings, chat with vendors, and get instant notifications.
            </p>

            {/* Features - Compact Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: <Zap className="w-4 h-4" />, text: 'Instant bookings' },
                { icon: <Shield className="w-4 h-4" />, text: 'Verified vendors' },
                { icon: <Star className="w-4 h-4" />, text: 'Real-time tracking' },
                { icon: <Smartphone className="w-4 h-4" />, text: 'Easy management' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* App Store Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-white text-gray-900 px-6 py-4 rounded-xl hover:bg-gray-100 transition font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300"
              >
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-600">GET IT ON</div>
                  <div className="text-lg font-bold">Google Play</div>
                </div>
              </a>

              {qrDataUrl && (
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-xl hover:bg-white/15 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="Scan to download the TransRentals app" className="w-16 h-16 rounded-md bg-white p-1" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">Scan to download</div>
                    <div className="text-xs text-white/70">Opens on Google Play</div>
                  </div>
                </a>
              )}

              {/* <a
                href={process.env.NEXT_PUBLIC_CUSTOMER_APP_IOS || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-white text-gray-900 px-6 py-4 rounded-xl hover:bg-gray-100 transition font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300"
              >
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-600">Download on the</div>
                  <div className="text-lg font-bold">App Store</div>
                </div>
              </a> */}
            </div>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-semibold text-sm">4.8</span>
              </div>
              <div className="text-white/80 text-xs">
                50K+ Downloads
              </div>
            </div>
          </motion.div>

          {/* Right Content - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative bg-white/10 backdrop-blur-sm rounded-[3rem] p-3 border-4 border-white/20 shadow-2xl max-w-[400px] mx-auto">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* App Screenshot */}
                  <Image
                    src="/assets/appshot.png"
                    alt="TransRentals Mobile App"
                    width={280}
                    height={560}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white text-gray-900 rounded-xl p-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-green-600" />
                  <div className="text-xs font-bold">50K+ Downloads</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 bg-white text-gray-900 rounded-xl p-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <div className="text-xs font-bold">4.8 Rating</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

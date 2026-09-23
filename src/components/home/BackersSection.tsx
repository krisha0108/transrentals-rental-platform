'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Users, Globe } from 'lucide-react';

const BACKERS = [
  {
    name: 'Startup India',
    logo: '/images/backers/startup-india.png',
    type: 'Government Initiative',
  },
  {
    name: 'Make in India',
    logo: '/images/backers/make-in-india.png',
    type: 'Government Initiative',
  },
  {
    name: 'Digital India',
    logo: '/images/backers/digital-india.png',
    type: 'Government Initiative',
  },
];

const ACHIEVEMENTS = [
  {
    icon: <Users className="w-8 h-8" />,
    number: '40,000+',
    label: 'Happy Customers',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    number: '10,000+',
    label: 'Verified Vendors',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: <Globe className="w-8 h-8" />,
    number: '150+',
    label: 'Cities Covered',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Award className="w-8 h-8" />,
    number: '2,00,000+',
    label: 'Successful Bookings',
    gradient: 'from-orange-500 to-red-500',
  },
];

export function BackersSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Recognized & Supported By
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            Proud to be part of India's digital transformation journey
          </motion.p>
        </div>

        {/* Backers Logos */}
        <div className="mb-16">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {BACKERS.map((backer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-400">Logo</span>
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-gray-900">{backer.name}</h3>
                      <p className="text-xs text-gray-500">{backer.type}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Achievements Stats */}
        <div className="mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {ACHIEVEMENTS.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${achievement.gradient} rounded-lg flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}
                >
                  {achievement.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {achievement.number}
                </div>
                <div className="text-sm text-gray-600">{achievement.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-3">
            India's Most Trusted Vehicle Rental Platform
          </h3>
          <p className="text-white/90 mb-6">
            Join thousands of satisfied customers and vendors who trust TransRentals
            for their vehicle rental needs
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>100% Verified Vendors</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Best Price Guarantee</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

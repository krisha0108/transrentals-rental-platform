'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { WHATSAPP_LINK } from '@/lib/contact';

export function CTASectionDynamic() {
  const { currentCity } = useLocation();

  return (
    <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-500 text-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Your Journey in {currentCity.name}?
          </h2>
          <p className="text-xl md:text-2xl text-primary-50 mb-10 max-w-2xl mx-auto">
            Book your vehicle in {currentCity.name} now and explore India like never before
          </p>

          {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
  {/* Book Now Button */}
  <Button
    size="xl"
    variant="secondary"
    className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto shadow-xl hover:shadow-2xl rounded-xl"
    asChild
  >
    <Link href={`/bike-on-rent/${currentCity.slug}`} className="flex items-center">
      Book Now in {currentCity.name}
      <ArrowRight className="w-5 h-5 ml-2" />
    </Link>
  </Button>

  {/* Contact Us Button — EXACT SAME DESIGN */}
  <Button
    size="xl"
    variant="secondary"
    className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto shadow-xl hover:shadow-2xl rounded-xl"
    asChild
  >
    <Link href="/contact" className="flex items-center">
      Contact Us
    </Link>
  </Button>
</div>



          {/* Contact Options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 border-t border-white/20">
            <a
              href={WHATSAPP_LINK ?? '/contact'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-white hover:text-primary-100 transition-colors"
            >
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm text-primary-100">WhatsApp Us</div>
                <div className="font-semibold">24/7 Support</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

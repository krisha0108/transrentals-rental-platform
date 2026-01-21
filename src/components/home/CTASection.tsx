import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { WHATSAPP_LINK } from '@/lib/contact';

export function CTASection() {
  return (
    <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-500 text-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl md:text-2xl text-primary-50 mb-10 max-w-2xl mx-auto">
            Book your vehicle now and explore India like never before
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="xl"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto"
              asChild
            >
              <Link href="/bike-on-rent">
                Book Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>

            <Button
              size="xl"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 w-full sm:w-auto"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>

          {/* Contact Options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 border-t border-white/20">
            <a
              href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE}`}
              className="flex items-center gap-3 text-white hover:text-primary-100 transition-colors"
            >
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm text-primary-100">Call Us Now</div>
                <div className="font-semibold">
                  {process.env.NEXT_PUBLIC_CONTACT_PHONE}
                </div>
              </div>
            </a>

            <div className="hidden sm:block w-px h-12 bg-white/20" />

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

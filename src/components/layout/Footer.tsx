'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  ChevronDown,
} from 'lucide-react';
import {
  CONTACT_ADDRESS,
  CONTACT_ADDRESS_LINK,
  WHATSAPP_LINK,
} from '@/lib/contact';
import { SERVICES } from '@/lib/constants/services';
import Image from 'next/image';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openService, setOpenService] = useState<string | null>(null);

  // Settings from database (with fallback to env)
  const [contactSettings, setContactSettings] = useState({
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
    contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
    facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
  });

  // Fetch settings from database on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/public');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            // Update only if database has non-null values, otherwise keep env fallback
            setContactSettings((prev) => ({
              contactEmail: data.settings.contactEmail || prev.contactEmail,
              contactPhone: data.settings.contactPhone || prev.contactPhone,
              facebookUrl: data.settings.facebookUrl || prev.facebookUrl,
              instagramUrl: data.settings.instagramUrl || prev.instagramUrl,
              linkedinUrl: data.settings.linkedinUrl || prev.linkedinUrl,
            }));
          }
        }
      } catch (error) {
        // Silently fail and keep env variables as fallback
        console.error('Failed to fetch contact settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Check if customer is logged in
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const customer = localStorage.getItem('customer');
    setIsCustomerLoggedIn(!!(token && customer));
  }, []);

  const popularLocations = [
    { name: 'Goa', slug: 'goa' },
    { name: 'Manali', slug: 'manali' },
    { name: 'Bangalore', slug: 'bangalore' },
    { name: 'Mumbai', slug: 'mumbai' },
    { name: 'Delhi', slug: 'delhi' },
    { name: 'Jaipur', slug: 'jaipur' },
  ];

  // Group services by main category
  const mainServices = [
    {
      id: 'car',
      name: 'Car Rental',
      icon: '🚗',
      base_url: '/car-rental',
      subServices: [
        { name: 'Round Trip', url: '/round-trip' },
        { name: 'One Way Cab', url: '/one-way-cab' },
        { name: 'Airport Transfer', url: '/airport-transfer' },
        { name: 'Self Drive', url: '/self-drive-car-rentals' },
        { name: 'Luxury Cars', url: '/luxury-car-rental' },
      ],
    },
    {
      id: 'bike',
      name: 'Bike Rental',
      icon: '🏍️',
      base_url: '/bike-on-rent',
      subServices: [
        { name: 'Bike on Rent', url: '/bike-on-rent' },
        { name: 'Activa on Rent', url: '/activa-on-rent' },
        { name: 'Royal Enfield', url: '/royal-enfield-on-rent' },
      ],
    },
    {
      id: 'bus',
      name: 'Bus Rental',
      icon: '🚌',
      base_url: '/bus-rental',
      subServices: [
        { name: 'Outstation Bus', url: '/bus-rental' },
        { name: 'Local Bus', url: '/local-bus-rental' },
      ],
    },
    {
      id: 'truck',
      name: 'Truck Rental',
      icon: '🚚',
      base_url: '/truck-rental',
      subServices: [
        { name: 'Personal Moving', url: '/truck-rental' },
        { name: 'Commercial Transport', url: '/commercial-truck-rental' },
      ],
    },
    {
      id: 'equipment',
      name: 'Equipment Rental',
      icon: '🏗️',
      base_url: '/equipment-rental',
      subServices: [
        { name: 'Construction Equipment', url: '/equipment-rental' },
      ],
    },
  ];

  const toggleService = (serviceId: string) => {
    setOpenService(openService === serviceId ? null : serviceId);
  };

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Become a Vendor', href: '/vendor' },
    { name: 'For Travel Agents', href: '/travel-agents' },
    { name: 'Become a Driver', href: '/driver' },
    { name: 'Vendor Guide', href: '/vendor-guide.html', external: true },
    { name: 'Interactive Guide', href: '/guide/vendor' },
    { name: 'Stories', href: '/stories' },
    { name: 'Reflections', href: '/blog' },
    ...(!isCustomerLoggedIn ? [{ name: 'Customer Login', href: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/customer/login`, external: true }] : []),
  ];

  const policies = [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms & Conditions', href: '/terms-conditions' },
    { name: 'Cancellation Policy', href: '/cancellation-policy' },
    { name: 'Refund Policy', href: '/refund-policy' },
    { name: 'FAQ', href: '/faq' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/Logo-favicon.png"
              alt="TR"
              width={48}
              height={48}
              className="w-10 h-10 md:w-11 md:h-11 rounded-md"
            />
            <div className="flex flex-col">
              <Image
                src="/assets/logo-white.png"
                alt="TransRentals"
                width={140}
                height={28}
                className="h-5 md:h-6 w-auto"
              />
              <span className="text-xs text-white/70 hidden md:block">
                Vehicle Rental Marketplace
              </span>
            </div>
          </Link>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              India's largest vehicle rental marketplace connecting customers
              with verified vendors across 150+ cities.
            </p>
            <div className="flex gap-3">
              {contactSettings.facebookUrl && (
                <a
                  href={contactSettings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {contactSettings.instagramUrl && (
                <a
                  href={contactSettings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {contactSettings.linkedinUrl && (
                <a
                  href={contactSettings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Services with Accordion */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Our Services
            </h3>
            <div className="space-y-2">
              {mainServices.map((service) => (
                <div key={service.id}>
                  <button
                    onClick={() => toggleService(service.id)}
                    className="w-full flex items-center justify-between text-left text-sm hover:text-primary transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{service.icon}</span>
                      <span className="font-medium">{service.name}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openService === service.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openService === service.id && (
                    <div className="mt-2 ml-6 space-y-1 animate-slideDown">
                      {service.subServices.map((subService) => (
                        <Link
                          key={subService.url}
                          href={subService.url}
                          className="block text-xs text-gray-400 hover:text-primary transition-colors py-1"
                        >
                          {subService.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Popular Locations */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Popular Locations
            </h3>
            <ul className="space-y-2">
              {popularLocations.map((location) => (
                <li key={location.slug}>
                  <Link
                    href={`/bike-on-rent/${location.slug}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {location.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              {/* Call number temporarily hidden — keep email + WhatsApp */}
              {false && contactSettings.contactPhone && (
                <li>
                  <a
                    href={`tel:${contactSettings.contactPhone}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{contactSettings.contactPhone}</span>
                  </a>
                </li>
              )}
              {contactSettings.contactEmail && (
                <li>
                  <a
                    href={`mailto:${contactSettings.contactEmail}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{contactSettings.contactEmail}</span>
                  </a>
                </li>
              )}
              <li>
                <a
                  href={WHATSAPP_LINK ?? '/contact'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span>WhatsApp Support</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {CONTACT_ADDRESS_LINK ? (
                  <a
                    href={CONTACT_ADDRESS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {CONTACT_ADDRESS}
                  </a>
                ) : (
                  <span>{CONTACT_ADDRESS}</span>
                )}
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>150+ Cities Across India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((link) => (
                  link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  )
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">
                Policies & Terms
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {policies.map((policy) => (
                  <Link
                    key={policy.href}
                    href={policy.href}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {policy.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>
              © {currentYear} TransRentals. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/vendor/login` || '#'}
                className="text-primary hover:text-blue-400 transition-colors font-medium"
              >
                Vendor Login
              </a>
              <span>|</span>
              <Link
                href="/driver/login"
                className="text-primary hover:text-blue-400 transition-colors font-medium"
              >
                Driver Login
              </Link>
              <span>|</span>
              <p className="text-center md:text-right">
                Made with ❤️ in India
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

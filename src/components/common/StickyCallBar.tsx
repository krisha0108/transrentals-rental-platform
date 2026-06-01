'use client';

import { usePathname } from 'next/navigation';
import { Phone, MessageCircle } from 'lucide-react';

const SERVICE_PATHS = [
  '/bike-on-rent', '/car-rental', '/bus-rental', '/mini-truck-rental',
  '/packers-and-movers', '/luxury-car-rental', '/equipment-rental',
  '/self-drive-car-rentals', '/trailer-on-rent', '/activa-on-rent',
  '/royal-enfield-on-rent', '/monthly-bike-rental', '/hourly-car-rental',
  '/monthly-car-rental', '/one-way-cab', '/crane-on-rent', '/jcb-on-rent',
];

const PHONE = '+919737965551';
const PHONE_DISPLAY = '+91 97379 65551';
const WA_URL = `https://wa.me/${PHONE}?text=Hi, I want to book a rental service`;

export function StickyCallBar() {
  // Both call and WhatsApp company CTAs removed — render nothing.
  return null;
}

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
  const pathname = usePathname();
  const isServicePage = SERVICE_PATHS.some((p) => pathname?.startsWith(p));

  if (!isServicePage) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden flex shadow-lg">
      {/* Call button temporarily removed — WhatsApp only */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 font-semibold text-sm active:bg-emerald-600"
      >
        <MessageCircle className="w-4 h-4" />
        <span>WhatsApp</span>
      </a>
    </div>
  );
}

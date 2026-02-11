'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Grid3x3,
  Calendar,
  User,
  Menu,
  MapPin,
  Phone,
  Info,
  Car,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileLocationButton } from '@/components/MobileLocationButton';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Services', href: '/services', icon: Grid3x3 },
  { label: 'Bookings', href: '/customer/dashboard', icon: Calendar },
  { label: 'Profile', href: '/customer/login', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const locationButtonRef = React.useRef<HTMLDivElement>(null);

  // Auto-click location button when showLocationPicker is true
  React.useEffect(() => {
    if (showLocationPicker && locationButtonRef.current) {
      const button = locationButtonRef.current.querySelector('button');
      if (button) {
        button.click();
        // Reset state after clicking
        setTimeout(() => setShowLocationPicker(false), 100);
      }
    }
  }, [showLocationPicker]);

  // Lock body scroll when More menu is open
  React.useEffect(() => {
    if (isMoreOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isMoreOpen]);

  // Hide bottom nav on admin/vendor/driver routes
  const shouldHide = [
    '/admin',
    '/subadmin',
    '/manager',
    '/vendor',
    '/driver',
  ].some((route) => pathname?.startsWith(route));

  if (shouldHide) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px]',
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More Menu Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsMoreOpen(!isMoreOpen);
            }}
            type="button"
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px]',
              isMoreOpen
                ? 'text-primary bg-primary/10'
                : 'text-gray-600 hover:text-primary hover:bg-gray-50'
            )}
          >
            {isMoreOpen ? (
              <X className={cn('w-5 h-5', isMoreOpen && 'scale-110')} />
            ) : (
              <Menu className={cn('w-5 h-5')} />
            )}
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Overlay */}
      {isMoreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* More Menu Panel */}
          <div className="fixed bottom-16 left-0 right-0 z-50 lg:hidden bg-white rounded-t-3xl shadow-2xl animate-slideUp">
            <div className="p-4">
              {/* Handle Bar */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4 px-2">
                More Options
              </h3>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Location Selector */}
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    // Small delay to let More menu close smoothly
                    setTimeout(() => setShowLocationPicker(true), 100);
                  }}
                  type="button"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    Location
                  </span>
                </button>

                {/* About */}
                <Link
                  href="/about"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Info className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    About Us
                  </span>
                </Link>

                {/* Contact */}
                <Link
                  href="/contact"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    Contact
                  </span>
                </Link>

                {/* Fleet */}
                <Link
                  href="/fleet"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Car className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    Our Fleet
                  </span>
                </Link>

                {/* Become Vendor */}
                <Link
                  href="/vendor"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    Be Vendor
                  </span>
                </Link>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-full py-3 text-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}


      {/* Location Picker - Hidden button that gets auto-clicked */}
      <div
        ref={locationButtonRef}
        className="fixed top-0 left-0 opacity-0 pointer-events-auto"
        style={{ zIndex: showLocationPicker ? 9999 : -1 }}
      >
        <MobileLocationButton />
      </div>

      {/* Spacer to prevent content from hiding behind bottom nav */}
      <div className="h-16 lg:hidden" />
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Phone, User, MapPin, ChevronDown, LogOut, Compass, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationSelector } from '@/components/LocationSelector';
import { MobileLocationButton } from '@/components/MobileLocationButton';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  image?: string;
}

interface Driver {
  id: string;
  name: string;
  email?: string;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for logged in customer or driver
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const customerData = localStorage.getItem('customer');
      if (token && customerData) {
        try { setCustomer(JSON.parse(customerData)); } catch {}
      }

      const driverToken = localStorage.getItem('driver-token');
      const driverData = localStorage.getItem('driver');
      if (driverToken && driverData) {
        try { setDriver(JSON.parse(driverData)); } catch {}
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    localStorage.removeItem('driver-token');
    localStorage.removeItem('driver');
    setCustomer(null);
    setDriver(null);
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    // { label: 'Fleet', href: '/fleet' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
      )}
    >
      {/* Top Bar */}
      <div className="bg-primary text-white py-2 hidden md:block">
        <div className="container-custom">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              {/* <a
                href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE}`}
                className="flex items-center gap-2 hover:text-primary-100 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{process.env.NEXT_PUBLIC_CONTACT_PHONE}</span>
              </a> */}
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>150+ Cities Across India</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <LocationSelector />
              <Link
                href="/vendor"
                className="hover:text-primary-100 transition-colors"
              >
                Become a Vendor
              </Link>
              <Link
                href="/travel-agents"
                className="hover:text-primary-100 transition-colors"
              >
                For Travel Agents
              </Link>
              {/* <Link
                href="/contact"
                className="hover:text-primary-100 transition-colors"
              >
                Help & Support
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/Logo-favicon.png"
              alt="TR"
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 border border-gray-200 rounded-md"
            />
            <div className="flex flex-col">
              <Image
                src="/assets/logo-trans.png"
                alt="TransRentals"
                width={140}
                height={28}
                className="h-5 md:h-7 w-auto"
                priority
              />
              <span className="text-xs text-gray-500 hidden md:block">
                Vehicle Rental Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-md text-gray-700 font-medium transition-colors',
                  pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'hover:text-primary hover:bg-primary/5'
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* ✅ Services as normal link (no dropdown) */}
            <Link
              href="/services"
              className={cn(
                'px-4 py-2 rounded-md text-gray-700 font-medium transition-colors',
                pathname === '/services'
                  ? 'text-primary bg-primary/10'
                  : 'hover:text-primary hover:bg-primary/5'
              )}
            >
              Services
            </Link>

            {/* Tours / Wander */}
            <Link
              href="/wander"
              className={cn(
                'px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5',
                pathname?.startsWith('/wander')
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/60'
              )}
            >
              <Compass className="w-4 h-4" />
              Tours
            </Link>

            {/* Travel Agents landing */}
            <Link
              href="/travel-agents"
              className={cn(
                'px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5',
                pathname === '/travel-agents'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-700 hover:text-emerald-700 hover:bg-emerald-50/60'
              )}
            >
              <Plane className="w-4 h-4" />
              For Travel Agents
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {(customer || driver) ? (
              // Logged in user menu (customer or driver)
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {(customer?.name || driver?.name)?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {(customer?.name || driver?.name)?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-gray-500 transition-transform',
                      isUserMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-900 truncate">
                        {customer?.name || driver?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {customer?.email || driver?.email || (driver ? 'Driver Account' : '')}
                      </p>
                    </div>
                    <Link
                      href={driver ? '/driver/dashboard' : '/customer/dashboard'}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      My Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Not logged in - show login/signup
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex"
                  asChild
                >
                  <Link href="/customer/login">
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                </Button>

                <Button size="sm" className="hidden md:flex" asChild>
                  <Link href="/customer/login">Sign Up</Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Location Bar - Below Logo */}
        <div className="lg:hidden border-t border-gray-100 py-2">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">Select Location:</span>
            </div>
            <MobileLocationButton />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg animate-slideDown">
          <div className="container-custom py-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-md text-gray-700 font-medium transition-colors',
                    pathname === link.href
                      ? 'text-primary bg-primary/10'
                      : 'hover:text-primary hover:bg-primary/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* Services Link in Mobile (already just a link) */}
              <Link
                href="/services"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-md text-gray-700 font-medium transition-colors flex items-center justify-between',
                  pathname === '/services'
                    ? 'text-primary bg-primary/10'
                    : 'hover:text-primary hover:bg-primary/5'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">🚗</span>
                  Services
                </span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </Link>

              {/* Tours / Wander - Mobile */}
              <Link
                href="/wander"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-between',
                  pathname?.startsWith('/wander')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                )}
              >
                <span className="flex items-center gap-2">
                  <Compass className="w-5 h-5" />
                  Tours
                </span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </Link>

              {/* Travel Agents landing - Mobile */}
              <Link
                href="/travel-agents"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-between',
                  pathname === '/travel-agents'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-gray-700 hover:text-emerald-700 hover:bg-emerald-50'
                )}
              >
                <span className="flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  For Travel Agents
                </span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </Link>

              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200">
                {(customer || driver) ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {(customer?.name || driver?.name)?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer?.name || driver?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer?.email || driver?.email || (driver ? 'Driver Account' : '')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link
                        href={driver ? '/driver/dashboard' : '/customer/dashboard'}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link
                        href="/customer/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link
                        href="/customer/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Menu, X, Home, FileText, MapPin, Briefcase, LogOut, Users, Store, MessageSquare, Headphones, TrendingUp, Building2, IndianRupee, Navigation, Plane, Mail } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/toast';

const SIDEBAR_LINKS = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: Home },
  { href: '/manager/tracking', label: 'Live Tracking', icon: Navigation },
  { href: '/manager/b2b', label: 'B2B Bookings', icon: Briefcase },
  { href: '/manager/b2b-companies', label: 'B2B Companies', icon: Building2 },
  { href: '/manager/inquiries', label: 'My Inquiries', icon: FileText },
  { href: '/manager/contact-inquiries', label: 'Contact Inquiries', icon: Mail },
  { href: '/manager/bookings', label: 'My Bookings', icon: Briefcase },
  { href: '/manager/vendors', label: 'Vendors', icon: Store },
  { href: '/manager/drivers', label: 'Drivers', icon: Users },
  { href: '/manager/travel-agents', label: 'Travel Agents', icon: Plane },
  { href: '/manager/vendor-performance', label: 'Performance', icon: TrendingUp },
  { href: '/manager/chats', label: 'Chats', icon: MessageSquare },
  { href: '/manager/locations', label: 'My Locations', icon: MapPin },
  { href: '/manager/city-pricing', label: 'City Pricing', icon: IndianRupee },
  { href: '/manager/helpdesk', label: 'Helpdesk', icon: Headphones },
];

function ManagerSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: session } = useSession();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-green-600 to-teal-700 text-white z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm truncate">Manager Panel</h2>
                  <p className="text-xs text-green-200 truncate">TransRentals</p>
                </div>
              </div>
              <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-lg flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {SIDEBAR_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition"
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-green-500">
            <div className="mb-3 px-4">
              <p className="font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-green-200 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/manager/login' })}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-white/10 transition text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function ManagerLayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/manager/login');
    return null;
  }

  // Check if user has MANAGER role
  if (session?.user?.role !== 'MANAGER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Users className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
          <Link href="/" className="text-green-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-64">
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ManagerLayoutContent>{children}</ManagerLayoutContent>
      </ToastProvider>
    </SessionProvider>
  );
}

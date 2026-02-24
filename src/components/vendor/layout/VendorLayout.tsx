'use client';

import React, { useState, useEffect } from 'react';
import { VendorSidebar } from './VendorSidebar';
import { Menu, Loader2, AlertTriangle, Bell } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/toast';
import { useVendorWebNotifications } from '@/hooks/useVendorWebNotifications';

interface VendorLayoutProps {
  children: React.ReactNode;
}

// Pages that non-approved vendors can access
const allowedPagesForPending = [
  '/vendor/dashboard',
  '/vendor/documents',
  '/vendor/profile',
  '/vendor/bank-details',
  '/vendor/notifications',
  '/vendor/notification-settings',
  '/vendor/support',
  '/vendor/settings',
  '/vendor/services/request',
  '/vendor/locations/request',
  '/vendor/services',
  '/vendor/locations',
  '/vendor/media',
];

export function VendorLayout({ children }: VendorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [approvedServiceIds, setApprovedServiceIds] = useState<string[]>([]);
  const [approvedServiceSlugs, setApprovedServiceSlugs] = useState<string[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Browser push notifications via Notification API (polling-based)
  useVendorWebNotifications();

  // Poll unread notification count
  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/vendor/notifications/unread-count', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [status]);


  // Fetch fresh vendor status from database
  useEffect(() => {
    const fetchVendorStatus = async () => {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/vendor/profile');
          if (res.ok) {
            const data = await res.json();
            setVendorStatus(data.status);
            setApprovedServiceIds(data.approvedServiceIds || []);
            setApprovedServiceSlugs(data.approvedServiceSlugs || []);
          } else {
            // Fallback to session status
            setVendorStatus((session?.user as any)?.status);
          }
        } catch (error) {
          // Fallback to session status
          setVendorStatus((session?.user as any)?.status);
        } finally {
          setStatusLoading(false);
        }
      }
    };

    fetchVendorStatus();
  }, [status, session]);

  const isApproved = vendorStatus === 'APPROVED';

  // Check if current page is allowed for non-approved vendors
  useEffect(() => {
    if (status === 'authenticated' && !statusLoading && !isApproved && pathname) {
      const isAllowed = allowedPagesForPending.some(
        (page) => pathname === page || pathname.startsWith(page + '/')
      );

      if (!isAllowed) {
        setShowAccessDenied(true);
        // Redirect after showing message briefly
        const timer = setTimeout(() => {
          router.push('/vendor/dashboard');
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setShowAccessDenied(false);
      }
    }
  }, [pathname, isApproved, status, statusLoading, router]);

  // Show loading state
  if (status === 'loading' || (status === 'authenticated' && statusLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/vendor/login');
    return null;
  }

  // Show access denied message
  if (showAccessDenied) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          vendorStatus={vendorStatus ?? undefined}
          approvedServiceIds={approvedServiceIds}
          approvedServiceSlugs={approvedServiceSlugs}
        />
        <div className="lg:pl-64">
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600 mb-4">
                This feature is only available for approved vendors. Please complete your document verification first.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <VendorSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          vendorStatus={vendorStatus ?? undefined}
          approvedServiceIds={approvedServiceIds}
          approvedServiceSlugs={approvedServiceSlugs}
        />

        <div className="lg:pl-64">
          {/* Top bar with menu and notification bell */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div className="lg:hidden flex-1" />
            <Link
              href="/vendor/notifications"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Bell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>

          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Home,
  MessageCircle,
  RefreshCw,
  LogOut,
  Menu,
  X,
  User,
  ArrowLeft,
} from 'lucide-react';

interface CustomerHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface ChatBooking {
  vendor_id: number;
  vendor_name: string;
  booking_id: number;
  service_name?: string;
  last_message?: string;
  unread_count?: number;
}

export default function CustomerHeader({
  showBackButton = false,
  backHref = '/customer/dashboard',
  title,
  onRefresh,
  isRefreshing = false,
}: CustomerHeaderProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [chatBookings, setChatBookings] = useState<ChatBooking[]>([]);
  const [totalUnreadChats, setTotalUnreadChats] = useState(0);

  useEffect(() => {
    const customerData = localStorage.getItem('customer');
    if (customerData) {
      try {
        const parsed = JSON.parse(customerData);
        setCustomer(parsed);
        // Fetch live chats after getting customer data
        if (parsed?.phone || parsed?.email) {
          fetchLiveChats(parsed.phone || parsed.email);
        }
      } catch (e) {
        console.error('Failed to parse customer data:', e);
      }
    }
  }, []);

  const fetchLiveChats = async (identifier: string) => {
    try {
      // Use local API route (Prisma/trans_cms database)
      const response = await fetch(`/api/customer/chat/live-chats?identifier=${encodeURIComponent(identifier)}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setChatBookings(data);
          const totalUnread = data.reduce((sum: number, chat: any) => sum + (chat.unread_count || 0), 0);
          setTotalUnreadChats(totalUnread);
        }
      }
    } catch (err) {
      console.error('Failed to fetch live chats:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    router.push('/customer/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Logo with Back Button */}
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Link
                href={backHref}
                className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 text-white hover:opacity-90 transition group"
            >
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                <Image
                  src="/assets/Logo-favicon.png"
                  alt="TransRentals"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <span className="font-bold text-lg hidden sm:block">TransRentals</span>
            </Link>
            {title && (
              <div className="hidden md:block ml-4 pl-4 border-l border-white/20">
                <p className="text-white font-semibold text-sm">{title}</p>
              </div>
            )}
          </div>

          {/* Center: User Info (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              {customer?.image ? (
                <img
                  src={customer.image}
                  alt={customer?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-white">
                  {customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="text-white">
              <p className="text-purple-300 text-xs">{getGreeting()}</p>
              <p className="font-semibold text-sm">{customer?.name || 'Customer'}</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Home Link */}
            <Link
              href="/"
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition hidden sm:flex items-center gap-2"
              title="Go to Homepage"
            >
              <Home className="h-5 w-5" />
              <span className="text-sm font-medium hidden lg:inline">Home</span>
            </Link>

            {/* Dashboard Link */}
            {showBackButton && (
              <Link
                href="/customer/dashboard"
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition hidden sm:flex items-center gap-2"
                title="Dashboard"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium hidden lg:inline">Dashboard</span>
              </Link>
            )}

            {/* Chat Icon with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowChatDropdown(!showChatDropdown)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition relative"
                title="Messages"
              >
                <MessageCircle className="h-5 w-5" />
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {totalUnreadChats > 9 ? '9+' : totalUnreadChats}
                  </span>
                )}
              </button>

              {/* Chat Dropdown */}
              {showChatDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowChatDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                      <h3 className="font-semibold text-gray-900">Vendor Messages</h3>
                      <p className="text-xs text-gray-500">Chat with vendors about your bookings</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {chatBookings.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <MessageCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No active chats</p>
                          <p className="text-xs text-gray-400">Messages from vendors will appear here</p>
                        </div>
                      ) : (
                        chatBookings.map((chat) => (
                          <Link
                            key={`chat-${chat.vendor_id}-${chat.booking_id}`}
                            href={`/customer/booking/${chat.booking_id}`}
                            onClick={() => setShowChatDropdown(false)}
                            className="flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b border-gray-50"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {chat.vendor_name}
                                </p>
                                {(chat.unread_count || 0) > 0 && (
                                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                                    {chat.unread_count}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{chat.last_message}</p>
                              <p className="text-xs text-purple-600 mt-0.5">
                                Booking #{chat.booking_id} • {chat.service_name}
                              </p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Refresh */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-200 hover:text-white transition hidden sm:block"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition sm:hidden"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="sm:hidden pb-4 border-t border-white/10 mt-2 pt-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                {customer?.image ? (
                  <img
                    src={customer.image}
                    alt={customer?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="text-white">
                <p className="font-semibold">{customer?.name || 'Customer'}</p>
                <p className="text-purple-300 text-sm">{customer?.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/"
                className="flex flex-col items-center gap-1 p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
              >
                <Home className="h-5 w-5" />
                <span className="text-xs">Home</span>
              </Link>
              <Link
                href="/customer/dashboard"
                className="flex flex-col items-center gap-1 p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 p-3 bg-red-500/20 rounded-xl text-red-200 hover:bg-red-500/30 transition"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-xs">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

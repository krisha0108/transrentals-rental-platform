'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  MessageCircle,
  LogOut,
  Menu,
  X,
  User,
  ArrowLeft,
  HelpCircle,
  BarChart3,
  Home,
  ChevronDown,
  Bell,
} from 'lucide-react';

interface CustomerHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface ChatBooking {
  vendor_id: string | number;
  vendor_name: string;
  booking_id: string | number;
  service_name?: string;
  last_message?: string;
  unread_count?: number;
  conversation_id?: string;
  participant_type?: string;
}

export default function CustomerHeader({
  showBackButton = false,
  backHref = '/customer/dashboard',
  title,
  onRefresh,
  isRefreshing = false,
}: CustomerHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState<any>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [chatBookings, setChatBookings] = useState<ChatBooking[]>([]);
  const [totalUnreadChats, setTotalUnreadChats] = useState(0);

  useEffect(() => {
    const customerData = localStorage.getItem('customer');
    if (customerData) {
      try {
        const parsed = JSON.parse(customerData);
        setCustomer(parsed);
        if (parsed?.phone || parsed?.email) {
          fetchLiveChats(parsed.phone || parsed.email);
        }
      } catch (e) {}
    }
  }, []);

  const fetchLiveChats = async (identifier: string) => {
    try {
      const response = await fetch(`/api/customer/chat/live-chats?identifier=${encodeURIComponent(identifier)}`, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setChatBookings(data);
          setTotalUnreadChats(data.reduce((s: number, c: any) => s + (c.unread_count || 0), 0));
        }
      }
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    router.push('/customer/login');
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  const navLinks = [
    { href: '/customer/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/customer/chat', label: 'Messages', icon: MessageCircle },
    { href: '/customer/financials', label: 'Financials', icon: BarChart3 },
    { href: '/customer/helpdesk', label: 'Helpdesk', icon: HelpCircle },
    { href: '/', label: 'Browse Services', icon: Home },
  ];

  const isActive = (href: string) => pathname === href;

  const initial = customer?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* LEFT: Logo + back */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {showBackButton && (
              <Link
                href={backHref}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:border-[#09B368] hover:text-[#09B368] transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
                <Image src="/assets/Logo-favicon.png" alt="TransRentals" fill className="object-contain" />
              </div>
              <div className="relative h-9 w-36 flex-shrink-0 hidden sm:block">
                <Image src="/assets/logo-trans.png" alt="TransRentals" fill className="object-contain object-left" />
              </div>
            </Link>
            {title && (
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-200 ml-1">
                <span className="text-gray-300">›</span>
                <span className="text-gray-600 text-sm font-medium">{title}</span>
              </div>
            )}
          </div>

          {/* CENTER: Nav links */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(link.href)
                    ? 'bg-[#09B368]/10 text-[#09B368]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT: Actions + User */}
          <div className="flex items-center gap-1.5">

            {/* Messages */}
            <div className="relative">
              <button
                onClick={() => { setShowChatDropdown(!showChatDropdown); setShowUserDropdown(false); }}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                title="Messages"
              >
                <MessageCircle className="h-5 w-5" />
                {totalUnreadChats > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#09B368] rounded-full border-2 border-white" />
                )}
              </button>

              {showChatDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowChatDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Messages</p>
                        <p className="text-xs text-gray-400 mt-0.5">Vendor & driver chats</p>
                      </div>
                      {totalUnreadChats > 0 && (
                        <span className="bg-[#09B368] text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                          {totalUnreadChats}
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {chatBookings.length === 0 ? (
                        <div className="p-8 text-center">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                          <p className="text-sm text-gray-500">No messages yet</p>
                        </div>
                      ) : (
                        chatBookings.map((chat) => {
                          const isDriver = chat.participant_type === 'driver' || chat.participant_type === 'staff_driver';
                          const mode = isDriver ? 'driver' : 'vendor';
                          const chatHref = `/customer/chat?mode=${mode}&conv=${chat.conversation_id}`;
                          return (
                          <Link
                            key={`${chat.vendor_id}-${chat.booking_id}-${chat.conversation_id}`}
                            href={chatHref}
                            onClick={() => setShowChatDropdown(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                          >
                            <div className="w-8 h-8 bg-[#09B368]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <User className="h-4 w-4 text-[#09B368]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-gray-900 text-sm truncate">{chat.vendor_name}</p>
                                {(chat.unread_count || 0) > 0 && (
                                  <span className="bg-[#09B368] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0">
                                    {chat.unread_count}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDriver ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {isDriver ? 'Driver' : 'Vendor'}
                                </span>
                                <p className="text-xs text-gray-400 truncate">{chat.last_message || 'Tap to view'}</p>
                              </div>
                            </div>
                          </Link>
                          );
                        })
                      )}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2.5">
                      <Link href="/customer/chat" onClick={() => setShowChatDropdown(false)} className="text-xs font-semibold text-[#09B368] hover:underline">
                        View all messages →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            {/* User Avatar Dropdown */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => { setShowUserDropdown(!showUserDropdown); setShowChatDropdown(false); }}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#09B368] flex items-center justify-center flex-shrink-0 shadow-sm">
                  {customer?.image ? (
                    <img src={customer.image} alt={customer?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">{initial}</span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{customer?.name || 'Account'}</p>
                  <p className="text-xs text-gray-400">{getGreeting()}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden lg:block" />
              </button>

              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm">{customer?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{customer?.email || customer?.phone}</p>
                    </div>
                    <Link href="/customer/dashboard" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <BarChart3 className="h-4 w-4 text-gray-400" /> Dashboard
                    </Link>
                    <Link href="/customer/chat" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <MessageCircle className="h-4 w-4 text-gray-400" /> Messages
                    </Link>
                    <Link href="/customer/financials" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <BarChart3 className="h-4 w-4 text-gray-400" /> Financials
                    </Link>
                    <Link href="/customer/helpdesk" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                      <HelpCircle className="h-4 w-4 text-gray-400" /> Helpdesk
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full text-left"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:bg-gray-100 transition lg:hidden"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-[#09B368]/10 text-[#09B368]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[#09B368] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{customer?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{customer?.phone}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

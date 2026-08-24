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
  ArrowRight,
  HelpCircle,
  BarChart3,
  Home,
  ChevronDown,
  ChevronRight,
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

/**
 * Per-destination accent for the mobile drawer, keyed by href so navLinks
 * itself stays untouched. The five hues are the same family the dashboard's
 * account band uses: green, teal, sky and amber.
 */
const DRAWER_ACCENTS: Record<string, { text: string; tile: string; tileHover: string }> = {
  '/customer/dashboard': { text: 'text-[#056B3E]', tile: 'bg-[#EAF8F1] text-[#0E8552]', tileHover: 'group-hover:bg-[#D3F0E2]' },
  '/customer/chat': { text: 'text-[#0B7C74]', tile: 'bg-[#F0FDFA] text-[#0B7C74]', tileHover: 'group-hover:bg-[#DCF5F1]' },
  '/customer/financials': { text: 'text-[#056B3E]', tile: 'bg-[#EAF8F1] text-[#0E8552]', tileHover: 'group-hover:bg-[#D3F0E2]' },
  '/customer/helpdesk': { text: 'text-[#0369A1]', tile: 'bg-[#F0F9FF] text-[#0369A1]', tileHover: 'group-hover:bg-[#DDF0FE]' },
  '/': { text: 'text-[#B4700F]', tile: 'bg-[#FEF8EA] text-[#B4700F]', tileHover: 'group-hover:bg-[#FDF0D5]' },
};

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
                  {/* Teal — the same accent Messages carries in the dashboard's
                      Get in touch card, so the two read as one thing. */}
                  <div className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-[#BFE7E2] bg-white shadow-[0_20px_44px_-14px_rgba(4,48,44,.28)]">
                    <div className="flex items-end justify-between gap-3 border-b border-[#BFE7E2] bg-gradient-to-r from-[#E2F6F4] to-[#F6FCFB] px-4 py-3.5">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#0B7C74]">Conversations</p>
                        <p className="quote-serif mt-[3px] text-[21px] font-semibold leading-none text-[#04302C]">Messages</p>
                      </div>
                      {totalUnreadChats > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0B7C74] px-1.5 text-[10px] font-bold text-white">
                          {totalUnreadChats}
                        </span>
                      )}
                    </div>
                    <div className="max-h-[280px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {chatBookings.length === 0 ? (
                        <div className="flex flex-col items-center px-4 py-9">
                          <MessageCircle className="mb-2.5 h-5 w-5 text-[#BFE7E2]" />
                          <p className="text-[13px] font-semibold text-[#78857C]">No messages yet</p>
                          <p className="mt-1 text-[11.5px] text-[#A6B1AA]">Your vendor and driver chats land here.</p>
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
                            className="group relative flex items-start gap-3 overflow-hidden border-b border-[#EDF3F2] px-4 py-3 text-[#0B7C74] transition last:border-b-0 after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100"
                          >
                            <span className="mt-0.5 grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] border border-[#CCEDE9] bg-[#F0FDFA] text-[#0B7C74] transition group-hover:bg-[#DCF5F1]">
                              <User className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-[13px] font-semibold text-[#0B1610]">{chat.vendor_name}</span>
                                {(chat.unread_count || 0) > 0 && (
                                  <span className="flex h-[17px] min-w-[17px] flex-shrink-0 items-center justify-center rounded-full bg-[#0B7C74] px-1 text-[9.5px] font-bold text-white">
                                    {chat.unread_count}
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 flex items-center gap-1.5">
                                <span className={`rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.06em] ${isDriver ? 'bg-[#EAF8F1] text-[#056B3E]' : 'bg-[#F0FDFA] text-[#0B7C74]'}`}>
                                  {isDriver ? 'Driver' : 'Vendor'}
                                </span>
                                <span className="truncate text-[11.5px] text-[#A6B1AA]">{chat.last_message || 'Tap to view'}</span>
                              </span>
                            </span>
                          </Link>
                          );
                        })
                      )}
                    </div>
                    <div className="border-t border-[#E7EEE9] px-4 py-2.5">
                      <Link href="/customer/chat" onClick={() => setShowChatDropdown(false)} className="group inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0B7C74] transition hover:text-[#04302C]">
                        View all messages
                        <ArrowRight className="h-3 w-3 transition group-hover:translate-x-[3px]" />
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
                    <Image src={customer.image} alt={customer?.name || ''} width={32} height={32} className="object-cover" />
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
                  {/* Green — the identity accent, matching the dashboard's
                      Your profile card. Same four links, same sign-out. */}
                  <div className="absolute right-0 top-full z-50 mt-2 w-[272px] overflow-hidden rounded-2xl border border-[#C6E7D8] bg-white shadow-[0_20px_44px_-14px_rgba(4,50,31,.28)]">
                    <div className="flex items-center gap-3 border-b border-[#C6E7D8] bg-gradient-to-r from-[#E4F6EE] to-[#F7FCFA] px-4 py-3.5">
                      <span className="relative flex-none">
                        <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#09B368] to-[#056040] text-white">
                          {customer?.image ? (
                            <Image src={customer.image} alt={customer?.name || ''} width={44} height={44} className="h-full w-full object-cover" />
                          ) : (
                            <span className="quote-serif text-[21px] font-medium">{initial}</span>
                          )}
                        </span>
                        <span className="absolute -bottom-0.5 -right-0.5 z-20 h-[13px] w-[13px] rounded-full border-2 border-white bg-[#4ADE80]" />
                      </span>
                      <div className="min-w-0">
                        <p className="quote-serif truncate text-[20px] font-medium leading-none text-[#04321F]">{customer?.name}</p>
                        <p className="mt-1 truncate text-[11px] text-[#0E8552]">{customer?.email || customer?.phone}</p>
                      </div>
                    </div>

                    {/* Each row carries its accent as currentColor, so the icon
                        tile and the bar that wipes in on hover stay in step. */}
                    <div className="flex flex-col py-1">
                      <Link href="/customer/dashboard" onClick={() => setShowUserDropdown(false)} className="group relative flex items-center gap-3 overflow-hidden px-4 py-2.5 text-[#056B3E] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100">
                        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-[#EAF8F1] text-[#0E8552] transition group-hover:bg-[#D3F0E2]">
                          <BarChart3 className="h-[15px] w-[15px]" />
                        </span>
                        <span className="text-[13px] font-medium text-[#0B1610]">Dashboard</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                      </Link>
                      <Link href="/customer/chat" onClick={() => setShowUserDropdown(false)} className="group relative flex items-center gap-3 overflow-hidden px-4 py-2.5 text-[#0B7C74] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100">
                        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-[#F0FDFA] text-[#0B7C74] transition group-hover:bg-[#DCF5F1]">
                          <MessageCircle className="h-[15px] w-[15px]" />
                        </span>
                        <span className="text-[13px] font-medium text-[#0B1610]">Messages</span>
                        {totalUnreadChats > 0 && (
                          <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#0B7C74] px-1 text-[9.5px] font-bold text-white">{totalUnreadChats}</span>
                        )}
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                      </Link>
                      <Link href="/customer/financials" onClick={() => setShowUserDropdown(false)} className="group relative flex items-center gap-3 overflow-hidden px-4 py-2.5 text-[#056B3E] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100">
                        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-[#EAF8F1] text-[#0E8552] transition group-hover:bg-[#D3F0E2]">
                          <BarChart3 className="h-[15px] w-[15px]" />
                        </span>
                        <span className="text-[13px] font-medium text-[#0B1610]">Financials</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                      </Link>
                      <Link href="/customer/helpdesk" onClick={() => setShowUserDropdown(false)} className="group relative flex items-center gap-3 overflow-hidden px-4 py-2.5 text-[#0369A1] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100">
                        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-[#F0F9FF] text-[#0369A1] transition group-hover:bg-[#DDF0FE]">
                          <HelpCircle className="h-[15px] w-[15px]" />
                        </span>
                        <span className="text-[13px] font-medium text-[#0B1610]">Helpdesk</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                      </Link>
                    </div>

                    <div className="border-t border-[#E7EEE9]">
                      <button
                        onClick={handleLogout}
                        className="group relative flex w-full items-center gap-3 overflow-hidden px-4 py-3 text-left text-[#DC2626] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#FEF2F2] hover:after:scale-y-100"
                      >
                        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-[#FEF2F2] text-[#DC2626] transition group-hover:bg-[#FEE2E2]">
                          <LogOut className="h-[15px] w-[15px]" />
                        </span>
                        <span className="text-[13px] font-semibold text-[#DC2626]">Sign out</span>
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

      {/* Mobile Drawer — same language as the two dropdowns: a green identity
          band on top, rows with tinted icon tiles and an accent bar that wipes
          in, and sign-out separated at the bottom. Same links, same handlers. */}
      {showMobileMenu && (
        <div className="border-t border-[#C6E7D8] bg-white lg:hidden">
          <div className="flex items-center gap-3 border-b border-[#C6E7D8] bg-gradient-to-r from-[#E4F6EE] to-[#F7FCFA] px-4 py-3.5">
            <span className="relative flex-none">
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#09B368] to-[#056040] text-white">
                {customer?.image ? (
                  <Image src={customer.image} alt={customer?.name || ''} width={44} height={44} className="h-full w-full object-cover" />
                ) : (
                  <span className="quote-serif text-[21px] font-medium">{initial}</span>
                )}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 z-20 h-[13px] w-[13px] rounded-full border-2 border-white bg-[#4ADE80]" />
            </span>
            <div className="min-w-0">
              <p className="quote-serif truncate text-[20px] font-medium leading-none text-[#04321F]">{customer?.name}</p>
              <p className="mt-1 truncate text-[11px] text-[#0E8552]">{customer?.email || customer?.phone}</p>
            </div>
          </div>

          <div className="flex flex-col py-1">
            {navLinks.map((link) => {
              const a = DRAWER_ACCENTS[link.href] || DRAWER_ACCENTS['/customer/dashboard'];
              const on = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  // The active row simply holds the hover state open, so there is
                  // one visual idea here rather than two.
                  className={`group relative flex items-center gap-3 overflow-hidden px-4 py-3 transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:bg-current after:transition-transform after:duration-200 hover:bg-[#F4F8F5] hover:after:scale-y-100 ${a.text} ${
                    on ? 'bg-[#F4F8F5] after:scale-y-100' : 'after:scale-y-0'
                  }`}
                >
                  <span className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] transition ${a.tile} ${a.tileHover}`}>
                    <link.icon className="h-[15px] w-[15px]" />
                  </span>
                  <span className={`text-[13.5px] ${on ? 'font-semibold' : 'font-medium text-[#0B1610]'}`}>{link.label}</span>
                  {link.href === '/customer/chat' && totalUnreadChats > 0 && (
                    <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#0B7C74] px-1 text-[9.5px] font-bold text-white">
                      {totalUnreadChats}
                    </span>
                  )}
                  <ChevronRight className="ml-auto h-4 w-4 text-[#D4DFD8] transition group-hover:translate-x-[3px] group-hover:text-[#09B368]" />
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[#E7EEE9]">
            <button
              onClick={handleLogout}
              className="group relative flex w-full items-center gap-3 overflow-hidden px-4 py-3.5 text-left text-[#DC2626] transition after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:origin-center after:scale-y-0 after:bg-current after:transition-transform after:duration-200 hover:bg-[#FEF2F2] hover:after:scale-y-100"
            >
              <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] bg-[#FEF2F2] text-[#DC2626] transition group-hover:bg-[#FEE2E2]">
                <LogOut className="h-[15px] w-[15px]" />
              </span>
              <span className="text-[13.5px] font-semibold text-[#DC2626]">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

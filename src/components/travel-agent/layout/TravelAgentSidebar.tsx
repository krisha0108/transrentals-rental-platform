'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Target,
  Calendar,
  Plus,
  Compass,
  Building2,
  BookOpen,
  FileText,
  Bell,
  HelpCircle,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  User,
  DollarSign,
  Image as ImageIcon,
  Link2,
  Inbox,
  Wallet,
  Settings,
  Sparkles,
  Car,
  MessageSquare,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';

interface TravelAgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  agentStatus?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
  requiresApproval?: boolean;
}

// Approved travel agent — full menu
const approvedNavigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/travel-agent/dashboard', icon: LayoutDashboard },
  { name: 'Customer Chats', href: '/travel-agent/chats', icon: MessageSquare },
  {
    name: 'Lead Management',
    href: '/travel-agent/leads',
    icon: Target,
    children: [
      { name: 'All Leads', href: '/travel-agent/leads', icon: Users },
      { name: 'Tour Quote Requests', href: '/travel-agent/leads?source=WEBSITE', icon: DollarSign },
      { name: 'Add Lead', href: '/travel-agent/leads/add', icon: Plus },
      { name: 'Pipeline', href: '/travel-agent/pipeline', icon: Inbox },
      { name: 'Follow-Ups', href: '/travel-agent/follow-ups', icon: Calendar },
      { name: 'Capture Links', href: '/travel-agent/capture-links', icon: Link2 },
    ],
  },
  {
    name: 'Tours',
    href: '/travel-agent/tours',
    icon: Compass,
    children: [
      { name: 'My Tours', href: '/travel-agent/tours', icon: Compass },
      { name: 'Add Tour', href: '/travel-agent/tours?addMode=open', icon: Plus },
    ],
  },
  {
    name: 'Properties',
    href: '/travel-agent/properties',
    icon: Building2,
    children: [
      { name: 'My Properties', href: '/travel-agent/properties', icon: Building2 },
      { name: 'Add Property', href: '/travel-agent/properties/add', icon: Plus },
    ],
  },
  {
    name: 'Fleet Management',
    href: '/travel-agent/fleet',
    icon: Car,
    children: [
      { name: 'All Vehicles', href: '/travel-agent/fleet', icon: Car },
      { name: 'Calendar', href: '/travel-agent/fleet/calendar', icon: CalendarDays },
      { name: 'Insurance & Docs', href: '/travel-agent/fleet/insurance', icon: ShieldCheck },
      { name: 'Add Vehicle', href: '/travel-agent/fleet/add', icon: Plus },
    ],
  },
  {
    name: 'Bookings',
    href: '/travel-agent/bookings',
    icon: BookOpen,
    children: [
      { name: 'All Bookings', href: '/travel-agent/bookings', icon: BookOpen },
      { name: 'Add Booking', href: '/travel-agent/bookings/add', icon: Plus },
    ],
  },
  { name: 'Payments', href: '/travel-agent/payments', icon: Wallet },
  { name: 'Earnings', href: '/travel-agent/earnings', icon: DollarSign },
  {
    name: 'Notifications',
    href: '/travel-agent/notifications',
    icon: Bell,
  },
  { name: 'Get Started', href: '/travel-agent/get-started', icon: Sparkles },
];

// Pending — soft-access subset (own-management features stay open)
const pendingNavigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/travel-agent/dashboard', icon: LayoutDashboard },
  { name: 'Customer Chats', href: '/travel-agent/chats', icon: MessageSquare },
  {
    name: 'Lead Management',
    href: '/travel-agent/leads',
    icon: Target,
    children: [
      { name: 'All Leads', href: '/travel-agent/leads', icon: Users },
      { name: 'Add Lead', href: '/travel-agent/leads/add', icon: Plus },
      { name: 'Pipeline', href: '/travel-agent/pipeline', icon: Inbox },
      { name: 'Follow-Ups', href: '/travel-agent/follow-ups', icon: Calendar },
    ],
  },
  {
    name: 'Tours',
    href: '/travel-agent/tours',
    icon: Compass,
    children: [
      { name: 'My Tours', href: '/travel-agent/tours', icon: Compass },
      { name: 'Add Tour', href: '/travel-agent/tours?addMode=open', icon: Plus },
    ],
  },
  {
    name: 'Properties',
    href: '/travel-agent/properties',
    icon: Building2,
    children: [
      { name: 'My Properties', href: '/travel-agent/properties', icon: Building2 },
      { name: 'Add Property', href: '/travel-agent/properties/add', icon: Plus },
    ],
  },
  {
    name: 'Fleet Management',
    href: '/travel-agent/fleet',
    icon: Car,
    children: [
      { name: 'All Vehicles', href: '/travel-agent/fleet', icon: Car },
      { name: 'Calendar', href: '/travel-agent/fleet/calendar', icon: CalendarDays },
      { name: 'Insurance & Docs', href: '/travel-agent/fleet/insurance', icon: ShieldCheck },
      { name: 'Add Vehicle', href: '/travel-agent/fleet/add', icon: Plus },
    ],
  },
  {
    name: 'Bookings',
    href: '/travel-agent/bookings',
    icon: BookOpen,
    children: [
      { name: 'All Bookings', href: '/travel-agent/bookings', icon: BookOpen },
      { name: 'Add Booking', href: '/travel-agent/bookings/add', icon: Plus },
    ],
  },
  { name: 'Notifications', href: '/travel-agent/notifications', icon: Bell },
  { name: 'Help & Support', href: '/travel-agent/support', icon: HelpCircle },
];

const profileItems: NavItem[] = [
  { name: 'Agency Profile', href: '/travel-agent/profile', icon: Building2 },
  { name: 'Documents', href: '/travel-agent/documents', icon: FileText },
  { name: 'Bank Details', href: '/travel-agent/bank-details', icon: DollarSign },
];

export function TravelAgentSidebar({ isOpen, onClose, agentStatus }: TravelAgentSidebarProps) {
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [profileExpanded, setProfileExpanded] = useState(false);

  const isApproved = agentStatus === 'APPROVED';
  const navigationItems = isApproved ? approvedNavigationItems : pendingNavigationItems;

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem('travel_agent_profile_cache');
      // Also clear the shadow-customer JWT we issued on TA login so the next
      // user of this browser doesn't pick up a stale customer session.
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('customer');
    } catch {
      /* ignore */
    }
    await signOut({ callbackUrl: '/travel-agent/login' });
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + '/'),
      );
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const isProfileActive = (): boolean =>
    profileItems.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
    );

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isItemActive(item);
    const isExpanded = expandedSections.includes(item.name);

    if (hasChildren) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleSection(item.name)}
            className={cn(
              'flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-white border-l-4 border-emerald-500'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white',
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="ml-4 pl-4 border-l border-gray-700 space-y-1">
              {item.children!.map((child) => {
                const ChildIcon = child.icon;
                const isExact = pathname === child.href;
                const isPrefix = pathname.startsWith(child.href + '/');
                const hasBetterMatch = item.children!.some(
                  (sibling) =>
                    sibling.href !== child.href &&
                    (pathname === sibling.href || pathname.startsWith(sibling.href + '/')) &&
                    sibling.href.length > child.href.length,
                );
                const isChildActive = isExact || (isPrefix && !hasBetterMatch);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                      isChildActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                    )}
                  >
                    <ChildIcon className="w-4 h-4" />
                    <span>{child.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
          isActive
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white',
        )}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.name}</span>
        {item.badge && (
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const agentName = session?.user?.name || 'Travel Agent';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <NextImage
                src="/assets/Logo-favicon.png"
                alt="TransRentals"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div className="flex items-center gap-1.5">
                <NextImage
                  src="/assets/logo-white.png"
                  alt="TransRentals"
                  width={130}
                  height={32}
                  className="object-contain"
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {agentStatus && (
            <div className="px-4 py-3 border-b border-gray-800">
              <div
                className={cn(
                  'px-3 py-2 rounded-lg text-center text-sm font-medium',
                  agentStatus === 'APPROVED' && 'bg-green-900/50 text-green-400',
                  agentStatus === 'PENDING' && 'bg-yellow-900/50 text-yellow-400',
                  agentStatus === 'DOCUMENTS_PENDING' && 'bg-orange-900/50 text-orange-400',
                  agentStatus === 'UNDER_REVIEW' && 'bg-blue-900/50 text-blue-400',
                  agentStatus === 'REJECTED' && 'bg-red-900/50 text-red-400',
                  agentStatus === 'SUSPENDED' && 'bg-red-900/50 text-red-400',
                )}
              >
                Status: {agentStatus.replace(/_/g, ' ')}
              </div>
            </div>
          )}

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto sidebar-scroll">
            {navigationItems.map((item) => renderNavItem(item))}
          </nav>

          <div className="border-t border-gray-800">
            <div className="p-4">
              <button
                onClick={() => setProfileExpanded(!profileExpanded)}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors',
                  isProfileActive()
                    ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm truncate max-w-[120px]">{agentName}</p>
                    <p className="text-xs text-gray-400">Profile & Settings</p>
                  </div>
                </div>
                {profileExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {profileExpanded && (
                <div className="mt-2 ml-4 pl-4 border-l border-gray-700 space-y-1">
                  {profileItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                          isActive
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

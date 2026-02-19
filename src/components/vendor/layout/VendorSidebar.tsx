'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FileText,
  MapPin,
  Link2,
  BookOpen,
  Layers,
  Car,
  DollarSign,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Bell,
  HelpCircle,
  CalendarCheck,
  Wallet,
  BarChart3,
  Star,
  Bike,
  Package,
  Inbox,
  Radio,
  Bus,
  FileSpreadsheet,
  Send,
  Truck,
  Wrench,
  Cog,
  Container,
  Users,
  Clock,
  CreditCard,
  Fuel,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  UserCircle,
  Target,
  FileSignature,
  Receipt,
  PieChart,
  MessageSquare,
  ScrollText,
  Calendar,
  Shield,
  Route,
  Zap,
  ClipboardCheck,
  Navigation,
  GraduationCap,
  Tag,
  Smile,
  History,
  User,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';

interface VendorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  vendorStatus?: string;
  approvedServiceIds?: string[];
  approvedServiceSlugs?: string[]; // kept for backward compatibility
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
  requiresApproval?: boolean;
  serviceId?: string; // Maps to approved service ID (stable, doesn't change with slug)
}

// Navigation items for APPROVED vendors
// Each service-specific menu item uses serviceId which is stable
// (doesn't change when admin updates service slug)
const approvedNavigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/vendor/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Customer Chats',
    href: '/vendor/chat',
    icon: MessageSquare,
  },
  {
    name: 'Booking Links',
    href: '/vendor/booking-links',
    icon: Link2,
  },
  {
    name: 'Direct Bookings',
    href: '/vendor/direct-bookings',
    icon: BookOpen,
  },
  {
    name: 'Bike Rentals',
    href: '/vendor/bike-rentals',
    icon: Bike,
    serviceId: 'SVC_1', // Bike Rental
    children: [
      { name: 'Quote Requests', href: '/vendor/bike-rentals/requests', icon: Inbox },
      { name: 'My Quotes', href: '/vendor/bike-rentals/quotes', icon: Send },
      { name: 'Bookings', href: '/vendor/bike-rentals/bookings', icon: CalendarCheck },
      { name: 'Direct Requests', href: '/vendor/bike-rentals/bookings/direct', icon: Inbox },
      { name: 'Open Requests', href: '/vendor/bike-rentals/bookings/open', icon: Radio },
      { name: 'Earnings', href: '/vendor/bike-rentals/earnings', icon: Wallet },
      { name: 'Templates', href: '/vendor/bike/templates', icon: FileSpreadsheet },
    ],
  },
  {
    name: 'Self-Drive Cars',
    href: '/vendor/self-drive',
    icon: Car,
    serviceId: 'SVC_2', // Self Drive Car Rental
    children: [
      { name: 'Quote Requests', href: '/vendor/self-drive/requests', icon: Inbox },
      { name: 'My Quotes', href: '/vendor/self-drive/quotes', icon: Send },
      { name: 'Bookings', href: '/vendor/self-drive/bookings', icon: CalendarCheck },
      { name: 'Direct Requests', href: '/vendor/self-drive/bookings/direct', icon: Inbox },
      { name: 'Open Requests', href: '/vendor/self-drive/bookings/open', icon: Radio },
      { name: 'Earnings', href: '/vendor/self-drive/earnings', icon: Wallet },
      { name: 'Templates', href: '/vendor/self-drive/templates', icon: FileSpreadsheet },
    ],
  },
  {
    name: 'Car Rental',
    href: '/vendor/car-rental',
    icon: Car,
    serviceId: 'SVC_5', // Car Rental (Chauffeur)
    children: [
      { name: 'Bookings', href: '/vendor/car-rental/bookings', icon: CalendarCheck },
      { name: 'Earnings', href: '/vendor/car-rental/earnings', icon: Wallet },
    ],
  },
  {
    name: 'Luxury Cars',
    href: '/vendor/luxury',
    icon: Star,
    serviceId: 'SVC_8', // Luxury Car
    children: [
      { name: 'Bookings', href: '/vendor/luxury/bookings', icon: CalendarCheck },
      { name: 'Active Trips', href: '/vendor/luxury/bookings/active', icon: Radio },
      { name: 'Templates', href: '/vendor/luxury/templates', icon: FileText },
      { name: 'Earnings', href: '/vendor/luxury/earnings', icon: Wallet },
    ],
  },
  {
    name: 'Bus & Tempo',
    href: '/vendor/bus',
    icon: Bus,
    serviceId: 'SVC_3', // Bus Rental
    children: [
      { name: 'Quote Requests', href: '/vendor/bus/requests', icon: Inbox },
      { name: 'My Quotes', href: '/vendor/bus/quotes', icon: Send },
      { name: 'Bookings', href: '/vendor/bus/bookings', icon: CalendarCheck },
      { name: 'Templates', href: '/vendor/bus/templates', icon: FileSpreadsheet },
      { name: 'Earnings', href: '/vendor/bus/earnings', icon: Wallet },
    ],
  },
  {
    name: 'Packers & Movers',
    href: '/vendor/packers',
    icon: Package,
    serviceId: 'SVC_6', // Packers and Movers
    children: [
      { name: 'Quote Requests', href: '/vendor/packers/requests', icon: Inbox },
      { name: 'My Quotes', href: '/vendor/packers/quotes', icon: Send },
      { name: 'Bookings', href: '/vendor/packers/bookings', icon: CalendarCheck },
      { name: 'Templates', href: '/vendor/packers/templates', icon: FileSpreadsheet },
      { name: 'Earnings', href: '/vendor/packers/earnings', icon: Wallet },
    ],
  },
  {
    name: 'Transporter',
    href: '/vendor/transporter',
    icon: Truck,
    serviceId: 'SVC_4', // Truck Rental
    children: [
      { name: 'Quote Requests', href: '/vendor/transporter/requests', icon: Inbox },
      { name: 'My Quotes', href: '/vendor/transporter/quotes', icon: Send },
      { name: 'Bookings', href: '/vendor/transporter/bookings', icon: CalendarCheck },
      { name: 'Templates', href: '/vendor/transporter/templates', icon: FileSpreadsheet },
      { name: 'Earnings', href: '/vendor/transporter/earnings', icon: Wallet },
    ],
  },
  {
    name: 'Equipment Rental',
    href: '/vendor/equipment',
    icon: Wrench,
    serviceId: 'SVC_7', // Equipment Rental
    children: [
      { name: 'Quote Requests', href: '/vendor/equipment/requests', icon: Inbox },
      { name: 'My Quotes', href: '/vendor/equipment/quotes', icon: Send },
      { name: 'Bookings', href: '/vendor/equipment/bookings', icon: CalendarCheck },
      { name: 'Templates', href: '/vendor/equipment/templates', icon: FileSpreadsheet },
      { name: 'Earnings', href: '/vendor/equipment/earnings', icon: Wallet },
    ],
  },
  {
    name: 'Bookings',
    href: '/vendor/bookings',
    icon: CalendarCheck,
  },
  // {
  //   name: 'Earnings',
  //   href: '/vendor/earnings',
  //   icon: Wallet,
  // },
  {
    name: 'Fleet Management',
    href: '/vendor/fleet',
    icon: Car,
    children: [
      { name: 'All Vehicles', href: '/vendor/fleet', icon: Car },
      { name: 'Add Vehicle', href: '/vendor/fleet/add', icon: Plus },
      { name: 'Documents', href: '/vendor/fleet/documents', icon: FileText },
      { name: 'Service & Maintenance', href: '/vendor/fleet/service', icon: Wrench },
      { name: 'Incidents', href: '/vendor/fleet/incidents', icon: AlertTriangle },
      { name: 'Fuel Tracking', href: '/vendor/fleet/fuel', icon: Fuel },
      { name: 'Analytics', href: '/vendor/fleet/analytics', icon: TrendingUp },
    ],
  },
  {
    name: 'Staff Management',
    href: '/vendor/staff',
    icon: Users,
    children: [
      { name: 'All Staff', href: '/vendor/staff', icon: Users },
      { name: 'Add Employee', href: '/vendor/staff/add', icon: Plus },
      { name: 'Attendance', href: '/vendor/staff/attendance', icon: Clock },
      { name: 'Payroll', href: '/vendor/staff/payroll', icon: CreditCard },
    ],
  },
  // {
  //   name: 'P2P Marketplace',
  //   href: '/vendor/p2p',
  //   icon: ArrowRightLeft,
  //   children: [
  //     { name: 'Dashboard', href: '/vendor/p2p', icon: ArrowRightLeft },
  //     { name: 'Available Vehicles', href: '/vendor/p2p/vehicles', icon: Car },
  //     { name: 'Post Vehicle', href: '/vendor/p2p/vehicles/post', icon: Plus },
  //     { name: 'Available Bookings', href: '/vendor/p2p/bookings', icon: CalendarCheck },
  //     { name: 'Share Booking', href: '/vendor/p2p/bookings/post', icon: Send },
  //     { name: 'My Activity', href: '/vendor/p2p/activity', icon: History },
  //   ],
  // },
  // {
  //   name: 'Customer CRM',
  //   href: '/vendor/crm',
  //   icon: UserCircle,
  // },
  // {
  //   name: 'Leads',
  //   href: '/vendor/leads',
  //   icon: Target,
  // },
  // {
  //   name: 'Quotations',
  //   href: '/vendor/quotations',
  //   icon: FileSignature,
  //   children: [
  //     { name: 'All Quotations', href: '/vendor/quotations', icon: FileSignature },
  //     { name: 'Create Quote', href: '/vendor/quotations/create', icon: Plus },
  //   ],
  // },
  // {
  //   name: 'Invoices & Billing',
  //   href: '/vendor/invoices',
  //   icon: Receipt,
  //   children: [
  //     { name: 'All Invoices', href: '/vendor/invoices', icon: Receipt },
  //     { name: 'Create Invoice', href: '/vendor/invoices/create', icon: Plus },
  //   ],
  // },
  // {
  //   name: 'Expenses',
  //   href: '/vendor/expenses',
  //   icon: Wallet,
  // },
  // {
  //   name: 'Reports & Analytics',
  //   href: '/vendor/reports',
  //   icon: PieChart,
  // },
  // {
  //   name: 'Communication',
  //   href: '/vendor/communication',
  //   icon: MessageSquare,
  // },
  // {
  //   name: 'Contracts',
  //   href: '/vendor/contracts',
  //   icon: ScrollText,
  // },
  // {
  //   name: 'Calendar',
  //   href: '/vendor/calendar',
  //   icon: Calendar,
  // },
  // {
  //   name: 'Daily Checklist',
  //   href: '/vendor/checklist',
  //   icon: ClipboardCheck,
  // },
  // {
  //   name: 'Route Planner',
  //   href: '/vendor/routes',
  //   icon: Route,
  // },
  // {
  //   name: 'Maintenance',
  //   href: '/vendor/maintenance',
  //   icon: Wrench,
  // },
  // {
  //   name: 'Document Alerts',
  //   href: '/vendor/documents/alerts',
  //   icon: AlertTriangle,
  // },
  // {
  //   name: 'Goals & Targets',
  //   href: '/vendor/goals',
  //   icon: Target,
  // },
  // {
  //   name: 'Rate Comparison',
  //   href: '/vendor/rates',
  //   icon: BarChart3,
  // },
  // {
  //   name: 'Branches',
  //   href: '/vendor/branches',
  //   icon: Building2,
  // },
  // {
  //   name: 'Insurance Claims',
  //   href: '/vendor/insurance-claims',
  //   icon: Shield,
  // },
  // {
  //   name: 'Audit Logs',
  //   href: '/vendor/audit-logs',
  //   icon: History,
  // },
  // {
  //   name: 'Quick Actions',
  //   href: '/vendor/quick-actions',
  //   icon: Zap,
  // },
  // {
  //   name: 'GPS Tracking',
  //   href: '/vendor/tracking',
  //   icon: Navigation,
  // },
  // {
  //   name: 'Toll Management',
  //   href: '/vendor/tolls',
  //   icon: CreditCard,
  // },
  // {
  //   name: 'Fines & Penalties',
  //   href: '/vendor/fines',
  //   icon: AlertTriangle,
  // },
  // {
  //   name: 'Driver Training',
  //   href: '/vendor/training',
  //   icon: GraduationCap,
  // },
  // {
  //   name: 'Customer Feedback',
  //   href: '/vendor/feedback',
  //   icon: Smile,
  // },
  // {
  //   name: 'Vendor Wallet',
  //   href: '/vendor/wallet',
  //   icon: Wallet,
  // },
  // {
  //   name: 'Promotions',
  //   href: '/vendor/promotions',
  //   icon: Tag,
  // },
  {
    name: 'Services & Locations',
    href: '/vendor/requests',
    icon: ClipboardList,
    children: [
      { name: 'My Services', href: '/vendor/services', icon: Layers },
      { name: 'My Locations', href: '/vendor/locations', icon: MapPin },
      { name: 'Request Service', href: '/vendor/services/request', icon: Layers },
      { name: 'Request Location', href: '/vendor/locations/request', icon: MapPin },
    ],
  },
  // {
  //   name: 'Reviews',
  //   href: '/vendor/reviews',
  //   icon: Star,
  // },
  // {
  //   name: 'Notifications',
  //   href: '/vendor/notifications',
  //   icon: Bell,
  //   children: [
  //     { name: 'All Notifications', href: '/vendor/notifications', icon: Bell },
  //     { name: 'Notification Settings', href: '/vendor/notification-settings', icon: Settings },
  //   ],
  // },
  // {
  //   name: 'Settings',
  //   href: '/vendor/settings',
  //   icon: Settings,
  // },
  // {
  //   name: 'Help & Support',
  //   href: '/vendor/support',
  //   icon: HelpCircle,
  // },
];

// Navigation items for NON-APPROVED vendors (pending, documents_pending, under_review)
const pendingNavigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/vendor/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Services & Locations',
    href: '/vendor/requests',
    icon: ClipboardList,
    children: [
      { name: 'Request Service', href: '/vendor/services/request', icon: Layers },
      { name: 'Request Location', href: '/vendor/locations/request', icon: MapPin },
    ],
  },
  {
    name: 'Notifications',
    href: '/vendor/notifications',
    icon: Bell,
  },
  {
    name: 'Help & Support',
    href: '/vendor/support',
    icon: HelpCircle,
  },
];

// Profile items for bottom section
const profileItems: NavItem[] = [
  { name: 'Business Profile', href: '/vendor/profile', icon: Building2 },
  { name: 'Documents', href: '/vendor/documents', icon: FileText },
  { name: 'Media Library', href: '/vendor/media', icon: Image },
  { name: 'Bank Details', href: '/vendor/bank-details', icon: DollarSign },
];

export function VendorSidebar({ isOpen, onClose, vendorStatus, approvedServiceIds = [], approvedServiceSlugs = [] }: VendorSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [profileExpanded, setProfileExpanded] = useState(false);

  const isApproved = vendorStatus === 'APPROVED';

  // Filter navigation items based on approved service IDs
  // This approach is stable - even if admin changes service slugs, IDs remain the same
  const getFilteredNavigationItems = () => {
    if (!isApproved) return pendingNavigationItems;

    // If no services approved yet, show empty service list
    // (but still show general features)
    return approvedNavigationItems.filter((item) => {
      // If item has no serviceId, show it (it's a general feature)
      if (!item.serviceId) return true;
      // If item has serviceId, only show if vendor is approved for that service
      return approvedServiceIds.includes(item.serviceId);
    });
  };

  const navigationItems = getFilteredNavigationItems();

  // Debug log for troubleshooting (remove in production)
  console.log('Approved service IDs from DB:', approvedServiceIds);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/vendor/login' });
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + '/')
      );
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const isProfileActive = (): boolean => {
    return profileItems.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    );
  };

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
                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-4 border-blue-500'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {isExpanded && (
            <div className="ml-4 pl-4 border-l border-gray-700 space-y-1">
              {item.children!.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                      isChildActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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

  const vendorName = session?.user?.name || 'Vendor';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
                TR
              </div>
              <div>
                <h2 className="font-bold text-lg">TransRentals</h2>
                <p className="text-xs text-gray-400">Vendor Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge */}
          {vendorStatus && (
            <div className="px-4 py-3 border-b border-gray-800">
              <div className={cn(
                'px-3 py-2 rounded-lg text-center text-sm font-medium',
                vendorStatus === 'APPROVED' && 'bg-green-900/50 text-green-400',
                vendorStatus === 'PENDING' && 'bg-yellow-900/50 text-yellow-400',
                vendorStatus === 'DOCUMENTS_PENDING' && 'bg-orange-900/50 text-orange-400',
                vendorStatus === 'UNDER_REVIEW' && 'bg-blue-900/50 text-blue-400',
                vendorStatus === 'REJECTED' && 'bg-red-900/50 text-red-400',
                vendorStatus === 'SUSPENDED' && 'bg-red-900/50 text-red-400',
              )}>
                Status: {vendorStatus.replace(/_/g, ' ')}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => renderNavItem(item))}
          </nav>

          {/* Footer Section with Profile and Sign Out */}
          <div className="border-t border-gray-800">
            {/* Profile Section */}
            <div className="p-4">
              <button
                onClick={() => setProfileExpanded(!profileExpanded)}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors',
                  isProfileActive()
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm truncate max-w-[120px]">{vendorName}</p>
                    <p className="text-xs text-gray-400">Profile & Settings</p>
                  </div>
                </div>
                {profileExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Profile Dropdown */}
              {profileExpanded && (
                <div className="mt-2 ml-4 pl-4 border-l border-gray-700 space-y-1">
                  {profileItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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

            {/* Sign Out Button */}
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

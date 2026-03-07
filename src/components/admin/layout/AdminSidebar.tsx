'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Search,
  ArrowRightLeft,
  FileEdit,
  Image,
  Settings,
  LogOut,
  X,
  Brain,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Users,
  Activity,
  Car,
  MapPin,
  Wrench,
  UserCog,
  Layers,
  Bike,
  Store,
  Clock,
  Bus,
  Truck,
  Package,
  Crown,
  CarTaxiFront,
  DollarSign,
  CalendarCheck,
  Globe,
  Gauge,
  List,
  PlusCircle,
  Eye,
  FileCheck,
  Cog,
  Tags,
  Route,
  Calculator,
  MapPinned,
  TestTube,
  Upload,
  Briefcase,
  CreditCard,
  Headphones,
  Link2,
  MousePointer,
  MessageSquare,
  FileBarChart,
  TrendingUp,
  Navigation,
  CircleDollarSign,
  Plane,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

// Sub-menu items for each service (Mission Control)
const serviceSubMenu = (slug: string): NavItem[] => [
  { name: 'Dashboard', href: `/admin/services/${slug}`, icon: Gauge },
  { name: 'Page Content', href: `/admin/services/${slug}/page-content`, icon: FileText },
  { name: 'Brands', href: `/admin/services/${slug}/brands`, icon: Tags },
  { name: 'Categories', href: `/admin/services/${slug}/sub-services`, icon: Layers },
  { name: 'Vehicle Categories', href: `/admin/services/${slug}/vehicles`, icon: Car },
  { name: 'Vehicle Models', href: `/admin/services/${slug}/vehicle-models`, icon: Car },
  { name: 'Fleet', href: `/admin/services/${slug}/fleet`, icon: Car },
  { name: 'Locations', href: `/admin/services/${slug}/locations`, icon: MapPin },
  { name: 'Location Inventory', href: `/admin/services/${slug}/location-inventory`, icon: BarChart3 },
  { name: 'Pricing', href: `/admin/services/${slug}/pricing`, icon: DollarSign },
  { name: 'Bookings', href: `/admin/services/${slug}/bookings`, icon: CalendarCheck },
  { name: 'Pages', href: `/admin/services/${slug}/pages`, icon: FileText },
  { name: 'Blog', href: `/admin/services/${slug}/blog`, icon: FileEdit },
  { name: 'Media', href: `/admin/services/${slug}/media`, icon: Image },
  { name: 'Redirects', href: `/admin/services/${slug}/redirects`, icon: ArrowRightLeft },
  { name: 'Knowledge Base', href: `/admin/services/${slug}/knowledge-base`, icon: Brain },
  { name: 'SEO', href: `/admin/services/${slug}/seo`, icon: Globe },
  { name: 'Settings', href: `/admin/services/${slug}/settings`, icon: Settings },
];

// Sub-menu for Car Rental / Luxury Car (Chauffeur-style services with packages & pricing)
const carRentalSubMenu = (slug: string): NavItem[] => [
  { name: 'Dashboard', href: `/admin/services/${slug}`, icon: Gauge },
  { name: 'Vehicle Categories', href: `/admin/services/${slug}/vehicles`, icon: Car },
  { name: 'Brands', href: `/admin/services/${slug}/brands`, icon: Tags },
  { name: 'Local Packages', href: `/admin/services/${slug}/packages`, icon: Package },
  { name: 'City Pricing', href: `/admin/services/${slug}/city-pricing`, icon: CircleDollarSign },
  { name: 'Route Packages', href: `/admin/services/${slug}/routes`, icon: Route },
  { name: 'One-Way Routes', href: `/admin/services/${slug}/oneway`, icon: Navigation },
  { name: 'Airports', href: `/admin/services/${slug}/airports`, icon: Plane },
  { name: 'Airport Transfers', href: `/admin/services/${slug}/airport-transfers`, icon: Plane },
  { name: 'Distance Matrix', href: `/admin/services/${slug}/distances`, icon: MapPinned },
  { name: 'Coverage Areas', href: `/admin/services/${slug}/coverage`, icon: MapPin },
  { name: 'Bulk Setup', href: `/admin/services/${slug}/bulk-setup`, icon: Upload },
  { name: 'Price Tester', href: `/admin/services/${slug}/price-tester`, icon: TestTube },
  { name: 'Bookings', href: `/admin/services/${slug}/bookings`, icon: CalendarCheck },
  { name: 'Locations', href: `/admin/services/${slug}/locations`, icon: MapPin },
  { name: 'Location Inventory', href: `/admin/services/${slug}/location-inventory`, icon: BarChart3 },
  { name: 'Page Content', href: `/admin/services/${slug}/page-content`, icon: FileText },
  { name: 'Blog', href: `/admin/services/${slug}/blog`, icon: FileEdit },
  { name: 'Media', href: `/admin/services/${slug}/media`, icon: Image },
  { name: 'SEO', href: `/admin/services/${slug}/seo`, icon: Globe },
  { name: 'Settings', href: `/admin/services/${slug}/settings`, icon: Settings },
];

// Sub-menu for Bus Rental (Quote-based system with trip types)
const busRentalSubMenu = (slug: string): NavItem[] => [
  { name: 'Dashboard', href: `/admin/services/${slug}`, icon: Gauge },
  { name: 'Trip Types', href: `/admin/services/${slug}/trip-types`, icon: Route },
  { name: 'Vehicle Categories', href: `/admin/services/${slug}/vehicles`, icon: Bus },
  { name: 'Brands', href: `/admin/services/${slug}/brands`, icon: Tags },
  { name: 'Vehicle Models', href: `/admin/services/${slug}/vehicle-models`, icon: Car },
  { name: 'Fleet', href: `/admin/services/${slug}/fleet`, icon: Car },
  { name: 'Locations', href: `/admin/services/${slug}/locations`, icon: MapPin },
  { name: 'Location Inventory', href: `/admin/services/${slug}/location-inventory`, icon: BarChart3 },
  { name: 'Bookings', href: `/admin/services/${slug}/bookings`, icon: CalendarCheck },
  { name: 'Page Content', href: `/admin/services/${slug}/page-content`, icon: FileText },
  { name: 'Blog', href: `/admin/services/${slug}/blog`, icon: FileEdit },
  { name: 'Media', href: `/admin/services/${slug}/media`, icon: Image },
  { name: 'Knowledge Base', href: `/admin/services/${slug}/knowledge-base`, icon: Brain },
  { name: 'SEO', href: `/admin/services/${slug}/seo`, icon: Globe },
  { name: 'Settings', href: `/admin/services/${slug}/settings`, icon: Settings },
];

// Sub-menu for Luxury Car Rental (Quote-based system with premium vehicles)
// Note: No pricing options (Local Packages, City Pricing, Routes, etc.) as it's quote-based
const luxuryCarSubMenu = (slug: string): NavItem[] => [
  { name: 'Dashboard', href: `/admin/services/${slug}`, icon: Gauge },
  { name: 'Vehicle Categories', href: `/admin/services/${slug}/vehicles`, icon: Crown },
  { name: 'Brands', href: `/admin/services/${slug}/brands`, icon: Tags },
  { name: 'Vehicle Models', href: `/admin/services/${slug}/vehicle-models`, icon: Car },
  { name: 'Vendor Fleet', href: `/admin/services/${slug}/fleet`, icon: Car },
  { name: 'Locations', href: `/admin/services/${slug}/locations`, icon: MapPin },
  { name: 'Location Inventory', href: `/admin/services/${slug}/location-inventory`, icon: BarChart3 },
  { name: 'Bookings', href: `/admin/services/${slug}/bookings`, icon: CalendarCheck },
  { name: 'Page Content', href: `/admin/services/${slug}/page-content`, icon: FileText },
  { name: 'Blog', href: `/admin/services/${slug}/blog`, icon: FileEdit },
  { name: 'Media', href: `/admin/services/${slug}/media`, icon: Image },
  { name: 'Knowledge Base', href: `/admin/services/${slug}/knowledge-base`, icon: Brain },
  { name: 'SEO', href: `/admin/services/${slug}/seo`, icon: Globe },
  { name: 'Settings', href: `/admin/services/${slug}/settings`, icon: Settings },
];

// Sub-menu for Truck/Tempo Rental (Quote-based goods transport)
// Note: Vehicle Models removed - truck categories have all specs (load capacity, dimensions, etc.)
const truckRentalSubMenu = (slug: string): NavItem[] => [
  { name: 'Dashboard', href: `/admin/services/${slug}`, icon: Gauge },
  { name: 'Vehicle Categories', href: `/admin/services/${slug}/vehicles`, icon: Truck },
  { name: 'Fleet', href: `/admin/services/${slug}/fleet`, icon: Truck },
  { name: 'Locations', href: `/admin/services/${slug}/locations`, icon: MapPin },
  { name: 'Location Inventory', href: `/admin/services/${slug}/location-inventory`, icon: BarChart3 },
  { name: 'Bookings', href: `/admin/services/${slug}/bookings`, icon: CalendarCheck },
  { name: 'Page Content', href: `/admin/services/${slug}/page-content`, icon: FileText },
  { name: 'Blog', href: `/admin/services/${slug}/blog`, icon: FileEdit },
  { name: 'Media', href: `/admin/services/${slug}/media`, icon: Image },
  { name: 'Knowledge Base', href: `/admin/services/${slug}/knowledge-base`, icon: Brain },
  { name: 'SEO', href: `/admin/services/${slug}/seo`, icon: Globe },
  { name: 'Settings', href: `/admin/services/${slug}/settings`, icon: Settings },
];

// Sub-menu for Packers & Movers (Quote-based moving service)
// Note: Vehicle Models removed - categories have all specs (load capacity, dimensions, etc.)
const packersMoversSubMenu = (slug: string): NavItem[] => [
  { name: 'Dashboard', href: `/admin/services/${slug}`, icon: Gauge },
  { name: 'Vehicle Categories', href: `/admin/services/${slug}/vehicles`, icon: Truck },
  { name: 'Fleet', href: `/admin/services/${slug}/fleet`, icon: Package },
  { name: 'Locations', href: `/admin/services/${slug}/locations`, icon: MapPin },
  { name: 'Location Inventory', href: `/admin/services/${slug}/location-inventory`, icon: BarChart3 },
  { name: 'Bookings', href: `/admin/services/${slug}/bookings`, icon: CalendarCheck },
  { name: 'Page Content', href: `/admin/services/${slug}/page-content`, icon: FileText },
  { name: 'Blog', href: `/admin/services/${slug}/blog`, icon: FileEdit },
  { name: 'Media', href: `/admin/services/${slug}/media`, icon: Image },
  { name: 'Knowledge Base', href: `/admin/services/${slug}/knowledge-base`, icon: Brain },
  { name: 'SEO', href: `/admin/services/${slug}/seo`, icon: Globe },
  { name: 'Settings', href: `/admin/services/${slug}/settings`, icon: Settings },
];

// Sub-menu for Equipment Rental (Quote-based equipment hire)
// Note: Brands and Models removed - equipment categories have all specs (power, rates, etc.)
const equipmentRentalSubMenu = (slug: string): NavItem[] => [
  { name: 'Dashboard', href: `/admin/services/${slug}`, icon: Gauge },
  { name: 'Equipment Categories', href: `/admin/services/${slug}/vehicles`, icon: Wrench },
  { name: 'Fleet', href: `/admin/services/${slug}/fleet`, icon: Wrench },
  { name: 'Locations', href: `/admin/services/${slug}/locations`, icon: MapPin },
  { name: 'Location Inventory', href: `/admin/services/${slug}/location-inventory`, icon: BarChart3 },
  { name: 'Bookings', href: `/admin/services/${slug}/bookings`, icon: CalendarCheck },
  { name: 'Page Content', href: `/admin/services/${slug}/page-content`, icon: FileText },
  { name: 'Blog', href: `/admin/services/${slug}/blog`, icon: FileEdit },
  { name: 'Media', href: `/admin/services/${slug}/media`, icon: Image },
  { name: 'Knowledge Base', href: `/admin/services/${slug}/knowledge-base`, icon: Brain },
  { name: 'SEO', href: `/admin/services/${slug}/seo`, icon: Globe },
  { name: 'Settings', href: `/admin/services/${slug}/settings`, icon: Settings },
];

// Icon mapping for database icon strings to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Car: Car,
  Bike: Bike,
  CarTaxiFront: CarTaxiFront,
  Crown: Crown,
  Bus: Bus,
  Truck: Truck,
  Package: Package,
  Wrench: Wrench,
};

// Get appropriate submenu based on service slug pattern
const getSubmenuBySlug = (slug: string): NavItem[] => {
  // Luxury car rental - Quote-based (check BEFORE generic car-rental)
  if (slug.includes('luxury')) {
    return luxuryCarSubMenu(slug);
  }
  // Car rental with driver - has pricing options
  if (slug.includes('car-rental') && !slug.includes('self-drive')) {
    return carRentalSubMenu(slug);
  }
  // Bus rental
  if (slug.includes('bus')) {
    return busRentalSubMenu(slug);
  }
  // Truck/Tempo rental
  if (slug.includes('truck') || slug.includes('tempo')) {
    return truckRentalSubMenu(slug);
  }
  // Packers & Movers
  if (slug.includes('packer') || slug.includes('mover')) {
    return packersMoversSubMenu(slug);
  }
  // Equipment rental
  if (slug.includes('equipment')) {
    return equipmentRentalSubMenu(slug);
  }
  // Default for self-drive, bike, etc. (BROWSE_FIRST services)
  return serviceSubMenu(slug);
};

// Map database service to NavItem
const mapServiceToNavItem = (service: {
  name: string;
  slug: string;
  icon?: string | null;
  flowType?: string;
}): NavItem => ({
  name: service.name,
  href: `/admin/services/${service.slug}`,
  icon: ICON_MAP[service.icon || ''] || Car,
  children: getSubmenuBySlug(service.slug),
});

// 8 Mission Controls (Primary Services) - Fallback when API fails
const FALLBACK_MISSION_CONTROLS: NavItem[] = [
  {
    name: 'Self-Drive Car',
    href: '/admin/services/self-drive-car-rental',
    icon: Car,
    children: serviceSubMenu('self-drive-car-rental'),
  },
  {
    name: 'Bike Rental',
    href: '/admin/services/bike-rental',
    icon: Bike,
    children: serviceSubMenu('bike-rental'),
  },
  {
    name: 'Car Rental',
    href: '/admin/services/car-rental',
    icon: CarTaxiFront,
    children: carRentalSubMenu('car-rental'),
  },
  {
    name: 'Luxury Car Rental',
    href: '/admin/services/luxury-car-rental',
    icon: Crown,
    children: luxuryCarSubMenu('luxury-car-rental'),
  },
  {
    name: 'Bus Rental',
    href: '/admin/services/bus-rental',
    icon: Bus,
    children: busRentalSubMenu('bus-rental'),
  },
  {
    name: 'Truck Rental',
    href: '/admin/services/truck-rental',
    icon: Truck,
    children: truckRentalSubMenu('truck-rental'),
  },
  {
    name: 'Packers & Movers',
    href: '/admin/services/packers-and-movers',
    icon: Package,
    children: packersMoversSubMenu('packers-and-movers'),
  },
  {
    name: 'Equipment Rental',
    href: '/admin/services/equipment-rental',
    icon: Wrench,
    children: equipmentRentalSubMenu('equipment-rental'),
  },
];



// Other admin items
const adminItems: NavItem[] = [
  {
    name: 'Service Management',
    href: '/admin/services-management',
    icon: Cog,
    children: [
      { name: 'Services', href: '/admin/services-management', icon: Layers },
      { name: 'Trip Types', href: '/admin/booking/trip-types', icon: Route },
      { name: 'Brands', href: '/admin/booking/brands', icon: Tags },
      { name: 'Vehicle Models', href: '/admin/booking/models', icon: Car },
    ],
  },
  {
    name: 'Locations',
    href: '/admin/locations',
    icon: MapPin,
  },
  {
    name: 'Vendors',
    href: '/admin/vendors',
    icon: Store,
    children: [
      { name: 'All Vendors', href: '/admin/vendors', icon: Store },
      { name: 'Pending Approval', href: '/admin/vendors/pending', icon: Clock },
      { name: 'Service Requests', href: '/admin/vendors/service-requests', icon: Layers },
      { name: 'Location Requests', href: '/admin/vendors/location-requests', icon: MapPin },
      { name: 'Vendor Documents', href: '/admin/vendor-documents', icon: Image },
    ],
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: UserCog,
  },
  {
    name: 'B2B Module',
    href: '/admin/b2b',
    icon: Headphones,
    children: [
      { name: 'B2B Customers', href: '/admin/b2b', icon: Headphones },
      { name: 'B2B Bookings', href: '/admin/b2b/bookings', icon: Headphones },
    ],
  },
  {
    name: 'Helpdesk',
    href: '/admin/helpdesk',
    icon: Headphones,
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    children: [
      { name: 'Overview', href: '/admin/analytics', icon: Activity },
      { name: 'Real-Time', href: '/admin/analytics/realtime', icon: Activity },
      { name: 'Traffic', href: '/admin/analytics/traffic', icon: Users },
      { name: 'Performance', href: '/admin/analytics/performance', icon: Gauge },
      { name: 'Pages', href: '/admin/analytics/pages', icon: FileBarChart },
      { name: 'SEO Audits', href: '/admin/analytics/seo', icon: TrendingUp },
      { name: 'Rankings', href: '/admin/analytics/rankings', icon: BarChart3 },
      { name: 'Clicks', href: '/admin/analytics/clicks', icon: MousePointer },
      { name: 'Backlinks', href: '/admin/analytics/backlinks', icon: Link2 },
      { name: 'Forms', href: '/admin/analytics/forms', icon: FileText },
      { name: 'Chat', href: '/admin/analytics/chat', icon: MessageSquare },
      { name: 'Reports', href: '/admin/analytics/reports', icon: FileText },
      { name: 'Integrations', href: '/admin/analytics/integrations', icon: Link2 },
    ],
  },
];

// Website Controls (Global site management)
const websiteItems: NavItem[] = [
  { name: 'Homepage', href: '/admin/website/homepage', icon: LayoutDashboard },
  { name: 'General Blog', href: '/admin/blog', icon: FileEdit },
  { name: 'Media Library', href: '/admin/media', icon: Image },
  { name: 'Navigation', href: '/admin/website/navigation', icon: List },
  { name: 'Footer', href: '/admin/website/footer', icon: FileCheck },
  { name: 'Appearance', href: '/admin/website/appearance', icon: Eye },
  { name: 'Global SEO', href: '/admin/seo', icon: Search },
  { name: 'Site Settings', href: '/admin/settings', icon: Settings },
];

// Settings items
const settingsItems: NavItem[] = [
  { name: 'Bank Details', href: '/admin/settings/bank-details', icon: CreditCard },
  { name: 'Payment & Fees', href: '/admin/settings/fees', icon: CircleDollarSign },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [missionControls, setMissionControls] = useState<NavItem[]>(FALLBACK_MISSION_CONTROLS);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Fetch services from database to sync with services-management
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/admin/services?parentsOnly=true');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Sort by displayOrder, then map to NavItems
            const sortedServices = data.sort((a: { displayOrder: number }, b: { displayOrder: number }) =>
              (a.displayOrder || 0) - (b.displayOrder || 0)
            );
            const navItems = sortedServices.map(mapServiceToNavItem);
            setMissionControls(navItems);
          }
        }
      } catch (error) {
        console.error('Failed to fetch services for sidebar:', error);
        // Keep using fallback on error
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
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

  const renderNavItem = (item: NavItem, isMissionControl: boolean = false) => {
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
              'flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors',
              isMissionControl && 'py-3',
              isActive
                ? isMissionControl
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-4 border-blue-500'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn('w-5 h-5', isMissionControl && 'w-5 h-5')} />
              <span className={cn('font-medium', isMissionControl && 'text-sm')}>{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {isExpanded && (
            <div className="ml-4 pl-3 border-l border-gray-700 space-y-0.5">
              {item.children!.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm',
                      isChildActive
                        ? 'bg-blue-600/30 text-white'
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
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        )}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

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
          'fixed top-0 left-0 z-50 h-screen w-72 bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
                TR
              </div>
              <div>
                <h2 className="font-bold text-lg">TransRentals</h2>
                <p className="text-xs text-gray-400">Mission Control</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {/* Dashboard */}
            <div>
              <Link
                href="/admin/dashboard"
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  pathname === '/admin/dashboard'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
            </div>

            {/* 8 Mission Controls */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Services
              </p>
              <div className="space-y-1">
                {missionControls.map((item) => renderNavItem(item, true))}
              </div>
            </div>

            {/* Website Controls */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Website
              </p>
              <div className="space-y-1">
                {websiteItems.map((item) => renderNavItem(item))}
              </div>
            </div>

            {/* Settings */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Settings
              </p>
              <div className="space-y-1">
                {settingsItems.map((item) => renderNavItem(item))}
              </div>
            </div>

            {/* Admin */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Management
              </p>
              <div className="space-y-1">
                {adminItems.map((item) => renderNavItem(item))}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

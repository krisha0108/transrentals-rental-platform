'use client';

import React from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Calendar,
  Car,
  Users,
  Receipt,
  Wrench,
  AlertTriangle,
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
  Package
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'new-booking',
    label: 'New Booking',
    description: 'Create a new booking',
    icon: <Plus className="w-6 h-6" />,
    href: '/vendor/bookings/new',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    id: 'new-quote',
    label: 'New Quote',
    description: 'Create quotation',
    icon: <FileText className="w-6 h-6" />,
    href: '/vendor/quotations/create',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  {
    id: 'new-invoice',
    label: 'New Invoice',
    description: 'Generate invoice',
    icon: <Receipt className="w-6 h-6" />,
    href: '/vendor/invoices?action=new',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    id: 'add-vehicle',
    label: 'Add Vehicle',
    description: 'Register new vehicle',
    icon: <Car className="w-6 h-6" />,
    href: '/vendor/fleet?action=add',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100'
  },
  {
    id: 'add-driver',
    label: 'Add Driver',
    description: 'Register new driver',
    icon: <Users className="w-6 h-6" />,
    href: '/vendor/staff?action=add',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100'
  },
  {
    id: 'view-calendar',
    label: 'View Calendar',
    description: 'Check schedules',
    icon: <Calendar className="w-6 h-6" />,
    href: '/vendor/calendar',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100'
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    description: 'Schedule service',
    icon: <Wrench className="w-6 h-6" />,
    href: '/vendor/maintenance',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100'
  },
  {
    id: 'doc-alerts',
    label: 'Doc Alerts',
    description: 'Expiry reminders',
    icon: <AlertTriangle className="w-6 h-6" />,
    href: '/vendor/documents/alerts',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100'
  },
  {
    id: 'checklist',
    label: 'Checklist',
    description: 'Daily inspection',
    icon: <ClipboardCheck className="w-6 h-6" />,
    href: '/vendor/checklist',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100'
  },
  {
    id: 'send-message',
    label: 'Send Message',
    description: 'WhatsApp/SMS',
    icon: <MessageSquare className="w-6 h-6" />,
    href: '/vendor/communication',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  {
    id: 'view-reports',
    label: 'View Reports',
    description: 'Analytics & insights',
    icon: <TrendingUp className="w-6 h-6" />,
    href: '/vendor/reports',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100'
  },
  {
    id: 'p2p-market',
    label: 'P2P Market',
    description: 'Vendor marketplace',
    icon: <Package className="w-6 h-6" />,
    href: '/vendor/p2p',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 hover:bg-violet-100'
  }
];

interface QuickActionsProps {
  showAll?: boolean;
  className?: string;
}

export default function QuickActions({ showAll = false, className = '' }: QuickActionsProps) {
  const displayActions = showAll ? quickActions : quickActions.slice(0, 8);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        {!showAll && (
          <Link
            href="/vendor/quick-actions"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All
          </Link>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {displayActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`flex flex-col items-center p-4 rounded-xl ${action.bgColor} transition-all duration-200 group`}
          >
            <div className={`${action.color} mb-2 group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-gray-900 text-center">
              {action.label}
            </span>
            <span className="text-xs text-gray-500 text-center mt-0.5">
              {action.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function QuickActionsCompact({ className = '' }: { className?: string }) {
  const topActions = quickActions.slice(0, 6);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>

      <div className="grid grid-cols-3 gap-2">
        {topActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`flex items-center gap-2 p-2 rounded-lg ${action.bgColor} transition-all duration-200`}
          >
            <div className={`${action.color}`}>
              {React.cloneElement(action.icon as React.ReactElement, { className: 'w-4 h-4' })}
            </div>
            <span className="text-xs font-medium text-gray-900 truncate">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Floating action button version
export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = React.useState(false);
  const topActions = quickActions.slice(0, 6);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {topActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 p-3 rounded-lg ${action.bgColor} transition-all duration-200`}
              >
                <div className={`${action.color}`}>
                  {React.cloneElement(action.icon as React.ReactElement, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 block">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all duration-200 ${isOpen ? 'rotate-45' : ''}`}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

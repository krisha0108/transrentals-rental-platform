'use client';

import React, { useState } from 'react';
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
  Package,
  Target,
  FileSignature,
  DollarSign,
  Building2,
  MapPin,
  BarChart3,
  Shield,
  History,
  Search,
  Star,
  Clock
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
  category: string;
}

const allQuickActions: QuickAction[] = [
  // Bookings & Operations
  {
    id: 'new-booking',
    label: 'New Booking',
    description: 'Create a new rental booking',
    icon: <Plus className="w-6 h-6" />,
    href: '/vendor/bookings/new',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    category: 'Bookings & Operations'
  },
  {
    id: 'view-calendar',
    label: 'View Calendar',
    description: 'Check vehicle & driver schedules',
    icon: <Calendar className="w-6 h-6" />,
    href: '/vendor/calendar',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    category: 'Bookings & Operations'
  },
  {
    id: 'checklist',
    label: 'Daily Checklist',
    description: 'Pre-trip vehicle inspection',
    icon: <ClipboardCheck className="w-6 h-6" />,
    href: '/vendor/checklist',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    category: 'Bookings & Operations'
  },
  {
    id: 'route-planner',
    label: 'Route Planner',
    description: 'Plan optimized routes',
    icon: <MapPin className="w-6 h-6" />,
    href: '/vendor/routes',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    category: 'Bookings & Operations'
  },

  // Sales & Finance
  {
    id: 'new-quote',
    label: 'New Quote',
    description: 'Create quotation for customer',
    icon: <FileText className="w-6 h-6" />,
    href: '/vendor/quotations/create',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    category: 'Sales & Finance'
  },
  {
    id: 'new-invoice',
    label: 'New Invoice',
    description: 'Generate GST invoice',
    icon: <Receipt className="w-6 h-6" />,
    href: '/vendor/invoices?action=new',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    category: 'Sales & Finance'
  },
  {
    id: 'add-expense',
    label: 'Add Expense',
    description: 'Record business expense',
    icon: <DollarSign className="w-6 h-6" />,
    href: '/vendor/expenses?action=add',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    category: 'Sales & Finance'
  },
  {
    id: 'new-contract',
    label: 'New Contract',
    description: 'Create service contract',
    icon: <FileSignature className="w-6 h-6" />,
    href: '/vendor/contracts?action=new',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    category: 'Sales & Finance'
  },

  // Fleet & Staff
  {
    id: 'add-vehicle',
    label: 'Add Vehicle',
    description: 'Register new vehicle',
    icon: <Car className="w-6 h-6" />,
    href: '/vendor/fleet?action=add',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    category: 'Fleet & Staff'
  },
  {
    id: 'add-driver',
    label: 'Add Driver',
    description: 'Register new driver/staff',
    icon: <Users className="w-6 h-6" />,
    href: '/vendor/staff?action=add',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
    category: 'Fleet & Staff'
  },
  {
    id: 'maintenance',
    label: 'Schedule Maintenance',
    description: 'Vehicle service scheduling',
    icon: <Wrench className="w-6 h-6" />,
    href: '/vendor/maintenance',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    category: 'Fleet & Staff'
  },
  {
    id: 'doc-alerts',
    label: 'Document Alerts',
    description: 'Check expiry reminders',
    icon: <AlertTriangle className="w-6 h-6" />,
    href: '/vendor/documents/alerts',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100',
    category: 'Fleet & Staff'
  },

  // Communication & CRM
  {
    id: 'send-message',
    label: 'Send Message',
    description: 'WhatsApp/SMS to customers',
    icon: <MessageSquare className="w-6 h-6" />,
    href: '/vendor/communication',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    category: 'Communication & CRM'
  },
  {
    id: 'add-lead',
    label: 'Add Lead',
    description: 'Create new sales lead',
    icon: <Target className="w-6 h-6" />,
    href: '/vendor/leads?action=add',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    category: 'Communication & CRM'
  },
  {
    id: 'crm',
    label: 'Customer CRM',
    description: 'View customer profiles',
    icon: <Users className="w-6 h-6" />,
    href: '/vendor/crm',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 hover:bg-violet-100',
    category: 'Communication & CRM'
  },

  // Reports & Analytics
  {
    id: 'view-reports',
    label: 'View Reports',
    description: 'Analytics & insights',
    icon: <TrendingUp className="w-6 h-6" />,
    href: '/vendor/reports',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    category: 'Reports & Analytics'
  },
  {
    id: 'goals',
    label: 'Goals & Targets',
    description: 'Track performance goals',
    icon: <Target className="w-6 h-6" />,
    href: '/vendor/goals',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    category: 'Reports & Analytics'
  },
  {
    id: 'rate-comparison',
    label: 'Rate Comparison',
    description: 'Compare market rates',
    icon: <BarChart3 className="w-6 h-6" />,
    href: '/vendor/rates',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    category: 'Reports & Analytics'
  },

  // Marketplace & More
  {
    id: 'p2p-market',
    label: 'P2P Marketplace',
    description: 'Vendor-to-vendor trading',
    icon: <Package className="w-6 h-6" />,
    href: '/vendor/p2p',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 hover:bg-violet-100',
    category: 'Marketplace & More'
  },
  {
    id: 'branches',
    label: 'Manage Branches',
    description: 'Multi-location management',
    icon: <Building2 className="w-6 h-6" />,
    href: '/vendor/branches',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 hover:bg-slate-100',
    category: 'Marketplace & More'
  },
  {
    id: 'insurance-claims',
    label: 'Insurance Claims',
    description: 'Manage insurance claims',
    icon: <Shield className="w-6 h-6" />,
    href: '/vendor/insurance-claims',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    category: 'Marketplace & More'
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    description: 'View change history',
    icon: <History className="w-6 h-6" />,
    href: '/vendor/audit-logs',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100',
    category: 'Marketplace & More'
  }
];

// Get unique categories
const categories = [...new Set(allQuickActions.map(a => a.category))];

// Mock recent actions
const recentActions = ['new-booking', 'new-invoice', 'send-message', 'view-calendar'];

// Mock favorite actions
const favoriteActions = ['new-booking', 'new-quote', 'new-invoice', 'maintenance'];

export default function QuickActionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredActions = allQuickActions.filter(action => {
    const matchesSearch = action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || action.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getActionsByCategory = (category: string) =>
    filteredActions.filter(a => a.category === category);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h1>
        <p className="text-gray-600">Access all common operations from one place</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-gray-900">Favorites</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allQuickActions
            .filter(a => favoriteActions.includes(a.id))
            .map(action => (
              <Link
                key={action.id}
                href={action.href}
                className={`flex items-center gap-3 p-4 rounded-xl bg-white border border-yellow-200 hover:shadow-md transition-all`}
              >
                <div className={`${action.color}`}>{action.icon}</div>
                <div>
                  <span className="text-sm font-medium text-gray-900 block">{action.label}</span>
                  <span className="text-xs text-gray-500">{action.description}</span>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Recent Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recently Used</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allQuickActions
            .filter(a => recentActions.includes(a.id))
            .map(action => (
              <Link
                key={action.id}
                href={action.href}
                className={`flex items-center gap-3 p-4 rounded-xl ${action.bgColor} transition-all`}
              >
                <div className={`${action.color}`}>{action.icon}</div>
                <div>
                  <span className="text-sm font-medium text-gray-900 block">{action.label}</span>
                  <span className="text-xs text-gray-500">{action.description}</span>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* All Actions by Category */}
      {selectedCategory ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{selectedCategory}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredActions.map(action => (
              <Link
                key={action.id}
                href={action.href}
                className={`flex flex-col items-center p-6 rounded-xl ${action.bgColor} transition-all group`}
              >
                <div className={`${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">{action.label}</span>
                <span className="text-xs text-gray-500 text-center mt-1">{action.description}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(category => {
            const categoryActions = getActionsByCategory(category);
            if (categoryActions.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categoryActions.map(action => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className={`flex flex-col items-center p-6 rounded-xl ${action.bgColor} transition-all group`}
                    >
                      <div className={`${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900 text-center">{action.label}</span>
                      <span className="text-xs text-gray-500 text-center mt-1">{action.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

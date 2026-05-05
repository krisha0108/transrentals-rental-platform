'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  Car,
  Users,
  DollarSign,
  Settings,
  Shield,
  Edit,
  Plus,
  Trash2,
  Eye,
  RefreshCcw,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  MoreVertical
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'approve' | 'reject';
  module: string;
  resource: string;
  resourceId: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'pending';
}

// Mock audit logs
const mockAuditLogs: AuditLog[] = [
  {
    id: 'AL001',
    timestamp: '2024-01-20T14:35:22',
    user: { name: 'Rajesh Kumar', role: 'Admin' },
    action: 'update',
    module: 'Fleet',
    resource: 'Vehicle',
    resourceId: 'VH-001',
    changes: [
      { field: 'Insurance Expiry', oldValue: '2024-01-15', newValue: '2025-01-15' },
      { field: 'Policy Number', oldValue: 'POL-123456', newValue: 'POL-789012' }
    ],
    ipAddress: '192.168.1.105',
    userAgent: 'Chrome/120.0 Windows',
    status: 'success'
  },
  {
    id: 'AL002',
    timestamp: '2024-01-20T14:20:15',
    user: { name: 'Priya Sharma', role: 'Manager' },
    action: 'create',
    module: 'Bookings',
    resource: 'Booking',
    resourceId: 'BK-2024-0156',
    ipAddress: '192.168.1.108',
    userAgent: 'Chrome/120.0 MacOS',
    status: 'success'
  },
  {
    id: 'AL003',
    timestamp: '2024-01-20T13:45:30',
    user: { name: 'Arun Menon', role: 'Staff' },
    action: 'view',
    module: 'Reports',
    resource: 'Revenue Report',
    resourceId: 'RPT-REV-2024-01',
    ipAddress: '192.168.1.112',
    userAgent: 'Safari/17.0 MacOS',
    status: 'success'
  },
  {
    id: 'AL004',
    timestamp: '2024-01-20T13:30:00',
    user: { name: 'System', role: 'Automated' },
    action: 'update',
    module: 'Documents',
    resource: 'Document Alert',
    resourceId: 'DOC-ALT-045',
    changes: [
      { field: 'Status', oldValue: 'Active', newValue: 'Expired' }
    ],
    ipAddress: 'System',
    userAgent: 'Automated Process',
    status: 'success'
  },
  {
    id: 'AL005',
    timestamp: '2024-01-20T12:15:45',
    user: { name: 'Rajesh Kumar', role: 'Admin' },
    action: 'delete',
    module: 'Staff',
    resource: 'Driver',
    resourceId: 'DRV-089',
    ipAddress: '192.168.1.105',
    userAgent: 'Chrome/120.0 Windows',
    status: 'success'
  },
  {
    id: 'AL006',
    timestamp: '2024-01-20T11:50:22',
    user: { name: 'Priya Sharma', role: 'Manager' },
    action: 'approve',
    module: 'Finance',
    resource: 'Expense',
    resourceId: 'EXP-2024-0089',
    changes: [
      { field: 'Status', oldValue: 'Pending', newValue: 'Approved' },
      { field: 'Approved Amount', oldValue: '-', newValue: '₹15,000' }
    ],
    ipAddress: '192.168.1.108',
    userAgent: 'Chrome/120.0 MacOS',
    status: 'success'
  },
  {
    id: 'AL007',
    timestamp: '2024-01-20T11:30:10',
    user: { name: 'Deepak Nair', role: 'Staff' },
    action: 'export',
    module: 'Reports',
    resource: 'Customer Report',
    resourceId: 'RPT-CUS-2024-01',
    ipAddress: '192.168.1.115',
    userAgent: 'Firefox/121.0 Windows',
    status: 'success'
  },
  {
    id: 'AL008',
    timestamp: '2024-01-20T10:45:00',
    user: { name: 'Unknown', role: '-' },
    action: 'login',
    module: 'Auth',
    resource: 'Login Attempt',
    resourceId: '-',
    ipAddress: '103.45.67.89',
    userAgent: 'Unknown Browser',
    status: 'failed'
  },
  {
    id: 'AL009',
    timestamp: '2024-01-20T10:30:15',
    user: { name: 'Rajesh Kumar', role: 'Admin' },
    action: 'login',
    module: 'Auth',
    resource: 'User Session',
    resourceId: 'SESSION-456789',
    ipAddress: '192.168.1.105',
    userAgent: 'Chrome/120.0 Windows',
    status: 'success'
  },
  {
    id: 'AL010',
    timestamp: '2024-01-20T09:15:30',
    user: { name: 'Arun Menon', role: 'Staff' },
    action: 'update',
    module: 'Bookings',
    resource: 'Booking',
    resourceId: 'BK-2024-0148',
    changes: [
      { field: 'Status', oldValue: 'Confirmed', newValue: 'Completed' },
      { field: 'Actual End Time', oldValue: '-', newValue: '09:00 AM' }
    ],
    ipAddress: '192.168.1.112',
    userAgent: 'Safari/17.0 MacOS',
    status: 'success'
  }
];

const actionConfig = {
  create: { label: 'Created', color: 'bg-green-100 text-green-700', icon: Plus },
  update: { label: 'Updated', color: 'bg-blue-100 text-blue-700', icon: Edit },
  delete: { label: 'Deleted', color: 'bg-red-100 text-red-700', icon: Trash2 },
  view: { label: 'Viewed', color: 'bg-gray-100 text-gray-700', icon: Eye },
  login: { label: 'Login', color: 'bg-purple-100 text-purple-700', icon: User },
  logout: { label: 'Logout', color: 'bg-gray-100 text-gray-700', icon: User },
  export: { label: 'Exported', color: 'bg-orange-100 text-orange-700', icon: Download },
  approve: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  reject: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

const moduleConfig = {
  Fleet: { icon: Car, color: 'text-blue-600' },
  Bookings: { icon: Calendar, color: 'text-green-600' },
  Staff: { icon: Users, color: 'text-purple-600' },
  Finance: { icon: DollarSign, color: 'text-orange-600' },
  Reports: { icon: FileText, color: 'text-cyan-600' },
  Documents: { icon: FileText, color: 'text-yellow-600' },
  Auth: { icon: Shield, color: 'text-red-600' },
  Settings: { icon: Settings, color: 'text-gray-600' }
};

export default function AuditLogsPage() {
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesModule && matchesAction;
  });

  // Calculate stats
  const stats = {
    total: logs.length,
    creates: logs.filter(l => l.action === 'create').length,
    updates: logs.filter(l => l.action === 'update').length,
    deletes: logs.filter(l => l.action === 'delete').length,
    failed: logs.filter(l => l.status === 'failed').length
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track all changes and activities in your system</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Logs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.creates}</p>
              <p className="text-sm text-gray-500">Creates</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.updates}</p>
              <p className="text-sm text-gray-500">Updates</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.deletes}</p>
              <p className="text-sm text-gray-500">Deletes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user, resource, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Modules</option>
              <option value="Fleet">Fleet</option>
              <option value="Bookings">Bookings</option>
              <option value="Staff">Staff</option>
              <option value="Finance">Finance</option>
              <option value="Reports">Reports</option>
              <option value="Documents">Documents</option>
              <option value="Auth">Auth</option>
            </select>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
              <option value="login">Login</option>
              <option value="export">Export</option>
              <option value="approve">Approve</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredLogs.map(log => {
            const ActionIcon = actionConfig[log.action].icon;
            const ModuleIcon = moduleConfig[log.module as keyof typeof moduleConfig]?.icon || FileText;
            const moduleColor = moduleConfig[log.module as keyof typeof moduleConfig]?.color || 'text-gray-600';
            const { time, date } = formatTimestamp(log.timestamp);
            const isExpanded = expandedLog === log.id;

            return (
              <div key={log.id}>
                <div
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${log.status === 'failed' ? 'bg-red-50' : ''}`}
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Timestamp */}
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-medium text-gray-900">{time}</p>
                      <p className="text-xs text-gray-500">{date}</p>
                    </div>

                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${actionConfig[log.action].color.replace('text-', 'bg-').replace('-700', '-100')}`}>
                      <ActionIcon className={`w-5 h-5 ${actionConfig[log.action].color.split(' ')[1]}`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{log.user.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{log.user.role}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${actionConfig[log.action].color}`}>
                          {actionConfig[log.action].label}
                        </span>
                        {log.status === 'failed' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            Failed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <ModuleIcon className={`w-4 h-4 ${moduleColor}`} />
                        <span className="text-sm text-gray-600">{log.module}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{log.resource}</span>
                        <span className="text-xs text-gray-400">({log.resourceId})</span>
                      </div>

                      {/* Changes preview */}
                      {log.changes && log.changes.length > 0 && !isExpanded && (
                        <div className="mt-2 text-sm text-gray-500">
                          Changed: {log.changes.map(c => c.field).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Expand icon */}
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="ml-[76px] space-y-4 pt-4">
                      {/* Changes */}
                      {log.changes && log.changes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Changes Made</h4>
                          <div className="space-y-2">
                            {log.changes.map((change, index) => (
                              <div key={index} className="flex items-center gap-4 text-sm">
                                <span className="font-medium text-gray-900 min-w-[120px]">{change.field}</span>
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded line-through">
                                  {change.oldValue}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                  {change.newValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technical Details */}
                      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">IP Address</p>
                          <p className="text-sm font-mono text-gray-900">{log.ipAddress}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">User Agent</p>
                          <p className="text-sm text-gray-900">{log.userAgent}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                          View Full Details
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                          Export Entry
                        </button>
                        {log.action !== 'delete' && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button className="text-sm text-blue-600 hover:text-blue-700">
                              View Resource
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing 1-10 of {filteredLogs.length} entries
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">About Audit Logs</h4>
            <p className="text-sm text-blue-700 mt-1">
              Audit logs are automatically generated for all significant actions in the system.
              Logs are retained for 90 days and can be exported for compliance purposes.
              For extended retention or custom audit requirements, contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

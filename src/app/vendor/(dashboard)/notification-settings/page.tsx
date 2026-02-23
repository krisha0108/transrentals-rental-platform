'use client';

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Volume2,
  Clock,
  Calendar,
  Car,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Settings,
  Save,
  Loader2,
  Moon,
  Shield,
  Star,
  Truck,
  ArrowRightLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react';

interface NotificationSetting {
  id: string;
  category: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
}

interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  exceptUrgent: boolean;
}

const initialSettings: NotificationSetting[] = [
  // Bookings
  { id: 'new_booking', category: 'Bookings', title: 'New Booking Request', description: 'When you receive a new booking request', email: true, push: true, sms: true, whatsapp: true },
  { id: 'booking_confirmed', category: 'Bookings', title: 'Booking Confirmed', description: 'When a booking is confirmed', email: true, push: true, sms: false, whatsapp: true },
  { id: 'booking_cancelled', category: 'Bookings', title: 'Booking Cancelled', description: 'When a booking is cancelled', email: true, push: true, sms: true, whatsapp: true },
  { id: 'booking_reminder', category: 'Bookings', title: 'Upcoming Reminder', description: 'Reminder before scheduled trips', email: true, push: true, sms: false, whatsapp: true },

  // P2P Marketplace
  { id: 'p2p_vehicle_posted', category: 'P2P Marketplace', title: 'New Vehicle Available', description: 'When a vendor posts a vehicle on P2P', email: false, push: true, sms: false, whatsapp: false },
  { id: 'p2p_booking_posted', category: 'P2P Marketplace', title: 'New Booking Request', description: 'When a vendor posts a booking need', email: false, push: true, sms: false, whatsapp: false },
  { id: 'p2p_request_received', category: 'P2P Marketplace', title: 'Vehicle Request Received', description: 'When someone requests your vehicle', email: true, push: true, sms: false, whatsapp: true },
  { id: 'p2p_request_status', category: 'P2P Marketplace', title: 'Request Status Update', description: 'When your request is accepted or rejected', email: true, push: true, sms: false, whatsapp: true },
  { id: 'p2p_trip_updates', category: 'P2P Marketplace', title: 'Trip Updates', description: 'Trip started, completed, or cancelled', email: true, push: true, sms: true, whatsapp: true },
  { id: 'p2p_rating', category: 'P2P Marketplace', title: 'New P2P Rating', description: 'When a vendor rates your P2P service', email: true, push: true, sms: false, whatsapp: false },

  // Payments
  { id: 'payment_received', category: 'Payments', title: 'Payment Received', description: 'When you receive a payment', email: true, push: true, sms: false, whatsapp: false },
  { id: 'withdrawal_processed', category: 'Payments', title: 'Withdrawal Processed', description: 'When your withdrawal is completed', email: true, push: true, sms: true, whatsapp: false },
  { id: 'invoice_generated', category: 'Payments', title: 'Invoice Generated', description: 'When a new invoice is created', email: true, push: false, sms: false, whatsapp: false },

  // Fleet
  { id: 'document_expiry', category: 'Fleet', title: 'Document Expiry Alert', description: 'Before vehicle documents expire', email: true, push: true, sms: true, whatsapp: true },
  { id: 'maintenance_due', category: 'Fleet', title: 'Maintenance Due', description: 'When vehicle maintenance is due', email: true, push: true, sms: false, whatsapp: true },

  // Staff
  { id: 'driver_assigned', category: 'Staff', title: 'Driver Assigned', description: 'When a driver is assigned to a trip', email: true, push: true, sms: false, whatsapp: true },
  { id: 'attendance_alert', category: 'Staff', title: 'Attendance Alert', description: 'Staff attendance notifications', email: true, push: true, sms: false, whatsapp: false },

  // Reviews
  { id: 'new_review', category: 'Reviews', title: 'New Review', description: 'When you receive a customer review', email: true, push: true, sms: false, whatsapp: false },
  { id: 'low_rating', category: 'Reviews', title: 'Low Rating Alert', description: 'When you receive a low rating', email: true, push: true, sms: false, whatsapp: false },

  // System
  { id: 'system_updates', category: 'System', title: 'System Updates', description: 'Platform updates and announcements', email: true, push: false, sms: false, whatsapp: false },
  { id: 'security_alerts', category: 'System', title: 'Security Alerts', description: 'Login attempts and security notifications', email: true, push: true, sms: true, whatsapp: false },
];

const CATEGORY_CONFIG: Record<string, { icon: any; gradient: string; description: string }> = {
  'Bookings': { icon: Calendar, gradient: 'from-blue-500 to-blue-600', description: 'Booking requests, confirmations & reminders' },
  'P2P Marketplace': { icon: ArrowRightLeft, gradient: 'from-orange-500 to-amber-600', description: 'Vehicle postings, requests & trip updates' },
  'Payments': { icon: DollarSign, gradient: 'from-emerald-500 to-green-600', description: 'Payments, withdrawals & invoices' },
  'Fleet': { icon: Car, gradient: 'from-indigo-500 to-violet-600', description: 'Vehicle documents & maintenance alerts' },
  'Staff': { icon: Users, gradient: 'from-cyan-500 to-teal-600', description: 'Driver assignments & attendance' },
  'Reviews': { icon: Star, gradient: 'from-amber-400 to-orange-500', description: 'Customer reviews & ratings' },
  'System': { icon: Shield, gradient: 'from-slate-500 to-gray-600', description: 'Updates & security notifications' },
};

const CHANNELS = [
  { key: 'email' as const, label: 'Email', icon: Mail, activeColor: 'bg-blue-100 text-blue-600 border-blue-200', gradient: 'from-blue-500 to-blue-600' },
  { key: 'push' as const, label: 'Push', icon: Bell, activeColor: 'bg-purple-100 text-purple-600 border-purple-200', gradient: 'from-purple-500 to-violet-600' },
  { key: 'sms' as const, label: 'SMS', icon: Smartphone, activeColor: 'bg-green-100 text-green-600 border-green-200', gradient: 'from-green-500 to-emerald-600' },
  { key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare, activeColor: 'bg-emerald-100 text-emerald-600 border-emerald-200', gradient: 'from-emerald-500 to-teal-600' },
];

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings);
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: true,
    startTime: '22:00',
    endTime: '07:00',
    exceptUrgent: true,
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    [...new Set(initialSettings.map(s => s.category))]
  );

  const categories = [...new Set(settings.map(s => s.category))];

  const toggleSetting = (id: string, channel: 'email' | 'push' | 'sms' | 'whatsapp') => {
    setSettings(prev => prev.map(s =>
      s.id === id ? { ...s, [channel]: !s[channel] } : s
    ));
    setSaved(false);
  };

  const toggleAllInCategory = (category: string, enable: boolean) => {
    setSettings(prev => prev.map(s =>
      s.category === category ? { ...s, email: enable, push: enable, sms: enable, whatsapp: enable } : s
    ));
    setSaved(false);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalEnabled = settings.reduce((acc, s) => {
    return acc + (s.email ? 1 : 0) + (s.push ? 1 : 0) + (s.sms ? 1 : 0) + (s.whatsapp ? 1 : 0);
  }, 0);
  const totalPossible = settings.length * 4;

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
                <p className="text-blue-200 text-sm">Manage how and when you receive notifications</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                saved
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                  : 'bg-white text-slate-900 hover:bg-gray-100 shadow-white/10'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex gap-4">
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-blue-300 text-xs font-medium mb-1">Categories</p>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-blue-300 text-xs font-medium mb-1">Total Rules</p>
              <p className="text-2xl font-bold text-white">{settings.length}</p>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-blue-300 text-xs font-medium mb-1">Active</p>
              <p className="text-2xl font-bold text-white">{totalEnabled}<span className="text-sm text-blue-300 font-normal">/{totalPossible}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Legend */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Notification Channels
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CHANNELS.map(ch => {
            const Icon = ch.icon;
            const count = settings.filter(s => s[ch.key]).length;
            return (
              <div key={ch.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center shadow-lg shadow-black/10`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{ch.label}</p>
                  <p className="text-xs text-gray-500">{count} active</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Settings Row: Quiet Hours + Sound */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Quiet Hours */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-black/10">
                <Moon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quiet Hours</h3>
                <p className="text-xs text-gray-500">Pause non-urgent alerts</p>
              </div>
            </div>
            <button
              onClick={() => setQuietHours(prev => ({ ...prev, enabled: !prev.enabled }))}
              className="transition-colors"
            >
              {quietHours.enabled ? (
                <ToggleRight className="w-10 h-10 text-blue-600" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-300" />
              )}
            </button>
          </div>

          {quietHours.enabled && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Start</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={quietHours.startTime}
                      onChange={(e) => setQuietHours(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">End</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={quietHours.endTime}
                      onChange={(e) => setQuietHours(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition">
                <input
                  type="checkbox"
                  checked={quietHours.exceptUrgent}
                  onChange={(e) => setQuietHours(prev => ({ ...prev, exceptUrgent: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Allow urgent notifications</span>
              </label>
            </div>
          )}
        </div>

        {/* Sound + Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-black/10">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Notification Sound</h3>
                  <p className="text-xs text-gray-500">Play sound for push notifications</p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="transition-colors"
              >
                {soundEnabled ? (
                  <ToggleRight className="w-10 h-10 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-300" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Important Note</h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  SMS and WhatsApp notifications may have additional carrier charges. Keep your contact details updated in profile settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="space-y-4">
        {categories.map(category => {
          const config = CATEGORY_CONFIG[category] || { icon: Bell, gradient: 'from-gray-400 to-gray-500', description: '' };
          const CatIcon = config.icon;
          const categorySettings = settings.filter(s => s.category === category);
          const isExpanded = expandedCategories.includes(category);
          const enabledCount = categorySettings.reduce((acc, s) => acc + (s.push ? 1 : 0), 0);
          const allEnabled = categorySettings.every(s => s.email && s.push && s.sms && s.whatsapp);

          return (
            <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg shadow-black/10`}>
                    <CatIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-lg">{category}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                    {enabledCount}/{categorySettings.length} push
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* Quick toggle all */}
                  <div className="px-5 py-3 bg-gray-50/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notification Rules</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAllInCategory(category, !allEnabled); }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        allEnabled
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {allEnabled ? 'Disable All' : 'Enable All'}
                    </button>
                  </div>

                  {/* Settings List */}
                  <div className="divide-y divide-gray-100/80">
                    {categorySettings.map(setting => (
                      <div key={setting.id} className="px-5 py-4 hover:bg-blue-50/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-6">
                            <h4 className="font-semibold text-gray-900 text-sm">{setting.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                          </div>

                          {/* Channel Toggles */}
                          <div className="flex items-center gap-2">
                            {CHANNELS.map(ch => {
                              const Icon = ch.icon;
                              const isOn = setting[ch.key];
                              return (
                                <button
                                  key={ch.key}
                                  onClick={() => toggleSetting(setting.id, ch.key)}
                                  className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
                                    isOn
                                      ? `${ch.activeColor} border-current shadow-sm`
                                      : 'bg-gray-50 text-gray-300 border-gray-200 hover:bg-gray-100 hover:text-gray-400'
                                  }`}
                                  title={`${ch.label}: ${isOn ? 'ON' : 'OFF'}`}
                                >
                                  <Icon className="w-4 h-4" />
                                  {isOn && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Save Bar (mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-200 z-50">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-lg ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Bottom spacer for mobile floating bar */}
      <div className="h-20 md:hidden" />
    </div>
  );
}

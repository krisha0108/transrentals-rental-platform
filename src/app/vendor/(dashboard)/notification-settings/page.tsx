'use client';

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Volume2,
  VolumeX,
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
  Sun,
  Globe
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

// Mock notification settings
const initialSettings: NotificationSetting[] = [
  // Bookings
  { id: 'new_booking', category: 'Bookings', title: 'New Booking Request', description: 'When you receive a new booking request', email: true, push: true, sms: true, whatsapp: true },
  { id: 'booking_confirmed', category: 'Bookings', title: 'Booking Confirmed', description: 'When a booking is confirmed', email: true, push: true, sms: false, whatsapp: true },
  { id: 'booking_cancelled', category: 'Bookings', title: 'Booking Cancelled', description: 'When a booking is cancelled', email: true, push: true, sms: true, whatsapp: true },
  { id: 'booking_reminder', category: 'Bookings', title: 'Upcoming Booking Reminder', description: 'Reminder before scheduled trips', email: true, push: true, sms: false, whatsapp: true },

  // Payments
  { id: 'payment_received', category: 'Payments', title: 'Payment Received', description: 'When you receive a payment', email: true, push: true, sms: false, whatsapp: false },
  { id: 'withdrawal_processed', category: 'Payments', title: 'Withdrawal Processed', description: 'When your withdrawal is completed', email: true, push: true, sms: true, whatsapp: false },
  { id: 'invoice_generated', category: 'Payments', title: 'Invoice Generated', description: 'When a new invoice is created', email: true, push: false, sms: false, whatsapp: false },

  // Fleet & Maintenance
  { id: 'document_expiry', category: 'Fleet', title: 'Document Expiry Alert', description: 'Before vehicle documents expire', email: true, push: true, sms: true, whatsapp: true },
  { id: 'maintenance_due', category: 'Fleet', title: 'Maintenance Due', description: 'When vehicle maintenance is due', email: true, push: true, sms: false, whatsapp: true },
  { id: 'low_fuel', category: 'Fleet', title: 'Low Fuel Alert', description: 'When vehicle fuel is low', email: false, push: true, sms: false, whatsapp: false },

  // Staff
  { id: 'driver_assigned', category: 'Staff', title: 'Driver Assigned', description: 'When a driver is assigned to a trip', email: true, push: true, sms: false, whatsapp: true },
  { id: 'attendance_alert', category: 'Staff', title: 'Attendance Alert', description: 'Staff attendance notifications', email: true, push: true, sms: false, whatsapp: false },

  // Reviews & Ratings
  { id: 'new_review', category: 'Reviews', title: 'New Review', description: 'When you receive a customer review', email: true, push: true, sms: false, whatsapp: false },
  { id: 'low_rating', category: 'Reviews', title: 'Low Rating Alert', description: 'When you receive a low rating', email: true, push: true, sms: false, whatsapp: false },

  // System
  { id: 'system_updates', category: 'System', title: 'System Updates', description: 'Platform updates and announcements', email: true, push: false, sms: false, whatsapp: false },
  { id: 'security_alerts', category: 'System', title: 'Security Alerts', description: 'Login attempts and security notifications', email: true, push: true, sms: true, whatsapp: false }
];

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings);
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: true,
    startTime: '22:00',
    endTime: '07:00',
    exceptUrgent: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const categories = [...new Set(settings.map(s => s.category))];

  const toggleSetting = (id: string, channel: 'email' | 'push' | 'sms' | 'whatsapp') => {
    setSettings(prev => prev.map(s =>
      s.id === id ? { ...s, [channel]: !s[channel] } : s
    ));
    setSaved(false);
  };

  const toggleAllInCategory = (category: string, channel: 'email' | 'push' | 'sms' | 'whatsapp', value: boolean) => {
    setSettings(prev => prev.map(s =>
      s.category === category ? { ...s, [channel]: value } : s
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bookings': return Calendar;
      case 'Payments': return DollarSign;
      case 'Fleet': return Car;
      case 'Staff': return Users;
      case 'Reviews': return MessageSquare;
      case 'System': return Settings;
      default: return Bell;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600 mt-1">Manage how and when you receive notifications</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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

      {/* Channel Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Notification Channels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Email</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Push Notification</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">SMS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-600">WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Moon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Quiet Hours</h3>
              <p className="text-sm text-gray-500">Pause non-urgent notifications during specific hours</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={quietHours.enabled}
              onChange={(e) => setQuietHours(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {quietHours.enabled && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={quietHours.startTime}
                onChange={(e) => setQuietHours(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={quietHours.endTime}
                onChange={(e) => setQuietHours(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quietHours.exceptUrgent}
                  onChange={(e) => setQuietHours(prev => ({ ...prev, exceptUrgent: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Except urgent notifications</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Notification Categories */}
      <div className="space-y-6">
        {categories.map(category => {
          const CategoryIcon = getCategoryIcon(category);
          const categorySettings = settings.filter(s => s.category === category);

          return (
            <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <CategoryIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                  </div>

                  {/* Quick toggles for category */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAllInCategory(category, 'email', true)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Enable all emails"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleAllInCategory(category, 'push', true)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                      title="Enable all push"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings List */}
              <div className="divide-y divide-gray-100">
                {categorySettings.map(setting => (
                  <div key={setting.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <h4 className="font-medium text-gray-900">{setting.title}</h4>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>

                      {/* Channel Toggles */}
                      <div className="flex items-center gap-3">
                        {/* Email */}
                        <button
                          onClick={() => toggleSetting(setting.id, 'email')}
                          className={`p-2 rounded-lg transition-colors ${
                            setting.email ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        {/* Push */}
                        <button
                          onClick={() => toggleSetting(setting.id, 'push')}
                          className={`p-2 rounded-lg transition-colors ${
                            setting.push ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title="Push Notification"
                        >
                          <Bell className="w-4 h-4" />
                        </button>

                        {/* SMS */}
                        <button
                          onClick={() => toggleSetting(setting.id, 'sms')}
                          className={`p-2 rounded-lg transition-colors ${
                            setting.sms ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title="SMS"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>

                        {/* WhatsApp */}
                        <button
                          onClick={() => toggleSetting(setting.id, 'whatsapp')}
                          className={`p-2 rounded-lg transition-colors ${
                            setting.whatsapp ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sound Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Volume2 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Notification Sound</h3>
              <p className="text-sm text-gray-500">Play sound for push notifications</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Note</h4>
            <p className="text-sm text-blue-700 mt-1">
              SMS and WhatsApp notifications may have additional carrier charges.
              Make sure your contact details are up to date in your profile settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

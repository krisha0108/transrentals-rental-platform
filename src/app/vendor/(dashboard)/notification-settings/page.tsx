'use client';

import React, { useState } from 'react';
import {
  Bell,
  BellRing,
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
  { key: 'email' as const, label: 'Email', icon: Mail, activeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
  { key: 'push' as const, label: 'Push', icon: Bell, activeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200', gradient: 'from-emerald-600 to-teal-600' },
  { key: 'sms' as const, label: 'SMS', icon: Smartphone, activeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200', gradient: 'from-teal-500 to-emerald-600' },
  { key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare, activeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200', gradient: 'from-green-500 to-emerald-600' },
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
    <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.08); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(6px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes bubble-rise-1 {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
        }
        @keyframes bubble-rise-2 {
          0% { opacity: 0; transform: translateY(0) scale(0.3); }
          30% { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(-60px) scale(1); }
        }
        @keyframes bubble-drift {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          30% { opacity: 0.6; }
          100% { opacity: 0; transform: translate(20px, -50px) scale(0.9); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glow-emerald {
          0%, 100% { box-shadow: 0 0 8px rgba(5,150,105,0.3); }
          50% { box-shadow: 0 0 20px rgba(5,150,105,0.5); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .anim-fade-up { animation: fade-up 0.5s ease-out both; }
        .anim-scale-in { animation: scale-in 0.4s ease-out both; }
        .anim-bounce-in { animation: bounce-in 0.6s ease-out both; }
        .anim-float-slow { animation: float-slow 4s ease-in-out infinite; }
        .anim-float-rev { animation: float-rev 3.5s ease-in-out infinite; }
        .anim-slide-left { animation: slide-in-left 0.5s ease-out both; }
        .anim-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease infinite;
        }
        .anim-shimmer {
          animation: shimmer-sweep 3s ease-in-out infinite;
        }
        .anim-glow { animation: glow-emerald 2s ease-in-out infinite; }
      `}</style>

      <div className="w-full">
        {/* Hero Header - Animated Emerald */}
        <div className="anim-gradient-x relative overflow-hidden rounded-2xl p-5 sm:p-6 mb-5" style={{ background: 'linear-gradient(135deg, #059669, #047857, #065f46, #059669)' }}>
          {/* Shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="anim-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Floating filled bubbles - right side */}
          <div className="absolute right-8 top-4 w-16 h-16 rounded-full bg-white/[0.07]" style={{ animation: 'float-slow 5s ease-in-out infinite' }} />
          <div className="absolute right-28 bottom-3 w-10 h-10 rounded-full bg-white/[0.05]" style={{ animation: 'float-rev 4s ease-in-out infinite' }} />
          <div className="absolute right-16 top-1/2 w-6 h-6 rounded-full bg-white/[0.08]" style={{ animation: 'float-slow 3s ease-in-out infinite 0.5s' }} />

          {/* Sparkle dots */}
          <div className="absolute right-12 top-6 w-1.5 h-1.5 rounded-full bg-white/70" style={{ animation: 'sparkle 2s ease-in-out infinite' }} />
          <div className="absolute right-24 top-10 w-1 h-1 rounded-full bg-white/60" style={{ animation: 'sparkle 2.5s ease-in-out infinite 0.5s' }} />
          <div className="absolute right-36 bottom-6 w-1.5 h-1.5 rounded-full bg-white/50" style={{ animation: 'sparkle 3s ease-in-out infinite 1s' }} />

          {/* Rising bubbles */}
          <div className="absolute right-20 bottom-0 w-3 h-3 rounded-full bg-white/20" style={{ animation: 'bubble-rise-1 4s ease-out infinite' }} />
          <div className="absolute right-32 bottom-0 w-2 h-2 rounded-full bg-white/15" style={{ animation: 'bubble-rise-2 5s ease-out infinite 1s' }} />
          <div className="absolute right-10 bottom-0 w-2.5 h-2.5 rounded-full bg-white/10" style={{ animation: 'bubble-drift 4.5s ease-out infinite 2s' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Glassmorphic icon badge */}
                <div className="anim-bounce-in w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <BellRing className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="anim-slide-left text-lg sm:text-xl font-bold text-white">Notification Settings</h1>
                  <p className="anim-slide-left text-[11px] text-white/60" style={{ animationDelay: '0.1s' }}>Manage how and when you receive notifications</p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  saved
                    ? 'bg-white text-emerald-700 shadow-lg shadow-emerald-900/20'
                    : 'bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25'
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
            <div className="flex gap-3 mt-4">
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10" style={{ animation: 'fade-up 0.5s ease-out both 0.15s' }}>
                <p className="text-emerald-200 text-[10px] font-medium mb-0.5">Categories</p>
                <p className="text-xl font-bold text-white">{categories.length}</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10" style={{ animation: 'fade-up 0.5s ease-out both 0.25s' }}>
                <p className="text-emerald-200 text-[10px] font-medium mb-0.5">Total Rules</p>
                <p className="text-xl font-bold text-white">{settings.length}</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10" style={{ animation: 'fade-up 0.5s ease-out both 0.35s' }}>
                <p className="text-emerald-200 text-[10px] font-medium mb-0.5">Active</p>
                <p className="text-xl font-bold text-white">{totalEnabled}<span className="text-sm text-emerald-200 font-normal">/{totalPossible}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Legend — alive */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 mb-5 hover:shadow-xl transition-shadow duration-300" style={{ animation: 'fade-up 0.5s ease-out both 0.2s' }}>
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            Notification Channels
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CHANNELS.map((ch, i) => {
              const Icon = ch.icon;
              const count = settings.filter(s => s[ch.key]).length;
              return (
                <div key={ch.key} className="group relative flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 overflow-hidden" style={{ animation: `fade-up 0.4s ease-out both ${0.3 + i * 0.08}s` }}>
                  <div className="absolute -right-3 -top-3 w-14 h-14 bg-emerald-100 rounded-full opacity-0 group-hover:opacity-60 group-hover:scale-150 transition-all duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center shadow-md shadow-emerald-200/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="relative">
                    <p className="text-sm font-semibold text-gray-900">{ch.label}</p>
                    <p className="text-xs text-gray-400">{count} active</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Settings Row: Quiet Hours + Sound */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Quiet Hours */}
          <div className="group bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden" style={{ animation: 'fade-up 0.5s ease-out both 0.3s' }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-60 group-hover:scale-150 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Moon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Quiet Hours</h3>
                  <p className="text-xs text-gray-400">Pause non-urgent alerts</p>
                </div>
              </div>
              <button
                onClick={() => setQuietHours(prev => ({ ...prev, enabled: !prev.enabled }))}
                className="transition-colors"
              >
                {quietHours.enabled ? (
                  <ToggleRight className="w-10 h-10 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-300" />
                )}
              </button>
            </div>

            {quietHours.enabled && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Start</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={quietHours.startTime}
                        onChange={(e) => setQuietHours(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">End</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={quietHours.endTime}
                        onChange={(e) => setQuietHours(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-emerald-50/50 rounded-lg transition">
                  <input
                    type="checkbox"
                    checked={quietHours.exceptUrgent}
                    onChange={(e) => setQuietHours(prev => ({ ...prev, exceptUrgent: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-600">Allow urgent notifications</span>
                </label>
              </div>
            )}
          </div>

          {/* Sound + Info */}
          <div className="space-y-4">
            <div className="group bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden" style={{ animation: 'fade-up 0.5s ease-out both 0.35s' }}>
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-60 group-hover:scale-150 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Notification Sound</h3>
                    <p className="text-xs text-gray-400">Play sound for push notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="transition-colors"
                >
                  {soundEnabled ? (
                    <ToggleRight className="w-10 h-10 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5" style={{ animation: 'fade-up 0.5s ease-out both 0.4s' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Important Note</h4>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    SMS and WhatsApp notifications may have additional carrier charges. Keep your contact details updated in profile settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Categories */}
        <div className="space-y-4">
          {categories.map((category, catIdx) => {
            const config = CATEGORY_CONFIG[category] || { icon: Bell, gradient: 'from-gray-400 to-gray-500', description: '' };
            const CatIcon = config.icon;
            const categorySettings = settings.filter(s => s.category === category);
            const isExpanded = expandedCategories.includes(category);
            const enabledCount = categorySettings.reduce((acc, s) => acc + (s.push ? 1 : 0), 0);
            const allEnabled = categorySettings.every(s => s.email && s.push && s.sms && s.whatsapp);

            return (
              <div key={category} className="group/cat bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-xl transition-all duration-300 relative" style={{ animation: `fade-up 0.5s ease-out both ${0.3 + catIdx * 0.07}s` }}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-5 flex items-center justify-between hover:bg-emerald-50/30 transition-colors relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-50/40 to-transparent translate-x-[-100%] group-hover/cat:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="relative flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md group-hover/cat:scale-110 group-hover/cat:rotate-6 transition-all duration-300`}>
                      <CatIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900">{category}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
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
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Notification Rules</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAllInCategory(category, !allEnabled); }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          allEnabled
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {allEnabled ? 'Disable All' : 'Enable All'}
                      </button>
                    </div>

                    {/* Settings List */}
                    <div className="divide-y divide-gray-100/80">
                      {categorySettings.map((setting, sIdx) => (
                        <div key={setting.id} className="px-5 py-4 hover:bg-emerald-50/20 transition-colors" style={{ animation: `fade-up 0.35s ease-out both ${sIdx * 0.06}s` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-6">
                              <h4 className="text-sm font-semibold text-gray-900">{setting.title}</h4>
                              <p className="text-xs text-gray-400 mt-0.5">{setting.description}</p>
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
                                    className={`relative p-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                                      isOn
                                        ? `${ch.activeColor} border-current shadow-sm`
                                        : 'bg-gray-50 text-gray-300 border-gray-200 hover:bg-gray-100 hover:text-gray-400'
                                    }`}
                                    title={`${ch.label}: ${isOn ? 'ON' : 'OFF'}`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    {isOn && (
                                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
                                      </span>
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
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-md active:scale-[0.98] ${
              saved
                ? 'bg-emerald-500 text-white shadow-emerald-200/50'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50'
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
    </div>
  );
}

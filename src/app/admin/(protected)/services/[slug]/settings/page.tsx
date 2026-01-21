'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Save,
  AlertCircle,
  Loader2,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  ToggleLeft,
  Clock,
  Shield,
  Bell,
  CreditCard,
  FileText,
  Mail,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { FLOW_TYPE_CONFIG } from '@/lib/constants/booking-services';
import { Button } from '@/components/ui/button';

interface ServiceSettings {
  // General
  isEnabled: boolean;
  isFeatured: boolean;
  displayOrder: number;

  // Booking
  allowOnlineBooking: boolean;
  requireVerification: boolean;
  requireDeposit: boolean;
  depositAmount: number;
  minBookingHours: number;
  maxBookingDays: number;
  advanceBookingDays: number;
  cancellationHours: number;

  // Display
  showPricing: boolean;
  showReviews: boolean;
  showVendorInfo: boolean;
  showAvailability: boolean;

  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  adminAlerts: boolean;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Bike,
  CarTaxiFront,
  Crown,
  Bus,
  Truck,
  Package,
  Wrench,
};

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  flowType?: string;
}

export default function ServiceSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceData | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const ServiceIcon = service ? IconMap[service.icon || ''] || Car : Car;

  // Fetch service from database
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/admin/services?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setService(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setServiceLoading(false);
      }
    };
    fetchService();
  }, [slug]);

  const [settings, setSettings] = useState<ServiceSettings>({
    isEnabled: true,
    isFeatured: false,
    displayOrder: 1,
    allowOnlineBooking: true,
    requireVerification: false,
    requireDeposit: true,
    depositAmount: 2000,
    minBookingHours: 4,
    maxBookingDays: 30,
    advanceBookingDays: 90,
    cancellationHours: 24,
    showPricing: true,
    showReviews: true,
    showVendorInfo: true,
    showAvailability: true,
    emailNotifications: true,
    smsNotifications: true,
    adminAlerts: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/services/${slug}/settings`);
        if (res.ok) {
          const data = await res.json();
          setSettings({
            isEnabled: data.settings.isEnabled ?? true,
            isFeatured: data.settings.isFeatured ?? false,
            displayOrder: data.settings.displayOrder ?? 1,
            allowOnlineBooking: data.settings.allowOnlineBooking ?? true,
            requireVerification: data.settings.requireVerification ?? false,
            requireDeposit: data.settings.requireDeposit ?? true,
            depositAmount: data.settings.depositAmount ?? 2000,
            minBookingHours: data.settings.minBookingHours ?? 4,
            maxBookingDays: data.settings.maxBookingDays ?? 30,
            advanceBookingDays: data.settings.advanceBookingDays ?? 90,
            cancellationHours: data.settings.cancellationHours ?? 24,
            showPricing: data.settings.showPricing ?? true,
            showReviews: data.settings.showReviews ?? true,
            showVendorInfo: data.settings.showVendorInfo ?? true,
            showAvailability: data.settings.showAvailability ?? true,
            emailNotifications: data.settings.emailNotifications ?? true,
            smsNotifications: data.settings.smsNotifications ?? true,
            adminAlerts: data.settings.adminAlerts ?? true,
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchSettings();
    }
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${slug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof ServiceSettings>(key: K, value: ServiceSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Link href="/admin/services" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Not Found</h3>
          <p className="text-gray-500">The service &quot;{slug}&quot; does not exist.</p>
        </div>
      </div>
    );
  }

  const flowConfig = FLOW_TYPE_CONFIG[service.flowType || 'BROWSE_FIRST'];

  const SettingToggle = ({
    label,
    description,
    value,
    onChange,
    icon: Icon,
  }: {
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
    icon?: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-500" />
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/services/${slug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {service.name}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center text-white">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Settings</h1>
              <p className="text-gray-600">{service.name}</p>
            </div>
          </div>
        </div>
        <Button
          disabled={!hasChanges || saving}
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Flow Type Info */}
      <div className={`rounded-lg p-4 ${flowConfig.color} flex items-center gap-3`}>
        <Info className="w-5 h-5" />
        <div>
          <span className="font-medium">{flowConfig.label}</span>
          <span className="mx-2">-</span>
          <span>{flowConfig.description}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 border flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ToggleLeft className="w-5 h-5 text-gray-400" />
              General Settings
            </h3>
            <div className="space-y-3">
              <SettingToggle
                label="Enable Service"
                description="Show this service on the website"
                value={settings.isEnabled}
                onChange={(v) => updateSetting('isEnabled', v)}
              />
              <SettingToggle
                label="Featured Service"
                description="Display on homepage featured section"
                value={settings.isFeatured}
                onChange={(v) => updateSetting('isFeatured', v)}
              />
              <div className="p-4 border rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                <input
                  type="number"
                  value={settings.displayOrder}
                  onChange={(e) => updateSetting('displayOrder', Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={1}
                  max={100}
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>
            </div>
          </div>

          {/* Booking Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              Booking Settings
            </h3>
            <div className="space-y-3">
              <SettingToggle
                label="Allow Online Booking"
                description="Enable instant booking for this service"
                value={settings.allowOnlineBooking}
                onChange={(v) => updateSetting('allowOnlineBooking', v)}
              />
              <SettingToggle
                label="Require ID Verification"
                description="Customers must verify ID before booking"
                value={settings.requireVerification}
                onChange={(v) => updateSetting('requireVerification', v)}
                icon={Shield}
              />
              <SettingToggle
                label="Require Security Deposit"
                description="Collect deposit at time of booking"
                value={settings.requireDeposit}
                onChange={(v) => updateSetting('requireDeposit', v)}
              />
              {settings.requireDeposit && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (₹)</label>
                  <input
                    type="number"
                    value={settings.depositAmount}
                    onChange={(e) => updateSetting('depositAmount', Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Time Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Time & Duration Settings
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Booking (hours)</label>
                  <input
                    type="number"
                    value={settings.minBookingHours}
                    onChange={(e) => updateSetting('minBookingHours', Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Booking (days)</label>
                  <input
                    type="number"
                    value={settings.maxBookingDays}
                    onChange={(e) => updateSetting('maxBookingDays', Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Advance Booking (days)</label>
                  <input
                    type="number"
                    value={settings.advanceBookingDays}
                    onChange={(e) => updateSetting('advanceBookingDays', Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={1}
                  />
                  <p className="text-xs text-gray-500 mt-1">How far ahead can book</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation (hours)</label>
                  <input
                    type="number"
                    value={settings.cancellationHours}
                    onChange={(e) => updateSetting('cancellationHours', Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">Free cancellation window</p>
                </div>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Display Settings
            </h3>
            <div className="space-y-3">
              <SettingToggle
                label="Show Pricing"
                description="Display prices on service pages"
                value={settings.showPricing}
                onChange={(v) => updateSetting('showPricing', v)}
              />
              <SettingToggle
                label="Show Reviews"
                description="Allow customers to view/leave reviews"
                value={settings.showReviews}
                onChange={(v) => updateSetting('showReviews', v)}
              />
              <SettingToggle
                label="Show Vendor Info"
                description="Display vendor details to customers"
                value={settings.showVendorInfo}
                onChange={(v) => updateSetting('showVendorInfo', v)}
              />
              <SettingToggle
                label="Show Availability"
                description="Real-time availability on listing"
                value={settings.showAvailability}
                onChange={(v) => updateSetting('showAvailability', v)}
              />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-400" />
              Notification Settings
            </h3>
            <div className="space-y-3">
              <SettingToggle
                label="Email Notifications"
                description="Send booking emails to customers"
                value={settings.emailNotifications}
                onChange={(v) => updateSetting('emailNotifications', v)}
                icon={Mail}
              />
              <SettingToggle
                label="SMS Notifications"
                description="Send SMS alerts for bookings"
                value={settings.smsNotifications}
                onChange={(v) => updateSetting('smsNotifications', v)}
                icon={MessageSquare}
              />
              <SettingToggle
                label="Admin Alerts"
                description="Notify admins of new bookings"
                value={settings.adminAlerts}
                onChange={(v) => updateSetting('adminAlerts', v)}
                icon={Bell}
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800 mb-3">
                  Disabling or deleting a service will affect all associated bookings, fleet, and vendor mappings.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => updateSetting('isEnabled', false)}
                  >
                    Disable Service
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-100"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Service
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete {service.name}?</h3>
              <p className="text-gray-500 mb-6">
                This action cannot be undone. All associated fleet, bookings, and vendor mappings will be removed.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700">Delete Service</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

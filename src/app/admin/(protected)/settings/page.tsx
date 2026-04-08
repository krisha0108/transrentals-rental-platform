'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe, Share2, Mail, Loader2, CheckCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/lib/contact';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'TransRentals',
    siteTagline: "India's Largest Vehicle Rental Marketplace",
    contactEmail: CONTACT_EMAIL,
    contactPhone: CONTACT_PHONE,
    facebookUrl: 'https://facebook.com/transrentals',
    instagramUrl: 'https://instagram.com/transrentals',
    twitterUrl: 'https://twitter.com/transrentals',
    linkedinUrl: 'https://linkedin.com/company/transrentals',
    defaultMetaTitle: 'TransRentals - Vehicle Rental Marketplace',
    defaultMetaDescription: 'Rent cars, bikes, buses and more across India',
    // Customer App Version
    app_latest_version: '3.3',
    app_force_update: 'false',
    app_update_message: 'New features and improvements available.',
    // Vendor App Version
    vendor_app_latest_version: '4.0.0',
    vendor_app_force_update: 'false',
    vendor_app_update_message: 'New features and improvements available.',
    // Driver App Version
    driver_app_latest_version: '1.0.0',
    driver_app_force_update: 'false',
    driver_app_update_message: 'New features and improvements available.',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your website settings</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Settings saved successfully!
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
            <p className="text-sm text-gray-600">Basic website information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={settings.siteTagline}
                onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Settings */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
            <p className="text-sm text-gray-600">How customers can reach you</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Share2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Social Media</h2>
            <p className="text-sm text-gray-600">Your social media profiles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'facebookUrl', label: 'Facebook URL' },
            { key: 'instagramUrl', label: 'Instagram URL' },
            { key: 'twitterUrl', label: 'Twitter URL' },
            { key: 'linkedinUrl', label: 'LinkedIn URL' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <input
                type="url"
                value={(settings as any)[field.key]}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://"
              />
            </div>
          ))}
        </div>
      </div>

      {/* SEO Defaults */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">SEO Defaults</h2>
            <p className="text-sm text-gray-600">Default meta tags for pages</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Meta Title
            </label>
            <input
              type="text"
              value={settings.defaultMetaTitle}
              onChange={(e) => setSettings({ ...settings, defaultMetaTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Meta Description
            </label>
            <textarea
              value={settings.defaultMetaDescription}
              onChange={(e) => setSettings({ ...settings, defaultMetaDescription: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Mobile App Versions */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mobile App Versions</h2>
            <p className="text-sm text-gray-600">Control app update prompts without redeploying</p>
          </div>
        </div>

        {/* Customer App */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg inline-block mb-4">Customer App</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latest Version</label>
                <input
                  type="text"
                  value={(settings as any).app_latest_version}
                  onChange={(e) => setSettings({ ...settings, app_latest_version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 3.4"
                />
                <p className="text-xs text-gray-500 mt-1">Version on Play Store</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Force Update</label>
                <select
                  value={(settings as any).app_force_update}
                  onChange={(e) => setSettings({ ...settings, app_force_update: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="false">No — User can skip</option>
                  <option value="true">Yes — Must update</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Message</label>
              <textarea
                value={(settings as any).app_update_message}
                onChange={(e) => setSettings({ ...settings, app_update_message: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What's new in this version..."
              />
            </div>
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Vendor App */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg inline-block mb-4">Vendor App</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latest Version</label>
                <input
                  type="text"
                  value={(settings as any).vendor_app_latest_version}
                  onChange={(e) => setSettings({ ...settings, vendor_app_latest_version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 4.1.0"
                />
                <p className="text-xs text-gray-500 mt-1">Version on Play Store</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Force Update</label>
                <select
                  value={(settings as any).vendor_app_force_update}
                  onChange={(e) => setSettings({ ...settings, vendor_app_force_update: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="false">No — User can skip</option>
                  <option value="true">Yes — Must update</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Message</label>
              <textarea
                value={(settings as any).vendor_app_update_message}
                onChange={(e) => setSettings({ ...settings, vendor_app_update_message: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What's new in this version..."
              />
            </div>
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Driver App */}
        <div>
          <h3 className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg inline-block mb-4">Driver App</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latest Version</label>
                <input
                  type="text"
                  value={(settings as any).driver_app_latest_version}
                  onChange={(e) => setSettings({ ...settings, driver_app_latest_version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. 1.0.0"
                />
                <p className="text-xs text-gray-500 mt-1">Version on Play Store</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Force Update</label>
                <select
                  value={(settings as any).driver_app_force_update}
                  onChange={(e) => setSettings({ ...settings, driver_app_force_update: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="false">No — User can skip</option>
                  <option value="true">Yes — Must update</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Message</label>
              <textarea
                value={(settings as any).driver_app_update_message}
                onChange={(e) => setSettings({ ...settings, driver_app_update_message: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="What's new in this version..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Search,
  TrendingUp,
  Globe,
  Code,
  Facebook,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TrackingSettings {
  // Google
  googleVerificationCode: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  googleAdsId: string;
  googleSearchConsoleId: string;
  // Facebook/Meta
  facebookPixelId: string;
  facebookVerificationCode: string;
  // Microsoft
  bingVerificationCode: string;
  microsoftClarityId: string;
  // Other
  hotjarId: string;
  customHeadScripts: string;
  customBodyScripts: string;
}

const defaultSettings: TrackingSettings = {
  googleVerificationCode: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  googleAdsId: '',
  googleSearchConsoleId: '',
  facebookPixelId: '',
  facebookVerificationCode: '',
  bingVerificationCode: '',
  microsoftClarityId: '',
  hotjarId: '',
  customHeadScripts: '',
  customBodyScripts: '',
};

export default function TrackingSettingsPage() {
  const [settings, setSettings] = useState<TrackingSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({
          ...prev,
          googleVerificationCode: data.googleVerificationCode || '',
          googleAnalyticsId: data.googleAnalyticsId || '',
          googleTagManagerId: data.googleTagManagerId || '',
          googleAdsId: data.googleAdsId || '',
          googleSearchConsoleId: data.googleSearchConsoleId || '',
          facebookPixelId: data.facebookPixelId || '',
          facebookVerificationCode: data.facebookVerificationCode || '',
          bingVerificationCode: data.bingVerificationCode || '',
          microsoftClarityId: data.microsoftClarityId || '',
          hotjarId: data.hotjarId || '',
          customHeadScripts: data.customHeadScripts || '',
          customBodyScripts: data.customBodyScripts || '',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tracking & Analytics</h1>
          <p className="text-gray-600">Configure tracking codes, analytics, and verification tags</p>
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

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Settings saved successfully! Changes will reflect on the website shortly.
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">How it works</p>
            <p className="text-sm text-blue-700 mt-1">
              Add your tracking codes here and they will be automatically injected into every page.
              No code changes required. Changes take effect immediately after saving.
            </p>
          </div>
        </div>
      </div>

      {/* Google Settings */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.26 9.76A7.74 7.74 0 0 1 12 4.5c1.87 0 3.58.66 4.91 1.76L19.74 3.4A11.96 11.96 0 0 0 12 0a12 12 0 0 0-10.73 6.63L5.26 9.76z"/>
              <path fill="#34A853" d="M12 24c3.15 0 5.8-1.03 7.73-2.8l-3.58-2.94c-1.15.77-2.6 1.24-4.15 1.24a7.74 7.74 0 0 1-7.3-5.16l-4.02 3.1A11.99 11.99 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M4.7 14.34A7.66 7.66 0 0 1 4.26 12c0-.82.15-1.6.43-2.34l-4-3.13A11.95 11.95 0 0 0 0 12c0 1.92.46 3.74 1.27 5.34l3.43-2.99z"/>
              <path fill="#4285F4" d="M12 19.5c-3.07 0-5.7-1.64-7.14-4.06l-3.6 2.78A12 12 0 0 0 12 24c2.93 0 5.58-1.04 7.66-2.76l-3.51-2.9c-1.16.7-2.63 1.16-4.15 1.16z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Google</h2>
            <p className="text-sm text-gray-600">Analytics, Search Console, Tag Manager, Ads</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Google Verification */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <Search className="w-4 h-4 inline mr-2" />
                Google Search Console Verification
              </label>
              <Link
                href="https://search.google.com/search-console"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Get Code <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <input
              type="text"
              value={settings.googleVerificationCode}
              onChange={(e) => setSettings({ ...settings, googleVerificationCode: e.target.value })}
              placeholder="e.g., abc123xyz..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Found in Search Console → Settings → Ownership verification → HTML tag (content value)
            </p>
          </div>

          {/* Google Analytics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Google Analytics 4 (GA4) Measurement ID
              </label>
              <Link
                href="https://analytics.google.com/"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Get ID <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <input
              type="text"
              value={settings.googleAnalyticsId}
              onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Found in GA4 → Admin → Data Streams → Web Stream → Measurement ID
            </p>
          </div>

          {/* Google Tag Manager */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <Code className="w-4 h-4 inline mr-2" />
                Google Tag Manager ID
              </label>
              <Link
                href="https://tagmanager.google.com/"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Get ID <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <input
              type="text"
              value={settings.googleTagManagerId}
              onChange={(e) => setSettings({ ...settings, googleTagManagerId: e.target.value })}
              placeholder="GTM-XXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Found in Tag Manager → Container ID (top right)
            </p>
          </div>

          {/* Google Ads */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Google Ads Conversion ID
              </label>
            </div>
            <input
              type="text"
              value={settings.googleAdsId}
              onChange={(e) => setSettings({ ...settings, googleAdsId: e.target.value })}
              placeholder="AW-XXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Meta/Facebook Settings */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Facebook className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Meta / Facebook</h2>
            <p className="text-sm text-gray-600">Pixel tracking and domain verification</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Facebook Pixel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Facebook Pixel ID
              </label>
              <Link
                href="https://business.facebook.com/events_manager"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Get Pixel ID <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <input
              type="text"
              value={settings.facebookPixelId}
              onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })}
              placeholder="XXXXXXXXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Facebook Verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook Domain Verification Code
            </label>
            <input
              type="text"
              value={settings.facebookVerificationCode}
              onChange={(e) => setSettings({ ...settings, facebookVerificationCode: e.target.value })}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Microsoft/Bing Settings */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Microsoft</h2>
            <p className="text-sm text-gray-600">Bing Webmaster Tools and Clarity</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Bing Verification */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Bing Webmaster Verification Code
              </label>
              <Link
                href="https://www.bing.com/webmasters"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Get Code <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <input
              type="text"
              value={settings.bingVerificationCode}
              onChange={(e) => setSettings({ ...settings, bingVerificationCode: e.target.value })}
              placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Microsoft Clarity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Microsoft Clarity Project ID
              </label>
              <Link
                href="https://clarity.microsoft.com/"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Get ID <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <input
              type="text"
              value={settings.microsoftClarityId}
              onChange={(e) => setSettings({ ...settings, microsoftClarityId: e.target.value })}
              placeholder="xxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Free heatmaps and session recordings
            </p>
          </div>
        </div>
      </div>

      {/* Other Analytics */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Other Analytics</h2>
            <p className="text-sm text-gray-600">Hotjar and other tracking tools</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Hotjar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Hotjar Site ID
              </label>
              <Link
                href="https://www.hotjar.com/"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Get ID <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <input
              type="text"
              value={settings.hotjarId}
              onChange={(e) => setSettings({ ...settings, hotjarId: e.target.value })}
              placeholder="XXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Custom Scripts */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileCode className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Custom Scripts</h2>
            <p className="text-sm text-gray-600">Add any custom tracking or third-party scripts</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Head Scripts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Head Scripts
            </label>
            <textarea
              value={settings.customHeadScripts}
              onChange={(e) => setSettings({ ...settings, customHeadScripts: e.target.value })}
              rows={4}
              placeholder="<!-- Paste your script tags here -->"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Scripts added here will be injected into the &lt;head&gt; tag
            </p>
          </div>

          {/* Body Scripts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Body Scripts (End of Body)
            </label>
            <textarea
              value={settings.customBodyScripts}
              onChange={(e) => setSettings({ ...settings, customBodyScripts: e.target.value })}
              rows={4}
              placeholder="<!-- Paste your script tags here -->"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Scripts added here will be injected before the closing &lt;/body&gt; tag
            </p>
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

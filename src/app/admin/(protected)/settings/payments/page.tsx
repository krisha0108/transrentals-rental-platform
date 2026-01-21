'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Save,
  Loader2,
  CheckCircle,
  QrCode,
  Building2,
  Smartphone,
  Percent,
  Info,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentSettings {
  payment_upi_id: string;
  payment_upi_name: string;
  payment_qr_code: string;
  payment_bank_name: string;
  payment_bank_account: string;
  payment_bank_ifsc: string;
  payment_bank_holder: string;
  payment_bank_branch: string;
  payment_instructions: string;
  payment_advance_percent: string;
}

const defaultSettings: PaymentSettings = {
  payment_upi_id: '',
  payment_upi_name: 'TransRentals',
  payment_qr_code: '',
  payment_bank_name: '',
  payment_bank_account: '',
  payment_bank_ifsc: '',
  payment_bank_holder: '',
  payment_bank_branch: '',
  payment_instructions: 'Please pay the advance amount and share the screenshot or transaction ID with us. Your booking will be confirmed once payment is verified.',
  payment_advance_percent: '20',
};

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/payments');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
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
      const response = await fetch('/api/admin/settings/payments', {
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

  const handleChange = (key: keyof PaymentSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Settings</h1>
          <p className="text-gray-600">Configure payment collection details shown to customers</p>
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

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">How Payment Collection Works</p>
          <p className="text-blue-700 text-sm mt-1">
            Customers will see these payment details after booking. They pay via UPI/Bank transfer and
            upload payment proof. You verify and confirm payments from the Payments page.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPI Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">UPI Payment</h2>
              <p className="text-sm text-gray-500">Primary payment method for customers</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
              <input
                type="text"
                value={settings.payment_upi_id}
                onChange={(e) => handleChange('payment_upi_id', e.target.value)}
                placeholder="yourname@upi"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">e.g., transrentals@ybl, 9876543210@paytm</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={settings.payment_upi_name}
                onChange={(e) => handleChange('payment_upi_name', e.target.value)}
                placeholder="Business Name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">QR Code URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.payment_qr_code}
                  onChange={(e) => handleChange('payment_qr_code', e.target.value)}
                  placeholder="https://... or upload"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Upload your UPI QR code image URL</p>
              {settings.payment_qr_code && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg inline-block">
                  <img
                    src={settings.payment_qr_code}
                    alt="UPI QR Code"
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Bank Transfer</h2>
              <p className="text-sm text-gray-500">Alternative payment via NEFT/IMPS</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={settings.payment_bank_name}
                onChange={(e) => handleChange('payment_bank_name', e.target.value)}
                placeholder="e.g., HDFC Bank"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={settings.payment_bank_holder}
                onChange={(e) => handleChange('payment_bank_holder', e.target.value)}
                placeholder="Account holder name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                value={settings.payment_bank_account}
                onChange={(e) => handleChange('payment_bank_account', e.target.value)}
                placeholder="Account number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={settings.payment_bank_ifsc}
                  onChange={(e) => handleChange('payment_bank_ifsc', e.target.value.toUpperCase())}
                  placeholder="HDFC0001234"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input
                  type="text"
                  value={settings.payment_bank_branch}
                  onChange={(e) => handleChange('payment_bank_branch', e.target.value)}
                  placeholder="Branch name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advance Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Percent className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Advance Payment</h2>
              <p className="text-sm text-gray-500">How much advance to collect</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Advance Percentage</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={settings.payment_advance_percent}
                onChange={(e) => handleChange('payment_advance_percent', e.target.value)}
                className="w-24 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
              />
              <span className="text-gray-600">% of total booking amount</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              e.g., For a ₹5,000 booking with 20% advance, customer pays ₹1,000 upfront
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Payment Instructions</h2>
              <p className="text-sm text-gray-500">Shown to customers after booking</p>
            </div>
          </div>

          <div>
            <textarea
              rows={4}
              value={settings.payment_instructions}
              onChange={(e) => handleChange('payment_instructions', e.target.value)}
              placeholder="Instructions for customers..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be displayed to customers on the payment page
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Preview (as seen by customers)</h2>
        <div className="bg-gray-50 rounded-xl p-6 max-w-md">
          <h3 className="font-bold text-gray-900 mb-4">Pay Advance to Confirm Booking</h3>

          {settings.payment_upi_id && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Pay via UPI</p>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-mono text-lg font-semibold text-gray-900">{settings.payment_upi_id}</p>
                <p className="text-sm text-gray-600">{settings.payment_upi_name}</p>
              </div>
            </div>
          )}

          {settings.payment_bank_account && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Or transfer via Bank</p>
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-sm space-y-1">
                <p><span className="text-gray-500">Bank:</span> {settings.payment_bank_name}</p>
                <p><span className="text-gray-500">A/C:</span> {settings.payment_bank_account}</p>
                <p><span className="text-gray-500">IFSC:</span> {settings.payment_bank_ifsc}</p>
                <p><span className="text-gray-500">Name:</span> {settings.payment_bank_holder}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg">
            {settings.payment_instructions}
          </p>
        </div>
      </div>
    </div>
  );
}

// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Car,
  RefreshCw,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  baseAmount: number;
  chauffeurCharges: number;
  decorationCharges: number;
  perKmRate: number | null;
  perHourRate: number | null;
  includedKm: number | null;
  includedHours: number | null;
  extraKmRate: number | null;
  extraHourRate: number | null;
  inclusions: string[];
  exclusions: string[];
  tripTypes: string[];
  occasions: string[];
  isActive: boolean;
  createdAt: string;
}

const VEHICLE_CATEGORIES = [
  { id: 'luxury_sedan', name: 'Luxury Sedan' },
  { id: 'luxury_suv', name: 'Luxury SUV' },
  { id: 'premium_sedan', name: 'Premium Sedan' },
  { id: 'premium_suv', name: 'Premium SUV' },
  { id: 'vintage', name: 'Vintage Car' },
  { id: 'sports', name: 'Sports Car' },
  { id: 'limousine', name: 'Limousine' },
  { id: 'convertible', name: 'Convertible' },
];

const TRIP_TYPES = [
  { id: 'local', name: 'Local' },
  { id: 'outstation', name: 'Outstation' },
  { id: 'airport', name: 'Airport Transfer' },
];

export default function VendorLuxuryTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vendor/luxury-templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError('Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setActionLoading(templateId);
    try {
      const response = await fetch(`/api/vendor/luxury-templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchTemplates();
      } else {
        setError(data.error || 'Failed to delete template');
      }
    } catch (err) {
      setError('Failed to delete template');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (template: Template) => {
    setActionLoading(template.id);
    try {
      const response = await fetch(`/api/vendor/luxury-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(prev => prev.map(t =>
          t.id === template.id ? { ...t, isActive: !t.isActive } : t
        ));
      } else {
        setError(data.error || 'Failed to update template');
      }
    } catch (err) {
      setError('Failed to update template');
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return VEHICLE_CATEGORIES.find((c) => c.id === categoryId)?.name || categoryId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Templates</h1>
            <p className="text-gray-600">Save templates for quick quote creation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTemplates}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <Link
            href="/vendor/luxury/templates/add"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <Crown className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-6">
            Create templates to quickly fill quote details when sending quotes to customers
          </p>
          <Link
            href="/vendor/luxury/templates/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Your First Template
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                template.isActive ? 'border-purple-100' : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-white/80" />
                  <span className="text-sm font-medium text-white/90">
                    {getCategoryName(template.category)}
                  </span>
                </div>
                {template.isActive ? (
                  <span className="text-xs px-2 py-0.5 bg-green-400 text-green-900 rounded-full font-medium">
                    Active
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-gray-300 text-gray-700 rounded-full font-medium">
                    Inactive
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-lg mb-3">{template.name}</h3>

                {/* Pricing */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base Amount</span>
                    <span className="font-semibold text-gray-900">₹{template.baseAmount.toLocaleString()}</span>
                  </div>
                  {template.chauffeurCharges > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Chauffeur</span>
                      <span className="font-medium text-gray-700">+₹{template.chauffeurCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {template.decorationCharges > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Decoration</span>
                      <span className="font-medium text-gray-700">+₹{template.decorationCharges.toLocaleString()}</span>
                    </div>
                  )}
                  {template.extraKmRate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Extra Km</span>
                      <span className="font-medium text-gray-700">₹{template.extraKmRate}/km</span>
                    </div>
                  )}
                </div>

                {/* Trip Types */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tripTypes?.map((tt: string) => (
                    <span
                      key={tt}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                    >
                      {TRIP_TYPES.find((t) => t.id === tt)?.name || tt}
                    </span>
                  ))}
                </div>

                {/* Inclusions Preview */}
                {template.inclusions?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Includes:</p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {template.inclusions.slice(0, 3).join(', ')}
                      {template.inclusions.length > 3 && ` +${template.inclusions.length - 3} more`}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleActive(template)}
                    disabled={actionLoading === template.id}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg flex items-center justify-center gap-1 transition ${
                      template.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {actionLoading === template.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : template.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Inactive
                      </>
                    )}
                  </button>
                  <Link
                    href={`/vendor/luxury/templates/${template.id}/edit`}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={actionLoading === template.id}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1"
                  >
                    {actionLoading === template.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

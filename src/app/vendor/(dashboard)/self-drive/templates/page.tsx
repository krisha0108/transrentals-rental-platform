'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Car,
  Plus,
  Edit,
  Trash2,
  Copy,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  RefreshCw,
} from 'lucide-react';

const SELF_DRIVE_CATEGORIES = [
  { id: 'hatchback', name: 'Hatchback' },
  { id: 'sedan', name: 'Sedan' },
  { id: 'suv', name: 'SUV' },
  { id: 'muv', name: 'MUV' },
  { id: 'compact-suv', name: 'Compact SUV' },
  { id: 'luxury', name: 'Luxury' },
];

interface SelfDriveTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  vehicleTypes?: string[];
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  dailyRateHint?: number;
  kmLimitPerDayHint?: number;
  extraKmRateHint?: number;
  securityDepositHint?: number;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
}

export default function VendorSelfDriveTemplatesPage() {
  const [templates, setTemplates] = useState<SelfDriveTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      const response = await fetch(`/api/vendor/self-drive-templates?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryLabel = (category: string) => {
    return SELF_DRIVE_CATEGORIES.find((t) => t.id === category)?.name || category;
  };

  const toggleActive = async (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    try {
      const response = await fetch(`/api/vendor/self-drive-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Failed to toggle template:', error);
      alert('Failed to update template');
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/vendor/self-drive-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to set default template');
      }
    } catch (error) {
      console.error('Failed to set default:', error);
      alert('Failed to set default template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/vendor/self-drive-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Self-Drive Quote Templates</h1>
            <p className="text-gray-600">Create reusable templates for quick quotes</p>
          </div>
        </div>

        <Link
          href="/vendor/self-drive/templates/create"
          className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            categoryFilter === 'all'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Templates
        </button>
        {SELF_DRIVE_CATEGORIES.map((type) => (
          <button
            key={type.id}
            onClick={() => setCategoryFilter(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              categoryFilter === type.id
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No templates found</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create templates to speed up your quote process
            </p>
            <Link
              href="/vendor/self-drive/templates/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="w-4 h-4" />
              Create Your First Template
            </Link>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              <div className="p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {template.isDefault && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        )}
                        {!template.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{getCategoryLabel(template.category)}</p>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Used {template.usageCount} times
                    </span>
                    <button
                      onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Eye className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Expanded View */}
                {expandedId === template.id && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    {/* Inclusions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Inclusions ({template.inclusions.length})
                      </h4>
                      <ul className="grid md:grid-cols-2 gap-1">
                        {template.inclusions.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Exclusions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Exclusions ({template.exclusions.length})
                      </h4>
                      <ul className="grid md:grid-cols-2 gap-1">
                        {template.exclusions.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-red-500 mt-1">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Terms */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Terms & Conditions ({template.termsConditions.length})
                      </h4>
                      <ul className="space-y-1">
                        {template.termsConditions.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Rate Hints */}
                    <div className="bg-orange-50 rounded-lg p-3 space-y-1">
                      {template.dailyRateHint && (
                        <div className="text-sm text-orange-700">
                          Daily Rate: <strong>₹{template.dailyRateHint.toLocaleString()}/day</strong>
                        </div>
                      )}
                      {template.kmLimitPerDayHint && (
                        <div className="text-sm text-orange-700">
                          KM Limit: <strong>{template.kmLimitPerDayHint} km/day</strong>
                        </div>
                      )}
                      {template.extraKmRateHint && (
                        <div className="text-sm text-orange-700">
                          Extra KM: <strong>₹{template.extraKmRateHint}/km</strong>
                        </div>
                      )}
                      {template.securityDepositHint && (
                        <div className="text-sm text-orange-700">
                          Security Deposit: <strong>₹{template.securityDepositHint.toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  <Link
                    href={`/vendor/self-drive/templates/${template.id}/edit`}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => toggleActive(template.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition flex items-center gap-1 ${
                      template.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {template.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => setAsDefault(template.id)}
                      className="px-3 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-200 transition flex items-center gap-1"
                    >
                      <Star className="w-4 h-4" />
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

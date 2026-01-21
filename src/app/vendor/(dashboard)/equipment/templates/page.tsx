'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Copy,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface EquipmentTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  equipmentTypes?: string[];
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  dailyRateHint?: number;
  weeklyRateHint?: number;
  monthlyRateHint?: number;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
}

const TEMPLATE_CATEGORIES = [
  { id: 'daily', name: 'Daily Rental' },
  { id: 'weekly', name: 'Weekly Rental' },
  { id: 'monthly', name: 'Monthly Rental' },
  { id: 'project', name: 'Project Based' },
];

export default function VendorEquipmentTemplatesPage() {
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/vendor/equipment-templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        setError(data.error || 'Failed to load templates');
      }
    } catch (err) {
      setError('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryLabel = (category: string) => {
    return TEMPLATE_CATEGORIES.find((t) => t.id === category)?.name || category;
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/vendor/equipment-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      const data = await response.json();
      if (data.success) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: !currentActive } : t))
        );
      } else {
        alert(data.error || 'Failed to update template');
      }
    } catch (err) {
      alert('Failed to update template');
    } finally {
      setActionLoading(null);
    }
  };

  const setAsDefault = async (id: string, category: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/vendor/equipment-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await response.json();
      if (data.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.category === category ? { ...t, isDefault: t.id === id } : t
          )
        );
      } else {
        alert(data.error || 'Failed to set default');
      }
    } catch (err) {
      alert('Failed to set default');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setActionLoading(id);
    try {
      const response = await fetch(`/api/vendor/equipment-templates/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch (err) {
      alert('Failed to delete template');
    } finally {
      setActionLoading(null);
    }
  };

  const duplicateTemplate = async (template: EquipmentTemplate) => {
    setActionLoading(template.id);
    try {
      const response = await fetch('/api/vendor/equipment-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          category: template.category,
          description: template.description,
          inclusions: template.inclusions,
          exclusions: template.exclusions,
          termsConditions: template.termsConditions,
          dailyRateHint: template.dailyRateHint,
          weeklyRateHint: template.weeklyRateHint,
          monthlyRateHint: template.monthlyRateHint,
          isActive: true,
          isDefault: false,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTemplates();
      } else {
        alert(data.error || 'Failed to duplicate template');
      }
    } catch (err) {
      alert('Failed to duplicate template');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Templates</h1>
            <p className="text-gray-600">Reusable templates for quick quotes</p>
          </div>
        </div>

        <Link
          href="/vendor/equipment/templates/create"
          className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            categoryFilter === 'all'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Templates
        </button>
        {TEMPLATE_CATEGORIES.map((type) => (
          <button
            key={type.id}
            onClick={() => setCategoryFilter(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              categoryFilter === type.id
                ? 'bg-amber-100 text-amber-700'
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
              href="/vendor/equipment/templates/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Plus className="w-4 h-4" />
              Create Your First Template
            </Link>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                actionLoading === template.id ? 'opacity-50' : ''
              }`}
            >
              <div className="p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-amber-600" />
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
                        Inclusions ({template.inclusions?.length || 0})
                      </h4>
                      <ul className="grid md:grid-cols-2 gap-1">
                        {template.inclusions?.map((item, idx) => (
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
                        Exclusions ({template.exclusions?.length || 0})
                      </h4>
                      <ul className="grid md:grid-cols-2 gap-1">
                        {template.exclusions?.map((item, idx) => (
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
                        Terms & Conditions ({template.termsConditions?.length || 0})
                      </h4>
                      <ul className="space-y-1">
                        {template.termsConditions?.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Rate hints */}
                    <div className="bg-amber-50 rounded-lg p-3 flex flex-wrap gap-4">
                      {template.dailyRateHint && (
                        <span className="text-sm text-amber-700">
                          Daily: <strong>₹{template.dailyRateHint.toLocaleString()}</strong>
                        </span>
                      )}
                      {template.weeklyRateHint && (
                        <span className="text-sm text-amber-700">
                          Weekly: <strong>₹{template.weeklyRateHint.toLocaleString()}</strong>
                        </span>
                      )}
                      {template.monthlyRateHint && (
                        <span className="text-sm text-amber-700">
                          Monthly: <strong>₹{template.monthlyRateHint.toLocaleString()}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  <Link
                    href={`/vendor/equipment/templates/${template.id}/edit`}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => duplicateTemplate(template)}
                    disabled={actionLoading === template.id}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => toggleActive(template.id, template.isActive)}
                    disabled={actionLoading === template.id}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition flex items-center gap-1 disabled:opacity-50 ${
                      template.isActive
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {template.isActive ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </button>
                  {!template.isDefault && template.isActive && (
                    <button
                      onClick={() => setAsDefault(template.id, template.category)}
                      disabled={actionLoading === template.id}
                      className="px-3 py-2 bg-yellow-50 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-100 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <Star className="w-4 h-4" />
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    disabled={actionLoading === template.id}
                    className="px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition flex items-center gap-1 disabled:opacity-50"
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

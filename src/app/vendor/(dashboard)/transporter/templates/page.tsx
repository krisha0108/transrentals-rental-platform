'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Copy,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Star,
  Eye,
} from 'lucide-react';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';

interface TransporterTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  ratePerKm?: number;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
}

export default function VendorTransporterTemplatesPage() {
  const [templates, setTemplates] = useState<TransporterTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendor/truck-templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (id: string) => {
    return TRANSPORTER_CONFIG.categories.find((c) => c.id === id)?.shortName || id;
  };

  const toggleActive = async (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    try {
      const response = await fetch(`/api/vendor/truck-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      const data = await response.json();
      if (data.success) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
        );
      }
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/vendor/truck-templates/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Templates</h1>
            <p className="text-gray-600">Reusable templates for transport quotes</p>
          </div>
        </div>

        <Link
          href="/vendor/transporter/templates/create"
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </Link>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No templates yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create reusable templates to speed up your quote process
            </p>
            <Link
              href="/vendor/transporter/templates/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5" />
              Create Your First Template
            </Link>
          </div>
        ) : (
        templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-xl shadow-sm border overflow-hidden"
          >
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-indigo-600" />
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
                    </div>
                    <p className="text-sm text-gray-500">{getCategoryName(template.category)}</p>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Used {template.usageCount} times</span>
                  <button
                    onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Eye className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {expandedId === template.id && (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Inclusions
                    </h4>
                    <ul className="grid md:grid-cols-2 gap-1">
                      {template.inclusions.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Exclusions
                    </h4>
                    <ul className="grid md:grid-cols-2 gap-1">
                      {template.exclusions.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-red-500">✗</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {template.ratePerKm && (
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <span className="text-sm text-indigo-700">
                        Rate per km: <strong>₹{template.ratePerKm}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                <Link
                  href={`/vendor/transporter/templates/${template.id}/edit`}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => toggleActive(template.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition flex items-center gap-1 ${
                    template.isActive
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {template.isActive ? 'Deactivate' : 'Activate'}
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

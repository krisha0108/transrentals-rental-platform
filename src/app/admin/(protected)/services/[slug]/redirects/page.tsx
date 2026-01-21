'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowRight,
  ArrowRightLeft,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface Redirect {
  id: string;
  source: string;
  destination: string;
  type: '301' | '302' | '307' | '308';
  isActive: boolean;
  hits: number;
  createdAt: string;
}

export default function ServiceRedirectsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    type: '301' as '301' | '302' | '307' | '308',
    isActive: true,
  });

  useEffect(() => {
    fetchRedirects();
  }, [slug]);

  const fetchRedirects = async () => {
    try {
      const response = await fetch(`/api/admin/services/${slug}/redirects`);
      if (response.ok) {
        const data = await response.json();
        setRedirects(data.redirects || []);
        setServiceName(data.serviceName || slug);
      }
    } catch (error) {
      console.error('Failed to fetch redirects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingRedirect
        ? `/api/admin/services/${slug}/redirects/${editingRedirect.id}`
        : `/api/admin/services/${slug}/redirects`;

      const response = await fetch(url, {
        method: editingRedirect ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchRedirects();
        setShowAddModal(false);
        setEditingRedirect(null);
        setFormData({
          source: '',
          destination: '',
          type: '301',
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Failed to save redirect:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redirect?')) return;

    try {
      const response = await fetch(`/api/admin/services/${slug}/redirects/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRedirects();
      }
    } catch (error) {
      console.error('Failed to delete redirect:', error);
    }
  };

  const handleToggleActive = async (redirect: Redirect) => {
    try {
      const response = await fetch(`/api/admin/services/${slug}/redirects/${redirect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !redirect.isActive }),
      });

      if (response.ok) {
        fetchRedirects();
      }
    } catch (error) {
      console.error('Failed to toggle redirect:', error);
    }
  };

  const handleEdit = (redirect: Redirect) => {
    setEditingRedirect(redirect);
    setFormData({
      source: redirect.source,
      destination: redirect.destination,
      type: redirect.type,
      isActive: redirect.isActive,
    });
    setShowAddModal(true);
  };

  const filteredRedirects = redirects.filter(redirect =>
    redirect.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    redirect.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const redirectTypes = [
    { value: '301', label: '301 - Permanent', description: 'SEO-friendly permanent redirect' },
    { value: '302', label: '302 - Temporary', description: 'Temporary redirect' },
    { value: '307', label: '307 - Temporary (Strict)', description: 'Preserves HTTP method' },
    { value: '308', label: '308 - Permanent (Strict)', description: 'Preserves HTTP method' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redirects</h1>
          <p className="text-gray-600 mt-1">Manage URL redirects for {serviceName}</p>
        </div>
        <button
          onClick={() => {
            setEditingRedirect(null);
            setFormData({
              source: '',
              destination: '',
              type: '301',
              isActive: true,
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Redirect
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900">About Redirects</h4>
          <p className="text-sm text-blue-700 mt-1">
            Redirects help manage URL changes and improve SEO. Use 301 redirects for permanent changes and 302 for temporary ones.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search redirects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Redirects List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredRedirects.length === 0 ? (
          <div className="text-center py-12">
            <ArrowRightLeft className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No redirects yet</h3>
            <p className="text-gray-500 mt-1">Create your first redirect to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRedirects.map((redirect) => (
              <div key={redirect.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleActive(redirect)}
                      className={`w-12 h-6 rounded-full transition relative ${
                        redirect.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                        redirect.isActive ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <code className="px-2 py-1 bg-gray-100 rounded text-gray-700 truncate max-w-xs">
                          {redirect.source}
                        </code>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <code className="px-2 py-1 bg-green-50 rounded text-green-700 truncate max-w-xs">
                          {redirect.destination}
                        </code>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                          {redirect.type}
                        </span>
                        <span>{redirect.hits} hits</span>
                        <span>Created {new Date(redirect.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(redirect)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(redirect.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRedirect ? 'Edit Redirect' : 'Add New Redirect'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/old-page"
                />
                <p className="text-xs text-gray-500 mt-1">The URL path to redirect from (relative to service)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/new-page or https://external.com"
                />
                <p className="text-xs text-gray-500 mt-1">The URL to redirect to (can be relative or absolute)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Redirect Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as '301' | '302' | '307' | '308' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {redirectTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {redirectTypes.find(t => t.value === formData.type)?.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Enable this redirect
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRedirect(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingRedirect ? 'Update' : 'Create'} Redirect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

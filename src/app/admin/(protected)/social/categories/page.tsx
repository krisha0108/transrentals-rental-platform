'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, ToggleLeft, ToggleRight, Zap } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSOS: boolean;
  isActive: boolean;
  displayOrder: number;
  _count: { social_posts: number };
}

export default function SocialCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isSOS: false, displayOrder: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/social/categories');
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', description: '', isSOS: false, displayOrder: 0 });
    setError('');
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || '', isSOS: cat.isSOS, displayOrder: cat.displayOrder });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const url = editingId ? `/api/admin/social/categories/${editingId}` : '/api/admin/social/categories';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setShowForm(false);
      fetchCategories();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    await fetch(`/api/admin/social/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    fetchCategories();
  };

  const handleDelete = async (cat: Category) => {
    if (cat._count.social_posts > 0) {
      alert(`Cannot delete "${cat.name}" — it has ${cat._count.social_posts} posts. Deactivate it instead.`);
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    await fetch(`/api/admin/social/categories/${cat.id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage categories for vendor social posts</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. General, SOS, Help Needed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isSOS"
                  checked={form.isSOS}
                  onChange={(e) => setForm({ ...form, isSOS: e.target.checked })}
                  className="h-4 w-4 text-red-600 rounded"
                />
                <label htmlFor="isSOS" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Zap className="h-4 w-4 text-red-500" /> SOS Category (shows as stories)
                </label>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No categories yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first social category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${
                cat.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-lg font-bold text-gray-600 flex-shrink-0">
                {cat.displayOrder}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{cat.name}</span>
                  {cat.isSOS && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <Zap className="h-3 w-3" /> SOS
                    </span>
                  )}
                  {!cat.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Inactive</span>
                  )}
                </div>
                {cat.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{cat.description}</p>}
                <p className="text-xs text-gray-400 mt-0.5">slug: {cat.slug} · {cat._count.social_posts} posts</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(cat)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  title={cat.isActive ? 'Deactivate' : 'Activate'}
                >
                  {cat.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

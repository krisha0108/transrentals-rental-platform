// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Loader2, AlertCircle, X, Check, Tag, ChevronDown, ChevronRight,
  Layers, FolderOpen,
} from 'lucide-react';

interface WanderCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  parentId: string | null;
  createdAt: string;
  _count: { listings: number };
  subCategories?: WanderCategory[];
}

const DEFAULT_ICONS = [
  '🏛️', '🏔️', '🏖️', '🛕', '🦁', '🏯', '⛰️', '🎭',
  '💑', '👨‍👩‍👧', '🍜', '🎒', '🌿', '🌊', '🕉️', '🚵',
  '📸', '🦅', '🏕️', '🌄', '🤿', '🚂', '🎪', '🍷',
];

const emptyForm = { name: '', icon: '', description: '', displayOrder: 0, parentId: '' };

export default function WanderCategoriesPage() {
  const [categories, setCategories] = useState<WanderCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/wander/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  function openCreate(parentId = '') {
    setEditingId(null);
    setForm({ ...emptyForm, parentId, displayOrder: parentId ? 0 : categories.length });
    setError('');
    setShowForm(true);
    if (parentId) setExpanded(prev => new Set([...prev, parentId]));
  }

  function openEdit(cat: WanderCategory) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      icon: cat.icon || '',
      description: cat.description || '',
      displayOrder: cat.displayOrder,
      parentId: cat.parentId || '',
    });
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/admin/wander/categories/${editingId}` : '/api/admin/wander/categories';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      await fetchCategories();
      closeForm();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: WanderCategory) {
    try {
      await fetch(`/api/admin/wander/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      await fetchCategories();
    } catch {
      setError('Failed to update status');
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/wander/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to delete'); setSaving(false); return; }
      await fetchCategories();
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete');
    } finally {
      setSaving(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const formParentCat = categories.find(c => c.id === form.parentId);
  const isSubForm = !!form.parentId;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tour Categories</h1>
            <p className="text-sm text-gray-500">Manage categories &amp; sub-categories for Wander tours</p>
          </div>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Global error */}
      {error && !showForm && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900">
                {editingId ? 'Edit' : 'New'} {isSubForm ? 'Sub-Category' : 'Category'}
              </h2>
              {isSubForm && formParentCat && (
                <p className="text-xs text-indigo-600 mt-0.5">
                  Under: {formParentCat.icon} {formParentCat.name}
                </p>
              )}
            </div>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isSubForm ? 'Sub-Category' : 'Category'} Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder={isSubForm ? 'e.g. Trekking, Rock Climbing' : 'e.g. Adventure, Beach & Coastal'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Parent category selector (only when creating, not editing sub) */}
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.parentId}
                  onChange={e => setForm({ ...form, parentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Top-level Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Icon picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon (Emoji)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DEFAULT_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic })}
                    className={`w-9 h-9 text-lg rounded-lg border-2 transition ${
                      form.icon === ic ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                placeholder="Or type a custom emoji"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Brief description..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Save Changes' : `Create ${isSubForm ? 'Sub-Category' : 'Category'}`}
              </button>
              <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
          <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No categories yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first tour category to get started</p>
          <button
            onClick={() => openCreate()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-8"></th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Description</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Tours</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const isOpen = expanded.has(cat.id);
                const subCount = cat.subCategories?.length ?? 0;

                return (
                  <React.Fragment key={cat.id}>
                    {/* Parent row */}
                    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {/* Expand toggle */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleExpand(cat.id)}
                          className="text-gray-400 hover:text-indigo-600 transition"
                          title={subCount > 0 ? `${isOpen ? 'Collapse' : 'Expand'} sub-categories` : 'No sub-categories'}
                        >
                          {isOpen
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon || '🗺️'}</span>
                          <div>
                            <p className="font-bold text-gray-900">{cat.name}</p>
                            <p className="text-xs text-gray-400">{cat.slug}</p>
                            {subCount > 0 && (
                              <p className="text-xs text-indigo-500 mt-0.5">{subCount} sub-categor{subCount === 1 ? 'y' : 'ies'}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-4 text-gray-500 max-w-xs truncate hidden md:table-cell">
                        {cat.description || <span className="text-gray-300 italic">—</span>}
                      </td>

                      {/* Tours */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                          <Tag className="w-3 h-3" /> {cat._count.listings}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <button
                          onClick={() => toggleActive(cat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                            cat.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {cat.isActive ? <><ToggleRight className="w-3.5 h-3.5" /> Active</> : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openCreate(cat.id)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Add sub-category"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deleteConfirm === cat.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(cat.id)} disabled={saving} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                                Confirm
                              </button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setDeleteConfirm(cat.id); setError(''); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Sub-category rows (expanded) */}
                    {isOpen && (
                      <>
                        {(cat.subCategories ?? []).length === 0 ? (
                          <tr className="bg-indigo-50/40 border-b border-gray-50">
                            <td />
                            <td colSpan={5} className="px-6 py-3">
                              <div className="flex items-center gap-3 text-sm text-gray-400">
                                <FolderOpen className="w-4 h-4 text-indigo-300" />
                                No sub-categories yet.
                                <button onClick={() => openCreate(cat.id)} className="text-indigo-500 hover:underline text-xs font-medium">
                                  + Add one
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          (cat.subCategories ?? []).map(sub => (
                            <tr key={sub.id} className="bg-indigo-50/30 border-b border-indigo-50 hover:bg-indigo-50/60 transition-colors">
                              {/* indent marker */}
                              <td className="px-5 py-3">
                                <div className="w-4 h-full flex items-center justify-center">
                                  <div className="w-0.5 h-4 bg-indigo-200 rounded-full" />
                                </div>
                              </td>

                              <td className="px-4 py-3 pl-8">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{sub.icon || '📌'}</span>
                                  <div>
                                    <p className="font-semibold text-gray-800 text-sm">{sub.name}</p>
                                    <p className="text-xs text-gray-400">{sub.slug}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate hidden md:table-cell">
                                {sub.description || <span className="italic">—</span>}
                              </td>

                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                                  <Tag className="w-2.5 h-2.5" /> {sub._count.listings}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-center hidden sm:table-cell">
                                <button
                                  onClick={() => toggleActive(sub)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition ${
                                    sub.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  {sub.isActive ? <><ToggleRight className="w-3 h-3" /> Active</> : <><ToggleLeft className="w-3 h-3" /> Inactive</>}
                                </button>
                              </td>

                              <td className="px-5 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => openEdit(sub)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {deleteConfirm === sub.id ? (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => handleDelete(sub.id)} disabled={saving} className="px-2 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                                        Confirm
                                      </button>
                                      <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setDeleteConfirm(sub.id); setError(''); }}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}

                        {/* Add sub-category inline button */}
                        {(cat.subCategories ?? []).length > 0 && (
                          <tr className="bg-indigo-50/20 border-b border-gray-50">
                            <td />
                            <td colSpan={5} className="px-6 py-2">
                              <button
                                onClick={() => openCreate(cat.id)}
                                className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                              >
                                <Plus className="w-3 h-3" /> Add sub-category to {cat.name}
                              </button>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

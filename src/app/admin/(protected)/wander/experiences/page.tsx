// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass, Plus, Pencil, Trash2, Loader2, AlertCircle, X, Check,
  MapPin, Clock, Users, ToggleLeft, ToggleRight, Layers, Link2, Unlink, Search, Upload,
} from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';

interface Experience {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: string | null;
  displayOrder: number;
  status: string;
  coverImage: string | null;
  category: { id: string; name: string; icon: string } | null;
  location: { id: string; name: string } | null;
  _count: { listings: number };
}

const emptyForm = {
  title: '', description: '', duration: '',
  categoryId: '', locationId: '', coverImage: '', displayOrder: 0,
};

export default function WanderExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Manage listings modal
  const [manageExp, setManageExp] = useState<Experience | null>(null);
  const [linkedListings, setLinkedListings] = useState<any[]>([]);
  const [unlinkedListings, setUnlinkedListings] = useState<any[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageSaving, setManageSaving] = useState(false);
  const [manageSearch, setManageSearch] = useState('');

  async function openManage(exp: Experience) {
    setManageExp(exp);
    setManageLoading(true);
    setManageSearch('');
    try {
      const res = await fetch(`/api/admin/wander/experiences/${exp.id}`);
      const data = await res.json();
      setLinkedListings(data.experience?.listings || []);
      setUnlinkedListings(data.unlinked || []);
    } catch {}
    finally { setManageLoading(false); }
  }

  async function handleLink(listingIds: string[]) {
    if (!manageExp) return;
    setManageSaving(true);
    try {
      await fetch(`/api/admin/wander/experiences/${manageExp.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', listingIds }),
      });
      await openManage(manageExp);
      await fetchAll();
    } catch {}
    finally { setManageSaving(false); }
  }

  async function handleUnlink(listingIds: string[]) {
    if (!manageExp) return;
    setManageSaving(true);
    try {
      await fetch(`/api/admin/wander/experiences/${manageExp.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink', listingIds }),
      });
      await openManage(manageExp);
      await fetchAll();
    } catch {}
    finally { setManageSaving(false); }
  }

  useEffect(() => {
    fetchAll();
    fetchCategories();
    fetchLocations();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/wander/experiences');
      const data = await res.json();
      setExperiences(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load experiences'); }
    finally { setLoading(false); }
  }

  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/wander/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function fetchLocations() {
    try {
      const res = await fetch('/api/locations?type=CITY');
      const data = await res.json();
      setLocations(Array.isArray(data.locations) ? data.locations : []);
    } catch {}
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, displayOrder: experiences.length });
    setError('');
    setShowForm(true);
  }

  function openEdit(exp: Experience) {
    setEditingId(exp.id);
    setForm({
      title: exp.title,
      description: exp.description || '',
      duration: exp.duration || '',
      categoryId: exp.category?.id || '',
      locationId: exp.location?.id || '',
      coverImage: exp.coverImage || '',
      displayOrder: exp.displayOrder,
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
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.categoryId) { setError('Category is required'); return; }
    if (!form.locationId) { setError('Location is required'); return; }
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/admin/wander/experiences/${editingId}` : '/api/admin/wander/experiences';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      await fetchAll();
      closeForm();
    } catch { setError('Failed to save'); }
    finally { setSaving(false); }
  }

  async function toggleStatus(exp: Experience) {
    const next = exp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await fetch(`/api/admin/wander/experiences/${exp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      await fetchAll();
    } catch { setError('Failed to update status'); }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/wander/experiences/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to delete'); setSaving(false); return; }
      await fetchAll();
      setDeleteConfirm(null);
    } catch { setError('Failed to delete'); }
    finally { setSaving(false); }
  }

  // All cats + sub-cats flat for dropdown
  const allCats = categories.flatMap(c => [c, ...(c.subCategories || [])]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tour Experiences</h1>
            <p className="text-sm text-gray-500">Define canonical experiences that vendors link their tours to</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> New Experience
        </button>
      </div>

      {/* Error */}
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
            <h2 className="font-semibold text-gray-900">{editingId ? 'Edit' : 'New'} Experience</h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Title <span className="text-red-500">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 1 Day Goa City Tour"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select category...</option>
                  {allCats.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                <select
                  value={form.locationId}
                  onChange={e => setForm({ ...form, locationId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select location...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 8 Hours, Full Day"
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
              {/* Cover Image */}
              <div className="md:col-span-2">
                <MediaPicker
                  value={form.coverImage}
                  onChange={(url) => setForm({ ...form, coverImage: url })}
                  label="Cover Image"
                />
              </div>
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="What does this experience involve?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
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
                {editingId ? 'Save Changes' : 'Create Experience'}
              </button>
              <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : experiences.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
          <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No experiences yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first canonical tour experience</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
            <Plus className="w-4 h-4" /> New Experience
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Experience</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Location</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Vendors</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiences.map(exp => (
                <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{exp.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exp.duration && <span className="inline-flex items-center gap-1 mr-3"><Clock className="w-3 h-3" />{exp.duration}</span>}
                        <span className="text-gray-300">{exp.slug}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    {exp.category ? (
                      <span className="text-sm text-gray-700">{exp.category.icon} {exp.category.name}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    {exp.location ? (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="w-3 h-3 text-gray-400" /> {exp.location.name}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      <Users className="w-3 h-3" /> {exp._count.listings}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => toggleStatus(exp)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                        exp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {exp.status === 'ACTIVE'
                        ? <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                        : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openManage(exp)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Manage Listings">
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(exp)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {deleteConfirm === exp.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(exp.id)} disabled={saving} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setDeleteConfirm(exp.id); setError(''); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manage Listings Modal */}
      {manageExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setManageExp(null)} />
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">Manage Listings</h2>
                <p className="text-sm text-gray-500">{manageExp.title}</p>
              </div>
              <button onClick={() => setManageExp(null)} className="p-1.5 hover:bg-gray-200 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {manageLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : (
                <>
                  {/* Linked Listings */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-emerald-500" />
                      Linked Listings ({linkedListings.length})
                    </h3>
                    {linkedListings.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl">No listings linked yet</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedListings.map((l: any) => (
                          <div key={l.id} className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{l.title}</p>
                              <p className="text-xs text-gray-500">
                                {l.vendor?.businessName || 'Unknown Vendor'}
                                {l.mainLocation?.name && <> · <MapPin className="w-3 h-3 inline" /> {l.mainLocation.name}</>}
                              </p>
                            </div>
                            <button
                              onClick={() => handleUnlink([l.id])}
                              disabled={manageSaving}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition disabled:opacity-50"
                            >
                              <Unlink className="w-3 h-3" /> Unlink
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Unlinked Listings */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-gray-400" />
                      Available Listings ({unlinkedListings.length})
                    </h3>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={manageSearch}
                        onChange={e => setManageSearch(e.target.value)}
                        placeholder="Search listings..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {unlinkedListings.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl">No unlinked active listings</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {unlinkedListings
                          .filter((l: any) => {
                            if (!manageSearch.trim()) return true;
                            const q = manageSearch.toLowerCase();
                            return (l.title?.toLowerCase().includes(q) ||
                              l.vendor?.businessName?.toLowerCase().includes(q) ||
                              l.mainLocation?.name?.toLowerCase().includes(q) ||
                              l.category?.name?.toLowerCase().includes(q));
                          })
                          .map((l: any) => (
                            <div key={l.id} className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 transition">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{l.title}</p>
                                <p className="text-xs text-gray-500">
                                  {l.vendor?.businessName || 'Unknown'}
                                  {l.category && <> · {l.category.icon} {l.category.name}</>}
                                  {l.mainLocation?.name && <> · {l.mainLocation.name}</>}
                                </p>
                              </div>
                              <button
                                onClick={() => handleLink([l.id])}
                                disabled={manageSaving}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition disabled:opacity-50"
                              >
                                <Link2 className="w-3 h-3" /> Link
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

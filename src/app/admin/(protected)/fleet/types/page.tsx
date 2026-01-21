'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  RefreshCw,
  ArrowLeft,
  Save,
  X,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FleetType {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  category: Category;
  _count: { vehicles: number };
}

export default function TypesManagementPage() {
  const [types, setTypes] = useState<FleetType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<FleetType | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/fleet/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(categoryFilter && { categoryId: categoryFilter }),
      });

      const res = await fetch(`/api/admin/fleet/types?${params}`);
      if (res.ok) {
        let data = await res.json();
        // Filter by search
        if (search) {
          data = data.filter((t: FleetType) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.category.name.toLowerCase().includes(search.toLowerCase())
          );
        }
        setTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch types:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'displayOrder' ? parseInt(value) || 0 : value,
    }));
  };

  const openAddModal = () => {
    setEditingType(null);
    setFormData({
      name: '',
      categoryId: categoryFilter || (categories[0]?.id || ''),
      description: '',
      displayOrder: 0,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (type: FleetType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      categoryId: type.categoryId,
      description: type.description || '',
      displayOrder: type.displayOrder,
      isActive: type.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingType
        ? `/api/admin/fleet/types/${editingType.id}`
        : '/api/admin/fleet/types';
      const method = editingType ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchTypes();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save type');
      }
    } catch (error) {
      console.error('Failed to save type:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete type "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/fleet/types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTypes();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete type');
      }
    } catch (error) {
      console.error('Failed to delete type:', error);
    }
  };

  // Group types by category
  const groupedTypes = types.reduce((acc, type) => {
    const catName = type.category.name;
    if (!acc[catName]) {
      acc[catName] = [];
    }
    acc[catName].push(type);
    return acc;
  }, {} as Record<string, FleetType[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/fleet">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Vehicle Types</h1>
            <p className="text-gray-600">Add and manage vehicle types for each service category</p>
          </div>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <Button variant="outline" onClick={fetchTypes}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Types List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : types.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No types found</h3>
          <p className="text-gray-500 mb-4">Add vehicle types for your categories</p>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTypes).map(([categoryName, categoryTypes]) => (
            <div key={categoryName} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-500" />
                  {categoryName}
                  <span className="text-sm font-normal text-gray-500">({categoryTypes.length} types)</span>
                </h3>
              </div>
              <div className="divide-y">
                {categoryTypes.map((type) => (
                  <div
                    key={type.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{type.name}</h4>
                        <p className="text-sm text-gray-500">
                          {type._count.vehicles} vehicle{type._count.vehicles !== 1 ? 's' : ''} using this type
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${type.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(type)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id, type.name)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          disabled={type._count.vehicles > 0}
                          title={type._count.vehicles > 0 ? 'Cannot delete: vehicles using this type' : 'Delete type'}
                        >
                          <Trash2 className={`w-4 h-4 ${type._count.vehicles > 0 ? 'text-gray-300' : 'text-red-500'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingType ? 'Edit Type' : 'Add Type'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Cruiser, SUV, Hatchback"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of this type"
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

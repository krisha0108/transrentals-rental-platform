'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Save,
  X,
  Loader2,
  Layers,
  Tag,
  Database,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BOOKING_SERVICES, SERVICE_SPEC_FIELDS, FLOW_TYPE_CONFIG } from '@/lib/constants/booking-services';

interface SpecField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  options?: string[]; // For select type
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  specFields: SpecField[] | null;
  _count: { vehicles: number; types: number };
  types: { id: string; name: string; slug: string }[];
}

// Use centralized spec fields from booking-services
const DEFAULT_SPEC_FIELDS = SERVICE_SPEC_FIELDS;

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'predefined'>('database');
  const [predefinedSearch, setPredefinedSearch] = useState('');
  const [addingServices, setAddingServices] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
    specFields: [] as SpecField[],
  });

  // Get existing category slugs for comparison
  const existingCategorySlugs = useMemo(() => {
    return new Set(categories.map(cat => cat.slug.toLowerCase()));
  }, [categories]);

  // Filter predefined services
  const filteredPredefinedServices = useMemo(() => {
    return BOOKING_SERVICES.filter(service => {
      const matchesSearch = predefinedSearch === '' ||
        service.name.toLowerCase().includes(predefinedSearch.toLowerCase()) ||
        service.slug.toLowerCase().includes(predefinedSearch.toLowerCase());
      return matchesSearch;
    });
  }, [predefinedSearch]);

  // Check if a service already exists in database
  const isServiceInDatabase = useCallback((slug: string) => {
    return existingCategorySlugs.has(slug.toLowerCase());
  }, [existingCategorySlugs]);

  // Add predefined service to database
  const addPredefinedService = async (service: typeof BOOKING_SERVICES[0]) => {
    if (isServiceInDatabase(service.slug)) return;

    setAddingServices(prev => new Set(prev).add(service.slug));

    try {
      const res = await fetch('/api/admin/fleet/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: service.name,
          slug: service.slug,
          description: service.description,
          icon: service.icon,
          displayOrder: service.id,
          isActive: true,
          specFields: service.specFields || DEFAULT_SPEC_FIELDS[service.slug] || [],
          flowType: service.flowType,
        }),
      });

      if (res.ok) {
        fetchCategories();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add service');
      }
    } catch (error) {
      console.error('Failed to add service:', error);
    } finally {
      setAddingServices(prev => {
        const next = new Set(prev);
        next.delete(service.slug);
        return next;
      });
    }
  };

  // Bulk add all filtered services
  const addAllFilteredServices = async () => {
    const servicesToAdd = filteredPredefinedServices.filter(service => !isServiceInDatabase(service.slug));
    if (servicesToAdd.length === 0) {
      alert('All services in this filter are already in the database');
      return;
    }

    if (!confirm(`Add ${servicesToAdd.length} services to the database?`)) return;

    for (const service of servicesToAdd) {
      await addPredefinedService(service);
    }
  };

  // Stats for predefined services
  const predefinedStats = useMemo(() => {
    const total = filteredPredefinedServices.length;
    const inDb = filteredPredefinedServices.filter(service => isServiceInDatabase(service.slug)).length;
    const notInDb = total - inDb;
    return { total, inDb, notInDb };
  }, [filteredPredefinedServices, isServiceInDatabase]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/fleet/categories');
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : name === 'displayOrder' ? parseInt(value) || 0 : value,
      };

      // Auto-generate slug
      if (name === 'name' && !editingCategory) {
        newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        // Auto-assign default spec fields based on slug
        if (DEFAULT_SPEC_FIELDS[newData.slug]) {
          newData.specFields = DEFAULT_SPEC_FIELDS[newData.slug];
        }
      }

      return newData;
    });
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      displayOrder: 0,
      isActive: true,
      specFields: [],
    });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      specFields: category.specFields || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCategory
        ? `/api/admin/fleet/categories/${editingCategory.id}`
        : '/api/admin/fleet/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCategories();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? This will also delete all associated types and vehicles.`)) return;

    try {
      const res = await fetch(`/api/admin/fleet/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const addSpecField = () => {
    setFormData((prev) => ({
      ...prev,
      specFields: [...prev.specFields, { name: '', label: '', type: 'text', required: false }],
    }));
  };

  const updateSpecField = (index: number, field: Partial<SpecField>) => {
    setFormData((prev) => ({
      ...prev,
      specFields: prev.specFields.map((f, i) => (i === index ? { ...f, ...field } : f)),
    }));
  };

  const removeSpecField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specFields: prev.specFields.filter((_, i) => i !== index),
    }));
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
            <p className="text-gray-600">Manage service categories like Bike Rental, Self Drive, Bus, Truck etc.</p>
          </div>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('database')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'database'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Database Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('predefined')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'predefined'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="w-4 h-4 inline mr-2" />
              8 Core Services ({BOOKING_SERVICES.length})
            </button>
          </div>
        </div>

        {/* Tab Content - Predefined Services Filter */}
        {activeTab === 'predefined' && (
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search predefined services..."
                  value={predefinedSearch}
                  onChange={(e) => setPredefinedSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={addAllFilteredServices}
                disabled={predefinedStats.notInDb === 0}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add All ({predefinedStats.notInDb})
              </Button>
            </div>
            {/* Stats bar */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Showing {predefinedStats.total} services:
              </span>
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {predefinedStats.inDb} in database
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                {predefinedStats.notInDb} not added
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'database' ? (
        /* Database Categories List */
        loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-4">Add service categories to organize your fleet</p>
            <div className="flex justify-center gap-3">
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('predefined')}>
                <Database className="w-4 h-4 mr-2" />
                Import from Predefined
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{category.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${category.isActive ? 'bg-white/20' : 'bg-red-500/50'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mt-1">/{category.slug}</p>
                </div>

                <div className="p-4">
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      {category._count.vehicles} vehicles
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {category._count.types} types
                    </span>
                  </div>

                  {category.types.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.types.slice(0, 5).map((type) => (
                          <span key={type.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {type.name}
                          </span>
                        ))}
                        {category.types.length > 5 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            +{category.types.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Predefined Services Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPredefinedServices.map((service) => {
            const isInDb = isServiceInDatabase(service.slug);
            const isAdding = addingServices.has(service.slug);

            return (
              <div
                key={service.slug}
                className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition overflow-hidden ${
                  isInDb ? 'border-green-200' : ''
                }`}
              >
                <div className={`p-4 text-white ${
                  isInDb
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{service.icon}</span>
                      <h3 className="font-bold text-lg">{service.name}</h3>
                    </div>
                    {isInDb && (
                      <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Added
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/80 mt-1">/{service.slug}</p>
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>

                  {/* Flow type & Sub-services */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${FLOW_TYPE_CONFIG[service.flowType].color}`}>
                      {FLOW_TYPE_CONFIG[service.flowType].label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {service.subServices.length} sub-services
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {isInDb ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Database
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600">Not added yet</span>
                    )}
                    {!isInDb && (
                      <Button
                        size="sm"
                        onClick={() => addPredefinedService(service)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 mr-1" />
                        )}
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Bike Rental, Self Drive"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g., bike-rental"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of this category"
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Lucide name)</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="e.g., Bike, Car, Bus"
                    className="w-full px-4 py-2 border rounded-lg"
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
              </div>

              {/* Spec Fields Configuration */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Specification Fields</label>
                  <button
                    type="button"
                    onClick={addSpecField}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Field
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Configure which specification fields should appear when adding vehicles to this category.
                </p>

                {formData.specFields.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No spec fields configured</p>
                ) : (
                  <div className="space-y-3">
                    {formData.specFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateSpecField(index, { name: e.target.value })}
                          placeholder="Field name"
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateSpecField(index, { label: e.target.value })}
                          placeholder="Label"
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateSpecField(index, { type: e.target.value as SpecField['type'] })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateSpecField(index, { required: e.target.checked })}
                          />
                          Req
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSpecField(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

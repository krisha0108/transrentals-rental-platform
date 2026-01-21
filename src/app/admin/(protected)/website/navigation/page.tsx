'use client';

import React, { useState, useEffect } from 'react';
import {
  List,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronRight,
  ExternalLink,
  Edit,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  target: '_self' | '_blank';
  isActive: boolean;
  order: number;
  children?: MenuItem[];
}

interface MenuConfig {
  header: MenuItem[];
  footer: {
    services: MenuItem[];
    company: MenuItem[];
    support: MenuItem[];
    legal: MenuItem[];
  };
  mobile: MenuItem[];
}

export default function NavigationManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'mobile'>('header');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [menus, setMenus] = useState<MenuConfig>({
    header: [
      { id: '1', label: 'Self-Drive Cars', href: '/self-drive-car-rental', target: '_self', isActive: true, order: 1 },
      { id: '2', label: 'Car with Driver', href: '/car-rental-with-driver', target: '_self', isActive: true, order: 2 },
      { id: '3', label: 'Bike Rental', href: '/bike-rental', target: '_self', isActive: true, order: 3 },
      { id: '4', label: 'Bus Rental', href: '/bus-rental', target: '_self', isActive: true, order: 4 },
      { id: '5', label: 'Luxury Cars', href: '/luxury-car-rental', target: '_self', isActive: true, order: 5 },
      { id: '6', label: 'Cities', href: '/cities', target: '_self', isActive: true, order: 6 },
      { id: '7', label: 'Blog', href: '/blog', target: '_self', isActive: true, order: 7 },
    ],
    footer: {
      services: [
        { id: 'f1', label: 'Self-Drive Cars', href: '/self-drive-car-rental', target: '_self', isActive: true, order: 1 },
        { id: 'f2', label: 'Car with Driver', href: '/car-rental-with-driver', target: '_self', isActive: true, order: 2 },
        { id: 'f3', label: 'Bike Rental', href: '/bike-rental', target: '_self', isActive: true, order: 3 },
        { id: 'f4', label: 'Bus Rental', href: '/bus-rental', target: '_self', isActive: true, order: 4 },
      ],
      company: [
        { id: 'c1', label: 'About Us', href: '/about', target: '_self', isActive: true, order: 1 },
        { id: 'c2', label: 'Contact', href: '/contact', target: '_self', isActive: true, order: 2 },
        { id: 'c3', label: 'Careers', href: '/careers', target: '_self', isActive: true, order: 3 },
      ],
      support: [
        { id: 's1', label: 'Help Center', href: '/help', target: '_self', isActive: true, order: 1 },
        { id: 's2', label: 'FAQs', href: '/faq', target: '_self', isActive: true, order: 2 },
      ],
      legal: [
        { id: 'l1', label: 'Terms of Service', href: '/terms', target: '_self', isActive: true, order: 1 },
        { id: 'l2', label: 'Privacy Policy', href: '/privacy', target: '_self', isActive: true, order: 2 },
        { id: 'l3', label: 'Refund Policy', href: '/refund-policy', target: '_self', isActive: true, order: 3 },
      ],
    },
    mobile: [
      { id: 'm1', label: 'Home', href: '/', target: '_self', isActive: true, order: 1 },
      { id: 'm2', label: 'Services', href: '/services', target: '_self', isActive: true, order: 2 },
      { id: 'm3', label: 'Cities', href: '/cities', target: '_self', isActive: true, order: 3 },
      { id: 'm4', label: 'Blog', href: '/blog', target: '_self', isActive: true, order: 4 },
      { id: 'm5', label: 'Contact', href: '/contact', target: '_self', isActive: true, order: 5 },
    ],
  });

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    label: '',
    href: '',
    target: '_self',
    isActive: true,
  });

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/website/navigation');
        if (res.ok) {
          const data = await res.json();
          if (data.menus) setMenus(data.menus);
        }
      } catch (error) {
        console.error('Failed to fetch navigation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/website/navigation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus }),
      });

      if (res.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save navigation:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (menuType: 'header' | 'mobile', id: string) => {
    setMenus(prev => ({
      ...prev,
      [menuType]: prev[menuType].map(item =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      ),
    }));
    setHasChanges(true);
  };

  const deleteItem = (menuType: 'header' | 'mobile', id: string) => {
    setMenus(prev => ({
      ...prev,
      [menuType]: prev[menuType].filter(item => item.id !== id),
    }));
    setHasChanges(true);
  };

  const addItem = () => {
    if (!newItem.label || !newItem.href) return;

    const id = `new-${Date.now()}`;
    const menuType = activeTab;

    setMenus(prev => ({
      ...prev,
      [menuType]: [
        ...prev[menuType],
        {
          ...newItem,
          id,
          order: prev[menuType].length + 1,
        } as MenuItem,
      ],
    }));

    setNewItem({ label: '', href: '', target: '_self', isActive: true });
    setShowAddModal(false);
    setHasChanges(true);
  };

  const activeMenu = menus[activeTab];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white">
            <List className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Navigation Management</h1>
            <p className="text-gray-600">Configure header and mobile menus</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('header')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'header'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Header Menu
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'mobile'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Mobile Menu
        </button>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'header' ? 'Header Menu Items' : 'Mobile Menu Items'}
            </h3>
            <p className="text-sm text-gray-500">Drag to reorder, toggle to show/hide</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-2">
          {activeMenu.sort((a, b) => a.order - b.order).map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition ${
                item.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500 font-mono">{item.href}</p>
                </div>
                {item.target === '_blank' && (
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingItem(item)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleItem(activeTab, item.id)}
                  className={`p-2 rounded-lg transition ${
                    item.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteItem(activeTab, item.id)}
                  className="p-2 hover:bg-red-100 text-red-500 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {activeMenu.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <List className="w-12 h-12 mx-auto mb-4" />
              <p>No menu items yet</p>
              <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-6">
            <span className="text-white font-bold">TransRentals</span>
            <div className="flex items-center gap-4">
              {activeMenu.filter(i => i.isActive).map((item) => (
                <span key={item.id} className="text-gray-300 text-sm hover:text-white cursor-pointer">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Menu Item</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                <input
                  type="text"
                  value={newItem.label}
                  onChange={(e) => setNewItem(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Menu Label"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                <input
                  type="text"
                  value={newItem.href}
                  onChange={(e) => setNewItem(prev => ({ ...prev, href: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg font-mono"
                  placeholder="/page-url"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Open in</label>
                <select
                  value={newItem.target}
                  onChange={(e) => setNewItem(prev => ({ ...prev, target: e.target.value as '_self' | '_blank' }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="_self">Same Tab</option>
                  <option value="_blank">New Tab</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={addItem} disabled={!newItem.label || !newItem.href}>
                Add Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

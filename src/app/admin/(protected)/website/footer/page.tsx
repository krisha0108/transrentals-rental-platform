'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Save,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Phone,
  Mail,
  MapPin,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FooterLink {
  id: string;
  label: string;
  href: string;
  order: number;
}

interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

interface FooterConfig {
  columns: FooterColumn[];
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  social: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  copyright: string;
  bottomLinks: FooterLink[];
}

export default function FooterManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  const [footer, setFooter] = useState<FooterConfig>({
    columns: [
      {
        id: 'services',
        title: 'Our Services',
        links: [
          { id: '1', label: 'Self-Drive Cars', href: '/self-drive-car-rental', order: 1 },
          { id: '2', label: 'Car with Driver', href: '/car-rental-with-driver', order: 2 },
          { id: '3', label: 'Bike Rental', href: '/bike-rental', order: 3 },
          { id: '4', label: 'Bus Rental', href: '/bus-rental', order: 4 },
          { id: '5', label: 'Luxury Cars', href: '/luxury-car-rental', order: 5 },
        ],
      },
      {
        id: 'company',
        title: 'Company',
        links: [
          { id: '6', label: 'About Us', href: '/about', order: 1 },
          { id: '7', label: 'Contact', href: '/contact', order: 2 },
          { id: '8', label: 'Careers', href: '/careers', order: 3 },
          { id: '9', label: 'Blog', href: '/blog', order: 4 },
        ],
      },
      {
        id: 'support',
        title: 'Support',
        links: [
          { id: '10', label: 'Help Center', href: '/help', order: 1 },
          { id: '11', label: 'FAQs', href: '/faq', order: 2 },
          { id: '12', label: 'Partner with Us', href: '/partner', order: 3 },
        ],
      },
      {
        id: 'cities',
        title: 'Popular Cities',
        links: [
          { id: '13', label: 'Mumbai', href: '/self-drive-car-rental/mumbai', order: 1 },
          { id: '14', label: 'Delhi', href: '/self-drive-car-rental/delhi', order: 2 },
          { id: '15', label: 'Bangalore', href: '/self-drive-car-rental/bangalore', order: 3 },
          { id: '16', label: 'Pune', href: '/self-drive-car-rental/pune', order: 4 },
        ],
      },
    ],
    contact: {
      email: 'book@transrentals.in',
      phone: '+91 9737965551',
      address: 'Mumbai, Maharashtra, India',
    },
    social: {
      facebook: 'https://facebook.com/transrentals',
      twitter: 'https://twitter.com/transrentals',
      instagram: 'https://instagram.com/transrentals',
      linkedin: 'https://linkedin.com/company/transrentals',
      youtube: '',
    },
    copyright: '© 2024 TransRentals. All rights reserved.',
    bottomLinks: [
      { id: 'b1', label: 'Terms of Service', href: '/terms', order: 1 },
      { id: 'b2', label: 'Privacy Policy', href: '/privacy', order: 2 },
      { id: 'b3', label: 'Refund Policy', href: '/refund-policy', order: 3 },
    ],
  });

  useEffect(() => {
    const fetchFooter = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/website/footer');
        if (res.ok) {
          const data = await res.json();
          if (data.footer) setFooter(data.footer);
        }
      } catch (error) {
        console.error('Failed to fetch footer:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooter();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/website/footer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footer }),
      });

      if (res.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save footer:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateColumn = (columnId: string, updates: Partial<FooterColumn>) => {
    setFooter(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      ),
    }));
    setHasChanges(true);
  };

  const addLinkToColumn = (columnId: string) => {
    const newLink: FooterLink = {
      id: `new-${Date.now()}`,
      label: 'New Link',
      href: '/',
      order: footer.columns.find(c => c.id === columnId)?.links.length || 0 + 1,
    };

    setFooter(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, links: [...col.links, newLink] } : col
      ),
    }));
    setHasChanges(true);
  };

  const updateLink = (columnId: string, linkId: string, updates: Partial<FooterLink>) => {
    setFooter(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId
          ? {
            ...col,
            links: col.links.map(link =>
              link.id === linkId ? { ...link, ...updates } : link
            ),
          }
          : col
      ),
    }));
    setHasChanges(true);
  };

  const deleteLink = (columnId: string, linkId: string) => {
    setFooter(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId
          ? { ...col, links: col.links.filter(link => link.id !== linkId) }
          : col
      ),
    }));
    setHasChanges(true);
  };

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
          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center text-white">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Footer Management</h1>
            <p className="text-gray-600">Configure footer links, contact info & social media</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Footer Columns */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Footer Columns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {footer.columns.map((column) => (
                <div key={column.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={column.title}
                      onChange={(e) => updateColumn(column.id, { title: e.target.value })}
                      className="font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addLinkToColumn(column.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {column.links.map((link) => (
                      <div key={link.id} className="flex items-center gap-2 group">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateLink(column.id, link.id, { label: e.target.value })}
                          className="flex-1 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => updateLink(column.id, link.id, { href: e.target.value })}
                          className="flex-1 px-2 py-1 text-sm border rounded font-mono text-gray-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => deleteLink(column.id, link.id)}
                          className="p-1 hover:bg-red-100 text-red-500 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Links */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bottom Links</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFooter(prev => ({
                    ...prev,
                    bottomLinks: [
                      ...prev.bottomLinks,
                      { id: `b-${Date.now()}`, label: 'New Link', href: '/', order: prev.bottomLinks.length + 1 },
                    ],
                  }));
                  setHasChanges(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>
            <div className="space-y-2">
              {footer.bottomLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      setFooter(prev => ({
                        ...prev,
                        bottomLinks: prev.bottomLinks.map(l =>
                          l.id === link.id ? { ...l, label: e.target.value } : l
                        ),
                      }));
                      setHasChanges(true);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => {
                      setFooter(prev => ({
                        ...prev,
                        bottomLinks: prev.bottomLinks.map(l =>
                          l.id === link.id ? { ...l, href: e.target.value } : l
                        ),
                      }));
                      setHasChanges(true);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      setFooter(prev => ({
                        ...prev,
                        bottomLinks: prev.bottomLinks.filter(l => l.id !== link.id),
                      }));
                      setHasChanges(true);
                    }}
                    className="p-2 hover:bg-red-100 text-red-500 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Copyright Text</h3>
            <input
              type="text"
              value={footer.copyright}
              onChange={(e) => {
                setFooter(prev => ({ ...prev, copyright: e.target.value }));
                setHasChanges(true);
              }}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={footer.contact.email}
                  onChange={(e) => {
                    setFooter(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }));
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={footer.contact.phone}
                  onChange={(e) => {
                    setFooter(prev => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }));
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <textarea
                  value={footer.contact.address}
                  onChange={(e) => {
                    setFooter(prev => ({ ...prev, contact: { ...prev.contact, address: e.target.value } }));
                    setHasChanges(true);
                  }}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
            <div className="space-y-3">
              {[
                { key: 'facebook', label: 'Facebook', icon: Facebook },
                { key: 'twitter', label: 'Twitter', icon: Twitter },
                { key: 'instagram', label: 'Instagram', icon: Instagram },
                { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                { key: 'youtube', label: 'YouTube', icon: Youtube },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <input
                    type="url"
                    value={(footer.social as any)[key]}
                    onChange={(e) => {
                      setFooter(prev => ({
                        ...prev,
                        social: { ...prev.social, [key]: e.target.value },
                      }));
                      setHasChanges(true);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    placeholder={`${label} URL`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-900 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4 text-gray-300">Footer Preview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {footer.columns.map((column) => (
            <div key={column.id}>
              <h4 className="font-semibold mb-3">{column.title}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {column.links.map((link) => (
                  <li key={link.id} className="hover:text-white cursor-pointer">{link.label}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{footer.copyright}</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {footer.bottomLinks.map((link) => (
              <span key={link.id} className="hover:text-white cursor-pointer">{link.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

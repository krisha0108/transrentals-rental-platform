'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Star,
  TrendingUp,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  MapPin,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  order: number;
}

interface FeaturedSection {
  id: string;
  type: 'services' | 'locations' | 'testimonials' | 'stats' | 'cta';
  title: string;
  isActive: boolean;
  order: number;
  config: Record<string, any>;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car, Bike, CarTaxiFront, Crown, Bus, Truck, Package, Wrench,
};

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function HomepageManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);

  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([
    {
      id: '1',
      title: "India's Largest Vehicle Rental Marketplace",
      subtitle: 'Rent cars, bikes, buses & more in 50+ cities',
      imageUrl: '/images/hero/hero-1.jpg',
      ctaText: 'Explore Services',
      ctaLink: '/services',
      isActive: true,
      order: 1,
    },
  ]);

  const [featuredServices, setFeaturedServices] = useState<string[]>([]);

  // Fetch all services from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/admin/services?parentsOnly=true');
        if (res.ok) {
          const data = await res.json();
          setAllServices(data);
          // Default: feature first 4 services if no saved config
          if (featuredServices.length === 0 && data.length > 0) {
            setFeaturedServices(data.slice(0, 4).map((s: ServiceItem) => s.slug));
          }
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      }
    };
    fetchServices();
  }, []);

  const [sections, setSections] = useState<FeaturedSection[]>([
    { id: '1', type: 'services', title: 'Our Services', isActive: true, order: 1, config: {} },
    { id: '2', type: 'locations', title: 'Popular Cities', isActive: true, order: 2, config: { limit: 8 } },
    { id: '3', type: 'stats', title: 'Why Choose Us', isActive: true, order: 3, config: {} },
    { id: '4', type: 'testimonials', title: 'Customer Reviews', isActive: true, order: 4, config: { limit: 6 } },
    { id: '5', type: 'cta', title: 'Ready to Get Started?', isActive: true, order: 5, config: {} },
  ]);

  const [stats, setStats] = useState({
    totalBookings: '50,000+',
    totalCities: '50+',
    totalVehicles: '10,000+',
    totalVendors: '500+',
    customerRating: '4.8',
  });

  useEffect(() => {
    const fetchHomepageData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/website/homepage');
        if (res.ok) {
          const data = await res.json();
          if (data.heroBanners) setHeroBanners(data.heroBanners);
          if (data.featuredServices) setFeaturedServices(data.featuredServices);
          if (data.sections) setSections(data.sections);
          if (data.stats) setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/website/homepage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroBanners,
          featuredServices,
          sections,
          stats,
        }),
      });

      if (res.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save homepage:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (slug: string) => {
    setFeaturedServices(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
    setHasChanges(true);
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Homepage Management</h1>
            <p className="text-gray-600">Configure your website homepage</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.open('/', '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Banner */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hero Banner</h3>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Banner
              </Button>
            </div>
            <div className="space-y-4">
              {heroBanners.map((banner) => (
                <div key={banner.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) => {
                          setHeroBanners(prev => prev.map(b =>
                            b.id === banner.id ? { ...b, title: e.target.value } : b
                          ));
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm font-medium"
                        placeholder="Banner Title"
                      />
                      <input
                        type="text"
                        value={banner.subtitle}
                        onChange={(e) => {
                          setHeroBanners(prev => prev.map(b =>
                            b.id === banner.id ? { ...b, subtitle: e.target.value } : b
                          ));
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Subtitle"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={banner.ctaText}
                          onChange={(e) => {
                            setHeroBanners(prev => prev.map(b =>
                              b.id === banner.id ? { ...b, ctaText: e.target.value } : b
                            ));
                            setHasChanges(true);
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          placeholder="CTA Text"
                        />
                        <input
                          type="text"
                          value={banner.ctaLink}
                          onChange={(e) => {
                            setHeroBanners(prev => prev.map(b =>
                              b.id === banner.id ? { ...b, ctaLink: e.target.value } : b
                            ));
                            setHasChanges(true);
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                          placeholder="/link"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setHeroBanners(prev => prev.map(b =>
                            b.id === banner.id ? { ...b, isActive: !b.isActive } : b
                          ));
                          setHasChanges(true);
                        }}
                        className={`p-2 rounded-lg ${banner.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button className="p-2 hover:bg-red-100 text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page Sections */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Sections</h3>
            <p className="text-sm text-gray-500 mb-4">Drag to reorder, toggle to show/hide sections</p>
            <div className="space-y-2">
              {sections.sort((a, b) => a.order - b.order).map((section) => (
                <div
                  key={section.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    section.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <div>
                      <p className="font-medium text-gray-900">{section.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{section.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`p-2 rounded-lg transition ${
                        section.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {section.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Homepage Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <label className="block text-xs text-gray-500 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      setStats(prev => ({ ...prev, [key]: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border rounded-lg font-bold text-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Services */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Services</h3>
            <p className="text-sm text-gray-500 mb-4">Select services to feature on homepage</p>
            <div className="space-y-2">
              {allServices.map((service) => {
                const Icon = IconMap[service.icon || ''] || Car;
                const isSelected = featuredServices.includes(service.slug);

                return (
                  <button
                    key={service.slug}
                    onClick={() => toggleService(service.slug)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{service.name}</span>
                    </div>
                    {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Page Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Banners</span>
                <span className="font-bold text-blue-600">
                  {heroBanners.filter(b => b.isActive).length}/{heroBanners.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Sections</span>
                <span className="font-bold text-blue-600">
                  {sections.filter(s => s.isActive).length}/{sections.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Featured Services</span>
                <span className="font-bold text-blue-600">{featuredServices.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye,
  Save,
  Loader2,
  Palette,
  Type,
  Image as ImageIcon,
  Layout,
  Sun,
  Moon,
  Monitor,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo: {
    main: string;
    dark: string;
    favicon: string;
  };
  layout: {
    maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    headerStyle: 'fixed' | 'static';
    footerStyle: 'simple' | 'expanded';
  };
  features: {
    darkMode: boolean;
    animations: boolean;
    preloader: boolean;
    backToTop: boolean;
    cookieConsent: boolean;
    chatWidget: boolean;
  };
}

const colorPresets = [
  { name: 'Blue', primary: '#2563eb', secondary: '#7c3aed' },
  { name: 'Green', primary: '#059669', secondary: '#0d9488' },
  { name: 'Purple', primary: '#7c3aed', secondary: '#ec4899' },
  { name: 'Orange', primary: '#ea580c', secondary: '#dc2626' },
  { name: 'Teal', primary: '#0d9488', secondary: '#06b6d4' },
];

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lato', label: 'Lato' },
];

export default function AppearanceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [theme, setTheme] = useState<ThemeConfig>({
    colors: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#111827',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    logo: {
      main: '/images/logo.png',
      dark: '/images/logo-dark.png',
      favicon: '/favicon.ico',
    },
    layout: {
      maxWidth: 'xl',
      headerStyle: 'fixed',
      footerStyle: 'expanded',
    },
    features: {
      darkMode: false,
      animations: true,
      preloader: true,
      backToTop: true,
      cookieConsent: true,
      chatWidget: false,
    },
  });

  useEffect(() => {
    const fetchTheme = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/website/appearance');
        if (res.ok) {
          const data = await res.json();
          if (data.theme) setTheme(data.theme);
        }
      } catch (error) {
        console.error('Failed to fetch theme:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/website/appearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });

      if (res.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateColors = (updates: Partial<ThemeConfig['colors']>) => {
    setTheme(prev => ({ ...prev, colors: { ...prev.colors, ...updates } }));
    setHasChanges(true);
  };

  const updateFonts = (updates: Partial<ThemeConfig['fonts']>) => {
    setTheme(prev => ({ ...prev, fonts: { ...prev.fonts, ...updates } }));
    setHasChanges(true);
  };

  const updateLayout = (updates: Partial<ThemeConfig['layout']>) => {
    setTheme(prev => ({ ...prev, layout: { ...prev.layout, ...updates } }));
    setHasChanges(true);
  };

  const updateFeatures = (key: keyof ThemeConfig['features']) => {
    setTheme(prev => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
    setHasChanges(true);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    updateColors({ primary: preset.primary, secondary: preset.secondary });
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
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appearance Settings</h1>
            <p className="text-gray-600">Customize colors, fonts, and layout</p>
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
          {/* Colors */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Brand Colors</h3>
            </div>

            {/* Color Presets */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div
                      className="w-5 h-5 rounded"
                      style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                    />
                    <span className="text-sm">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(theme.colors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateColors({ [key]: e.target.value })}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateColors({ [key]: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm uppercase"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font</label>
                <select
                  value={theme.fonts.heading}
                  onChange={(e) => updateFonts({ heading: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Font</label>
                <select
                  value={theme.fonts.body}
                  onChange={(e) => updateFonts({ body: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold mb-2" style={{ fontFamily: theme.fonts.heading }}>
                Heading Preview
              </p>
              <p className="text-gray-600" style={{ fontFamily: theme.fonts.body }}>
                This is how your body text will look. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
          </div>

          {/* Logo & Branding */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Logo & Branding</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'main', label: 'Main Logo', desc: 'For light backgrounds' },
                { key: 'dark', label: 'Dark Logo', desc: 'For dark backgrounds' },
                { key: 'favicon', label: 'Favicon', desc: '32x32 or 64x64' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="border rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-1">{label}</p>
                  <p className="text-xs text-gray-500 mb-3">{desc}</p>
                  <div className="flex items-center justify-center h-20 bg-gray-100 rounded-lg mb-3">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Layout Settings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Width</label>
                <select
                  value={theme.layout.maxWidth}
                  onChange={(e) => updateLayout({ maxWidth: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="sm">Small (640px)</option>
                  <option value="md">Medium (768px)</option>
                  <option value="lg">Large (1024px)</option>
                  <option value="xl">Extra Large (1280px)</option>
                  <option value="full">Full Width</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Header Style</label>
                <select
                  value={theme.layout.headerStyle}
                  onChange={(e) => updateLayout({ headerStyle: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="fixed">Fixed (Sticky)</option>
                  <option value="static">Static</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Footer Style</label>
                <select
                  value={theme.layout.footerStyle}
                  onChange={(e) => updateLayout({ footerStyle: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="expanded">Expanded</option>
                  <option value="simple">Simple</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Feature Toggles */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="space-y-4">
              {[
                { key: 'darkMode', label: 'Dark Mode', desc: 'Enable dark mode toggle', icon: Moon },
                { key: 'animations', label: 'Animations', desc: 'Page transitions & effects', icon: RefreshCw },
                { key: 'preloader', label: 'Preloader', desc: 'Show loading animation', icon: Loader2 },
                { key: 'backToTop', label: 'Back to Top', desc: 'Floating scroll button', icon: Layout },
                { key: 'cookieConsent', label: 'Cookie Consent', desc: 'Show cookie banner', icon: Eye },
                { key: 'chatWidget', label: 'Chat Widget', desc: 'Live chat support', icon: Type },
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={theme.features[key as keyof typeof theme.features]}
                      onChange={() => updateFeatures(key as keyof typeof theme.features)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Color Preview */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Preview</h3>
            <div
              className="rounded-lg p-4"
              style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
            >
              <p className="text-white font-bold text-lg mb-2">Primary Gradient</p>
              <p className="text-white/80 text-sm">This is how your brand gradient will look</p>
              <button
                className="mt-4 px-4 py-2 bg-white rounded-lg font-medium"
                style={{ color: theme.colors.primary }}
              >
                Sample Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

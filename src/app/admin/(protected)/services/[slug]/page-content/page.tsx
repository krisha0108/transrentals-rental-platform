'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Type,
  List,
  MessageSquare,
  HelpCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layout,
} from 'lucide-react';

interface HeroSection {
  title: string;
  subtitle: string;
  backgroundImage: string;
  ctaText: string;
  ctaLink: string;
  overlayOpacity: number;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface HowItWorksStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  caption: string;
}

interface CustomSection {
  id: string;
  type: 'text' | 'image-text' | 'cta' | 'stats';
  title: string;
  content: string;
  image?: string;
  visible: boolean;
  order: number;
}

interface PageContent {
  hero: HeroSection;
  introText: string;
  features: Feature[];
  featuresTitle: string;
  featuresVisible: boolean;
  howItWorks: HowItWorksStep[];
  howItWorksTitle: string;
  howItWorksVisible: boolean;
  testimonials: Testimonial[];
  testimonialsTitle: string;
  testimonialsVisible: boolean;
  faqs: FAQ[];
  faqsTitle: string;
  faqsVisible: boolean;
  gallery: GalleryImage[];
  galleryTitle: string;
  galleryVisible: boolean;
  customSections: CustomSection[];
  ctaSection: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    visible: boolean;
  };
}

const defaultContent: PageContent = {
  hero: {
    title: '',
    subtitle: '',
    backgroundImage: '',
    ctaText: 'Book Now',
    ctaLink: '#booking',
    overlayOpacity: 50,
  },
  introText: '',
  features: [],
  featuresTitle: 'Why Choose Us',
  featuresVisible: true,
  howItWorks: [],
  howItWorksTitle: 'How It Works',
  howItWorksVisible: true,
  testimonials: [],
  testimonialsTitle: 'What Our Customers Say',
  testimonialsVisible: true,
  faqs: [],
  faqsTitle: 'Frequently Asked Questions',
  faqsVisible: true,
  gallery: [],
  galleryTitle: 'Gallery',
  galleryVisible: false,
  customSections: [],
  ctaSection: {
    title: 'Ready to Get Started?',
    subtitle: 'Book your vehicle today and experience the difference.',
    buttonText: 'Book Now',
    buttonLink: '#booking',
    visible: true,
  },
};

const iconOptions = [
  'car', 'clock', 'shield', 'star', 'check', 'heart', 'thumbs-up',
  'map-pin', 'phone', 'credit-card', 'users', 'award', 'zap', 'truck',
  'key', 'calendar', 'headphones', 'percent', 'gift', 'navigation'
];

export default function ServicePageContentPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [content, setContent] = useState<PageContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [serviceName, setServiceName] = useState<string>('');

  useEffect(() => {
    fetchContent();
  }, [slug]);

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/admin/services/${slug}/page-content`);
      if (response.ok) {
        const data = await response.json();
        setContent({ ...defaultContent, ...data.content });
        setServiceName(data.serviceName || slug);
      }
    } catch (error) {
      console.error('Failed to fetch page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/services/${slug}/page-content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        alert('Page content saved successfully!');
      } else {
        alert('Failed to save page content');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save page content');
    } finally {
      setSaving(false);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Feature handlers
  const addFeature = () => {
    setContent({
      ...content,
      features: [...content.features, { id: generateId(), icon: 'star', title: '', description: '' }],
    });
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setContent({
      ...content,
      features: content.features.map(f => f.id === id ? { ...f, [field]: value } : f),
    });
  };

  const removeFeature = (id: string) => {
    setContent({
      ...content,
      features: content.features.filter(f => f.id !== id),
    });
  };

  // How It Works handlers
  const addStep = () => {
    const nextStep = content.howItWorks.length + 1;
    setContent({
      ...content,
      howItWorks: [...content.howItWorks, { id: generateId(), stepNumber: nextStep, icon: 'check', title: '', description: '' }],
    });
  };

  const updateStep = (id: string, field: keyof HowItWorksStep, value: string | number) => {
    setContent({
      ...content,
      howItWorks: content.howItWorks.map(s => s.id === id ? { ...s, [field]: value } : s),
    });
  };

  const removeStep = (id: string) => {
    setContent({
      ...content,
      howItWorks: content.howItWorks.filter(s => s.id !== id),
    });
  };

  // Testimonial handlers
  const addTestimonial = () => {
    setContent({
      ...content,
      testimonials: [...content.testimonials, { id: generateId(), name: '', role: '', avatar: '', content: '', rating: 5 }],
    });
  };

  const updateTestimonial = (id: string, field: keyof Testimonial, value: string | number) => {
    setContent({
      ...content,
      testimonials: content.testimonials.map(t => t.id === id ? { ...t, [field]: value } : t),
    });
  };

  const removeTestimonial = (id: string) => {
    setContent({
      ...content,
      testimonials: content.testimonials.filter(t => t.id !== id),
    });
  };

  // FAQ handlers
  const addFAQ = () => {
    setContent({
      ...content,
      faqs: [...content.faqs, { id: generateId(), question: '', answer: '' }],
    });
  };

  const updateFAQ = (id: string, field: keyof FAQ, value: string) => {
    setContent({
      ...content,
      faqs: content.faqs.map(f => f.id === id ? { ...f, [field]: value } : f),
    });
  };

  const removeFAQ = (id: string) => {
    setContent({
      ...content,
      faqs: content.faqs.filter(f => f.id !== id),
    });
  };

  // Gallery handlers
  const addGalleryImage = () => {
    setContent({
      ...content,
      gallery: [...content.gallery, { id: generateId(), url: '', alt: '', caption: '' }],
    });
  };

  const updateGalleryImage = (id: string, field: keyof GalleryImage, value: string) => {
    setContent({
      ...content,
      gallery: content.gallery.map(g => g.id === id ? { ...g, [field]: value } : g),
    });
  };

  const removeGalleryImage = (id: string) => {
    setContent({
      ...content,
      gallery: content.gallery.filter(g => g.id !== id),
    });
  };

  const sections = [
    { id: 'hero', name: 'Hero Section', icon: Layout },
    { id: 'intro', name: 'Introduction', icon: Type },
    { id: 'features', name: 'Features', icon: Star },
    { id: 'howItWorks', name: 'How It Works', icon: List },
    { id: 'testimonials', name: 'Testimonials', icon: MessageSquare },
    { id: 'faqs', name: 'FAQs', icon: HelpCircle },
    { id: 'gallery', name: 'Gallery', icon: ImageIcon },
    { id: 'cta', name: 'CTA Section', icon: Layout },
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
          <h1 className="text-2xl font-bold text-gray-900">Page Content</h1>
          <p className="text-gray-600 mt-1">
            Manage the landing page content for {serviceName}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Section Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">Page Sections</h3>
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Editor */}
        <div className="flex-1">
          {/* Hero Section */}
          {activeSection === 'hero' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Hero Section</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                  <input
                    type="text"
                    value={content.hero.title}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter hero title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <textarea
                    value={content.hero.subtitle}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter hero subtitle..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                  <input
                    type="text"
                    value={content.hero.backgroundImage}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, backgroundImage: e.target.value } })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={content.hero.ctaText}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, ctaText: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Link</label>
                    <input
                      type="text"
                      value={content.hero.ctaLink}
                      onChange={(e) => setContent({ ...content, hero: { ...content.hero, ctaLink: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overlay Opacity: {content.hero.overlayOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={content.hero.overlayOpacity}
                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, overlayOpacity: parseInt(e.target.value) } })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Introduction */}
          {activeSection === 'intro' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Introduction Text</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Introduction paragraph (shown below hero)
                </label>
                <textarea
                  value={content.introText}
                  onChange={(e) => setContent({ ...content, introText: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write an engaging introduction about this service..."
                />
              </div>
            </div>
          )}

          {/* Features Section */}
          {activeSection === 'features' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Features</h2>
                  <button
                    onClick={() => setContent({ ...content, featuresVisible: !content.featuresVisible })}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      content.featuresVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {content.featuresVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {content.featuresVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
                <button
                  onClick={addFeature}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={content.featuresTitle}
                  onChange={(e) => setContent({ ...content, featuresTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                {content.features.map((feature, index) => (
                  <div key={feature.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-grab" />
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Icon</label>
                            <select
                              value={feature.icon}
                              onChange={(e) => updateFeature(feature.id, 'icon', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              {iconOptions.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Title</label>
                            <input
                              type="text"
                              value={feature.title}
                              onChange={(e) => updateFeature(feature.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Feature title"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Description</label>
                          <textarea
                            value={feature.description}
                            onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Feature description"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeFeature(feature.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {content.features.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No features added yet. Click "Add Feature" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* How It Works Section */}
          {activeSection === 'howItWorks' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">How It Works</h2>
                  <button
                    onClick={() => setContent({ ...content, howItWorksVisible: !content.howItWorksVisible })}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      content.howItWorksVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {content.howItWorksVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {content.howItWorksVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
                <button
                  onClick={addStep}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={content.howItWorksTitle}
                  onChange={(e) => setContent({ ...content, howItWorksTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                {content.howItWorks.map((step, index) => (
                  <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Icon</label>
                            <select
                              value={step.icon}
                              onChange={(e) => updateStep(step.id, 'icon', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              {iconOptions.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Title</label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Step title"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Description</label>
                          <textarea
                            value={step.description}
                            onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Step description"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {content.howItWorks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No steps added yet. Click "Add Step" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Testimonials Section */}
          {activeSection === 'testimonials' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Testimonials</h2>
                  <button
                    onClick={() => setContent({ ...content, testimonialsVisible: !content.testimonialsVisible })}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      content.testimonialsVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {content.testimonialsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {content.testimonialsVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
                <button
                  onClick={addTestimonial}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Testimonial
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={content.testimonialsTitle}
                  onChange={(e) => setContent({ ...content, testimonialsTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                {content.testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Name</label>
                            <input
                              type="text"
                              value={testimonial.name}
                              onChange={(e) => updateTestimonial(testimonial.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Customer name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Role/Location</label>
                            <input
                              type="text"
                              value={testimonial.role}
                              onChange={(e) => updateTestimonial(testimonial.id, 'role', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Business Owner, Delhi"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Rating</label>
                            <select
                              value={testimonial.rating}
                              onChange={(e) => updateTestimonial(testimonial.id, 'rating', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              {[5, 4, 3, 2, 1].map(r => (
                                <option key={r} value={r}>{r} Stars</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Avatar URL</label>
                          <input
                            type="text"
                            value={testimonial.avatar}
                            onChange={(e) => updateTestimonial(testimonial.id, 'avatar', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="https://example.com/avatar.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Testimonial Content</label>
                          <textarea
                            value={testimonial.content}
                            onChange={(e) => updateTestimonial(testimonial.id, 'content', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="What the customer said..."
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeTestimonial(testimonial.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {content.testimonials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No testimonials added yet. Click "Add Testimonial" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FAQs Section */}
          {activeSection === 'faqs' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">FAQs</h2>
                  <button
                    onClick={() => setContent({ ...content, faqsVisible: !content.faqsVisible })}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      content.faqsVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {content.faqsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {content.faqsVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
                <button
                  onClick={addFAQ}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add FAQ
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={content.faqsTitle}
                  onChange={(e) => setContent({ ...content, faqsTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                {content.faqs.map((faq, index) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-medium text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Question</label>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="What is the question?"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Answer</label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="The answer to the question..."
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeFAQ(faq.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {content.faqs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No FAQs added yet. Click "Add FAQ" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {activeSection === 'gallery' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Gallery</h2>
                  <button
                    onClick={() => setContent({ ...content, galleryVisible: !content.galleryVisible })}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      content.galleryVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {content.galleryVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {content.galleryVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
                <button
                  onClick={addGalleryImage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Image
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={content.galleryTitle}
                  onChange={(e) => setContent({ ...content, galleryTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {content.gallery.map((image) => (
                  <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      {image.url && (
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                        <input
                          type="text"
                          value={image.url}
                          onChange={(e) => updateGalleryImage(image.id, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Alt Text</label>
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) => updateGalleryImage(image.id, 'alt', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Image description"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Caption</label>
                        <input
                          type="text"
                          value={image.caption}
                          onChange={(e) => updateGalleryImage(image.id, 'caption', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Image caption"
                        />
                      </div>
                      <button
                        onClick={() => removeGalleryImage(image.id)}
                        className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg transition text-sm flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {content.gallery.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No images added yet. Click "Add Image" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA Section */}
          {activeSection === 'cta' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">CTA Section</h2>
                <button
                  onClick={() => setContent({
                    ...content,
                    ctaSection: { ...content.ctaSection, visible: !content.ctaSection.visible }
                  })}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    content.ctaSection.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {content.ctaSection.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {content.ctaSection.visible ? 'Visible' : 'Hidden'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={content.ctaSection.title}
                    onChange={(e) => setContent({
                      ...content,
                      ctaSection: { ...content.ctaSection, title: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <textarea
                    value={content.ctaSection.subtitle}
                    onChange={(e) => setContent({
                      ...content,
                      ctaSection: { ...content.ctaSection, subtitle: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={content.ctaSection.buttonText}
                      onChange={(e) => setContent({
                        ...content,
                        ctaSection: { ...content.ctaSection, buttonText: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                    <input
                      type="text"
                      value={content.ctaSection.buttonLink}
                      onChange={(e) => setContent({
                        ...content,
                        ctaSection: { ...content.ctaSection, buttonLink: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

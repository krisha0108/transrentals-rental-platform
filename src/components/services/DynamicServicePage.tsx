'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Clock,
  Shield,
  Star,
  Check,
  Heart,
  ThumbsUp,
  MapPin,
  Phone,
  CreditCard,
  Users,
  Award,
  Zap,
  Truck,
  Key,
  Calendar,
  Headphones,
  Percent,
  Gift,
  Navigation,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Quote,
} from 'lucide-react';

interface PageContent {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
    ctaText: string;
    ctaLink: string;
    overlayOpacity: number;
  };
  introText: string;
  features: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  featuresTitle: string;
  featuresVisible: boolean;
  howItWorks: Array<{
    id: string;
    stepNumber: number;
    title: string;
    description: string;
    icon: string;
  }>;
  howItWorksTitle: string;
  howItWorksVisible: boolean;
  testimonials: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    content: string;
    rating: number;
  }>;
  testimonialsTitle: string;
  testimonialsVisible: boolean;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  faqsTitle: string;
  faqsVisible: boolean;
  gallery: Array<{
    id: string;
    url: string;
    alt: string;
    caption: string;
  }>;
  galleryTitle: string;
  galleryVisible: boolean;
  ctaSection: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    visible: boolean;
  };
}

interface DynamicServicePageProps {
  slug: string;
  fallbackContent?: Partial<PageContent>;
  children?: React.ReactNode;
  citiesSection?: React.ReactNode;
  vehicleTypesSection?: React.ReactNode;
  bookingFormSection?: React.ReactNode;
  hideHero?: boolean;
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  car: Car,
  clock: Clock,
  shield: Shield,
  star: Star,
  check: Check,
  heart: Heart,
  'thumbs-up': ThumbsUp,
  'map-pin': MapPin,
  phone: Phone,
  'credit-card': CreditCard,
  users: Users,
  award: Award,
  zap: Zap,
  truck: Truck,
  key: Key,
  calendar: Calendar,
  headphones: Headphones,
  percent: Percent,
  gift: Gift,
  navigation: Navigation,
};

export function DynamicServicePage({
  slug,
  fallbackContent,
  children,
  citiesSection,
  vehicleTypesSection,
  bookingFormSection,
  hideHero = false,
}: DynamicServicePageProps) {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [slug]);

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/services/${slug}/page-content`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      }
    } catch (error) {
      console.error('Failed to fetch page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Star;
  };

  // Actually merge, rather than picking one or the other: a CMS record that
  // predates a section (or arrives partial) then falls back key by key
  // instead of leaving a hole the render walks straight into.
  const pageContent = {
    ...(fallbackContent as PageContent),
    ...(content && typeof content === 'object' ? content : {}),
  } as PageContent;

  if (loading || !pageContent || !pageContent.hero) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      {!hideHero && <section
        className="relative min-h-[500px] flex items-center justify-center"
        style={{
          backgroundImage: pageContent.hero.backgroundImage
            ? `url(${pageContent.hero.backgroundImage})`
            : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {pageContent.hero.backgroundImage && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: pageContent.hero.overlayOpacity / 100 }}
          />
        )}
        <div className="relative z-10 text-center text-white px-4 py-20 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {pageContent.hero.title}
          </h1>
          {pageContent.hero.subtitle && (
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {pageContent.hero.subtitle}
            </p>
          )}
          {pageContent.hero.ctaText && (
            <Link
              href={pageContent.hero.ctaLink}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg"
            >
              {pageContent.hero.ctaText}
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>}

      {/* Booking Form Section (if provided) */}
      {bookingFormSection}

      {/* Introduction */}
      {pageContent.introText && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <p className="text-lg text-gray-700 leading-relaxed text-center">
              {pageContent.introText}
            </p>
          </div>
        </section>
      )}

      {/* Features Section */}
      {pageContent.featuresVisible && pageContent.features.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageContent.featuresTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pageContent.features.map((feature) => {
                const Icon = getIcon(feature.icon);
                return (
                  <div
                    key={feature.id}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
                  >
                    <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Custom Children Content */}
      {children}

      {/* Cities Section (if provided) */}
      {citiesSection}

      {/* Vehicle Types Section (if provided) */}
      {vehicleTypesSection}

      {/* How It Works */}
      {pageContent.howItWorksVisible && pageContent.howItWorks.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageContent.howItWorksTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pageContent.howItWorks.map((step, index) => {
                const Icon = getIcon(step.icon);
                return (
                  <div key={step.id} className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {pageContent.testimonialsVisible && pageContent.testimonials.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageContent.testimonialsTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pageContent.testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white p-6 rounded-xl shadow-md"
                >
                  <Quote className="w-8 h-8 text-blue-200 mb-4" />
                  <p className="text-gray-700 mb-4">{testimonial.content}</p>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {testimonial.avatar ? (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {pageContent.galleryVisible && pageContent.gallery.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageContent.galleryTitle}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageContent.gallery.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-lg overflow-hidden group"
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      {pageContent.faqsVisible && pageContent.faqs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {pageContent.faqsTitle}
            </h2>
            <div className="space-y-4">
              {pageContent.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                    }
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-gray-900">
                      {faq.question}
                    </span>
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-5 pb-5 text-gray-600">{faq.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {pageContent.ctaSection?.visible && (
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {pageContent.ctaSection?.title}
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              {pageContent.ctaSection?.subtitle}
            </p>
            <Link
              href={pageContent.ctaSection?.buttonLink || '#booking'}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg"
            >
              {pageContent.ctaSection?.buttonText}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

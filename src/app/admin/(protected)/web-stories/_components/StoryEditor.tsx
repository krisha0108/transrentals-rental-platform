'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Upload, Loader2, ChevronLeft, ChevronRight,
  Globe, Save, Image as ImageIcon, Video, Palette, Layers,
  AlertCircle, CheckCircle, X, GripVertical, Eye, Pause, Play, Share2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type BgType = 'IMAGE' | 'VIDEO' | 'COLOR' | 'GRADIENT';
type HeadingSize = 'SM' | 'MD' | 'LG';
type TextPosition = 'TOP' | 'MIDDLE' | 'BOTTOM';
type TextAnimation = 'NONE' | 'FADE' | 'SLIDE_UP' | 'SLIDE_DOWN';

interface Slide {
  id: string;
  order: number;
  duration: number;
  bgType: BgType;
  bgImage: string | null;
  bgVideo: string | null;
  bgColor: string | null;
  bgGradient: string | null;
  heading: string | null;
  headingSize: HeadingSize;
  headingColor: string;
  subtext: string | null;
  subtextColor: string;
  textPosition: TextPosition;
  textAnimation: TextAnimation;
  ctaText: string | null;
  ctaUrl: string | null;
  ctaStyle: string | null;
}

interface StoryMeta {
  title: string;
  slug: string;
  description: string;
  metaDescription: string;
  category: string;
  publisherName: string;
  publisherLogo: string;
  coverImage: string;
  coverImageSquare: string;
  expiresAt: string;
}

interface StoryEditorProps {
  mode: 'create' | 'edit';
  initialData?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateClientId(): string {
  return 'new_' + Math.random().toString(36).slice(2, 10);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function makeBlankSlide(order: number): Slide {
  return {
    id: generateClientId(),
    order,
    duration: 7,
    bgType: 'IMAGE',
    bgImage: null,
    bgVideo: null,
    bgColor: '#1a1a2e',
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    heading: '',
    headingSize: 'LG',
    headingColor: '#FFFFFF',
    subtext: '',
    subtextColor: '#FFFFFF',
    textPosition: 'BOTTOM',
    textAnimation: 'FADE',
    ctaText: '',
    ctaUrl: '',
    ctaStyle: null,
  };
}

const EXPIRY_PRESETS = [
  { label: '24 hours', value: () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16) },
  { label: '7 days', value: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) },
  { label: '30 days', value: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) },
  { label: 'Permanent', value: () => '' },
];

// ─── SEO Score ─────────────────────────────────────────────────────────────────

function calcSeoScore(meta: StoryMeta, slides: Slide[]): { score: number; checks: { label: string; ok: boolean }[] } {
  const hasCTA = slides.some((s) => s.ctaText && s.ctaUrl);
  const allHaveHeading = slides.length > 0 && slides.every((s) => s.heading && s.heading.trim());
  const allHaveBg = slides.length > 0 && slides.every((s) =>
    (s.bgType === 'IMAGE' && s.bgImage) ||
    (s.bgType === 'VIDEO' && s.bgVideo) ||
    (s.bgType === 'COLOR' && s.bgColor) ||
    (s.bgType === 'GRADIENT' && s.bgGradient)
  );

  const checks = [
    { label: 'Title set', ok: !!(meta.title && meta.title.trim().length > 3) },
    { label: 'Meta description', ok: !!(meta.metaDescription && meta.metaDescription.trim().length > 10) },
    { label: 'Cover image (landscape)', ok: !!meta.coverImage },
    { label: 'Cover image (square)', ok: !!meta.coverImageSquare },
    { label: 'Publisher name & logo', ok: !!(meta.publisherName && meta.publisherLogo) },
    { label: '4+ slides', ok: slides.length >= 4 },
    { label: 'Has CTA slide', ok: hasCTA },
    { label: 'All slides have heading', ok: allHaveHeading },
    { label: 'All slides have background', ok: allHaveBg },
    { label: 'URL-friendly slug', ok: /^[a-z0-9-]+$/.test(meta.slug) },
  ];
  const score = checks.filter((c) => c.ok).length * 10;
  return { score, checks };
}

// ─── Upload Helper ──────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/admin/web-stories/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function UploadButton({
  label,
  accept,
  onUploaded,
  currentUrl,
  className = '',
}: {
  label: string;
  accept: string;
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onUploaded(url);
    } catch {
      alert('Upload failed. Try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        {currentUrl && (
          <span className="text-xs text-green-600 truncate max-w-[140px]" title={currentUrl}>
            ✓ Uploaded
          </span>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}

// ─── Full Screen Preview Modal ────────────────────────────────────────────────

function FullPreviewModal({
  slides,
  meta,
  onClose,
}: {
  slides: Slide[];
  meta: StoryMeta;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<any>(null);
  const longPressRef = useRef<any>(null);

  const currentSlide = slides[currentIdx] || null;
  const duration = (currentSlide?.duration || 7) * 1000;

  const goNext = useCallback(() => {
    if (currentIdx < slides.length - 1) {
      setCurrentIdx((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIdx, slides.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setProgress(0);
    }
  }, [currentIdx]);

  // Auto-advance timer
  useEffect(() => {
    if (paused) return;
    setProgress(0);
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        goNext();
      }
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [currentIdx, paused, duration, goNext]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  const getBackground = (): React.CSSProperties => {
    if (!currentSlide) return { background: '#000' };
    switch (currentSlide.bgType) {
      case 'COLOR': return { background: currentSlide.bgColor || '#000' };
      case 'GRADIENT': return { background: currentSlide.bgGradient || '#000' };
      default: return { background: '#000' };
    }
  };

  const positionClass =
    currentSlide?.textPosition === 'TOP' ? 'justify-start pt-24' :
    currentSlide?.textPosition === 'MIDDLE' ? 'justify-center' :
    'justify-end pb-24';

  const headingSizeClass =
    currentSlide?.headingSize === 'SM' ? 'text-2xl font-semibold' :
    currentSlide?.headingSize === 'MD' ? 'text-3xl font-bold' :
    'text-4xl font-black';

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Outside controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setPaused((p) => !p)}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition"
          title={paused ? 'Play' : 'Pause'}
        >
          {paused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Draft watermark */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        ADMIN PREVIEW
      </div>

      {/* Story container - 9:16 centered */}
      <div
        className="relative bg-black overflow-hidden rounded-2xl shadow-2xl"
        style={{ aspectRatio: '9/16', height: '95vh', maxHeight: '95vh', maxWidth: 'calc(95vh * 9 / 16)' }}
      >
        {/* Background */}
        <div className="absolute inset-0" style={getBackground()}>
          {currentSlide?.bgType === 'IMAGE' && currentSlide.bgImage && (
            <img src={currentSlide.bgImage} alt="" className="w-full h-full object-cover" />
          )}
          {currentSlide?.bgType === 'VIDEO' && currentSlide.bgVideo && (
            <video src={currentSlide.bgVideo} className="w-full h-full object-cover" autoPlay muted loop playsInline />
          )}
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          {slides.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < currentIdx ? '100%' : i === currentIdx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header: Publisher + controls */}
        <div className="absolute top-8 left-3 right-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {meta.publisherLogo ? (
              <img src={meta.publisherLogo} alt="" className="w-8 h-8 rounded-full object-cover border border-white/40" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-white/70" />
              </div>
            )}
            <div>
              <p className="text-white text-xs font-bold leading-tight drop-shadow-md">
                {meta.publisherName || 'Publisher'}
              </p>
              {meta.category && <p className="text-white/50 text-[10px]">{meta.category}</p>}
            </div>
          </div>
          <span className="text-white/60 text-xs font-medium bg-black/30 px-2 py-0.5 rounded-full">
            {currentIdx + 1}/{slides.length}
          </span>
        </div>

        {/* Text content */}
        {currentSlide && (
          <div className={`absolute inset-0 flex flex-col px-6 z-10 pointer-events-none ${positionClass}`}>
            <div className="space-y-3">
              {currentSlide.heading && (
                <h2
                  className={`${headingSizeClass} leading-tight`}
                  style={{ color: currentSlide.headingColor, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
                >
                  {currentSlide.heading}
                </h2>
              )}
              {currentSlide.subtext && (
                <p
                  className="text-base leading-relaxed"
                  style={{ color: currentSlide.subtextColor, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
                >
                  {currentSlide.subtext}
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA Button */}
        {currentSlide?.ctaText && currentSlide.ctaUrl && (
          <div className="absolute bottom-8 left-6 right-6 z-20">
            <div className="w-full py-3.5 bg-white rounded-full text-center text-gray-900 text-sm font-bold shadow-xl">
              {currentSlide.ctaText} →
            </div>
          </div>
        )}

        {/* Tap zones */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={goNext} />
        </div>

        {/* Paused overlay */}
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
              <Pause className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Story Preview (small, in editor) ──────────────────────────────────────────

function StoryPreview({
  slide,
  meta,
  slides,
  currentIndex,
}: {
  slide: Slide | null;
  meta: StoryMeta;
  slides: Slide[];
  currentIndex: number;
}) {
  const getBackground = (): React.CSSProperties => {
    if (!slide) return { background: '#1a1a2e' };
    switch (slide.bgType) {
      case 'COLOR':
        return { background: slide.bgColor || '#1a1a2e' };
      case 'GRADIENT':
        return { background: slide.bgGradient || 'linear-gradient(135deg, #1a1a2e, #0f3460)' };
      default:
        return { background: '#1a1a2e' };
    }
  };

  const headingSizeClass =
    slide?.headingSize === 'SM' ? 'text-lg font-semibold' :
    slide?.headingSize === 'MD' ? 'text-xl font-bold' :
    'text-2xl font-black';

  const positionClass =
    slide?.textPosition === 'TOP' ? 'justify-start pt-16' :
    slide?.textPosition === 'MIDDLE' ? 'justify-center' :
    'justify-end pb-16';

  return (
    <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
      {/* Phone chrome */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl">

        {/* Background */}
        <div className="absolute inset-0" style={getBackground()}>
          {slide?.bgType === 'IMAGE' && slide.bgImage && (
            <img src={slide.bgImage} alt="" className="w-full h-full object-cover" />
          )}
          {slide?.bgType === 'VIDEO' && slide.bgVideo && (
            <video
              src={slide.bgVideo}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Progress bars */}
        <div className="absolute top-3 left-2 right-2 flex gap-1 z-10">
          {slides.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
              <div
                className={`h-full rounded-full bg-white transition-all ${i === currentIndex ? 'w-1/2' : i < currentIndex ? 'w-full' : 'w-0'}`}
              />
            </div>
          ))}
        </div>

        {/* Publisher info */}
        <div className="absolute top-7 left-3 flex items-center gap-2 z-10">
          {meta.publisherLogo ? (
            <img src={meta.publisherLogo} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              <ImageIcon className="w-3.5 h-3.5 text-white/70" />
            </div>
          )}
          <span className="text-white text-xs font-semibold drop-shadow" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
            {meta.publisherName || 'Publisher Name'}
          </span>
        </div>

        {/* Slide counter */}
        <div className="absolute top-7 right-3 z-10">
          <span className="text-white/70 text-xs">{currentIndex + 1}/{slides.length || 1}</span>
        </div>

        {/* Text content */}
        {slide && (
          <div className={`absolute inset-0 flex flex-col px-4 z-10 ${positionClass}`}>
            <div className="space-y-2 max-w-full">
              {slide.heading && (
                <h2
                  className={`${headingSizeClass} leading-tight`}
                  style={{ color: slide.headingColor, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                >
                  {slide.heading}
                </h2>
              )}
              {slide.subtext && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: slide.subtextColor, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                >
                  {slide.subtext}
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA Button */}
        {slide?.ctaText && slide.ctaUrl && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="w-full py-2.5 bg-white rounded-full text-center text-gray-900 text-sm font-bold shadow-lg">
              {slide.ctaText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Editor ───────────────────────────────────────────────────────────────

export default function StoryEditor({ mode, initialData }: StoryEditorProps) {
  const router = useRouter();

  const [meta, setMeta] = useState<StoryMeta>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    metaDescription: initialData?.metaDescription || '',
    category: initialData?.category || '',
    publisherName: initialData?.publisherName || '',
    publisherLogo: initialData?.publisherLogo || '',
    coverImage: initialData?.coverImage || '',
    coverImageSquare: initialData?.coverImageSquare || '',
    expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : '',
  });

  const [slides, setSlides] = useState<Slide[]>(
    initialData?.slides?.length
      ? initialData.slides.map((s: any) => ({
          id: s.id,
          order: s.order,
          duration: s.duration,
          bgType: s.bgType,
          bgImage: s.bgImage || null,
          bgVideo: s.bgVideo || null,
          bgColor: s.bgColor || '#1a1a2e',
          bgGradient: s.bgGradient || 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          heading: s.heading || '',
          headingSize: s.headingSize,
          headingColor: s.headingColor || '#FFFFFF',
          subtext: s.subtext || '',
          subtextColor: s.subtextColor || '#FFFFFF',
          textPosition: s.textPosition,
          textAnimation: s.textAnimation,
          ctaText: s.ctaText || '',
          ctaUrl: s.ctaUrl || '',
          ctaStyle: s.ctaStyle || null,
        }))
      : [makeBlankSlide(0)]
  );

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === 'edit');
  const [showPreview, setShowPreview] = useState(false);

  const activeSlide = slides[activeSlideIdx] || null;

  // Auto-slug from title
  useEffect(() => {
    if (!slugManuallyEdited && meta.title) {
      setMeta((prev) => ({ ...prev, slug: slugify(meta.title) }));
    }
  }, [meta.title, slugManuallyEdited]);

  const updateMeta = (key: keyof StoryMeta, value: string) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const updateSlide = (key: keyof Slide, value: any) => {
    setSlides((prev) =>
      prev.map((s, i) => (i === activeSlideIdx ? { ...s, [key]: value } : s))
    );
  };

  const addSlide = () => {
    const newSlide = makeBlankSlide(slides.length);
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIdx(slides.length);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
    setActiveSlideIdx((prev) => Math.min(prev, slides.length - 2));
  };

  const moveSlide = (idx: number, dir: 'left' | 'right') => {
    const newIdx = dir === 'left' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const updated = [...slides];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setSlides(updated.map((s, i) => ({ ...s, order: i })));
    setActiveSlideIdx(newIdx);
  };

  const buildPayload = () => ({
    title: meta.title.trim(),
    slug: meta.slug.trim(),
    description: meta.description.trim() || null,
    metaDescription: meta.metaDescription.trim() || null,
    coverImage: meta.coverImage || null,
    coverImageSquare: meta.coverImageSquare || null,
    publisherName: meta.publisherName.trim() || null,
    publisherLogo: meta.publisherLogo || null,
    category: meta.category.trim() || null,
    expiresAt: meta.expiresAt || null,
    slides: slides.map((s, i) => ({
      id: s.id.startsWith('new_') ? undefined : s.id,
      order: i,
      duration: s.duration,
      bgType: s.bgType,
      bgImage: s.bgImage || null,
      bgVideo: s.bgVideo || null,
      bgColor: s.bgColor || null,
      bgGradient: s.bgGradient || null,
      heading: s.heading?.trim() || null,
      headingSize: s.headingSize,
      headingColor: s.headingColor,
      subtext: s.subtext?.trim() || null,
      subtextColor: s.subtextColor,
      textPosition: s.textPosition,
      textAnimation: s.textAnimation,
      ctaText: s.ctaText?.trim() || null,
      ctaUrl: s.ctaUrl?.trim() || null,
      ctaStyle: s.ctaStyle || null,
    })),
  });

  const handleSave = async () => {
    if (!meta.title.trim()) {
      setSaveMsg({ type: 'error', text: 'Title is required' });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload = buildPayload();
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/admin/web-stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/web-stories/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaveMsg({ type: 'success', text: 'Saved!' });
      if (mode === 'create') {
        router.push(`/admin/web-stories/${data.story.id}`);
      }
    } catch (e: any) {
      setSaveMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (mode === 'create') {
      await handleSave();
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/web-stories/${initialData.id}/publish`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish');
      setSaveMsg({ type: 'success', text: data.isPublished ? 'Published!' : 'Unpublished' });
    } catch (e: any) {
      setSaveMsg({ type: 'error', text: e.message });
    } finally {
      setPublishing(false);
    }
  };

  const { score, checks } = calcSeoScore(meta, slides);
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';
  const scoreBg = score >= 80 ? 'bg-green-100' : score >= 50 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* Full Screen Preview Modal */}
      {showPreview && (
        <FullPreviewModal
          slides={slides}
          meta={meta}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <a
            href="/admin/web-stories"
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {mode === 'create' ? 'New Web Story' : `Edit: ${meta.title || 'Untitled'}`}
            </h1>
            <p className="text-xs text-gray-400">/stories/{meta.slug || 'story-slug'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
              saveMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {saveMsg.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {saveMsg.text}
            </div>
          )}
          <button
            onClick={() => setShowPreview(true)}
            disabled={slides.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition disabled:opacity-40"
          >
            <Eye className="w-3.5 h-3.5" /> Preview Story
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            {mode === 'edit' && initialData?.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Live Preview (9:16) */}
        <div className="flex-shrink-0 w-64 bg-gray-900 flex flex-col items-center justify-center p-4 gap-4">
          <div className="w-full max-w-[160px]">
            <StoryPreview
              slide={activeSlide}
              meta={meta}
              slides={slides}
              currentIndex={activeSlideIdx}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
              disabled={activeSlideIdx === 0}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white/60 text-xs">{activeSlideIdx + 1} / {slides.length}</span>
            <button
              onClick={() => setActiveSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
              disabled={activeSlideIdx === slides.length - 1}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT: Controls Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 space-y-6">

            {/* ── Story Metadata ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-800">Story Details</h2>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                {/* Title */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
                  <input
                    type="text"
                    value={meta.title}
                    onChange={(e) => updateMeta('title', e.target.value)}
                    placeholder="Story title..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                {/* Slug */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">URL Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex-shrink-0">/stories/</span>
                    <input
                      type="text"
                      value={meta.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        updateMeta('slug', e.target.value);
                      }}
                      placeholder="story-slug"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {/* Description */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                  <textarea
                    value={meta.description}
                    onChange={(e) => updateMeta('description', e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                {/* Meta Description */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Meta Description <span className="text-gray-400">({meta.metaDescription.length}/160)</span>
                  </label>
                  <textarea
                    value={meta.metaDescription}
                    onChange={(e) => updateMeta('metaDescription', e.target.value)}
                    placeholder="SEO meta description (max 160 chars)..."
                    maxLength={160}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
                  <input
                    type="text"
                    value={meta.category}
                    onChange={(e) => updateMeta('category', e.target.value)}
                    placeholder="e.g. Travel, Deals..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                {/* Publisher Name */}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Publisher Name</label>
                  <input
                    type="text"
                    value={meta.publisherName}
                    onChange={(e) => updateMeta('publisherName', e.target.value)}
                    placeholder="Your brand / company name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                {/* Publisher Logo */}
                <div>
                  <UploadButton
                    label="Publisher Logo"
                    accept="image/jpeg,image/png,image/webp"
                    currentUrl={meta.publisherLogo}
                    onUploaded={(url) => updateMeta('publisherLogo', url)}
                  />
                  {meta.publisherLogo && (
                    <img src={meta.publisherLogo} alt="" className="mt-1 w-8 h-8 rounded-full object-cover border" />
                  )}
                </div>
                {/* Cover Image */}
                <div>
                  <UploadButton
                    label="Cover Image (landscape 16:9)"
                    accept="image/jpeg,image/png,image/webp"
                    currentUrl={meta.coverImage}
                    onUploaded={(url) => updateMeta('coverImage', url)}
                  />
                  {meta.coverImage && (
                    <img src={meta.coverImage} alt="" className="mt-1 w-20 h-12 rounded object-cover border" />
                  )}
                </div>
                {/* Cover Image Square */}
                <div>
                  <UploadButton
                    label="Cover Image (square 1:1)"
                    accept="image/jpeg,image/png,image/webp"
                    currentUrl={meta.coverImageSquare}
                    onUploaded={(url) => updateMeta('coverImageSquare', url)}
                  />
                  {meta.coverImageSquare && (
                    <img src={meta.coverImageSquare} alt="" className="mt-1 w-12 h-12 rounded object-cover border" />
                  )}
                </div>
                {/* Expires At */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Expires At</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {EXPIRY_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateMeta('expiresAt', preset.value())}
                        className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 rounded-md transition"
                      >
                        {preset.label}
                      </button>
                    ))}
                    <input
                      type="datetime-local"
                      value={meta.expiresAt}
                      onChange={(e) => updateMeta('expiresAt', e.target.value)}
                      className="flex-1 min-w-[180px] px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {meta.expiresAt && (
                      <button
                        onClick={() => updateMeta('expiresAt', '')}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Slide Tabs ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Slides ({slides.length})</h2>
                <button
                  onClick={addSlide}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Slide
                </button>
              </div>

              {/* Slide tabs */}
              <div className="flex items-center gap-1 px-3 pt-3 pb-0 overflow-x-auto scrollbar-hide">
                {slides.map((slide, idx) => (
                  <div key={slide.id} className="flex-shrink-0 flex items-center">
                    <button
                      onClick={() => setActiveSlideIdx(idx)}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-lg font-medium transition border-b-2 ${
                        idx === activeSlideIdx
                          ? 'bg-white border-purple-600 text-purple-700'
                          : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      Slide {idx + 1}
                    </button>
                    <div className="flex flex-col items-center ml-0.5">
                      <button
                        onClick={() => moveSlide(idx, 'left')}
                        disabled={idx === 0}
                        className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition"
                        title="Move left"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveSlide(idx, 'right')}
                        disabled={idx === slides.length - 1}
                        className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition"
                        title="Move right"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    {slides.length > 1 && (
                      <button
                        onClick={() => deleteSlide(idx)}
                        className="ml-0.5 p-0.5 text-gray-300 hover:text-red-500 transition"
                        title="Delete slide"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Active slide controls */}
              {activeSlide && (
                <div className="p-5 space-y-5 border-t border-gray-100">

                  {/* Background Type */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">Background Type</label>
                    <div className="flex items-center gap-2">
                      {([
                        { type: 'IMAGE', icon: <ImageIcon className="w-3.5 h-3.5" />, label: 'Image' },
                        { type: 'VIDEO', icon: <Video className="w-3.5 h-3.5" />, label: 'Video' },
                        { type: 'COLOR', icon: <Palette className="w-3.5 h-3.5" />, label: 'Color' },
                        { type: 'GRADIENT', icon: <Layers className="w-3.5 h-3.5" />, label: 'Gradient' },
                      ] as { type: BgType; icon: React.ReactNode; label: string }[]).map((opt) => (
                        <button
                          key={opt.type}
                          onClick={() => updateSlide('bgType', opt.type)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition font-medium ${
                            activeSlide.bgType === opt.type
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400 hover:text-purple-600'
                          }`}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background content based on type */}
                  {activeSlide.bgType === 'IMAGE' && (
                    <div>
                      <UploadButton
                        label="Background Image"
                        accept="image/jpeg,image/png,image/webp"
                        currentUrl={activeSlide.bgImage}
                        onUploaded={(url) => updateSlide('bgImage', url)}
                      />
                      {activeSlide.bgImage && (
                        <div className="mt-2 relative inline-block">
                          <img src={activeSlide.bgImage} alt="" className="w-32 h-20 rounded object-cover border" />
                          <button
                            onClick={() => updateSlide('bgImage', null)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSlide.bgType === 'VIDEO' && (
                    <div>
                      <UploadButton
                        label="Background Video (MP4 / WebM)"
                        accept="video/mp4,video/webm"
                        currentUrl={activeSlide.bgVideo}
                        onUploaded={(url) => updateSlide('bgVideo', url)}
                      />
                      {activeSlide.bgVideo && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-green-600">✓ Video uploaded</span>
                          <button
                            onClick={() => updateSlide('bgVideo', null)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSlide.bgType === 'COLOR' && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeSlide.bgColor || '#1a1a2e'}
                          onChange={(e) => updateSlide('bgColor', e.target.value)}
                          className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeSlide.bgColor || '#1a1a2e'}
                          onChange={(e) => updateSlide('bgColor', e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {activeSlide.bgType === 'GRADIENT' && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Gradient CSS</label>
                      <input
                        type="text"
                        value={activeSlide.bgGradient || ''}
                        onChange={(e) => updateSlide('bgGradient', e.target.value)}
                        placeholder="linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <div className="mt-2 h-8 rounded-lg border border-gray-200" style={{ background: activeSlide.bgGradient || '' }} />
                      <div className="mt-2 flex flex-wrap gap-1">
                        {[
                          'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        ].map((g) => (
                          <button
                            key={g}
                            onClick={() => updateSlide('bgGradient', g)}
                            className="w-8 h-5 rounded border border-gray-200 hover:scale-110 transition"
                            style={{ background: g }}
                            title={g}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100" />

                  {/* Heading */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Heading Text</label>
                      <input
                        type="text"
                        value={activeSlide.heading || ''}
                        onChange={(e) => updateSlide('heading', e.target.value)}
                        placeholder="Main heading..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Heading Size</label>
                      <div className="flex items-center gap-1">
                        {(['SM', 'MD', 'LG'] as HeadingSize[]).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => updateSlide('headingSize', sz)}
                            className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition ${
                              activeSlide.headingSize === sz
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Heading Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeSlide.headingColor}
                          onChange={(e) => updateSlide('headingColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeSlide.headingColor}
                          onChange={(e) => updateSlide('headingColor', e.target.value)}
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtext */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Subtext</label>
                      <textarea
                        value={activeSlide.subtext || ''}
                        onChange={(e) => updateSlide('subtext', e.target.value)}
                        placeholder="Supporting text..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Subtext Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeSlide.subtextColor}
                          onChange={(e) => updateSlide('subtextColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeSlide.subtextColor}
                          onChange={(e) => updateSlide('subtextColor', e.target.value)}
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Position & Animation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Text Position</label>
                      <div className="flex items-center gap-1">
                        {(['TOP', 'MIDDLE', 'BOTTOM'] as TextPosition[]).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => updateSlide('textPosition', pos)}
                            className={`flex-1 py-1.5 text-[11px] rounded-lg border font-medium transition ${
                              activeSlide.textPosition === pos
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                            }`}
                          >
                            {pos.charAt(0) + pos.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Animation</label>
                      <select
                        value={activeSlide.textAnimation}
                        onChange={(e) => updateSlide('textAnimation', e.target.value as TextAnimation)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      >
                        <option value="NONE">None</option>
                        <option value="FADE">Fade In</option>
                        <option value="SLIDE_UP">Slide Up</option>
                        <option value="SLIDE_DOWN">Slide Down</option>
                      </select>
                    </div>
                  </div>

                  {/* CTA */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">CTA Button (optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Button Text</label>
                        <input
                          type="text"
                          value={activeSlide.ctaText || ''}
                          onChange={(e) => updateSlide('ctaText', e.target.value)}
                          placeholder="e.g. Book Now"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Button URL</label>
                        <input
                          type="url"
                          value={activeSlide.ctaUrl || ''}
                          onChange={(e) => updateSlide('ctaUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Auto-advance duration: <span className="font-semibold text-purple-700">{activeSlide.duration}s</span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={15}
                      value={activeSlide.duration}
                      onChange={(e) => updateSlide('duration', parseInt(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>3s</span>
                      <span>15s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── SEO Score ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">SEO Score</h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${scoreBg}`}>
                  <span className={`text-xl font-black ${scoreColor}`}>{score}</span>
                  <span className={`text-xs font-medium ${scoreColor}`}>/100</span>
                </div>
              </div>
              <div className="p-5">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {checks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2">
                      {check.ok ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${check.ok ? 'text-gray-700' : 'text-gray-400'}`}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

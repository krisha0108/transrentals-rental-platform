'use client';

import React, { useState, useEffect, useRef, useCallback, TouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Volume2, VolumeX, ChevronLeft, ChevronRight,
  Pause, Play, RotateCcw, Sparkles, Send,
} from 'lucide-react';

// ─── Canvas Elements Viewer ───────────────────────────────────────────────────
const CANVAS_W = 390;
const CANVAS_H = 693;

function shadowRgba(el: any): string {
  return toRgba(el.shadowColor || '#000000', el.shadowAlpha ?? 0.6);
}

function hasShadow(el: any): boolean {
  return el.shadowBlur !== undefined || el.shadowX !== undefined || el.shadowY !== undefined || el.shadowAlpha !== undefined;
}

function buildDropShadow(el: any): string {
  if (!hasShadow(el)) return '';
  return `drop-shadow(${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 8}px ${shadowRgba(el)})`;
}

function buildTextShadow(el: any): string | undefined {
  if (!hasShadow(el)) return undefined;
  return `${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 8}px ${shadowRgba(el)}`;
}

function toRgba(hex: string, alpha: number = 1): string {
  if (!hex || !hex.startsWith('#')) return hex || 'transparent';
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${isNaN(alpha) ? 1 : alpha})`;
}

function getClipPath(shapeType: string): string {
  switch (shapeType) {
    case 'triangle': return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'diamond':  return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'star':     return 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
    case 'hexagon':  return 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)';
    default: return 'none';
  }
}

// Build animation CSS with custom duration
function getAnimCss(key: string, duration: number = 0.6): string {
  const d = `${duration}s`;
  switch (key) {
    case 'fade-in':    return `ws-fadeIn ${d} ease forwards`;
    case 'slide-up':   return `ws-slideUp ${d} ease forwards`;
    case 'slide-down': return `ws-slideDown ${d} ease forwards`;
    case 'slide-left': return `ws-slideLeft ${d} ease forwards`;
    case 'slide-right':return `ws-slideRight ${d} ease forwards`;
    case 'zoom-in':    return `ws-zoomIn ${d} ease forwards`;
    case 'pop':        return `ws-pop ${d} cubic-bezier(0.175,0.885,0.32,1.275) forwards`;
    case 'spin-in':    return `ws-spin ${d} ease forwards`;
    default: return '';
  }
}
const ANIM_KEYS = new Set(['fade-in','slide-up','slide-down','slide-left','slide-right','zoom-in','pop','spin-in']);

function ViewerCanvasElements({ elements, slideKey }: { elements: any[]; slideKey: string }) {
  if (!elements?.length) return null;
  return (
    <div key={slideKey} className="absolute inset-0 overflow-hidden" style={{ containerType: 'inline-size' } as any}>
      {[...elements].sort((a, b) => (a.z || 0) - (b.z || 0)).map((el: any) => {
        const flipX = el.flipX ? ' scaleX(-1)' : '';
        const flipY = el.flipY ? ' scaleY(-1)' : '';
        const shadowFilter = buildDropShadow(el);
        const isText = el.type === 'text';
        // For text: use textShadow on inner div, only filterCss on outer. For others: combine both.
        const combinedFilter = isText
          ? (el.filterCss || undefined)
          : ([el.filterCss, shadowFilter].filter(Boolean).join(' ') || undefined);
        const s: React.CSSProperties = {
          position: 'absolute',
          left: `${(el.x / CANVAS_W) * 100}%`,
          top: `${(el.y / CANVAS_H) * 100}%`,
          width: `${(el.w / CANVAS_W) * 100}%`,
          height: `${(el.h / CANVAS_H) * 100}%`,
          transform: `rotate(${el.rot || 0}deg)${flipX}${flipY}`,
          zIndex: (el.z || 0) + 5,
          opacity: el.opacity ?? 1,
          filter: combinedFilter,
          animation: el.animation && ANIM_KEYS.has(el.animation) ? getAnimCss(el.animation, el.animationDuration) : undefined,
        };

        // Text/image/shape get filter via `s`. Text also gets textShadow on inner div.
        // ── Text ──────────────────────────────────────────────────────────────
        if (el.type === 'text') {
          const textColor = el.colorAlpha !== undefined && el.colorAlpha < 1 && el.color
            ? toRgba(el.color, el.colorAlpha)
            : (el.color || '#fff');
          const textBg = el.bgColor && el.bgAlpha && el.bgAlpha > 0
            ? toRgba(el.bgColor, el.bgAlpha)
            : undefined;
          return (
            <div key={el.id} style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                fontSize: `${(el.fontSize || 24) / CANVAS_W * 100}cqw`,
                fontFamily: el.fontFamily || 'inherit',
                fontWeight: el.bold ? 'bold' : 'normal',
                fontStyle: el.italic ? 'italic' : 'normal',
                textDecoration: el.underline ? 'underline' : 'none',
                textAlign: el.align || 'center',
                color: textColor,
                lineHeight: el.lineHeight || 1.3,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                width: '100%',
                backgroundColor: textBg,
                borderRadius: el.borderRadius || 0,
                padding: textBg ? '2px 8px' : undefined,
                WebkitTextStroke: el.textStrokeWidth && el.textStrokeColor
                  ? `${el.textStrokeWidth}px ${el.textStrokeColor}`
                  : undefined,
                textShadow: buildTextShadow(el),
              } as React.CSSProperties}>
                {el.content}
              </div>
            </div>
          );
        }

        // ── Image ─────────────────────────────────────────────────────────────
        if (el.type === 'image' && el.src) {
          const hasBorder = el.borderWidth && el.borderColor;
          return (
            <div key={el.id} style={{
              ...s,
              borderRadius: el.borderRadius || 0,
              overflow: 'hidden',
              boxSizing: 'border-box',
              ...(hasBorder ? { border: `${el.borderWidth}px solid ${el.borderColor}` } : {}),
            }}>
              <img src={el.src} alt="" className="w-full h-full" style={{
                objectFit: el.objectFit || 'cover',
                objectPosition: el.objectPosition || 'center center',
              }} />
            </div>
          );
        }

        // ── Shape ─────────────────────────────────────────────────────────────
        if (el.type === 'shape') {
          const shapeType = el.shapeType || 'rect';
          const clip = getClipPath(shapeType);
          const fillColor = el.bgColor ? toRgba(el.bgColor, el.bgAlpha ?? 1) : '#6366f1';
          const bgImage = el.bgImage ? `url(${el.bgImage})` : undefined;
          const filled = el.filled !== false;

          if (clip !== 'none') {
            // Polygon shapes: use drop-shadow filter to simulate border
            const borderFilter = !filled && el.borderColor && el.borderWidth
              ? `drop-shadow(0 0 ${el.borderWidth}px ${el.borderColor})`
              : undefined;
            const combinedFilter = [el.filterCss, borderFilter].filter(Boolean).join(' ') || undefined;
            return (
              <div key={el.id} style={{ ...s, filter: combinedFilter }}>
                <div style={{
                  width: '100%', height: '100%',
                  clipPath: clip,
                  backgroundColor: filled ? fillColor : 'transparent',
                  backgroundImage: bgImage,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
              </div>
            );
          }

          // rect / circle
          const br = shapeType === 'circle' ? '50%' : (el.borderRadius || 0);
          const borderStyle: React.CSSProperties = el.borderWidth && el.borderColor
            ? { border: `${el.borderWidth}px solid ${el.borderColor}` }
            : {};
          return (
            <div key={el.id} style={{
              ...s,
              backgroundColor: filled ? fillColor : 'transparent',
              backgroundImage: bgImage,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: br,
              ...borderStyle,
            }} />
          );
        }

        // ── Button ────────────────────────────────────────────────────────────
        if (el.type === 'button') {
          const textColor = el.colorAlpha !== undefined && el.colorAlpha < 1 && el.color
            ? toRgba(el.color, el.colorAlpha)
            : (el.color || '#000');
          const bgColor = el.bgColor ? toRgba(el.bgColor, el.bgAlpha ?? 1) : '#fff';
          const borderStyle: React.CSSProperties = el.borderWidth && el.borderColor
            ? { border: `${el.borderWidth}px solid ${el.borderColor}` }
            : {};
          const innerStyle: React.CSSProperties = {
            display: 'flex', width: '100%', height: '100%',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: bgColor,
            borderRadius: el.borderRadius ?? 50,
            textDecoration: 'none',
            ...borderStyle,
          };
          const label = (
            <span style={{
              fontSize: `${(el.fontSize || 16) / CANVAS_W * 100}cqw`,
              fontFamily: el.fontFamily || 'inherit',
              fontWeight: 'bold',
              color: textColor,
            }}>
              {el.content || 'Tap Here'}
            </span>
          );
          return (
            <div key={el.id} style={s}>
              {el.href
                ? <a href={el.href} onClick={e => e.stopPropagation()} style={innerStyle}>{label}</a>
                : <div style={innerStyle}>{label}</div>
              }
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

interface Slide {
  id: string;
  order: number;
  duration: number;
  bgType: 'IMAGE' | 'VIDEO' | 'COLOR' | 'GRADIENT';
  bgImage: string | null;
  bgVideo: string | null;
  bgColor: string | null;
  bgGradient: string | null;
  heading: string | null;
  headingSize: 'SM' | 'MD' | 'LG';
  headingColor: string;
  subtext: string | null;
  subtextColor: string;
  textPosition: 'TOP' | 'MIDDLE' | 'BOTTOM';
  textAnimation: 'NONE' | 'FADE' | 'SLIDE_UP' | 'SLIDE_DOWN';
  ctaText: string | null;
  ctaUrl: string | null;
  ctaStyle: string | null;
  canvasData?: any[];
}

interface Story {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  publisherName: string | null;
  publisherLogo: string | null;
  category: string | null;
  slides: Slide[];
  reactions: { HEART: number; FIRE: number; THUMBS_UP: number };
}

interface StoryViewerProps {
  story: Story;
  backUrl?: string;
}

type ReactionType = 'HEART' | 'FIRE' | 'THUMBS_UP';

const REACTION_EMOJI: Record<ReactionType, string> = {
  HEART: '❤️',
  FIRE: '🔥',
  THUMBS_UP: '👍',
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  duration, active, done, paused, onComplete,
}: {
  duration: number; active: boolean; done: boolean; paused: boolean; onComplete: () => void;
}) {
  const [progress, setProgress] = useState(done ? 100 : 0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!active) { setProgress(done ? 100 : 0); return; }
    setProgress(0);
    startTimeRef.current = performance.now();
    pauseOffsetRef.current = 0;

    const tick = (now: number) => {
      if (paused) {
        pausedAtRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (pausedAtRef.current > 0) {
        pauseOffsetRef.current += now - pausedAtRef.current;
        pausedAtRef.current = 0;
      }
      const elapsed = now - startTimeRef.current - pauseOffsetRef.current;
      const pct = Math.min((elapsed / (duration * 1000)) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
      else onComplete();
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, duration, done]);

  useEffect(() => {
    if (paused && pausedAtRef.current === 0) pausedAtRef.current = performance.now();
  }, [paused]);

  return (
    <div className="flex-1 h-[2px] rounded-full bg-white/30 overflow-hidden">
      <div className="h-full bg-white rounded-full" style={{ width: `${progress}%`, transition: 'none' }} />
    </div>
  );
}

// ─── Share Sheet ──────────────────────────────────────────────────────────────

function ShareSheet({ story, onClose }: { story: Story; onClose: () => void }) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const platforms = [
    { name: 'WhatsApp', emoji: '💬', bg: 'bg-[#25D366]', url: `https://wa.me/?text=${encodeURIComponent(story.title + ' ' + url)}` },
    { name: 'Facebook', emoji: '📘', bg: 'bg-[#1877F2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'X (Twitter)', emoji: '🐦', bg: 'bg-black', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(story.title)}&url=${encodeURIComponent(url)}` },
    { name: 'Telegram', emoji: '✈️', bg: 'bg-[#229ED9]', url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(story.title)}` },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Share Story</h3>
              <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[240px]">{story.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Platform icons */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {platforms.map(p => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 ${p.bg} rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition`}>
                  {p.emoji}
                </div>
                <span className="text-xs text-gray-500 font-medium text-center leading-tight">{p.name}</span>
              </a>
            ))}
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Link</p>
              <p className="text-xs text-gray-600 truncate">{url}</p>
            </div>
            <button
              onClick={copy}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Viewer ──────────────────────────────────────────────────────────────

export default function StoryViewer({ story, backUrl = '/stories' }: StoryViewerProps) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [reactions, setReactions] = useState(story.reactions);
  const [reactedTypes, setReactedTypes] = useState<Set<ReactionType>>(new Set());
  const [showEnd, setShowEnd] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = story.slides;
  const currentSlide = slides[currentIdx];

  const goNext = useCallback(() => {
    if (currentIdx < slides.length - 1) setCurrentIdx(i => i + 1);
    else setShowEnd(true);
  }, [currentIdx, slides.length]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }, [currentIdx]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
      if (e.key === 'Escape') router.push(backUrl);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, router, backUrl]);

  // Video sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      if (paused) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [muted, paused, currentIdx]);

  // Touch
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
    longPressRef.current = setTimeout(() => setPaused(true), 300);
  };
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    setPaused(false);
    const start = touchStartRef.current;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const dt = Date.now() - start.time;
    if (dy > 80 && Math.abs(dx) < 50 && dt < 500) { router.push(backUrl); return; }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) {
      if (e.changedTouches[0].clientX < window.innerWidth / 3) goPrev();
      else goNext();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.clientX < window.innerWidth / 3) goPrev();
    else goNext();
  };

  const handleReact = async (type: ReactionType) => {
    if (reactedTypes.has(type)) return;
    try {
      const res = await fetch(`/api/web-stories/${story.slug}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type }),
      });
      const data = await res.json();
      if (res.ok) { setReactions(data.reactions); setReactedTypes(prev => new Set([...prev, type])); }
    } catch {}
  };

  const getSlideBg = (slide: Slide): React.CSSProperties => {
    switch (slide.bgType) {
      case 'COLOR': return { backgroundColor: slide.bgColor || '#111' };
      case 'GRADIENT': return { background: slide.bgGradient || 'linear-gradient(135deg,#1a1a2e,#0f3460)' };
      default: return { backgroundColor: '#111' };
    }
  };

  const headingClass =
    currentSlide.headingSize === 'SM' ? 'text-2xl font-semibold' :
    currentSlide.headingSize === 'MD' ? 'text-3xl font-bold' : 'text-4xl font-black';

  const positionClass =
    currentSlide.textPosition === 'TOP' ? 'justify-start pt-24' :
    currentSlide.textPosition === 'MIDDLE' ? 'justify-center' : 'justify-end pb-24';

  const animClass =
    currentSlide.textAnimation === 'FADE' ? 'animate-fade-in' :
    currentSlide.textAnimation === 'SLIDE_UP' ? 'animate-slide-up' :
    currentSlide.textAnimation === 'SLIDE_DOWN' ? 'animate-slide-down' : '';

  // ── Complete Screen ────────────────────────────────────────────────────────
  if (showEnd) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
        {story.coverImage && (
          <img src={story.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 scale-110 blur-2xl" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/95" />

        <div className="relative w-full max-w-xs mx-auto px-6 text-center">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
              <span className="text-white text-[10px] font-black">✓</span>
            </div>
          </div>

          <h2 className="text-white text-2xl font-black mb-1">Story Complete!</h2>
          <p className="text-white/60 text-sm mb-1 font-medium">{story.title}</p>
          <p className="text-white/30 text-xs mb-7">
            {slides.length} slides{story.category ? ` · ${story.category}` : ''}
          </p>

          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-4">How was it?</p>
          <div className="flex items-center justify-center gap-3 mb-7">
            {(['HEART', 'FIRE', 'THUMBS_UP'] as ReactionType[]).map(type => (
              <button
                key={type}
                onClick={() => handleReact(type)}
                className={`flex flex-col items-center gap-2 py-4 px-5 rounded-2xl border-2 transition-all duration-200 ${
                  reactedTypes.has(type)
                    ? 'bg-white/20 border-white/50 scale-110 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/25 hover:scale-105'
                }`}
              >
                <span className="text-3xl">{REACTION_EMOJI[type]}</span>
                <span className="text-white font-bold text-sm">{reactions[type]}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => { setCurrentIdx(0); setShowEnd(false); }}
              className="w-full py-3.5 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Watch Again
            </button>
            <button
              onClick={() => router.push(backUrl)}
              className="w-full py-3.5 bg-white/10 text-white font-medium rounded-2xl hover:bg-white/18 transition text-sm border border-white/15"
            >
              Browse More Stories
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Story Viewer ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-20px) } to { opacity:1; transform:translateY(0) } }
        .animate-fade-in { animation: fadeIn 0.5s ease forwards; }
        .animate-slide-up { animation: slideUp 0.5s ease forwards; }
        .animate-slide-down { animation: slideDown 0.5s ease forwards; }

        @keyframes ws-fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes ws-slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ws-slideDown { from{opacity:0;transform:translateY(-30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ws-slideLeft { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ws-slideRight { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ws-zoomIn { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
        @keyframes ws-pop { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes ws-spin { from{opacity:0;transform:rotate(-180deg) scale(0.5)} to{opacity:1;transform:rotate(0deg) scale(1)} }
      `}</style>

      {/* Full screen container */}
      <div className="fixed inset-0 z-50 overflow-hidden">

        {/* ── Blurred background (changes with slide) ── */}
        <div className="absolute inset-0 transition-all duration-700" style={getSlideBg(currentSlide)}>
          {currentSlide.bgType === 'IMAGE' && currentSlide.bgImage && (
            <img
              key={currentSlide.id}
              src={currentSlide.bgImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.7 }}
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* ── Layout: arrow + card + arrow ── */}
        <div className="relative h-full flex items-center justify-center">

          {/* Left arrow — desktop only */}
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="hidden sm:flex flex-shrink-0 mr-6 w-12 h-12 bg-white rounded-full shadow-xl items-center justify-center disabled:opacity-25 hover:scale-110 transition-transform z-20"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>

          {/* ── Story Card ── */}
          <div
            className="relative overflow-hidden rounded-2xl shadow-[0_8px_60px_rgba(0,0,0,0.7)] flex-shrink-0"
            style={{ height: '92vh', aspectRatio: '9/16' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Slide background */}
            <div className="absolute inset-0" style={getSlideBg(currentSlide)}>
              {currentSlide.bgType === 'IMAGE' && currentSlide.bgImage && (
                <img
                  key={`img-${currentSlide.id}`}
                  src={currentSlide.bgImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              {currentSlide.bgType === 'VIDEO' && currentSlide.bgVideo && (
                <video
                  ref={videoRef}
                  key={`vid-${currentSlide.id}`}
                  src={currentSlide.bgVideo}
                  className="w-full h-full object-cover"
                  autoPlay muted={muted} loop playsInline
                />
              )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

            {/* Canvas elements */}
            {currentSlide.canvasData && currentSlide.canvasData.length > 0 && (
              <ViewerCanvasElements elements={currentSlide.canvasData} slideKey={`${currentSlide.id}-${currentIdx}`} />
            )}

            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
              {slides.map((slide, idx) => (
                <ProgressBar
                  key={slide.id}
                  duration={slide.duration}
                  active={idx === currentIdx}
                  done={idx < currentIdx}
                  paused={paused}
                  onComplete={goNext}
                />
              ))}
            </div>

            {/* Header: publisher left, controls right */}
            <div className="absolute top-7 left-3 right-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                {story.publisherLogo ? (
                  <img src={story.publisherLogo} alt="" className="w-7 h-7 rounded-full object-cover border border-white/40" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30" />
                )}
                <div>
                  <p className="text-white text-xs font-bold leading-tight drop-shadow-md">
                    {story.publisherName || 'TransRentals'}
                  </p>
                  {story.category && <p className="text-white/50 text-[9px]">{story.category}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {currentSlide.bgType === 'VIDEO' && (
                  <button
                    onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
                    className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/15 hover:bg-black/60 transition"
                  >
                    {muted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setPaused(p => !p); }}
                  className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/15 hover:bg-black/60 transition"
                >
                  {paused
                    ? <Play className="w-3 h-3 text-white fill-white" />
                    : <Pause className="w-3 h-3 text-white fill-white" />}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setShowShare(true); }}
                  className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/15 hover:bg-black/60 transition"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); router.push(backUrl); }}
                  className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/15 hover:bg-black/60 transition"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Text content */}
            <div
              className={`absolute inset-0 flex flex-col px-5 z-10 pointer-events-none ${positionClass}`}
              key={`text-${currentIdx}`}
            >
              <div className={`space-y-2 ${animClass}`}>
                {currentSlide.heading && (
                  <h1
                    className={`${headingClass} leading-tight`}
                    style={{
                      color: currentSlide.headingColor,
                      textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.6)',
                    }}
                  >
                    {currentSlide.heading}
                  </h1>
                )}
                {currentSlide.subtext && (
                  <p
                    className="text-base leading-relaxed"
                    style={{
                      color: currentSlide.subtextColor,
                      textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                    }}
                  >
                    {currentSlide.subtext}
                  </p>
                )}
              </div>
            </div>

            {/* CTA */}
            {currentSlide.ctaText && currentSlide.ctaUrl && (
              <div className="absolute bottom-6 left-5 right-5 z-20">
                <a
                  href={currentSlide.ctaUrl}
                  onClick={e => e.stopPropagation()}
                  className="block w-full py-3.5 bg-white text-gray-900 text-sm font-bold text-center rounded-full shadow-xl hover:bg-gray-50 transition active:scale-95"
                >
                  {currentSlide.ctaText}
                </a>
              </div>
            )}

            {/* Click zones (tap to advance) */}
            <div className="absolute inset-0 flex z-10" onClick={handleClick}>
              <div className="w-1/3 h-full" />
              <div className="w-2/3 h-full" />
            </div>

            {/* Paused overlay */}
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div className="w-14 h-14 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                  <Pause className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            )}
          </div>
          {/* ── End Story Card ── */}

          {/* Right arrow — desktop only */}
          <button
            onClick={goNext}
            disabled={currentIdx === slides.length - 1}
            className="hidden sm:flex flex-shrink-0 ml-6 w-12 h-12 bg-white rounded-full shadow-xl items-center justify-center disabled:opacity-25 hover:scale-110 transition-transform z-20"
          >
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </button>

        </div>
      </div>

      {/* Share sheet */}
      {showShare && <ShareSheet story={story} onClose={() => setShowShare(false)} />}
    </>
  );
}

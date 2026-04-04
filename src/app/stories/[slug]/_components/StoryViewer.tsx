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

function scaleFilter(css: string | undefined, intensity: number): string | undefined {
  if (!css) return undefined;
  const t = Math.max(0, Math.min(100, intensity)) / 100;
  if (t === 1) return css;
  if (t === 0) return undefined;
  const NEUTRALS: Record<string, number> = {
    saturate: 1, brightness: 1, contrast: 1,
    grayscale: 0, sepia: 0, invert: 0, blur: 0, 'hue-rotate': 0,
  };
  const result = css.replace(/(\w[\w-]*)\(([^)]+)\)/g, (_m: string, fn: string, val: string) => {
    const neutral = NEUTRALS[fn] ?? 0;
    if (val.includes('deg')) {
      const num = parseFloat(val);
      return `${fn}(${(neutral + (num - neutral) * t).toFixed(1)}deg)`;
    }
    const num = parseFloat(val);
    return `${fn}(${(neutral + (num - neutral) * t).toFixed(3)})`;
  });
  return result || undefined;
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

function getClipPath(st: string): string {
  switch (st) {
    case 'triangle':      return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'diamond':       return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'star':          return 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
    case 'hexagon':       return 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)';
    case 'pentagon':      return 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)';
    case 'octagon':       return 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)';
    case 'cross':         return 'polygon(35% 0%,65% 0%,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0% 65%,0% 35%,35% 35%)';
    case 'parallelogram': return 'polygon(20% 0%,100% 0%,80% 100%,0% 100%)';
    case 'arrowRight':    return 'polygon(0% 20%,60% 20%,60% 0%,100% 50%,60% 100%,60% 80%,0% 80%)';
    case 'arrowLeft':     return 'polygon(40% 0%,40% 20%,100% 20%,100% 80%,40% 80%,40% 100%,0% 50%)';
    case 'arrowUp':       return 'polygon(50% 0%,100% 40%,80% 40%,80% 100%,20% 100%,20% 40%,0% 40%)';
    case 'arrowDown':     return 'polygon(20% 0%,80% 0%,80% 60%,100% 60%,50% 100%,0% 60%,20% 60%)';
    case 'arrowDoubleH':  return 'polygon(0% 50%,20% 0%,20% 35%,80% 35%,80% 0%,100% 50%,80% 100%,80% 65%,20% 65%,20% 100%)';
    case 'chevronRight':  return 'polygon(0% 0%,75% 0%,100% 50%,75% 100%,0% 100%,25% 50%)';
    case 'chevronLeft':   return 'polygon(25% 0%,100% 0%,75% 50%,100% 100%,25% 100%,0% 50%)';
    case 'star4':         return 'polygon(50% 0%,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0% 50%,40% 40%)';
    case 'star6':         return 'polygon(50% 0%,38% 28%,7% 25%,25% 50%,7% 75%,38% 72%,50% 100%,63% 72%,93% 75%,75% 50%,93% 25%,63% 28%)';
    case 'star8':         return 'polygon(50% 0%,61% 24%,85% 15%,76% 39%,100% 50%,76% 61%,85% 85%,61% 76%,50% 100%,39% 76%,15% 85%,24% 61%,0% 50%,24% 39%,15% 15%,39% 24%)';
    case 'starburst':     return 'polygon(50% 0%,55% 31%,75% 7%,64% 36%,93% 25%,69% 45%,100% 50%,69% 55%,93% 75%,64% 64%,75% 93%,55% 69%,50% 100%,45% 69%,25% 93%,36% 64%,7% 75%,31% 55%,0% 50%,31% 45%,7% 25%,36% 36%,25% 7%,45% 31%)';
    default: return 'none';
  }
}

const VIEWER_SVG_PATHS: Record<string, string> = {
  heart:       'M 50 30 C 50 22,42 10,25 10 C 8 10,0 25,0 40 C 0 65,50 90,50 90 C 50 90,100 65,100 40 C 100 25,92 10,75 10 C 58 10,50 22,50 30 Z',
  speechLeft:  'M 15 0 Q 0 0 0 15 L 0 65 Q 0 80 15 80 L 20 80 L 8 100 L 38 80 L 85 80 Q 100 80 100 65 L 100 15 Q 100 0 85 0 Z',
  speechRight: 'M 15 0 Q 0 0 0 15 L 0 65 Q 0 80 15 80 L 62 80 L 92 100 L 80 80 L 85 80 Q 100 80 100 65 L 100 15 Q 100 0 85 0 Z',
  speechRound: 'M 10 0 Q 0 0 0 10 L 0 62 Q 0 75 10 75 L 40 75 L 50 95 L 60 75 L 90 75 Q 100 75 100 62 L 100 10 Q 100 0 90 0 Z',
  bannerRibbon:'M 0 20 L 15 35 L 0 50 L 0 85 Q 0 100 15 100 L 85 100 Q 100 100 100 85 L 100 50 L 85 35 L 100 20 Z',
  fcDocument:  'M 0 0 L 100 0 L 100 75 Q 87 90 75 75 Q 62 60 50 75 Q 37 90 25 75 Q 12 60 0 75 Z',
  blobA:       'M 72 14 C 90 26,102 46,96 65 C 90 84,72 95,52 93 C 32 91,8 84,2 66 C -4 48,8 24,24 14 C 40 4,54 2,72 14 Z',
  blobB:       'M 65 8 C 82 14,96 32,97 52 C 98 72,84 92,64 95 C 44 98,20 88,8 70 C -4 52,0 26,16 14 C 32 2,48 2,65 8 Z',
  gear:        'M 40 0 L 60 0 L 64 16 L 78 8 L 92 22 L 84 36 L 100 44 L 100 56 L 84 64 L 92 78 L 78 92 L 64 84 L 60 100 L 40 100 L 36 84 L 22 92 L 8 78 L 16 64 L 0 56 L 0 44 L 16 36 L 8 22 L 22 8 L 36 16 Z M 35 50 A 15 15 0 1 0 65 50 A 15 15 0 1 0 35 50 Z',
};

// Build animation CSS with custom duration and easing
function getAnimCss(key: string, duration: number = 0.6, easing?: string): string {
  const d = `${duration}s`;
  const defaultEasing = key === 'pop' ? 'cubic-bezier(0.175,0.885,0.32,1.275)' : 'ease';
  const e = easing || defaultEasing;
  switch (key) {
    case 'fade-in':    return `ws-fadeIn ${d} ${e} forwards`;
    case 'slide-up':   return `ws-slideUp ${d} ${e} forwards`;
    case 'slide-down': return `ws-slideDown ${d} ${e} forwards`;
    case 'slide-left': return `ws-slideLeft ${d} ${e} forwards`;
    case 'slide-right':return `ws-slideRight ${d} ${e} forwards`;
    case 'zoom-in':    return `ws-zoomIn ${d} ${e} forwards`;
    case 'pop':        return `ws-pop ${d} ${e} forwards`;
    case 'spin-in':    return `ws-spin ${d} ${e} forwards`;
    default: return '';
  }
}

// Parse canvasData (may be old array format or new { config, elements } format)
function parseCanvasData(raw: any): { config: any; elements: any[] } {
  if (!raw) return { config: {}, elements: [] };
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (Array.isArray(parsed)) return { config: {}, elements: parsed };
  return { config: parsed.config || {}, elements: parsed.elements || [] };
}
const ANIM_KEYS = new Set(['fade-in','slide-up','slide-down','slide-left','slide-right','zoom-in','pop','spin-in']);

function ViewerCanvasElements({ elements, slideKey }: { elements: any[]; slideKey: string }) {
  if (!elements?.length) return null;
  return (
    <div key={slideKey} className="absolute inset-0 overflow-hidden" style={{ containerType: 'inline-size', pointerEvents: 'none' } as any}>
      {[...elements].sort((a, b) => (a.z || 0) - (b.z || 0)).map((el: any) => {
        const flipX = el.flipX ? ' scaleX(-1)' : '';
        const flipY = el.flipY ? ' scaleY(-1)' : '';
        const scaledFilterCss = scaleFilter(el.filterCss, el.filterIntensity ?? 100);
        const shadowFilter = buildDropShadow(el);
        const isText = el.type === 'text';
        // For text: use textShadow on inner div, only filterCss on outer. For others: combine both.
        const combinedFilter = isText
          ? (scaledFilterCss || undefined)
          : ([scaledFilterCss, shadowFilter].filter(Boolean).join(' ') || undefined);
        const s: React.CSSProperties = {
          position: 'absolute',
          left: `${(el.x / CANVAS_W) * 100}%`,
          top: `${(el.y / CANVAS_H) * 100}%`,
          width: `${(el.w / CANVAS_W) * 100}%`,
          height: `${(el.h / CANVAS_H) * 100}%`,
          transform: `rotate(${el.rot || 0}deg)${flipX}${flipY}`,
          zIndex: (el.type === 'button' && el.href) ? 20 : (el.z || 0) + 5,
          opacity: el.opacity ?? 1,
          filter: combinedFilter,
          animation: el.animation && ANIM_KEYS.has(el.animation) ? getAnimCss(el.animation, el.animationDuration, el.animationEasing) : undefined,
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
                letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                textTransform: el.textTransform || undefined,
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
              {el.tintColor && (el.tintOpacity ?? 0) > 0 && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: el.tintColor, opacity: el.tintOpacity, pointerEvents: 'none' }} />
              )}
            </div>
          );
        }

        // ── Sticker ───────────────────────────────────────────────────────────
        if (el.type === 'sticker') {
          return (
            <div key={el.id} style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: `${(el.fontSize || 60) / CANVAS_W * 100}cqw`, lineHeight: 1 }}>{el.content || '⭐'}</span>
            </div>
          );
        }

        // ── Shape ─────────────────────────────────────────────────────────────
        if (el.type === 'shape') {
          const shapeType = el.shapeType || 'rect';
          const fillColor = el.bgColor ? toRgba(el.bgColor, el.bgAlpha ?? 1) : '#6366f1';
          const filled = el.filled !== false;
          const bw = el.borderWidth || 0;
          const borderDs = bw > 0 ? `drop-shadow(0 0 ${bw}px ${el.borderColor || '#fff'})` : '';
          const shapeFilter = [scaledFilterCss, borderDs, shadowFilter].filter(Boolean).join(' ') || undefined;

          // SVG-based shapes
          const svgClipId = `sv-${el.id}`;
          if (shapeType === 'fcCylinder') {
            const cylPath = 'M 0 18 Q 0 5 50 5 Q 100 5 100 18 L 100 82 Q 100 95 50 95 Q 0 95 0 82 Z';
            if (el.bgImage) return (
              <div key={el.id} style={{ ...s, filter: shapeFilter }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <defs><clipPath id={svgClipId}><path d={cylPath} /></clipPath></defs>
                  <image href={el.bgImage} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${svgClipId})`} />
                </svg>
              </div>
            );
            if (el.isFrame) return null;
            return (
              <div key={el.id} style={{ ...s, filter: shapeFilter }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <path d={cylPath} fill={filled ? fillColor : 'transparent'} />
                  <path d="M 0 18 Q 0 31 50 31 Q 100 31 100 18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                </svg>
              </div>
            );
          }
          if (VIEWER_SVG_PATHS[shapeType]) {
            const svgPath = VIEWER_SVG_PATHS[shapeType];
            if (el.bgImage) return (
              <div key={el.id} style={{ ...s, filter: shapeFilter }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <defs><clipPath id={svgClipId}><path d={svgPath} /></clipPath></defs>
                  <image href={el.bgImage} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${svgClipId})`} />
                </svg>
              </div>
            );
            if (el.isFrame) return null;
            return (
              <div key={el.id} style={{ ...s, filter: shapeFilter }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <path d={svgPath} fill={filled ? fillColor : 'transparent'} fillRule={shapeType === 'gear' ? 'evenodd' : 'nonzero'} />
                </svg>
              </div>
            );
          }

          const clip = getClipPath(shapeType);
          const bgImage = el.bgImage ? `url(${el.bgImage})` : undefined;

          if (clip !== 'none') {
            if (el.isFrame && !el.bgImage) return null;
            return (
              <div key={el.id} style={{ ...s, filter: shapeFilter }}>
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
          if (el.isFrame && !el.bgImage) return null;
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
            <div key={el.id} style={{ ...s, ...(el.href ? { pointerEvents: 'auto' } : {}) }}>
              {el.href
                ? <a href={el.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={innerStyle}>{label}</a>
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
  canvasData?: any;
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
  readonly?: boolean; // admin preview: disable reaction saving
}

type ReactionType = 'HEART' | 'FIRE' | 'THUMBS_UP';

// Professional SVG reaction icons
function IconHeart({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'url(#heartGrad)' : 'none'} stroke={active ? 'none' : 'rgba(255,255,255,0.7)'} strokeWidth="1.8" className="w-8 h-8">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b8a" />
          <stop offset="100%" stopColor="#e91e63" />
        </linearGradient>
      </defs>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconFire({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'url(#fireGrad)' : 'none'} stroke={active ? 'none' : 'rgba(255,255,255,0.7)'} strokeWidth="1.8" strokeLinejoin="round" className="w-8 h-8">
      <defs>
        <linearGradient id="fireGrad" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#ffd93d" />
          <stop offset="50%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#c0392b" />
        </linearGradient>
      </defs>
      <path d="M12 2c0 0-3 4-3 7a3 3 0 0 0 6 0c0-1-.5-2-1-3 0 0 2 2 2 5a5 5 0 0 1-10 0c0-5 4-9 6-9z" />
      <path d="M12 14c0 0-1.5 1-1.5 2.5a1.5 1.5 0 0 0 3 0C13.5 15 12 14 12 14z" />
    </svg>
  );
}

function IconThumbsUp({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'url(#thumbGrad)' : 'none'} stroke={active ? 'none' : 'rgba(255,255,255,0.7)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <defs>
        <linearGradient id="thumbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#74b9ff" />
          <stop offset="100%" stopColor="#0984e3" />
        </linearGradient>
      </defs>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

const REACTION_CONFIG: Record<ReactionType, {
  label: string;
  icon: (active: boolean) => React.ReactNode;
  activeBg: string;
  activeGlow: string;
}> = {
  HEART: {
    label: 'Love',
    icon: (active) => <IconHeart active={active} />,
    activeBg: 'from-pink-500/30 to-rose-600/30',
    activeGlow: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
  },
  FIRE: {
    label: 'Fire',
    icon: (active) => <IconFire active={active} />,
    activeBg: 'from-orange-400/30 to-red-500/30',
    activeGlow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]',
  },
  THUMBS_UP: {
    label: 'Like',
    icon: (active) => <IconThumbsUp active={active} />,
    activeBg: 'from-blue-400/30 to-blue-600/30',
    activeGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
  },
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
  // Always use canonical public story URL regardless of where viewer is embedded (e.g. admin preview)
  const url = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/stories/${story.slug}`
    : `/stories/${story.slug}`;
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

export default function StoryViewer({ story, backUrl = '/stories', readonly = false }: StoryViewerProps) {
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

  // Record view on mount (fire-and-forget, once per mount)
  const viewRecorded = useRef(false);
  useEffect(() => {
    if (viewRecorded.current) return;
    viewRecorded.current = true;
    fetch(`/api/web-stories/${story.slug}/view`, { method: 'POST' }).catch(() => {});
  }, [story.slug]);

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
    // Optimistic update for instant feedback
    setReactedTypes(prev => new Set([...prev, type]));
    if (readonly) return; // admin preview — don't save reactions
    try {
      const res = await fetch(`/api/web-stories/${story.slug}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type }),
      });
      const data = await res.json();
      if (res.ok || res.status === 429) {
        // Update counts whether fresh reaction or already-reacted (429 also returns counts now)
        if (data.reactions) setReactions(data.reactions);
      }
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
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
        {/* Layered background */}
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        {story.coverImage && (
          <img src={story.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 scale-110 blur-3xl" style={{ filter: 'blur(48px) saturate(1.5)' }} />
        )}
        {/* Radial glow center */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(10,107,63,0.22) 0%, transparent 70%)' }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />

        <div className="relative w-full max-w-[340px] mx-auto px-5 text-center" style={{ animation: 'ws-slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}>

          {/* Check icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, #0A6B3F, #10b981, #34d399, #059669, #0A6B3F)', padding: '2px', borderRadius: '9999px' }}>
              <div className="w-full h-full rounded-full bg-[#0a0a0f]" />
            </div>
            {/* Inner glass */}
            <div className="absolute inset-[3px] rounded-full backdrop-blur-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(10,107,63,0.3), rgba(16,185,129,0.15))' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                <circle cx="12" cy="12" r="10" fill="url(#checkCircle)" opacity="0.9" />
                <polyline points="8,12 11,15 16,9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="checkCircle" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Sparkle dots */}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-300 to-green-500 shadow-lg shadow-green-500/50" />
            <div className="absolute -bottom-0.5 -left-1 w-3 h-3 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-emerald-500/50" />
          </div>

          {/* Title */}
          <div className="mb-1">
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ background: 'linear-gradient(90deg,#059669,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>You finished it</span>
          </div>
          <h2 className="text-white text-[1.6rem] font-black leading-tight mb-2 tracking-tight">Story Complete</h2>

          {/* Story meta card */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6 mx-auto max-w-[260px]" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            {story.coverImage && (
              <img src={story.coverImage} alt="" className="w-11 h-14 rounded-xl object-cover flex-shrink-0" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
            )}
            <div className="text-left min-w-0">
              <p className="text-white text-sm font-semibold leading-snug truncate">{story.title}</p>
              {story.publisherName && (
                <p className="text-white/50 text-xs mt-0.5 truncate">{story.publisherName}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-white/30 font-medium">{slides.length} slides</span>
                {story.category && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                    <span className="text-[10px] text-white/30 font-medium">{story.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reactions */}
          <p className="text-white/35 text-[10px] font-bold tracking-[0.18em] uppercase mb-3">Rate this story</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            {(['HEART', 'FIRE', 'THUMBS_UP'] as ReactionType[]).map(type => {
              const cfg = REACTION_CONFIG[type];
              const active = reactedTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  className={`flex flex-col items-center gap-2 py-4 px-4 rounded-[20px] transition-all duration-300 ${
                    active
                      ? `bg-gradient-to-b ${cfg.activeBg} border border-white/25 scale-110 ${cfg.activeGlow}`
                      : 'border border-white/8 hover:border-white/20 hover:scale-105 active:scale-95'
                  }`}
                  style={{ background: active ? undefined : 'rgba(255,255,255,0.04)', minWidth: 76 }}
                >
                  {cfg.icon(active)}
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-white font-bold text-base leading-none">{reactions[type]}</span>
                    <span className={`text-[10px] font-semibold ${active ? 'text-white/80' : 'text-white/35'}`}>{cfg.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => { setCurrentIdx(0); setShowEnd(false); }}
              className="w-full py-3.5 rounded-[16px] font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
              style={{ background: 'linear-gradient(135deg,#0A6B3F,#10b981)', boxShadow: '0 4px 24px rgba(10,107,63,0.45)', color: 'white' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.36" />
              </svg>
              Watch Again
            </button>
            <button
              onClick={() => router.push(backUrl)}
              className="w-full py-3.5 rounded-[16px] font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
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
            {(() => {
              const { config: bgCfg } = parseCanvasData(currentSlide.canvasData);
              return (
                <div className="absolute inset-0" style={getSlideBg(currentSlide)}>
                  {currentSlide.bgType === 'IMAGE' && currentSlide.bgImage && (
                    <img
                      key={`img-${currentSlide.id}`}
                      src={currentSlide.bgImage}
                      alt=""
                      className="w-full h-full"
                      style={{
                        objectFit: bgCfg.bgImageFit || 'cover',
                        objectPosition: bgCfg.bgImagePosition || 'center',
                        opacity: bgCfg.bgImageOpacity ?? 1,
                      }}
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
              );
            })()}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

            {/* Canvas elements */}
            {(() => {
              const { config: slCfg, elements: slEls } = parseCanvasData(currentSlide.canvasData);
              return (
                <>
                  {/* bgBlur overlay (only for IMAGE/VIDEO bg) */}
                  {(slCfg.bgBlur ?? 0) > 0 && (currentSlide.bgType === 'IMAGE' || currentSlide.bgType === 'VIDEO') && (
                    <div className="absolute inset-0" style={{ backdropFilter: `blur(${slCfg.bgBlur}px)`, WebkitBackdropFilter: `blur(${slCfg.bgBlur}px)` } as React.CSSProperties} />
                  )}
                  {/* Color overlay */}
                  {slCfg.bgOverlayColor && (slCfg.bgOverlayOpacity ?? 0) > 0 && (
                    <div className="absolute inset-0" style={{ backgroundColor: slCfg.bgOverlayColor, opacity: slCfg.bgOverlayOpacity }} />
                  )}
                  {slEls.length > 0 && (
                    <ViewerCanvasElements elements={slEls} slideKey={`${currentSlide.id}-${currentIdx}`} />
                  )}
                </>
              );
            })()}

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

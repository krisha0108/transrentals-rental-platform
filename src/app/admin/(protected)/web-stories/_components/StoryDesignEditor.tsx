'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Loader2, ChevronLeft, Globe, Save,
  Type, Image as ImageIcon, Square, Upload,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link, ArrowUp, ArrowDown, Copy, Eye, X, MousePointer,
  FlipHorizontal, FlipVertical, Sparkles, Lock, Unlock,
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  GripVertical,
} from 'lucide-react';

const CANVAS_W = 390;
const CANVAS_H = 693;

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Open+Sans:wght@400;700&family=Raleway:wght@400;700&family=Playfair+Display:wght@400;700&family=Oswald:wght@400;700&family=Lobster&family=Dancing+Script:wght@400;700&family=Pacifico&family=Quicksand:wght@400;700&family=Nunito:wght@400;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Ubuntu:wght@400;700&family=Bebas+Neue&family=Inter:wght@400;700&display=swap';

const FONTS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Open Sans', value: 'Open Sans, sans-serif' },
  { label: 'Raleway', value: 'Raleway, sans-serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Quicksand', value: 'Quicksand, sans-serif' },
  { label: 'Ubuntu', value: 'Ubuntu, sans-serif' },
  { label: 'Oswald', value: 'Oswald, sans-serif' },
  { label: 'Bebas Neue', value: 'Bebas Neue, sans-serif' },
  { label: 'Playfair', value: 'Playfair Display, serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'Lobster', value: 'Lobster, cursive' },
  { label: 'Dancing', value: 'Dancing Script, cursive' },
  { label: 'Pacifico', value: 'Pacifico, cursive' },
  { label: 'Courier', value: 'Courier New, monospace' },
];

const FILTER_PRESETS = [
  { name: 'None', css: '' },
  { name: 'Vivid', css: 'saturate(1.8) contrast(1.1)' },
  { name: 'Cool', css: 'hue-rotate(20deg) saturate(1.1) brightness(1.05)' },
  { name: 'Warm', css: 'sepia(0.4) saturate(1.2) brightness(1.05)' },
  { name: 'Fade', css: 'saturate(0.6) brightness(1.15) contrast(0.9)' },
  { name: 'Mono', css: 'grayscale(1)' },
  { name: 'Sepia', css: 'sepia(1)' },
  { name: 'Bright', css: 'brightness(1.4) contrast(1.1)' },
  { name: 'Dark', css: 'brightness(0.55) contrast(1.3)' },
  { name: 'Blur', css: 'blur(4px)' },
  { name: 'Invert', css: 'invert(1)' },
  { name: 'Punch', css: 'contrast(1.6) saturate(1.5)' },
];

const ANIMATIONS = [
  { name: 'None', value: '' },
  { name: 'Fade In', value: 'fade-in' },
  { name: 'Slide Up', value: 'slide-up' },
  { name: 'Slide Down', value: 'slide-down' },
  { name: 'Slide Left', value: 'slide-left' },
  { name: 'Slide Right', value: 'slide-right' },
  { name: 'Zoom In', value: 'zoom-in' },
  { name: 'Pop', value: 'pop' },
  { name: 'Spin', value: 'spin-in' },
];

const EASINGS = [
  { label: 'Ease', value: 'ease' },
  { label: 'Linear', value: 'linear' },
  { label: 'Ease In', value: 'ease-in' },
  { label: 'Ease Out', value: 'ease-out' },
  { label: 'Smooth', value: 'ease-in-out' },
  { label: 'Bounce', value: 'cubic-bezier(0.175,0.885,0.32,1.275)' },
];

type EType = 'text' | 'image' | 'shape' | 'button';
type ShapeType = 'rect' | 'circle' | 'triangle' | 'diamond' | 'star' | 'hexagon';

interface CE {
  id: string; type: EType;
  x: number; y: number; w: number; h: number;
  rot: number; z: number; opacity: number;
  flipX?: boolean; flipY?: boolean;
  filterCss?: string;
  animation?: string; animationDuration?: number; animationEasing?: string;
  locked?: boolean;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  content?: string; fontSize?: number; fontFamily?: string;
  bold?: boolean; italic?: boolean; underline?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string; colorAlpha?: number;
  lineHeight?: number;
  textStrokeColor?: string; textStrokeWidth?: number;
  bgColor?: string; bgAlpha?: number;
  borderRadius?: number;
  shapeType?: ShapeType;
  bgImage?: string;
  filled?: boolean;
  borderColor?: string; borderWidth?: number;
  shadowX?: number; shadowY?: number; shadowBlur?: number; shadowColor?: string; shadowAlpha?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  objectPosition?: string;
  src?: string;
  href?: string;
}

interface SD {
  id: string; order: number; duration: number;
  bgType: 'COLOR' | 'GRADIENT' | 'IMAGE' | 'VIDEO';
  bgColor: string | null; bgGradient: string | null;
  bgImage: string | null; bgVideo: string | null;
  bgImageOpacity?: number; bgImageFit?: 'cover' | 'contain' | 'fill'; bgImagePosition?: string;
  bgBlur?: number;
  bgOverlayColor?: string; bgOverlayOpacity?: number;
  elements: CE[];
}

interface Meta {
  title: string; slug: string; description: string; metaDescription: string;
  category: string; publisherName: string; publisherLogo: string;
  coverImage: string; coverImageSquare: string; expiresAt: string;
}

type Tab = 'insert' | 'style' | 'document';

const uid = () => '_' + Math.random().toString(36).slice(2, 11);
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

function toRgba(hex: string, alpha = 1): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return hex || '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return alpha >= 1 ? hex : `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

function getClipPath(st: ShapeType): string {
  switch (st) {
    case 'triangle': return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'diamond': return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    case 'hexagon': return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    default: return 'none';
  }
}

function shadowRgba(el: CE): string {
  return toRgba(el.shadowColor || '#000000', el.shadowAlpha ?? 0.6);
}

function hasShadow(el: CE): boolean {
  return el.shadowBlur !== undefined || el.shadowX !== undefined || el.shadowY !== undefined || el.shadowAlpha !== undefined;
}

function buildDropShadow(el: CE): string {
  if (!hasShadow(el)) return '';
  return `drop-shadow(${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 8}px ${shadowRgba(el)})`;
}

function buildTextShadow(el: CE): string | undefined {
  if (!hasShadow(el)) return undefined;
  return `${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 8}px ${shadowRgba(el)}`;
}

function blankSlide(order: number): SD {
  return { id: uid(), order, duration: 7, bgType: 'COLOR', bgColor: '#1a1a2e', bgGradient: null, bgImage: null, bgVideo: null, elements: [] };
}

function slideBgStyle(s: SD): React.CSSProperties {
  if (s.bgType === 'COLOR') return { backgroundColor: s.bgColor || '#1a1a2e' };
  if (s.bgType === 'GRADIENT') return { background: s.bgGradient || 'linear-gradient(135deg,#1a1a2e,#0f3460)' };
  return { backgroundColor: '#111' };
}

function calcSeo(meta: Meta, slides: SD[]): number {
  return [meta.title.trim().length > 3, meta.metaDescription.trim().length > 10, !!meta.coverImage, !!meta.coverImageSquare, !!(meta.publisherName && meta.publisherLogo), slides.length >= 4, !!meta.category, /^[a-z0-9-]+$/.test(meta.slug), slides.some(s => s.elements.some(e => e.type === 'text' && e.content)), meta.description.trim().length > 10].filter(Boolean).length * 10;
}

function SlideBg({ s, children }: { s: SD; children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={slideBgStyle(s)}>
      {s.bgType === 'IMAGE' && s.bgImage && (
        <img src={s.bgImage} alt="" className="absolute inset-0 w-full h-full"
          style={{ objectFit: s.bgImageFit || 'cover', objectPosition: s.bgImagePosition || 'center', opacity: s.bgImageOpacity ?? 1, filter: s.bgBlur ? `blur(${s.bgBlur}px)` : undefined, transform: s.bgBlur ? 'scale(1.05)' : undefined }} />
      )}
      {s.bgType === 'VIDEO' && s.bgVideo && <video src={s.bgVideo} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />}
      {/* Color overlay */}
      {s.bgOverlayColor && (s.bgOverlayOpacity ?? 0) > 0 && (
        <div className="absolute inset-0" style={{ backgroundColor: s.bgOverlayColor, opacity: s.bgOverlayOpacity ?? 0.5 }} />
      )}
      {children}
    </div>
  );
}

function renderElInner(el: CE): React.ReactNode {
  const shadowFilter = buildDropShadow(el);
  const combinedFilter = [el.filterCss, shadowFilter].filter(Boolean).join(' ') || undefined;

  if (el.type === 'text' || el.type === 'button') {
    const isBtn = el.type === 'button';
    const bw = el.borderWidth || 0;
    const boxShadow = isBtn && hasShadow(el)
      ? `${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 8}px ${shadowRgba(el)}`
      : undefined;
    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ filter: el.filterCss || undefined, backgroundColor: isBtn ? toRgba(el.bgColor || '#ffffff', el.bgAlpha ?? 1) : 'transparent', borderRadius: el.borderRadius ?? (isBtn ? 50 : 0), border: bw > 0 ? `${bw}px solid ${el.borderColor || '#fff'}` : undefined, boxSizing: 'border-box', boxShadow }}>
        <div style={{ fontSize: el.fontSize || (isBtn ? 16 : 24), fontFamily: el.fontFamily || 'inherit', fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', textDecoration: el.underline ? 'underline' : 'none', textAlign: el.align || 'center', color: toRgba(el.color || '#ffffff', el.colorAlpha ?? 1), lineHeight: el.lineHeight || 1.3, letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined, textTransform: el.textTransform || 'none', padding: isBtn ? '0 16px' : 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap', width: '100%', WebkitTextStroke: el.textStrokeWidth ? `${el.textStrokeWidth}px ${el.textStrokeColor || '#000'}` : undefined, textShadow: !isBtn ? buildTextShadow(el) : undefined } as React.CSSProperties}>
          {el.content || (isBtn ? 'Button' : 'Double-click to edit')}
        </div>
      </div>
    );
  }

  if (el.type === 'image') {
    const bw = el.borderWidth || 0;
    return el.src
      ? <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: el.objectFit || 'cover', objectPosition: el.objectPosition || 'center center', borderRadius: el.borderRadius ?? 0, filter: combinedFilter, border: bw > 0 ? `${bw}px solid ${el.borderColor || '#fff'}` : undefined, boxSizing: 'border-box' }} />
      : <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-600"><ImageIcon className="w-8 h-8 text-gray-400" /></div>;
  }

  if (el.type === 'shape') {
    const st = el.shapeType || 'rect';
    const clip = getClipPath(st);
    const isFilled = el.filled !== false;
    const fillColor = isFilled ? toRgba(el.bgColor || '#6366f1', el.bgAlpha ?? 1) : 'transparent';
    const bw = el.borderWidth || 0;
    if (clip !== 'none') {
      const borderDs = bw > 0 ? `drop-shadow(0 0 ${bw}px ${el.borderColor || '#fff'})` : '';
      const shapeFilter = [el.filterCss, borderDs, shadowFilter].filter(Boolean).join(' ') || undefined;
      return <div style={{ width: '100%', height: '100%', backgroundColor: el.bgImage ? 'transparent' : fillColor, clipPath: clip, backgroundImage: el.bgImage ? `url(${el.bgImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', filter: shapeFilter }} />;
    }
    const br = st === 'circle' ? '50%' : `${el.borderRadius ?? 0}px`;
    return <div style={{ width: '100%', height: '100%', backgroundColor: el.bgImage ? 'transparent' : fillColor, borderRadius: br, backgroundImage: el.bgImage ? `url(${el.bgImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', border: bw > 0 ? `${bw}px solid ${el.borderColor || '#fff'}` : undefined, boxSizing: 'border-box', overflow: 'hidden', filter: combinedFilter }} />;
  }
  return null;
}

// ─── CanvasEl with Rotation Handle ───────────────────────────────────────────
function CanvasEl({ el, selected, scale, canvasRef, onSelect, onChange, onDblClick, onDragMove, onDragEnd, dropHighlight, onSnapshot }: {
  el: CE; selected: boolean; scale: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void; onChange: (e: CE) => void; onDblClick: () => void;
  onDragMove?: (el: CE) => void;
  onDragEnd?: (finalEl: CE) => void;
  dropHighlight?: boolean;
  onSnapshot?: () => void;
}) {
  const handleDrag = (e: React.MouseEvent) => {
    if (el.locked) { onSelect(); return; }
    e.preventDefault(); e.stopPropagation(); onSelect();
    onSnapshot?.();
    const sx = e.clientX, sy = e.clientY, ox = el.x, oy = el.y;
    const SNAP = 8;
    const snapX = (x: number) => {
      if (Math.abs(x) < SNAP) return 0;
      if (Math.abs(x + el.w - CANVAS_W) < SNAP) return CANVAS_W - el.w;
      if (Math.abs(x + el.w / 2 - CANVAS_W / 2) < SNAP) return CANVAS_W / 2 - el.w / 2;
      return x;
    };
    const snapY = (y: number) => {
      if (Math.abs(y) < SNAP) return 0;
      if (Math.abs(y + el.h - CANVAS_H) < SNAP) return CANVAS_H - el.h;
      if (Math.abs(y + el.h / 2 - CANVAS_H / 2) < SNAP) return CANVAS_H / 2 - el.h / 2;
      return y;
    };
    let lastEl = el;
    const move = (ev: MouseEvent) => {
      const rawX = ox + (ev.clientX - sx) / scale;
      const rawY = oy + (ev.clientY - sy) / scale;
      lastEl = { ...el, x: ev.altKey ? rawX : snapX(rawX), y: ev.altKey ? rawY : snapY(rawY) };
      onChange(lastEl);
      if (onDragMove) onDragMove(lastEl);
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      if (onDragEnd) onDragEnd(lastEl);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };

  const handleResize = (handle: string, e: React.MouseEvent) => {
    if (el.locked) return;
    e.preventDefault(); e.stopPropagation();
    onSnapshot?.();
    const sx = e.clientX, sy = e.clientY, s0 = { ...el };
    const move = (ev: MouseEvent) => {
      const dx = (ev.clientX - sx) / scale, dy = (ev.clientY - sy) / scale;
      let { x, y, w, h } = s0;
      if (handle.includes('e')) w = Math.max(30, s0.w + dx);
      if (handle.includes('s')) h = Math.max(20, s0.h + dy);
      if (handle.includes('w')) { x = s0.x + dx; w = Math.max(30, s0.w - dx); }
      if (handle.includes('n')) { y = s0.y + dy; h = Math.max(20, s0.h - dy); }
      onChange({ ...el, x, y, w, h });
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };

  const handleRotate = (e: React.MouseEvent) => {
    if (el.locked) return;
    e.preventDefault(); e.stopPropagation(); onSelect();
    onSnapshot?.();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + (el.x + el.w / 2) * scale;
    const cy = rect.top + (el.y + el.h / 2) * scale;
    const startA = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    const startRot = el.rot;
    const move = (ev: MouseEvent) => {
      const a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
      let r = startRot + (a - startA);
      if (ev.shiftKey) r = Math.round(r / 15) * 15;
      onChange({ ...el, rot: r });
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };

  const handles = [
    { id: 'nw', s: { top: -5, left: -5, cursor: 'nw-resize' } },
    { id: 'n', s: { top: -5, left: '50%', marginLeft: -5, cursor: 'n-resize' } },
    { id: 'ne', s: { top: -5, right: -5, cursor: 'ne-resize' } },
    { id: 'e', s: { top: '50%', marginTop: -5, right: -5, cursor: 'e-resize' } },
    { id: 'se', s: { bottom: -5, right: -5, cursor: 'se-resize' } },
    { id: 's', s: { bottom: -5, left: '50%', marginLeft: -5, cursor: 's-resize' } },
    { id: 'sw', s: { bottom: -5, left: -5, cursor: 'sw-resize' } },
    { id: 'w', s: { top: '50%', marginTop: -5, left: -5, cursor: 'w-resize' } },
  ];

  const flipStr = `${el.flipX ? ' scaleX(-1)' : ''}${el.flipY ? ' scaleY(-1)' : ''}`;

  return (
    <div
      style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rot}deg)${flipStr}`, zIndex: el.z, opacity: el.opacity, cursor: el.locked ? 'not-allowed' : 'move', outline: dropHighlight ? '3px solid #22c55e' : selected ? (el.locked ? '2px solid #f59e0b' : '2px solid #818cf8') : 'none', outlineOffset: dropHighlight ? 3 : 1, userSelect: 'none', transition: 'outline 0.1s' }}
      onMouseDown={handleDrag}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={e => { e.stopPropagation(); onDblClick(); }}
    >
      {renderElInner(el)}
      {selected && (
        <>
          {/* Rotation handle */}
          <div style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
            onMouseDown={handleRotate}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#818cf8', border: '2px solid white', cursor: 'grab', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} title={`Rotate (${Math.round(el.rot)}°)`} />
          </div>
          {/* Line from rotation handle to element */}
          <div style={{ position: 'absolute', top: -18, left: '50%', width: 1, height: 18, backgroundColor: '#818cf8', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
          {/* Resize handles */}
          {handles.map(h => (
            <div key={h.id} style={{ position: 'absolute', width: 10, height: 10, backgroundColor: '#fff', border: '2px solid #818cf8', borderRadius: 2, ...h.s } as React.CSSProperties}
              onMouseDown={ev => handleResize(h.id, ev)} />
          ))}
        </>
      )}
    </div>
  );
}

// ─── TextEditModal ─────────────────────────────────────────────────────────────
function TextEditModal({ el, onSave, onClose }: { el: CE; onSave: (c: string) => void; onClose: () => void }) {
  const [val, setVal] = useState(el.content || '');
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Edit Text</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <textarea autoFocus value={val} onChange={e => setVal(e.target.value)}
          className="w-full h-32 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Enter text..." />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm">Cancel</button>
          <button onClick={() => { onSave(val); onClose(); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── SlideThumbnail ────────────────────────────────────────────────────────────
function SlideThumbnail({ s, idx, selected, onClick, onDelete, onDuplicate }: {
  s: SD; idx: number; selected: boolean;
  onClick: () => void; onDelete: () => void; onDuplicate: () => void;
}) {
  const ts = 72 / CANVAS_W;
  return (
    <div className="relative flex-shrink-0 group cursor-pointer" onClick={onClick}>
      <div className={`overflow-hidden rounded-lg ${selected ? 'ring-2 ring-indigo-400' : 'ring-1 ring-white/10'}`} style={{ width: 72, height: 128 }}>
        <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${ts})`, transformOrigin: 'top left', position: 'absolute', pointerEvents: 'none' }}>
          <SlideBg s={s}>
            {s.elements.sort((a, b) => a.z - b.z).map(el => (
              <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.z, opacity: el.opacity, transform: `rotate(${el.rot}deg)${el.flipX ? ' scaleX(-1)' : ''}${el.flipY ? ' scaleY(-1)' : ''}` }}>
                {renderElInner(el)}
              </div>
            ))}
          </SlideBg>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 rounded-b-lg">{idx + 1}</div>
      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition z-10">
        <button onClick={e => { e.stopPropagation(); onDuplicate(); }} className="w-5 h-5 bg-indigo-500 rounded-full text-white text-[10px] flex items-center justify-center">⧉</button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">×</button>
      </div>
    </div>
  );
}

// ─── FloatingToolbar ──────────────────────────────────────────────────────────
function FloatingToolbar({ el, scale, onChange, canvasRef, onShapeImageFill, onSnapshot }: {
  el: CE; scale: number; onChange: (e: CE) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onShapeImageFill?: () => void;
  onSnapshot?: () => void;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [showShadow, setShowShadow] = useState(false);
  if (!canvasRef.current) return null;

  // All positions are in visual pixels (scale already applied)
  const canvasVisualW = CANVAS_W * scale;
  const toolbarW = Math.min(420, canvasVisualW);
  const elTopPx = el.y * scale;
  const elBottomPx = (el.y + el.h) * scale;
  let left = el.x * scale + (el.w * scale) / 2 - toolbarW / 2;
  left = Math.max(0, Math.min(canvasVisualW - toolbarW, left));

  // Show above: anchor toolbar BOTTOM to element TOP using translateY(-100%)
  // This way browser handles the toolbar height — no guessing needed.
  // Show below only if element is very near the top (< 100px from top).
  const showAbove = elTopPx >= 100;
  const posStyle: React.CSSProperties = showAbove
    ? { top: elTopPx - 6, transform: 'translateY(-100%)' }
    : { top: elBottomPx + 8 };

  return (
    <div className="absolute z-50 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl overflow-visible"
      style={{ left, width: toolbarW, ...posStyle }} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>

      {/* ROW 1: Text formatting */}
      {(el.type === 'text' || el.type === 'button') && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/10 flex-wrap">
          <select value={el.fontFamily || 'inherit'} onChange={e => onChange({ ...el, fontFamily: e.target.value })}
            className="text-xs border-0 outline-none bg-transparent text-gray-300 max-w-[76px] cursor-pointer">
            {FONTS.map(f => <option key={f.value} value={f.value} className="bg-gray-800">{f.label}</option>)}
          </select>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <input type="number" value={el.fontSize || 24} min={8} max={120}
            onChange={e => onChange({ ...el, fontSize: Number(e.target.value) })}
            className="w-11 text-xs text-center bg-white/10 text-white border border-white/10 rounded px-1 py-0.5 outline-none" />
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          {[{ icon: <Bold className="w-3.5 h-3.5" />, k: 'bold' as const }, { icon: <Italic className="w-3.5 h-3.5" />, k: 'italic' as const }, { icon: <Underline className="w-3.5 h-3.5" />, k: 'underline' as const }].map(({ icon, k }) => (
            <button key={k} onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, [k]: !el[k] }); }}
              className={`w-7 h-7 rounded flex items-center justify-center ${el[k] ? 'bg-indigo-500/30 text-indigo-300' : 'hover:bg-white/10 text-gray-400'}`}>{icon}</button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          {[{ icon: <AlignLeft className="w-3.5 h-3.5" />, v: 'left' as const }, { icon: <AlignCenter className="w-3.5 h-3.5" />, v: 'center' as const }, { icon: <AlignRight className="w-3.5 h-3.5" />, v: 'right' as const }].map(({ icon, v }) => (
            <button key={v} onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, align: v }); }}
              className={`w-7 h-7 rounded flex items-center justify-center ${(el.align || 'center') === v ? 'bg-indigo-500/30 text-indigo-300' : 'hover:bg-white/10 text-gray-400'}`}>{icon}</button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <input type="color" value={el.color || '#ffffff'} onChange={e => onChange({ ...el, color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border border-white/20 p-0.5 bg-transparent" title="Text color" />
          <input type="range" min={0} max={1} step={0.05} value={el.colorAlpha ?? 1}
            onChange={e => onChange({ ...el, colorAlpha: Number(e.target.value) })}
            className="w-12 accent-indigo-500" />
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          {/* Letter spacing */}
          <div className="flex items-center gap-1" title="Letter Spacing">
            <span className="text-[10px] text-gray-500">LS</span>
            <input type="range" min={-5} max={20} step={0.5} value={el.letterSpacing ?? 0}
              onChange={e => onChange({ ...el, letterSpacing: Number(e.target.value) })}
              className="w-14 accent-indigo-500" />
            <span className="text-[9px] text-gray-500 w-5">{el.letterSpacing ?? 0}</span>
          </div>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          {/* Text Transform */}
          {(['none','uppercase','lowercase','capitalize'] as const).map(t => (
            <button key={t} onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, textTransform: t }); }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${(el.textTransform || 'none') === t ? 'bg-indigo-500/30 text-indigo-300' : 'hover:bg-white/10 text-gray-500'}`}>
              {t === 'none' ? 'Aa' : t === 'uppercase' ? 'AA' : t === 'lowercase' ? 'aa' : 'Abc'}
            </button>
          ))}
        </div>
      )}

      {/* ROW 2: BG, border, radius, href, stroke */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 flex-wrap border-b border-white/10">
        {el.type === 'button' && (
          <div className="flex items-center gap-1">
            <Square className="w-3 h-3 text-gray-500" />
            <input type="color" value={el.bgColor || '#fff'} onChange={e => onChange({ ...el, bgColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-white/20 p-0.5 bg-transparent" />
            <input type="range" min={0} max={1} step={0.05} value={el.bgAlpha ?? 1}
              onChange={e => onChange({ ...el, bgAlpha: Number(e.target.value) })} className="w-12 accent-indigo-500" />
          </div>
        )}
        {el.type === 'shape' && (
          <div className="flex items-center gap-1">
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, filled: true }); }}
                className={`px-2 py-0.5 text-[10px] transition ${el.filled !== false ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}>Filled</button>
              <button onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, filled: false }); }}
                className={`px-2 py-0.5 text-[10px] transition ${el.filled === false ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}>Outline</button>
            </div>
            {el.filled !== false && (
              <>
                <input type="color" value={el.bgColor || '#6366f1'} onChange={e => onChange({ ...el, bgColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-white/20 p-0.5 bg-transparent" />
                <input type="range" min={0} max={1} step={0.05} value={el.bgAlpha ?? 1}
                  onChange={e => onChange({ ...el, bgAlpha: Number(e.target.value) })} className="w-14 accent-indigo-500" />
              </>
            )}
          </div>
        )}
        {/* Border */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">B</span>
          <input type="number" value={el.borderWidth || 0} min={0} max={20}
            onChange={e => onChange({ ...el, borderWidth: Number(e.target.value) })}
            className="w-8 text-xs text-center bg-white/10 text-white border border-white/10 rounded px-1 py-0.5 outline-none" />
          <input type="color" value={el.borderColor || '#ffffff'} onChange={e => onChange({ ...el, borderColor: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border border-white/20 p-0.5 bg-transparent" />
        </div>
        {/* Radius */}
        {(!el.shapeType || el.shapeType === 'rect') && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500">R</span>
            <input type="range" min={0} max={el.type === 'button' ? 100 : 120}
              value={el.borderRadius ?? (el.type === 'button' ? 50 : 0)}
              onChange={e => onChange({ ...el, borderRadius: Number(e.target.value) })}
              className="w-16 accent-indigo-500" />
            <span className="text-[10px] text-gray-400">{el.borderRadius ?? (el.type === 'button' ? 50 : 0)}</span>
          </div>
        )}
        {/* Text stroke */}
        {(el.type === 'text' || el.type === 'button') && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500">Stk</span>
            <input type="number" value={el.textStrokeWidth || 0} min={0} max={10}
              onChange={e => onChange({ ...el, textStrokeWidth: Number(e.target.value) })}
              className="w-8 text-xs text-center bg-white/10 text-white border border-white/10 rounded px-1 py-0.5 outline-none" />
            <input type="color" value={el.textStrokeColor || '#000000'} onChange={e => onChange({ ...el, textStrokeColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-white/20 p-0.5 bg-transparent" />
          </div>
        )}
        {/* Shape image fill */}
        {el.type === 'shape' && onShapeImageFill && (
          <button onMouseDown={ev => { ev.preventDefault(); onShapeImageFill(); }}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-[10px] font-medium transition">
            <ImageIcon className="w-3 h-3" /> {el.bgImage ? 'Change Fill' : 'Fill Image'}
          </button>
        )}
        {el.type === 'shape' && el.bgImage && (
          <button onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, bgImage: undefined }); }}
            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-[10px] transition">
            ✕ Fill
          </button>
        )}
        {/* Button href */}
        {el.type === 'button' && (
          <div className="flex items-center gap-1 flex-1 min-w-[120px]">
            <Link className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input type="url" value={el.href || ''} placeholder="https://..."
              onChange={e => onChange({ ...el, href: e.target.value })}
              className="flex-1 text-xs bg-white/10 text-white border border-white/10 rounded-lg px-2 py-0.5 outline-none placeholder-gray-600" />
          </div>
        )}
      </div>

      {/* ROW ALIGNMENT: Canvas alignment tools */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/10 flex-wrap">
        <span className="text-[10px] text-gray-500 mr-1">Align</span>
        {([
          { icon: <AlignHorizontalJustifyStart className="w-3.5 h-3.5" />, title: 'Align Left', fn: () => onChange({ ...el, x: 0 }) },
          { icon: <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />, title: 'Center Horizontal', fn: () => onChange({ ...el, x: Math.round((CANVAS_W - el.w) / 2) }) },
          { icon: <AlignHorizontalJustifyEnd className="w-3.5 h-3.5" />, title: 'Align Right', fn: () => onChange({ ...el, x: Math.round(CANVAS_W - el.w) }) },
          { icon: <AlignVerticalJustifyStart className="w-3.5 h-3.5" />, title: 'Align Top', fn: () => onChange({ ...el, y: 0 }) },
          { icon: <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />, title: 'Center Vertical', fn: () => onChange({ ...el, y: Math.round((CANVAS_H - el.h) / 2) }) },
          { icon: <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />, title: 'Align Bottom', fn: () => onChange({ ...el, y: Math.round(CANVAS_H - el.h) }) },
        ] as { icon: React.ReactNode; title: string; fn: () => void }[]).map(({ icon, title, fn }) => (
          <button key={title} onMouseDown={ev => { ev.preventDefault(); fn(); }} title={title}
            className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-indigo-300 transition">{icon}</button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        {/* Position inputs */}
        {(['x','y','w','h'] as const).map(k => (
          <div key={k} className="flex flex-col items-center">
            <span className="text-[8px] text-gray-600 leading-none">{k.toUpperCase()}</span>
            <input type="number" value={Math.round((el as any)[k])}
              onChange={ev => onChange({ ...el, [k]: Number(ev.target.value) })}
              className="w-10 text-[10px] text-center bg-white/10 text-white border border-white/10 rounded px-1 py-0.5 outline-none" />
          </div>
        ))}
      </div>

      {/* ROW 3: Filters + Animation */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Filter toggle */}
        <div className="relative">
          <button onMouseDown={ev => { ev.preventDefault(); setShowFilters(v => !v); setShowAnim(false); setShowShadow(false); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition ${showFilters ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}>
            🎨 Filter
          </button>
          {showFilters && (
            <div className="absolute bottom-full left-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-xl p-2 shadow-2xl z-50" style={{ width: 280 }}>
              <div className="grid grid-cols-4 gap-1">
                {FILTER_PRESETS.map(fp => (
                  <button key={fp.name} onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, filterCss: fp.css }); }}
                    className={`px-1.5 py-1 rounded-lg text-[10px] font-medium transition ${(el.filterCss || '') === fp.css ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/15'}`}>
                    {fp.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Animation toggle */}
        <div className="relative">
          <button onMouseDown={ev => { ev.preventDefault(); setShowAnim(v => !v); setShowFilters(false); setShowShadow(false); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition ${showAnim ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}>
            <Sparkles className="w-3 h-3" /> {el.animation || 'Animate'}
          </button>
          {showAnim && (
            <div className="absolute bottom-full left-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-xl p-2 shadow-2xl z-50" style={{ width: 220 }}>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {ANIMATIONS.map(a => (
                  <button key={a.value} onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, animation: a.value }); setShowAnim(false); }}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition ${(el.animation || '') === a.value ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/15'}`}>
                    {a.name}
                  </button>
                ))}
              </div>
              {el.animation && (
                <div className="border-t border-white/10 pt-2 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-400">Speed</span>
                      <span className="text-[10px] text-gray-300">{(el.animationDuration ?? 0.6).toFixed(1)}s</span>
                    </div>
                    <input type="range" min={0.1} max={3} step={0.1} value={el.animationDuration ?? 0.6}
                      onMouseDown={ev => ev.stopPropagation()}
                      onChange={ev => onChange({ ...el, animationDuration: Number(ev.target.value) })}
                      className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1">Easing</span>
                    <div className="grid grid-cols-3 gap-1">
                      {EASINGS.map(ez => (
                        <button key={ez.value} onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, animationEasing: ez.value }); }}
                          className={`px-1 py-1 rounded text-[9px] font-medium transition ${(el.animationEasing || 'ease') === ez.value ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/15'}`}>
                          {ez.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shadow toggle */}
        <div className="relative">
          <button onMouseDown={ev => { ev.preventDefault(); setShowShadow(v => !v); setShowFilters(false); setShowAnim(false); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition ${showShadow || el.shadowBlur !== undefined || el.shadowX !== undefined || el.shadowY !== undefined ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}>
            🌑 Shadow
          </button>
          {showShadow && (
            <div className="absolute bottom-full left-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-xl p-3 shadow-2xl z-50" style={{ width: 270 }}>
              {/* Directional presets */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {[
                  { label: '↑ Top', x: 0, y: -8 },
                  { label: '↓ Bot', x: 0, y: 8 },
                  { label: '← Left', x: -8, y: 0 },
                  { label: '→ Right', x: 8, y: 0 },
                ].map(p => (
                  <button key={p.label} onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, shadowX: p.x, shadowY: p.y, shadowBlur: el.shadowBlur ?? 8, shadowColor: el.shadowColor || '#000000' }); }}
                    className="px-1 py-1 bg-white/5 hover:bg-white/15 text-gray-300 rounded-lg text-[10px] transition">{p.label}</button>
                ))}
              </div>
              {/* Sliders */}
              <div className="space-y-2">
                {[
                  { label: 'X', key: 'shadowX' as const, min: -50, max: 50, step: 1, val: el.shadowX ?? 0 },
                  { label: 'Y', key: 'shadowY' as const, min: -50, max: 50, step: 1, val: el.shadowY ?? 0 },
                  { label: 'Blur', key: 'shadowBlur' as const, min: 0, max: 50, step: 1, val: el.shadowBlur ?? 0 },
                  { label: 'Opacity', key: 'shadowAlpha' as const, min: 0, max: 1, step: 0.05, val: el.shadowAlpha ?? 0.6 },
                ].map(({ label, key, min, max, step, val }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-10">{label}</span>
                    <input type="range" min={min} max={max} step={step} value={val}
                      onMouseDown={ev => ev.stopPropagation()}
                      onChange={e => onChange({ ...el, [key]: Number(e.target.value) })}
                      className="flex-1 accent-indigo-500" />
                    <span className="text-[10px] text-gray-400 w-8 text-right">
                      {key === 'shadowAlpha' ? Math.round((val as number) * 100) + '%' : val}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-7">Col</span>
                  <input type="color" value={el.shadowColor || '#000000'}
                    onMouseDown={ev => ev.stopPropagation()}
                    onChange={e => onChange({ ...el, shadowColor: e.target.value })}
                    className="w-8 h-7 rounded cursor-pointer border border-white/20 p-0.5 bg-transparent" />
                  <button onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, shadowX: undefined, shadowY: undefined, shadowBlur: undefined, shadowColor: undefined, shadowAlpha: undefined }); setShowShadow(false); }}
                    className="ml-auto text-[10px] text-red-400 hover:text-red-300 px-2 py-0.5 bg-red-500/10 rounded-lg">Clear</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rotation display */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] text-gray-500">↺</span>
          <input type="number" value={Math.round(el.rot)} onChange={e => onChange({ ...el, rot: Number(e.target.value) })}
            className="w-12 text-xs text-center bg-white/10 text-white border border-white/10 rounded px-1 py-0.5 outline-none" />
          <span className="text-[10px] text-gray-500">°</span>
          <button onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, rot: 0 }); }}
            className="px-1.5 py-0.5 text-[10px] bg-white/10 text-gray-300 rounded hover:bg-white/20">Reset</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
interface Props { mode: 'create' | 'edit'; initialData?: any; }

export default function StoryDesignEditor({ mode, initialData }: Props) {
  const router = useRouter();

  const [meta, setMeta] = useState<Meta>(() => ({
    title: initialData?.title || '', slug: initialData?.slug || '',
    description: initialData?.description || '', metaDescription: initialData?.metaDescription || '',
    category: initialData?.category || '', publisherName: initialData?.publisherName || '',
    publisherLogo: initialData?.publisherLogo || '', coverImage: initialData?.coverImage || '',
    coverImageSquare: initialData?.coverImageSquare || '', expiresAt: initialData?.expiresAt || '',
  }));

  const [slides, setSlides] = useState<SD[]>(() => {
    if (initialData?.slides?.length) {
      return initialData.slides.map((s: any, i: number) => ({
        id: s.id || uid(), order: i, duration: s.duration || 7,
        bgType: s.bgType || 'COLOR', bgColor: s.bgColor || '#1a1a2e',
        bgGradient: s.bgGradient || null, bgImage: s.bgImage || null, bgVideo: s.bgVideo || null,
        ...(() => {
          const raw = s.canvasData
            ? (typeof s.canvasData === 'string' ? JSON.parse(s.canvasData) : s.canvasData)
            : null;
          const isNew = raw && !Array.isArray(raw) && raw.elements !== undefined;
          const cfg: any = isNew ? (raw.config || {}) : {};
          return {
            elements: isNew ? raw.elements : (raw || []),
            bgImageOpacity: cfg.bgImageOpacity, bgImageFit: cfg.bgImageFit, bgImagePosition: cfg.bgImagePosition,
            bgBlur: cfg.bgBlur, bgOverlayColor: cfg.bgOverlayColor, bgOverlayOpacity: cfg.bgOverlayOpacity,
          };
        })(),
      }));
    }
    return [blankSlide(0)];
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('insert');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panImageId, setPanImageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [savedColors, setSavedColors] = useState<string[]>(() => {
    try { return JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem('ws_palette') || '[]') : '[]'); } catch { return []; }
  });
  const [scale, setScale] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dragSlideIdx, setDragSlideIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const bgImgInputRef = useRef<HTMLInputElement>(null);
  const shapeImgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ─── History / Undo-Redo ─────────────────────────────────────────────────────
  const slidesRef = useRef(slides);
  useEffect(() => { slidesRef.current = slides; }, [slides]);
  const pastRef = useRef<SD[][]>([]);
  const futureRef = useRef<SD[][]>([]);
  const clipboardRef = useRef<CE | null>(null);

  const snapshot = useCallback(() => {
    const copy = JSON.parse(JSON.stringify(slidesRef.current));
    pastRef.current.push(copy);
    if (pastRef.current.length > 50) pastRef.current.shift();
    futureRef.current = [];
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const prev = pastRef.current.pop()!;
    futureRef.current.unshift(JSON.parse(JSON.stringify(slidesRef.current)));
    setSlides(JSON.parse(JSON.stringify(prev)));
    setSelectedId(null);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.shift()!;
    pastRef.current.push(JSON.parse(JSON.stringify(slidesRef.current)));
    setSlides(JSON.parse(JSON.stringify(next)));
    setSelectedId(null);
  }, []);

  const activeSlide = slides[activeIdx] || slides[0];
  const selectedEl = activeSlide?.elements.find(e => e.id === selectedId) || null;

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      setScale(Math.max(0.4, Math.min((clientWidth - 48) / CANVAS_W, (clientHeight - 160) / CANVAS_H, 1.4)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Load gallery when insert tab opens
  useEffect(() => {
    if (tab === 'insert' && !galleryLoaded) {
      fetch('/api/admin/web-stories/gallery')
        .then(r => r.json())
        .then(d => { setGallery(d.files || []); setGalleryLoaded(true); })
        .catch(() => setGalleryLoaded(true));
    }
  }, [tab, galleryLoaded]);

  const updateSlide = useCallback((fn: (s: SD) => SD) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? fn(s) : s));
  }, [activeIdx]);

  const updateElement = useCallback((updated: CE) => {
    updateSlide(s => ({ ...s, elements: s.elements.map(e => e.id === updated.id ? updated : e) }));
  }, [updateSlide]);

  const addElement = (el: CE) => { snapshot(); updateSlide(s => ({ ...s, elements: [...s.elements, el] })); setSelectedId(el.id); };
  const deleteElement = (id: string) => { snapshot(); updateSlide(s => ({ ...s, elements: s.elements.filter(e => e.id !== id) })); setSelectedId(null); };
  const clearAll = () => { snapshot(); updateSlide(s => ({ ...s, elements: [] })); setSelectedId(null); };

  const distributeH = () => {
    const els = [...activeSlide.elements].sort((a, b) => a.x - b.x);
    if (els.length < 3) return;
    snapshot();
    const leftmost = els[0].x, rightmost = els[els.length - 1].x + els[els.length - 1].w;
    const totalW = els.reduce((s, e) => s + e.w, 0);
    const gap = (rightmost - leftmost - totalW) / (els.length - 1);
    let x = leftmost;
    const updated = els.map(e => { const ne = { ...e, x: Math.round(x) }; x += e.w + gap; return ne; });
    updateSlide(s => ({ ...s, elements: s.elements.map(e => updated.find(u => u.id === e.id) || e) }));
  };

  const distributeV = () => {
    const els = [...activeSlide.elements].sort((a, b) => a.y - b.y);
    if (els.length < 3) return;
    snapshot();
    const topmost = els[0].y, bottommost = els[els.length - 1].y + els[els.length - 1].h;
    const totalH = els.reduce((s, e) => s + e.h, 0);
    const gap = (bottommost - topmost - totalH) / (els.length - 1);
    let y = topmost;
    const updated = els.map(e => { const ne = { ...e, y: Math.round(y) }; y += e.h + gap; return ne; });
    updateSlide(s => ({ ...s, elements: s.elements.map(e => updated.find(u => u.id === e.id) || e) }));
  };

  const saveColor = (color: string) => {
    if (!color || savedColors.includes(color)) return;
    const next = [color, ...savedColors].slice(0, 20);
    setSavedColors(next);
    try { localStorage.setItem('ws_palette', JSON.stringify(next)); } catch {}
  };

  const removeColor = (color: string) => {
    const next = savedColors.filter(c => c !== color);
    setSavedColors(next);
    try { localStorage.setItem('ws_palette', JSON.stringify(next)); } catch {}
  };

  const duplicateElement = (id: string) => {
    const el = activeSlide.elements.find(e => e.id === id);
    if (!el) return;
    addElement({ ...el, id: uid(), x: el.x + 20, y: el.y + 20, z: Math.max(...activeSlide.elements.map(e => e.z), 0) + 1 });
  };

  const duplicateSlide = (idx: number) => {
    const src = slides[idx];
    const copy: SD = { ...src, id: uid(), order: slides.length, elements: src.elements.map(e => ({ ...e, id: uid() })) };
    setSlides(prev => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
    setActiveIdx(idx + 1); setSelectedId(null);
  };

  // When an image element is dragged, highlight shape under it and merge on drop
  const handleElementDrag = useCallback((draggedEl: CE) => {
    if (draggedEl.type !== 'image' || !draggedEl.src) { setDropTargetId(null); return; }
    const cx = draggedEl.x + draggedEl.w / 2;
    const cy = draggedEl.y + draggedEl.h / 2;
    const over = activeSlide.elements.find(e =>
      e.type === 'shape' && e.id !== draggedEl.id &&
      cx >= e.x && cx <= e.x + e.w && cy >= e.y && cy <= e.y + e.h
    );
    setDropTargetId(over?.id || null);
  }, [activeSlide.elements]);

  const handleDragEnd = useCallback((draggedEl: CE) => {
    if (draggedEl.type !== 'image' || !draggedEl.src) { setDropTargetId(null); return; }
    const cx = draggedEl.x + draggedEl.w / 2;
    const cy = draggedEl.y + draggedEl.h / 2;
    const targetShape = activeSlide.elements.find(e =>
      e.type === 'shape' && e.id !== draggedEl.id &&
      cx >= e.x && cx <= e.x + e.w && cy >= e.y && cy <= e.y + e.h
    );
    setDropTargetId(null);
    if (!targetShape) return;
    // Merge: fill shape with image, delete image element
    updateSlide(s => ({
      ...s,
      elements: s.elements
        .filter(e => e.id !== draggedEl.id)
        .map(e => e.id === targetShape.id ? { ...e, bgImage: draggedEl.src, filled: true } : e),
    }));
    setSelectedId(targetShape.id);
  }, [activeSlide.elements, updateSlide]);

  const changeLayer = (id: string, dir: 'up' | 'down') => {
    const el = activeSlide.elements.find(e => e.id === id);
    if (!el) return;
    updateElement({ ...el, z: dir === 'up' ? el.z + 1 : Math.max(0, el.z - 1) });
  };

  const maxZ = activeSlide?.elements.length ? Math.max(...activeSlide.elements.map(e => e.z)) + 1 : 1;
  const cx = CANVAS_W / 2 - 100, cy = CANVAS_H / 2 - 30;

  const addHeading = () => addElement({ id: uid(), type: 'text', x: 20, y: cy, w: CANVAS_W - 40, h: 70, rot: 0, z: maxZ, opacity: 1, content: 'Your Heading', fontSize: 38, fontFamily: 'inherit', bold: true, align: 'center', color: '#ffffff', colorAlpha: 1, lineHeight: 1.2 });
  const addParagraph = () => addElement({ id: uid(), type: 'text', x: 20, y: cy, w: CANVAS_W - 40, h: 60, rot: 0, z: maxZ, opacity: 1, content: 'Your text here', fontSize: 18, fontFamily: 'inherit', align: 'left', color: '#ffffff', colorAlpha: 1, lineHeight: 1.5 });
  const addShape = (shapeType: ShapeType) => addElement({ id: uid(), type: 'shape', x: cx, y: cy, w: 140, h: 140, rot: 0, z: maxZ, opacity: 1, bgColor: '#6366f1', bgAlpha: 1, shapeType, filled: true, borderRadius: shapeType === 'rect' ? 8 : 0 });
  const addButton = () => addElement({ id: uid(), type: 'button', x: cx - 30, y: CANVAS_H - 120, w: 260, h: 52, rot: 0, z: maxZ, opacity: 1, content: 'Tap Here', fontSize: 16, bold: true, color: '#1a1a2e', colorAlpha: 1, bgColor: '#ffffff', bgAlpha: 1, borderRadius: 50, href: '' });

  const uploadFile = async (file: File, onSuccess: (url: string) => void) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/admin/web-stories/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) { onSuccess(data.url); setGalleryLoaded(false); } // refresh gallery
      else alert(data.error || 'Upload failed');
    } catch { alert('Upload failed'); } finally { setUploading(false); }
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadFile(file, url => addElement({ id: uid(), type: 'image', x: cx - 30, y: cy - 60, w: 260, h: 200, rot: 0, z: maxZ, opacity: 1, src: url, borderRadius: 0 }));
    e.target.value = '';
  };
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const isVideo = file.type.startsWith('video/');
    uploadFile(file, url => updateSlide(s => ({ ...s, bgType: isVideo ? 'VIDEO' : 'IMAGE', bgImage: isVideo ? null : url, bgVideo: isVideo ? url : null })));
    e.target.value = '';
  };
  const handleShapeImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !selectedEl) return;
    uploadFile(file, url => updateElement({ ...selectedEl, bgImage: url })); e.target.value = '';
  };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadFile(file, url => setMeta(m => ({ ...m, publisherLogo: url }))); e.target.value = '';
  };
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadFile(file, url => setMeta(m => ({ ...m, coverImage: url, coverImageSquare: url }))); e.target.value = '';
  };

  const buildPayload = () => ({
    title: meta.title.trim(), slug: meta.slug.trim() || slugify(meta.title),
    description: meta.description.trim() || null, metaDescription: meta.metaDescription.trim() || null,
    coverImage: meta.coverImage || null, coverImageSquare: meta.coverImageSquare || null,
    publisherName: meta.publisherName.trim() || null, publisherLogo: meta.publisherLogo || null,
    category: meta.category.trim() || null, expiresAt: meta.expiresAt || null,
    slides: slides.map((s, i) => ({
      id: s.id.startsWith('_') ? undefined : s.id, order: i, duration: s.duration, bgType: s.bgType,
      bgImage: s.bgImage || null, bgVideo: s.bgVideo || null, bgColor: s.bgColor || null, bgGradient: s.bgGradient || null,
      canvasData: JSON.stringify({
        config: {
          bgImageOpacity: s.bgImageOpacity, bgImageFit: s.bgImageFit, bgImagePosition: s.bgImagePosition,
          bgBlur: s.bgBlur, bgOverlayColor: s.bgOverlayColor, bgOverlayOpacity: s.bgOverlayOpacity,
        },
        elements: s.elements,
      }), heading: null, subtext: null, ctaText: null, ctaUrl: null,
    })),
  });

  const handleSave = async () => {
    if (!meta.title.trim()) { setMsg({ type: 'err', text: 'Title is required' }); return; }
    setSaving(true); setMsg(null);
    try {
      const payload = buildPayload();
      const res = mode === 'create'
        ? await fetch('/api/admin/web-stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch(`/api/admin/web-stories/${initialData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg({ type: 'ok', text: 'Saved!' });
      if (mode === 'create') router.push(`/admin/web-stories/${data.story.id}`);
    } catch (e: any) { setMsg({ type: 'err', text: e.message }); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (mode === 'create') { await handleSave(); return; }
    setPublishing(true);
    try {
      await handleSave();
      const res = await fetch(`/api/admin/web-stories/${initialData.id}/publish`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg({ type: 'ok', text: data.isPublished ? 'Published!' : 'Unpublished' });
    } catch (e: any) { setMsg({ type: 'err', text: e.message }); }
    finally { setPublishing(false); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Undo / Redo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); return; }

      // Copy
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedId) {
        const el = activeSlide.elements.find(el => el.id === selectedId);
        if (el) { clipboardRef.current = el; e.preventDefault(); }
        return;
      }
      // Paste
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && clipboardRef.current) {
        e.preventDefault();
        const src = clipboardRef.current;
        const newMaxZ = activeSlide.elements.length ? Math.max(...activeSlide.elements.map(el => el.z)) + 1 : 1;
        addElement({ ...src, id: uid(), x: Math.min(src.x + 20, CANVAS_W - src.w), y: Math.min(src.y + 20, CANVAS_H - src.h), z: newMaxZ });
        return;
      }

      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { deleteElement(selectedId); return; }

      // Escape
      if (e.key === 'Escape') { setSelectedId(null); return; }

      // Duplicate
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedId) { e.preventDefault(); duplicateElement(selectedId); return; }

      // Layer order
      if (e.key === ']' && (e.ctrlKey || e.metaKey) && selectedId) { e.preventDefault(); changeLayer(selectedId, 'up'); return; }
      if (e.key === '[' && (e.ctrlKey || e.metaKey) && selectedId) { e.preventDefault(); changeLayer(selectedId, 'down'); return; }

      // Lock/Unlock
      if (e.key === 'l' && (e.ctrlKey || e.metaKey) && selectedId) {
        e.preventDefault();
        const el = activeSlide.elements.find(el => el.id === selectedId);
        if (el) updateElement({ ...el, locked: !el.locked });
        return;
      }

      // Save
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); return; }

      // Arrow key nudge
      if (selectedId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const el = activeSlide.elements.find(el => el.id === selectedId);
        if (!el || el.locked) return;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        updateElement({ ...el, x: el.x + dx, y: el.y + dy });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, activeSlide, undo, redo]);

  const seo = calcSeo(meta, slides);
  const seoColor = seo >= 80 ? 'text-green-400' : seo >= 50 ? 'text-yellow-400' : 'text-red-400';

  const SHAPES: { type: ShapeType; label: string; preview: React.ReactNode }[] = [
    { type: 'rect', label: 'Rect', preview: <div className="w-8 h-5 bg-indigo-400 rounded-sm" /> },
    { type: 'circle', label: 'Circle', preview: <div className="w-6 h-6 bg-pink-400 rounded-full" /> },
    { type: 'triangle', label: 'Triangle', preview: <div className="w-0 h-0 border-l-[13px] border-r-[13px] border-b-[22px] border-transparent border-b-yellow-400" /> },
    { type: 'diamond', label: 'Diamond', preview: <div className="w-5 h-5 bg-green-400" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} /> },
    { type: 'star', label: 'Star', preview: <div className="w-6 h-6 bg-amber-400" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} /> },
    { type: 'hexagon', label: 'Hexagon', preview: <div className="w-6 h-6 bg-cyan-400" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#1a1a1a] overflow-hidden" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
      <input ref={bgImgInputRef} type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={handleBgUpload} />
      <input ref={shapeImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleShapeImgUpload} />
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 bg-[#1a1a1a] border-b border-white/10 flex-shrink-0 z-30">
        <div className="flex items-center gap-1">
          <button onClick={() => router.push('/admin/web-stories')} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition mr-2"><ChevronLeft className="w-4 h-4" /></button>
          {(['insert', 'style', 'document'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              {t === 'insert' ? 'Insert' : t === 'style' ? 'Style' : 'Document'}
            </button>
          ))}
        </div>
        <input value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value, slug: m.slug || slugify(e.target.value) }))}
          placeholder="Story title..."
          className="bg-transparent text-white text-sm font-medium text-center outline-none placeholder-gray-500 max-w-xs w-full border-b border-transparent focus:border-white/30 transition py-1 px-2" />
        <div className="flex items-center gap-2">
          {msg && <span className={`text-xs font-medium px-2 py-1 rounded-full ${msg.type === 'ok' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{msg.text}</span>}
          <span className={`text-xs font-bold ${seoColor}`}>SEO {seo}</span>
          <button onClick={() => setShowGrid(v => !v)} title="Toggle Grid"
            className={`px-2 py-1.5 text-xs rounded-lg transition ${showGrid ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
            ⊞ Grid
          </button>
          <button onClick={() => window.open(`/admin/web-stories/preview/${initialData?.id || ''}`, '_blank')} disabled={mode === 'create'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-300 hover:text-white text-xs rounded-lg hover:bg-white/10 transition disabled:opacity-30">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
          <button onClick={handlePublish} disabled={publishing || saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50">
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />} Publish
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 bg-[#232323] border-r border-white/10 flex flex-col overflow-y-auto flex-shrink-0">

          {tab === 'insert' && (
            <div className="p-4 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Text</p>
                <div className="space-y-2">
                  <button onClick={addHeading} className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm transition">
                    <Type className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div className="text-left"><p className="font-semibold">Heading</p><p className="text-xs text-gray-500">Large bold text</p></div>
                  </button>
                  <button onClick={addParagraph} className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm transition">
                    <Type className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="text-left"><p className="font-medium">Paragraph</p><p className="text-xs text-gray-500">Body text</p></div>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Media</p>
                <button onClick={() => imgInputRef.current?.click()} disabled={uploading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm transition disabled:opacity-50">
                  <ImageIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="text-left"><p className="font-medium">Upload Image</p><p className="text-xs text-gray-500">{uploading ? 'Uploading...' : 'Add from device'}</p></div>
                </button>
              </div>

              {/* Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gallery</p>
                  <button onClick={() => { setGalleryLoaded(false); }} className="text-[10px] text-indigo-400 hover:text-indigo-300">Refresh</button>
                </div>
                {!galleryLoaded ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-500" /></div>
                ) : gallery.length === 0 ? (
                  <p className="text-[11px] text-gray-500 text-center py-3">No images uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                    {gallery.map(url => (
                      <button key={url} onClick={() => addElement({ id: uid(), type: 'image', x: cx - 30, y: cy - 60, w: 260, h: 200, rot: 0, z: maxZ, opacity: 1, src: url, borderRadius: 0 })}
                        className="aspect-square overflow-hidden rounded-lg bg-gray-800 hover:ring-2 hover:ring-indigo-400 transition flex-shrink-0">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Shapes</p>
                <div className="grid grid-cols-3 gap-2">
                  {SHAPES.map(sh => (
                    <button key={sh.type} onClick={() => addShape(sh.type)}
                      className="flex flex-col items-center gap-1.5 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition">
                      {sh.preview}
                      <span className="text-[10px] text-gray-400">{sh.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Button</p>
                <button onClick={addButton} className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm transition">
                  <MousePointer className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="text-left"><p className="font-medium">CTA Button</p><p className="text-xs text-gray-500">With link URL</p></div>
                </button>
              </div>

              {/* Distribute */}
              {activeSlide.elements.length >= 3 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Distribute</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={distributeH} className="py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 transition">⟷ Horizontal</button>
                    <button onClick={distributeV} className="py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 transition">⟸⟹ Vertical</button>
                  </div>
                </div>
              )}

              {/* Saved Colors Palette */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Color Palette</p>
                  {selectedEl?.color && (
                    <button onClick={() => saveColor(selectedEl.color!)} className="text-[10px] text-indigo-400 hover:text-indigo-300">+ Save current</button>
                  )}
                </div>
                {savedColors.length === 0
                  ? <p className="text-[11px] text-gray-600 text-center py-2">Select element color then click Save</p>
                  : (
                    <div className="flex flex-wrap gap-1.5">
                      {savedColors.map(c => (
                        <div key={c} className="relative group">
                          <button
                            onClick={() => selectedEl && updateElement({ ...selectedEl, color: c })}
                            className="w-7 h-7 rounded-lg border border-white/20 hover:ring-2 hover:ring-white/40 transition"
                            style={{ backgroundColor: c }} title={c} />
                          <button onClick={() => removeColor(c)} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] hidden group-hover:flex items-center justify-center">×</button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {activeSlide.elements.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Layers ({activeSlide.elements.length})</p>
                    <button onClick={clearAll} className="text-[10px] text-red-400 hover:text-red-300">Clear all</button>
                  </div>
                  <div className="space-y-1">
                    {[...activeSlide.elements].sort((a, b) => b.z - a.z).map(el => (
                      <div key={el.id} onClick={() => setSelectedId(el.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition ${selectedId === el.id ? 'bg-indigo-600/30 text-indigo-200' : 'hover:bg-white/5 text-gray-400'}`}>
                        {(el.type === 'text' || el.type === 'button') ? <Type className="w-3 h-3" /> : el.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                        <span className="truncate flex-1">{(el.type === 'text' || el.type === 'button') ? (el.content?.slice(0, 16) || el.type) : (el.shapeType || el.type)}</span>
                        {el.animation && <Sparkles className="w-2.5 h-2.5 text-indigo-400" />}
                        <button onClick={e => { e.stopPropagation(); deleteElement(el.id); }} className="hover:text-red-400">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'style' && (
            <div className="p-4 space-y-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Slide Background</p>
              <div className="grid grid-cols-2 gap-2">
                {(['COLOR', 'GRADIENT', 'IMAGE', 'VIDEO'] as const).map(t => (
                  <button key={t} onClick={() => updateSlide(s => ({ ...s, bgType: t }))}
                    className={`py-2 rounded-xl text-xs font-medium transition ${activeSlide.bgType === t ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{t}</button>
                ))}
              </div>
              {activeSlide.bgType === 'COLOR' && (
                <div className="flex items-center gap-3">
                  <input type="color" value={activeSlide.bgColor || '#1a1a2e'} onChange={e => updateSlide(s => ({ ...s, bgColor: e.target.value }))} className="w-10 h-10 rounded-xl border-0 cursor-pointer p-1 bg-transparent" />
                  <input type="text" value={activeSlide.bgColor || '#1a1a2e'} onChange={e => updateSlide(s => ({ ...s, bgColor: e.target.value }))} className="flex-1 bg-white/10 text-white text-xs px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
                </div>
              )}
              {activeSlide.bgType === 'GRADIENT' && (
                <div className="space-y-2">
                  <input type="text" placeholder="linear-gradient(...)" value={activeSlide.bgGradient || ''} onChange={e => updateSlide(s => ({ ...s, bgGradient: e.target.value }))} className="w-full bg-white/10 text-white text-xs px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500" />
                  <div className="grid grid-cols-3 gap-1.5">
                    {['linear-gradient(135deg,#1a1a2e,#0f3460)', 'linear-gradient(180deg,#0f0c29,#302b63,#24243e)', 'linear-gradient(135deg,#f093fb,#f5576c)', 'linear-gradient(135deg,#4facfe,#00f2fe)', 'linear-gradient(135deg,#43e97b,#38f9d7)', 'linear-gradient(180deg,#fa709a,#fee140)', 'linear-gradient(135deg,#a18cd1,#fbc2eb)', 'linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#ffecd2,#fcb69f)'].map(g => (
                      <button key={g} onClick={() => updateSlide(s => ({ ...s, bgGradient: g }))} className="h-10 rounded-lg border border-white/10 hover:border-white/30 transition" style={{ background: g }} />
                    ))}
                  </div>
                </div>
              )}
              {(activeSlide.bgType === 'IMAGE' || activeSlide.bgType === 'VIDEO') && (
                <div className="space-y-3">
                  {activeSlide.bgImage && <img src={activeSlide.bgImage} alt="" className="w-full h-24 object-cover rounded-xl" />}
                  {activeSlide.bgVideo && <video src={activeSlide.bgVideo} className="w-full h-24 object-cover rounded-xl" muted />}
                  <button onClick={() => bgImgInputRef.current?.click()} disabled={uploading} className="w-full py-2.5 border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50">
                    <Upload className="w-4 h-4" /> Upload {activeSlide.bgType === 'VIDEO' ? 'Video (MP4/WebM)' : 'Image'}
                  </button>
                  {(activeSlide.bgImage || activeSlide.bgVideo) && (
                    <button onClick={() => updateSlide(s => ({ ...s, bgImage: null, bgVideo: null }))} className="w-full py-1 text-xs text-red-400 hover:text-red-300">Remove</button>
                  )}
                  {activeSlide.bgType === 'IMAGE' && activeSlide.bgImage && (<>
                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Opacity</span><span>{Math.round((activeSlide.bgImageOpacity ?? 1) * 100)}%</span>
                      </div>
                      <input type="range" min={0} max={1} step={0.05} value={activeSlide.bgImageOpacity ?? 1}
                        onChange={e => updateSlide(s => ({ ...s, bgImageOpacity: Number(e.target.value) }))}
                        className="w-full accent-indigo-500" />
                    </div>
                    {/* Blur */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Blur</span><span>{activeSlide.bgBlur ?? 0}px</span>
                      </div>
                      <input type="range" min={0} max={20} step={1} value={activeSlide.bgBlur ?? 0}
                        onChange={e => updateSlide(s => ({ ...s, bgBlur: Number(e.target.value) }))}
                        className="w-full accent-indigo-500" />
                    </div>
                    {/* Fit */}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5">Fit</p>
                      <div className="grid grid-cols-3 gap-1">
                        {(['cover','contain','fill'] as const).map(f => (
                          <button key={f} onClick={() => updateSlide(s => ({ ...s, bgImageFit: f }))}
                            className={`py-1 rounded-lg text-[10px] capitalize transition ${(activeSlide.bgImageFit||'cover')===f ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    {/* Position */}
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5">Position</p>
                      <div className="grid grid-cols-3 gap-1">
                        {([
                          {l:'↖',v:'top left'},{l:'↑',v:'top center'},{l:'↗',v:'top right'},
                          {l:'←',v:'center left'},{l:'·',v:'center'},{l:'→',v:'center right'},
                          {l:'↙',v:'bottom left'},{l:'↓',v:'bottom center'},{l:'↘',v:'bottom right'},
                        ]).map(p => (
                          <button key={p.v} onClick={() => updateSlide(s => ({ ...s, bgImagePosition: p.v }))}
                            className={`py-1.5 rounded-lg text-sm transition ${(activeSlide.bgImagePosition||'center')===p.v ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{p.l}</button>
                        ))}
                      </div>
                    </div>
                  </>)}
                </div>
              )}
              {selectedEl?.type === 'shape' && (
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Shape Image Fill</p>
                  {selectedEl.bgImage && (
                    <div className="relative">
                      <img src={selectedEl.bgImage} alt="" className="w-full h-20 object-cover rounded-xl" />
                      <button onClick={() => updateElement({ ...selectedEl, bgImage: undefined })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">×</button>
                    </div>
                  )}
                  <button onClick={() => shapeImgInputRef.current?.click()} disabled={uploading} className="w-full py-2.5 border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-indigo-400 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50">
                    <Upload className="w-3.5 h-3.5" /> {selectedEl.bgImage ? 'Change Image' : 'Fill with Image'}
                  </button>
                </div>
              )}
              {/* Color Overlay (works on all bg types) */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Color Overlay</p>
                <div className="flex items-center gap-3">
                  <input type="color" value={activeSlide.bgOverlayColor || '#000000'}
                    onChange={e => updateSlide(s => ({ ...s, bgOverlayColor: e.target.value, bgOverlayOpacity: s.bgOverlayOpacity ?? 0.3 }))}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0.5 bg-transparent" />
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Opacity</span><span>{Math.round((activeSlide.bgOverlayOpacity ?? 0) * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.05} value={activeSlide.bgOverlayOpacity ?? 0}
                      onChange={e => updateSlide(s => ({ ...s, bgOverlayOpacity: Number(e.target.value) }))}
                      className="w-full accent-indigo-500" />
                  </div>
                  {(activeSlide.bgOverlayOpacity ?? 0) > 0 && (
                    <button onClick={() => updateSlide(s => ({ ...s, bgOverlayOpacity: 0 }))} className="text-[10px] text-red-400 hover:text-red-300">Clear</button>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-gray-400">Slide Duration</span><span className="text-white font-medium">{activeSlide.duration}s</span></div>
                <input type="range" min={3} max={30} value={activeSlide.duration} onChange={e => updateSlide(s => ({ ...s, duration: Number(e.target.value) }))} className="w-full accent-indigo-500" />
              </div>
            </div>
          )}

          {tab === 'document' && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Story Info</p>
              {[{ label: 'Slug', key: 'slug' as const, placeholder: 'url-slug' }, { label: 'Category', key: 'category' as const, placeholder: 'Travel, Deals...' }, { label: 'Publisher Name', key: 'publisherName' as const, placeholder: 'TransRentals' }, { label: 'Description', key: 'description' as const, placeholder: 'Story description...' }, { label: 'Meta Description', key: 'metaDescription' as const, placeholder: 'SEO description...' }, { label: 'Expires At', key: 'expiresAt' as const, placeholder: '', type: 'datetime-local' }].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder} value={(meta as any)[f.key]} onChange={e => setMeta(m => ({ ...m, [f.key]: e.target.value }))} className="w-full bg-white/10 text-white text-xs px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600" />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Publisher Logo</label>
                {meta.publisherLogo && <img src={meta.publisherLogo} alt="" className="w-12 h-12 rounded-full object-cover mb-2" />}
                <button onClick={() => logoInputRef.current?.click()} className="w-full py-2 border border-dashed border-white/20 text-gray-400 hover:text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition"><Upload className="w-3 h-3" /> Upload Logo</button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cover Image</label>
                {meta.coverImage && <img src={meta.coverImage} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />}
                <button onClick={() => coverInputRef.current?.click()} className="w-full py-2 border border-dashed border-white/20 text-gray-400 hover:text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition"><Upload className="w-3 h-3" /> Upload Cover</button>
              </div>
            </div>
          )}
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
          <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden" onClick={() => setSelectedId(null)}>
            <div style={{ position: 'relative', width: CANVAS_W * scale, height: CANVAS_H * scale, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <div ref={canvasRef} className="overflow-visible shadow-2xl rounded-sm"
                style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                onClick={e => e.stopPropagation()}>
                {/* Clip the background only */}
                <div className="absolute inset-0 overflow-hidden rounded-sm">
                  <SlideBg s={activeSlide} />
                </div>
                {activeSlide.elements.sort((a, b) => a.z - b.z).map(el => (
                  <CanvasEl key={el.id} el={el} selected={selectedId === el.id} scale={scale}
                    canvasRef={canvasRef}
                    onSelect={() => setSelectedId(el.id)} onChange={updateElement}
                    onDblClick={() => {
                      if (el.type === 'text' || el.type === 'button') setEditingId(el.id);
                      else if (el.type === 'image' && el.src) setPanImageId(el.id);
                    }}
                    onDragMove={handleElementDrag} onDragEnd={handleDragEnd}
                    dropHighlight={dropTargetId === el.id} onSnapshot={snapshot} />
                ))}
                {/* Grid overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9000, backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                    {/* Center guides */}
                    <div className="absolute" style={{ left: CANVAS_W/2 - 0.5, top: 0, width: 1, height: '100%', background: 'rgba(99,102,241,0.4)' }} />
                    <div className="absolute" style={{ top: CANVAS_H/2 - 0.5, left: 0, height: 1, width: '100%', background: 'rgba(99,102,241,0.4)' }} />
                  </div>
                )}
              </div>
              {/* FloatingToolbar outside scaled canvas — positioned in visual pixels */}
              {selectedEl && (
                <FloatingToolbar el={selectedEl} scale={scale} onChange={updateElement} canvasRef={canvasRef} onShapeImageFill={() => shapeImgInputRef.current?.click()} onSnapshot={snapshot} />
              )}
            </div>
          </div>

          {/* Slide Strip */}
          <div className="h-36 bg-[#161616] border-t border-white/10 flex items-center px-4 gap-3 overflow-x-auto flex-shrink-0">
            <span className="text-gray-500 text-xs font-medium whitespace-nowrap flex-shrink-0">{activeIdx + 1} / {slides.length}</span>
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <div
                  key={s.id}
                  draggable
                  onDragStart={() => setDragSlideIdx(i)}
                  onDragEnd={() => { setDragSlideIdx(null); setDragOverIdx(null); }}
                  onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }}
                  onDrop={() => {
                    if (dragSlideIdx === null || dragSlideIdx === i) return;
                    snapshot();
                    setSlides(prev => {
                      const arr = [...prev];
                      const [removed] = arr.splice(dragSlideIdx, 1);
                      arr.splice(i, 0, removed);
                      return arr.map((sl, idx) => ({ ...sl, order: idx }));
                    });
                    setActiveIdx(i);
                    setDragSlideIdx(null); setDragOverIdx(null);
                  }}
                  className={`transition-all ${dragOverIdx === i && dragSlideIdx !== i ? 'ring-2 ring-indigo-400 rounded-lg scale-95' : ''}`}
                >
                  <SlideThumbnail s={s} idx={i} selected={i === activeIdx}
                    onClick={() => { setActiveIdx(i); setSelectedId(null); }}
                    onDelete={() => { if (slides.length <= 1) return; snapshot(); setSlides(prev => prev.filter((_, idx) => idx !== i)); setActiveIdx(Math.max(0, i - 1)); setSelectedId(null); }}
                    onDuplicate={() => duplicateSlide(i)} />
                </div>
              ))}
              <button onClick={() => { setSlides(prev => [...prev, blankSlide(prev.length)]); setActiveIdx(slides.length); setSelectedId(null); }}
                className="flex-shrink-0 w-[72px] h-[128px] border-2 border-dashed border-white/20 hover:border-indigo-400 text-white/30 hover:text-indigo-400 rounded-lg flex items-center justify-center transition">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Strip */}
        <div className="w-12 bg-[#232323] border-l border-white/10 flex flex-col items-center py-3 gap-1 flex-shrink-0">
          {selectedEl ? (
            <>
              <button onClick={() => duplicateElement(selectedEl.id)} title="Duplicate (Ctrl+D)"
                className="w-9 h-9 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition"><Copy className="w-4 h-4" /></button>
              <button onClick={() => changeLayer(selectedEl.id, 'up')} title="Forward (Ctrl+])"
                className="w-9 h-9 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => changeLayer(selectedEl.id, 'down')} title="Back (Ctrl+[)"
                className="w-9 h-9 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition"><ArrowDown className="w-4 h-4" /></button>
              <div className="w-6 h-px bg-white/10 my-0.5" />
              {/* Lock/Unlock */}
              <button onClick={() => updateElement({ ...selectedEl, locked: !selectedEl.locked })} title={selectedEl.locked ? 'Unlock' : 'Lock element'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${selectedEl.locked ? 'bg-amber-500/30 text-amber-300' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                {selectedEl.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <div className="w-6 h-px bg-white/10 my-0.5" />
              {/* Flip H */}
              <button onClick={() => updateElement({ ...selectedEl, flipX: !selectedEl.flipX })} title="Flip Horizontal"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${selectedEl.flipX ? 'bg-indigo-600/40 text-indigo-300' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                <FlipHorizontal className="w-4 h-4" />
              </button>
              {/* Flip V */}
              <button onClick={() => updateElement({ ...selectedEl, flipY: !selectedEl.flipY })} title="Flip Vertical"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${selectedEl.flipY ? 'bg-indigo-600/40 text-indigo-300' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                <FlipVertical className="w-4 h-4" />
              </button>
              <div className="w-6 h-px bg-white/10 my-0.5" />
              <button onClick={() => deleteElement(selectedEl.id)} title="Delete (Del)"
                className="w-9 h-9 hover:bg-red-500/20 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
              <div className="mt-auto px-1 w-full flex flex-col items-center gap-1 pb-2">
                <span className="text-[9px] text-gray-500 uppercase tracking-wide">Opacity</span>
                <input type="range" min={0.1} max={1} step={0.05} value={selectedEl.opacity}
                  onChange={e => updateElement({ ...selectedEl, opacity: parseFloat(e.target.value) })}
                  className="accent-indigo-500" style={{ writingMode: 'vertical-lr', width: 32, height: 80 }} />
                <span className="text-[9px] text-gray-500">{Math.round(selectedEl.opacity * 100)}%</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 mt-2 opacity-30">
              <MousePointer className="w-4 h-4 text-gray-500" />
              <span className="text-[8px] text-gray-500 text-center leading-tight px-1">Select element</span>
            </div>
          )}
        </div>
      </div>

      {editingId && (() => {
        const el = activeSlide.elements.find(e => e.id === editingId);
        if (!el) return null;
        return <TextEditModal el={el} onSave={c => updateElement({ ...el, content: c })} onClose={() => setEditingId(null)} />;
      })()}

      {/* Image pan mode overlay */}
      {panImageId && (() => {
        const el = activeSlide.elements.find(e => e.id === panImageId);
        if (!el || !el.src) { setPanImageId(null); return null; }

        // Parse current objectPosition to % values
        const parsePos = (pos: string) => {
          const parts = pos.split(' ');
          const toNum = (v: string) => {
            if (v === 'left' || v === 'top') return 0;
            if (v === 'center') return 50;
            if (v === 'right' || v === 'bottom') return 100;
            return parseFloat(v) || 50;
          };
          return { x: toNum(parts[0] || 'center'), y: toNum(parts[1] || 'center') };
        };

        const handlePanDrag = (e: React.MouseEvent) => {
          e.preventDefault(); e.stopPropagation();
          const cur = parsePos(el.objectPosition || 'center center');
          const sx = e.clientX, sy = e.clientY;
          const move = (ev: MouseEvent) => {
            const dx = (ev.clientX - sx) / (el.w * scale) * 100;
            const dy = (ev.clientY - sy) / (el.h * scale) * 100;
            const nx = Math.max(0, Math.min(100, cur.x - dx));
            const ny = Math.max(0, Math.min(100, cur.y - dy));
            updateElement({ ...el, objectPosition: `${nx.toFixed(1)}% ${ny.toFixed(1)}%` });
          };
          const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
          document.addEventListener('mousemove', move);
          document.addEventListener('mouseup', up);
        };

        // Position overlay exactly over the element
        const elLeft = el.x * scale;
        const elTop = el.y * scale;
        const elW = el.w * scale;
        const elH = el.h * scale;

        return (
          <div className="fixed inset-0 z-[9998]" onClick={() => setPanImageId(null)}>
            {/* Green border overlay on the element */}
            <div
              style={{
                position: 'fixed',
                left: canvasRef.current ? canvasRef.current.getBoundingClientRect().left + elLeft : 0,
                top: canvasRef.current ? canvasRef.current.getBoundingClientRect().top + elTop : 0,
                width: elW, height: elH,
                border: '2px solid #22c55e',
                cursor: 'grab',
                zIndex: 9999,
                borderRadius: el.borderRadius ? el.borderRadius * scale : 0,
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
              onMouseDown={handlePanDrag}
            >
              <img src={el.src} alt="" style={{
                width: '100%', height: '100%',
                objectFit: el.objectFit || 'cover',
                objectPosition: el.objectPosition || 'center center',
                pointerEvents: 'none',
              }} />
              {/* Hint label */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
                Drag to reposition · Click outside to exit
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

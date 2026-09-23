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

// CSS keyframes for canvas animation preview — one entry per ANIMATIONS value
const CANVAS_ANIM_CSS = `
@keyframes ws-fade-in{from{opacity:0}to{opacity:1}}
@keyframes ws-slide-up{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes ws-slide-down{from{transform:translateY(-60px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes ws-slide-left{from{transform:translateX(60px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes ws-slide-right{from{transform:translateX(-60px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes ws-zoom-in{from{transform:scale(0.2);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes ws-pop{0%{transform:scale(0.2);opacity:0}70%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes ws-spin-in{from{transform:rotate(-180deg) scale(0.3);opacity:0}to{transform:rotate(0deg) scale(1);opacity:1}}
`;

// Interpolate CSS filter intensity: 0% = no effect, 100% = full effect
function scaleFilter(css: string | undefined, intensity: number): string | undefined {
  if (!css) return undefined;
  const t = Math.max(0, Math.min(100, intensity)) / 100;
  if (t === 1) return css;
  if (t === 0) return undefined;
  const NEUTRALS: Record<string, number> = {
    saturate: 1, brightness: 1, contrast: 1,
    grayscale: 0, sepia: 0, invert: 0, blur: 0, 'hue-rotate': 0,
  };
  const result = css.replace(/(\w[\w-]*)\(([^)]+)\)/g, (_m, fn, val) => {
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

type EType = 'text' | 'image' | 'shape' | 'button' | 'sticker';
type ShapeType = 'rect' | 'circle' | 'triangle' | 'diamond' | 'star' | 'hexagon'
  | 'pentagon' | 'octagon' | 'cross' | 'parallelogram'
  | 'arrowRight' | 'arrowLeft' | 'arrowUp' | 'arrowDown' | 'arrowDoubleH' | 'chevronRight' | 'chevronLeft'
  | 'star4' | 'star6' | 'star8' | 'starburst'
  | 'heart' | 'speechLeft' | 'speechRight' | 'speechRound'
  | 'bannerRibbon' | 'fcDocument' | 'fcCylinder'
  | 'blobA' | 'blobB' | 'gear';

interface CE {
  id: string; type: EType;
  x: number; y: number; w: number; h: number;
  rot: number; z: number; opacity: number;
  flipX?: boolean; flipY?: boolean;
  filterCss?: string;
  filterIntensity?: number;
  animation?: string; animationDuration?: number; animationEasing?: string;
  locked?: boolean;
  groupId?: string;
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
  tintColor?: string; tintOpacity?: number;
  href?: string;
  isFrame?: boolean;
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
  coverImage: string; coverImageSquare: string; coverImageLandscape: string; expiresAt: string;
  targetServices: string[]; targetLocations: string[];
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
    // Basic
    case 'triangle':     return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'diamond':      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'star':         return 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
    case 'hexagon':      return 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)';
    case 'pentagon':     return 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)';
    case 'octagon':      return 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)';
    case 'cross':        return 'polygon(35% 0%,65% 0%,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0% 65%,0% 35%,35% 35%)';
    case 'parallelogram':return 'polygon(20% 0%,100% 0%,80% 100%,0% 100%)';
    // Arrows
    case 'arrowRight':   return 'polygon(0% 20%,60% 20%,60% 0%,100% 50%,60% 100%,60% 80%,0% 80%)';
    case 'arrowLeft':    return 'polygon(40% 0%,40% 20%,100% 20%,100% 80%,40% 80%,40% 100%,0% 50%)';
    case 'arrowUp':      return 'polygon(50% 0%,100% 40%,80% 40%,80% 100%,20% 100%,20% 40%,0% 40%)';
    case 'arrowDown':    return 'polygon(20% 0%,80% 0%,80% 60%,100% 60%,50% 100%,0% 60%,20% 60%)';
    case 'arrowDoubleH': return 'polygon(0% 50%,20% 0%,20% 35%,80% 35%,80% 0%,100% 50%,80% 100%,80% 65%,20% 65%,20% 100%)';
    case 'chevronRight': return 'polygon(0% 0%,75% 0%,100% 50%,75% 100%,0% 100%,25% 50%)';
    case 'chevronLeft':  return 'polygon(25% 0%,100% 0%,75% 50%,100% 100%,25% 100%,0% 50%)';
    // Stars
    case 'star4':        return 'polygon(50% 0%,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0% 50%,40% 40%)';
    case 'star6':        return 'polygon(50% 0%,38% 28%,7% 25%,25% 50%,7% 75%,38% 72%,50% 100%,63% 72%,93% 75%,75% 50%,93% 25%,63% 28%)';
    case 'star8':        return 'polygon(50% 0%,61% 24%,85% 15%,76% 39%,100% 50%,76% 61%,85% 85%,61% 76%,50% 100%,39% 76%,15% 85%,24% 61%,0% 50%,24% 39%,15% 15%,39% 24%)';
    case 'starburst':    return 'polygon(50% 0%,55% 31%,75% 7%,64% 36%,93% 25%,69% 45%,100% 50%,69% 55%,93% 75%,64% 64%,75% 93%,55% 69%,50% 100%,45% 69%,25% 93%,36% 64%,7% 75%,31% 55%,0% 50%,31% 45%,7% 25%,36% 36%,25% 7%,45% 31%)';
    default: return 'none';
  }
}

// SVG path shapes (viewBox 0 0 100 100)
const SVG_PATHS: Partial<Record<ShapeType, string>> = {
  heart:      'M 50 30 C 50 22,42 10,25 10 C 8 10,0 25,0 40 C 0 65,50 90,50 90 C 50 90,100 65,100 40 C 100 25,92 10,75 10 C 58 10,50 22,50 30 Z',
  speechLeft: 'M 15 0 Q 0 0 0 15 L 0 65 Q 0 80 15 80 L 20 80 L 8 100 L 38 80 L 85 80 Q 100 80 100 65 L 100 15 Q 100 0 85 0 Z',
  speechRight:'M 15 0 Q 0 0 0 15 L 0 65 Q 0 80 15 80 L 62 80 L 92 100 L 80 80 L 85 80 Q 100 80 100 65 L 100 15 Q 100 0 85 0 Z',
  speechRound:'M 10 0 Q 0 0 0 10 L 0 62 Q 0 75 10 75 L 40 75 L 50 95 L 60 75 L 90 75 Q 100 75 100 62 L 100 10 Q 100 0 90 0 Z',
  bannerRibbon:'M 0 20 L 15 35 L 0 50 L 0 85 Q 0 100 15 100 L 85 100 Q 100 100 100 85 L 100 50 L 85 35 L 100 20 Z',
  fcDocument:  'M 0 0 L 100 0 L 100 75 Q 87 90 75 75 Q 62 60 50 75 Q 37 90 25 75 Q 12 60 0 75 Z',
  blobA:       'M 72 14 C 90 26,102 46,96 65 C 90 84,72 95,52 93 C 32 91,8 84,2 66 C -4 48,8 24,24 14 C 40 4,54 2,72 14 Z',
  blobB:       'M 65 8 C 82 14,96 32,97 52 C 98 72,84 92,64 95 C 44 98,20 88,8 70 C -4 52,0 26,16 14 C 32 2,48 2,65 8 Z',
  gear:        'M 40 0 L 60 0 L 64 16 L 78 8 L 92 22 L 84 36 L 100 44 L 100 56 L 84 64 L 92 78 L 78 92 L 64 84 L 60 100 L 40 100 L 36 84 L 22 92 L 8 78 L 16 64 L 0 56 L 0 44 L 16 36 L 8 22 L 22 8 L 36 16 Z M 35 50 A 15 15 0 1 0 65 50 A 15 15 0 1 0 35 50 Z',
};

function isSvgShape(st: ShapeType): boolean {
  return st in SVG_PATHS || st === 'fcCylinder';
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

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES: {
  name: string; icon: string;
  bg: Pick<SD, 'bgType' | 'bgColor' | 'bgGradient' | 'bgImage' | 'bgVideo'>;
  elements: Partial<CE>[];
}[] = [
  {
    name: 'Title Slide', icon: '📌',
    bg: { bgType: 'COLOR', bgColor: '#1a1a2e', bgGradient: null, bgImage: null, bgVideo: null },
    elements: [
      { type: 'text', x: 20, y: 210, w: 350, h: 110, content: 'Your Headline', fontSize: 46, bold: true, align: 'center', color: '#ffffff', colorAlpha: 1, lineHeight: 1.15, fontFamily: 'inherit' },
      { type: 'text', x: 40, y: 340, w: 310, h: 60, content: 'Your subtitle goes here', fontSize: 17, align: 'center', color: '#c4c4e0', colorAlpha: 0.85, lineHeight: 1.5, fontFamily: 'inherit' },
    ],
  },
  {
    name: 'CTA', icon: '🎯',
    bg: { bgType: 'GRADIENT', bgColor: null, bgGradient: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', bgImage: null, bgVideo: null },
    elements: [
      { type: 'text', x: 20, y: 190, w: 350, h: 110, content: 'Big Bold Headline', fontSize: 44, bold: true, align: 'center', color: '#ffffff', colorAlpha: 1, lineHeight: 1.1, fontFamily: 'inherit' },
      { type: 'text', x: 40, y: 320, w: 310, h: 50, content: 'Supporting text goes here', fontSize: 16, align: 'center', color: '#ffffff', colorAlpha: 0.7, lineHeight: 1.5, fontFamily: 'inherit' },
      { type: 'button', x: 95, y: 500, w: 200, h: 52, content: 'Tap to Learn More', fontSize: 15, bold: true, color: '#1a1a2e', colorAlpha: 1, bgColor: '#ffffff', bgAlpha: 1, borderRadius: 50 },
    ],
  },
  {
    name: 'Quote', icon: '💬',
    bg: { bgType: 'GRADIENT', bgColor: null, bgGradient: 'linear-gradient(135deg,#667eea,#764ba2)', bgImage: null, bgVideo: null },
    elements: [
      { type: 'shape', x: 165, y: 140, w: 60, h: 60, shapeType: 'circle', bgColor: '#ffffff', bgAlpha: 0.15, filled: true },
      { type: 'text', x: 30, y: 240, w: 330, h: 200, content: '"A great insight that resonates with your audience and inspires action."', fontSize: 24, italic: true, align: 'center', color: '#ffffff', colorAlpha: 1, lineHeight: 1.55, fontFamily: 'inherit' },
      { type: 'text', x: 80, y: 455, w: 230, h: 40, content: '— Author Name', fontSize: 15, align: 'center', color: '#ffffff', colorAlpha: 0.72, lineHeight: 1.3, fontFamily: 'inherit' },
    ],
  },
  {
    name: 'Stats', icon: '📊',
    bg: { bgType: 'COLOR', bgColor: '#0d0d0d', bgGradient: null, bgImage: null, bgVideo: null },
    elements: [
      { type: 'text', x: 20, y: 90, w: 350, h: 55, content: 'Key Numbers', fontSize: 26, bold: true, align: 'center', color: '#ffffff', colorAlpha: 1, lineHeight: 1.2, fontFamily: 'inherit' },
      { type: 'text', x: 20, y: 210, w: 165, h: 90, content: '99%', fontSize: 54, bold: true, align: 'center', color: '#818cf8', colorAlpha: 1, lineHeight: 1, fontFamily: 'inherit' },
      { type: 'text', x: 20, y: 308, w: 165, h: 38, content: 'Satisfaction', fontSize: 14, align: 'center', color: '#9ca3af', colorAlpha: 1, lineHeight: 1.3, fontFamily: 'inherit' },
      { type: 'text', x: 205, y: 210, w: 165, h: 90, content: '5K+', fontSize: 54, bold: true, align: 'center', color: '#f472b6', colorAlpha: 1, lineHeight: 1, fontFamily: 'inherit' },
      { type: 'text', x: 205, y: 308, w: 165, h: 38, content: 'Customers', fontSize: 14, align: 'center', color: '#9ca3af', colorAlpha: 1, lineHeight: 1.3, fontFamily: 'inherit' },
    ],
  },
  {
    name: 'Announcement', icon: '📣',
    bg: { bgType: 'GRADIENT', bgColor: null, bgGradient: 'linear-gradient(160deg,#f093fb,#f5576c)', bgImage: null, bgVideo: null },
    elements: [
      { type: 'shape', x: 145, y: 140, w: 100, h: 100, shapeType: 'star', bgColor: '#ffffff', bgAlpha: 0.25, filled: true },
      { type: 'text', x: 20, y: 270, w: 350, h: 80, content: 'Big Announcement!', fontSize: 38, bold: true, align: 'center', color: '#ffffff', colorAlpha: 1, lineHeight: 1.1, fontFamily: 'inherit' },
      { type: 'text', x: 40, y: 368, w: 310, h: 70, content: 'Share details about your exciting news here.', fontSize: 17, align: 'center', color: '#ffffff', colorAlpha: 0.88, lineHeight: 1.45, fontFamily: 'inherit' },
    ],
  },
  {
    name: 'Split', icon: '✂️',
    bg: { bgType: 'COLOR', bgColor: '#f9fafb', bgGradient: null, bgImage: null, bgVideo: null },
    elements: [
      { type: 'shape', x: 0, y: 0, w: 390, h: 350, shapeType: 'rect', bgColor: '#1a1a2e', bgAlpha: 1, filled: true, borderRadius: 0 },
      { type: 'text', x: 20, y: 380, w: 350, h: 70, content: 'Your Heading Here', fontSize: 30, bold: true, align: 'center', color: '#111827', colorAlpha: 1, lineHeight: 1.2, fontFamily: 'inherit' },
      { type: 'text', x: 30, y: 460, w: 330, h: 80, content: 'Supporting description. Keep it short and engaging.', fontSize: 15, align: 'center', color: '#6b7280', colorAlpha: 1, lineHeight: 1.55, fontFamily: 'inherit' },
    ],
  },
  {
    name: 'Product', icon: '🛍️',
    bg: { bgType: 'COLOR', bgColor: '#f8f9fa', bgGradient: null, bgImage: null, bgVideo: null },
    elements: [
      { type: 'shape', x: 35, y: 55, w: 320, h: 310, shapeType: 'rect', bgColor: '#e5e7eb', bgAlpha: 1, filled: true, borderRadius: 20 },
      { type: 'text', x: 20, y: 390, w: 350, h: 60, content: 'Product Name', fontSize: 28, bold: true, align: 'center', color: '#111827', colorAlpha: 1, lineHeight: 1.2, fontFamily: 'inherit' },
      { type: 'text', x: 40, y: 460, w: 310, h: 45, content: '₹999 · Limited Time Offer', fontSize: 19, align: 'center', color: '#6366f1', colorAlpha: 1, lineHeight: 1.3, fontFamily: 'inherit' },
      { type: 'button', x: 95, y: 555, w: 200, h: 52, content: 'Shop Now', fontSize: 16, bold: true, color: '#ffffff', colorAlpha: 1, bgColor: '#6366f1', bgAlpha: 1, borderRadius: 50 },
    ],
  },
  {
    name: 'Steps', icon: '📋',
    bg: { bgType: 'COLOR', bgColor: '#18181b', bgGradient: null, bgImage: null, bgVideo: null },
    elements: [
      { type: 'text', x: 20, y: 55, w: 350, h: 55, content: 'How It Works', fontSize: 28, bold: true, align: 'center', color: '#ffffff', colorAlpha: 1, lineHeight: 1.2, fontFamily: 'inherit' },
      { type: 'shape', x: 28, y: 150, w: 48, h: 48, shapeType: 'circle', bgColor: '#6366f1', bgAlpha: 1, filled: true },
      { type: 'text', x: 28, y: 155, w: 48, h: 38, content: '1', fontSize: 22, bold: true, align: 'center', color: '#fff', colorAlpha: 1, lineHeight: 1, fontFamily: 'inherit' },
      { type: 'text', x: 92, y: 152, w: 272, h: 44, content: 'Step one: First action here', fontSize: 15, align: 'left', color: '#e5e7eb', colorAlpha: 1, lineHeight: 1.45, fontFamily: 'inherit' },
      { type: 'shape', x: 28, y: 288, w: 48, h: 48, shapeType: 'circle', bgColor: '#ec4899', bgAlpha: 1, filled: true },
      { type: 'text', x: 28, y: 293, w: 48, h: 38, content: '2', fontSize: 22, bold: true, align: 'center', color: '#fff', colorAlpha: 1, lineHeight: 1, fontFamily: 'inherit' },
      { type: 'text', x: 92, y: 290, w: 272, h: 44, content: 'Step two: Second action here', fontSize: 15, align: 'left', color: '#e5e7eb', colorAlpha: 1, lineHeight: 1.45, fontFamily: 'inherit' },
      { type: 'shape', x: 28, y: 426, w: 48, h: 48, shapeType: 'circle', bgColor: '#10b981', bgAlpha: 1, filled: true },
      { type: 'text', x: 28, y: 431, w: 48, h: 38, content: '3', fontSize: 22, bold: true, align: 'center', color: '#fff', colorAlpha: 1, lineHeight: 1, fontFamily: 'inherit' },
      { type: 'text', x: 92, y: 428, w: 272, h: 44, content: 'Step three: Final result', fontSize: 15, align: 'left', color: '#e5e7eb', colorAlpha: 1, lineHeight: 1.45, fontFamily: 'inherit' },
    ],
  },
];

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
  const scaledFilterCss = scaleFilter(el.filterCss, el.filterIntensity ?? 100);
  const shadowFilter = buildDropShadow(el);
  const combinedFilter = [scaledFilterCss, shadowFilter].filter(Boolean).join(' ') || undefined;

  if (el.type === 'text' || el.type === 'button') {
    const isBtn = el.type === 'button';
    const bw = el.borderWidth || 0;
    const boxShadow = isBtn && hasShadow(el)
      ? `${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 8}px ${shadowRgba(el)}`
      : undefined;
    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ filter: scaledFilterCss || undefined, backgroundColor: isBtn ? toRgba(el.bgColor || '#ffffff', el.bgAlpha ?? 1) : 'transparent', borderRadius: el.borderRadius ?? (isBtn ? 50 : 0), border: bw > 0 ? `${bw}px solid ${el.borderColor || '#fff'}` : undefined, boxSizing: 'border-box', boxShadow }}>
        <div style={{ fontSize: el.fontSize || (isBtn ? 16 : 24), fontFamily: el.fontFamily || 'inherit', fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', textDecoration: el.underline ? 'underline' : 'none', textAlign: el.align || 'center', color: toRgba(el.color || '#ffffff', el.colorAlpha ?? 1), lineHeight: el.lineHeight || 1.3, letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined, textTransform: el.textTransform || 'none', padding: isBtn ? '0 16px' : 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap', width: '100%', WebkitTextStroke: el.textStrokeWidth ? `${el.textStrokeWidth}px ${el.textStrokeColor || '#000'}` : undefined, textShadow: !isBtn ? buildTextShadow(el) : undefined } as React.CSSProperties}>
          {el.content || (isBtn ? 'Button' : 'Double-click to edit')}
        </div>
      </div>
    );
  }

  if (el.type === 'image') {
    const bw = el.borderWidth || 0;
    return el.src
      ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: el.borderRadius ?? 0, overflow: 'hidden', border: bw > 0 ? `${bw}px solid ${el.borderColor || '#fff'}` : undefined, boxSizing: 'border-box' }}>
          <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: el.objectFit || 'cover', objectPosition: el.objectPosition || 'center center', filter: combinedFilter, display: 'block' }} />
          {el.tintColor && (el.tintOpacity ?? 0) > 0 && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: el.tintColor, opacity: el.tintOpacity, pointerEvents: 'none' }} />
          )}
        </div>
      )
      : <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300"><ImageIcon className="w-8 h-8 text-slate-400" /></div>;
  }

  if (el.type === 'sticker') {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ filter: combinedFilter }}>
        <span style={{ fontSize: el.fontSize || 60, lineHeight: 1, userSelect: 'none' }}>{el.content || '⭐'}</span>
      </div>
    );
  }

  if (el.type === 'shape') {
    const st = el.shapeType || 'rect';
    const isFilled = el.filled !== false;
    const fillColor = isFilled ? toRgba(el.bgColor || '#6366f1', el.bgAlpha ?? 1) : 'transparent';
    const bw = el.borderWidth || 0;
    const frameStroke = el.borderColor || '#6366f1';
    const isEmptyFrame = el.isFrame && !el.bgImage;
    const clipId = `ec-${el.id}`;

    // SVG-based shapes
    if (isSvgShape(st)) {
      const borderDs = bw > 0 ? `drop-shadow(0 0 ${bw}px ${el.borderColor || '#fff'})` : '';
      const shapeFilter = [scaledFilterCss, borderDs, shadowFilter].filter(Boolean).join(' ') || undefined;
      const cylPath = 'M 0 18 Q 0 5 50 5 Q 100 5 100 18 L 100 82 Q 100 95 50 95 Q 0 95 0 82 Z';

      // Image fill via SVG clipPath
      if (el.bgImage) {
        if (st === 'fcCylinder') return (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', filter: shapeFilter }}>
            <defs><clipPath id={clipId}><path d={cylPath} /></clipPath></defs>
            <image href={el.bgImage} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
          </svg>
        );
        const svgPath = SVG_PATHS[st]!;
        return (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', filter: shapeFilter }}>
            <defs><clipPath id={clipId}><path d={svgPath} /></clipPath></defs>
            <image href={el.bgImage} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
          </svg>
        );
      }

      // Empty frame placeholder
      if (isEmptyFrame) {
        if (st === 'fcCylinder') return (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', filter: shapeFilter }}>
            <path d={cylPath} fill="rgba(99,102,241,0.07)" stroke={frameStroke} strokeWidth="4" strokeDasharray="7 4" />
          </svg>
        );
        const svgPath = SVG_PATHS[st]!;
        const isGear = st === 'gear';
        return (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', filter: shapeFilter }}>
            <path d={svgPath} fill="rgba(99,102,241,0.07)" stroke={frameStroke} strokeWidth="4" strokeDasharray="7 4" fillRule={isGear ? 'evenodd' : 'nonzero'} />
          </svg>
        );
      }

      // Regular colored shape
      if (st === 'fcCylinder') return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', filter: shapeFilter }}>
          <path d={cylPath} fill={fillColor} />
          <path d="M 0 18 Q 0 31 50 31 Q 100 31 100 18" fill="none" stroke={toRgba(el.bgColor || '#6366f1', Math.min(1, (el.bgAlpha ?? 1) + 0.2))} strokeWidth="2" />
        </svg>
      );
      const svgPath = SVG_PATHS[st]!;
      const isGear = st === 'gear';
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', filter: shapeFilter }}>
          <path d={svgPath} fill={fillColor} fillRule={isGear ? 'evenodd' : 'nonzero'} />
        </svg>
      );
    }

    const clip = getClipPath(st);
    if (clip !== 'none') {
      const borderDs = bw > 0 ? `drop-shadow(0 0 ${bw}px ${el.borderColor || '#fff'})` : '';
      const shapeFilter = [scaledFilterCss, borderDs, shadowFilter].filter(Boolean).join(' ') || undefined;
      if (isEmptyFrame) return (
        <div style={{ position: 'relative', width: '100%', height: '100%', filter: shapeFilter }}>
          <div style={{ width: '100%', height: '100%', clipPath: clip, backgroundColor: 'rgba(99,102,241,0.07)', backgroundImage: 'repeating-linear-gradient(45deg,rgba(99,102,241,0.15) 0,rgba(99,102,241,0.15) 1px,transparent 0,transparent 50%)', backgroundSize: '8px 8px' }} />
          <div style={{ position: 'absolute', inset: 0, clipPath: clip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, opacity: 0.45 }}>🖼️</span>
          </div>
        </div>
      );
      return <div style={{ width: '100%', height: '100%', backgroundColor: el.bgImage ? 'transparent' : fillColor, clipPath: clip, backgroundImage: el.bgImage ? `url(${el.bgImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', filter: shapeFilter }} />;
    }

    const br = st === 'circle' ? '50%' : `${el.borderRadius ?? 0}px`;
    if (isEmptyFrame) return (
      <div style={{ width: '100%', height: '100%', borderRadius: br, border: `2px dashed ${frameStroke}`, backgroundColor: 'rgba(99,102,241,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', filter: combinedFilter }}>
        <span style={{ fontSize: 22, opacity: 0.45 }}>🖼️</span>
      </div>
    );
    return <div style={{ width: '100%', height: '100%', backgroundColor: el.bgImage ? 'transparent' : fillColor, borderRadius: br, backgroundImage: el.bgImage ? `url(${el.bgImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', border: bw > 0 ? `${bw}px solid ${el.borderColor || '#fff'}` : undefined, boxSizing: 'border-box', overflow: 'hidden', filter: combinedFilter }} />;
  }
  return null;
}

// ─── Collapsible Insert Section ──────────────────────────────────────────────
function InsertSection({ label, sKey, open, toggle, children }: {
  label: string; sKey: string;
  open: Set<string>; toggle: (k: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = open.has(sKey);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button onClick={() => toggle(sKey)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition text-left">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {isOpen && <div className="p-2.5 bg-white">{children}</div>}
    </div>
  );
}

// ─── CanvasEl with Rotation Handle ───────────────────────────────────────────
function CanvasEl({ el, selected, multiSelected, scale, canvasRef, onSelect, onShiftSelect, onChange, onDblClick, onDragMove, onDragEnd, dropHighlight, onSnapshot, onMultiDragStart, onMultiMove }: {
  el: CE; selected: boolean; multiSelected?: boolean; scale: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void; onShiftSelect?: () => void; onChange: (e: CE) => void; onDblClick: () => void;
  onDragMove?: (el: CE) => void;
  onDragEnd?: (finalEl: CE) => void;
  dropHighlight?: boolean;
  onSnapshot?: () => void;
  onMultiDragStart?: () => void;
  onMultiMove?: (dx: number, dy: number) => void;
}) {
  const handleDrag = (e: React.MouseEvent) => {
    if (el.locked) { if (e.shiftKey && onShiftSelect) onShiftSelect(); else onSelect(); return; }
    e.preventDefault(); e.stopPropagation();
    // Shift+click = toggle selection only, skip drag
    if (e.shiftKey && onShiftSelect) { onShiftSelect(); return; }
    onSelect();
    onSnapshot?.();
    if (multiSelected && onMultiDragStart) onMultiDragStart();
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
      const dx = (ev.clientX - sx) / scale;
      const dy = (ev.clientY - sy) / scale;
      if (multiSelected && onMultiMove) {
        onMultiMove(dx, dy);
      } else {
        const rawX = ox + dx, rawY = oy + dy;
        lastEl = { ...el, x: ev.altKey ? rawX : snapX(rawX), y: ev.altKey ? rawY : snapY(rawY) };
        onChange(lastEl);
        if (onDragMove) onDragMove(lastEl);
      }
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      if (!multiSelected && onDragEnd) onDragEnd(lastEl);
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
      style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rot}deg)${flipStr}`, zIndex: el.z, opacity: el.opacity, cursor: el.locked ? 'not-allowed' : 'move', outline: dropHighlight ? '3px solid #22c55e' : selected ? (el.locked ? '2px solid #f59e0b' : '2px solid #818cf8') : multiSelected ? '2px dashed #818cf8' : 'none', outlineOffset: dropHighlight ? 3 : 1, userSelect: 'none', transition: 'outline 0.1s' }}
      onMouseDown={handleDrag}
      onClick={e => { e.stopPropagation(); if (!e.shiftKey) onSelect(); }}
      onDoubleClick={e => { e.stopPropagation(); onDblClick(); }}
    >
      {/* Animation preview wrapper — key changes when anim settings change, forcing CSS restart */}
      <div
        key={`${el.animation || 'none'}-${el.animationDuration ?? 0.6}-${el.animationEasing ?? 'ease'}`}
        style={{ position: 'absolute', inset: 0, animation: el.animation ? `ws-${el.animation} ${el.animationDuration ?? 0.6}s ${el.animationEasing ?? 'ease'} both` : undefined }}
      >
        {renderElInner(el)}
      </div>
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
      <div className={`overflow-hidden rounded-lg ${selected ? 'ring-2 ring-indigo-400' : 'ring-1 ring-slate-200'}`} style={{ width: 72, height: 128 }}>
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

// ─── StaticToolbar ────────────────────────────────────────────────────────────
function StaticToolbar({ el, onChange, onShapeImageFill, onSnapshot }: {
  el: CE; onChange: (e: CE) => void;
  onShapeImageFill?: () => void;
  onSnapshot?: () => void;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [showShadow, setShowShadow] = useState(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const animBtnRef = useRef<HTMLButtonElement>(null);
  const shadowBtnRef = useRef<HTMLButtonElement>(null);
  const filterPopupRef = useRef<HTMLDivElement>(null);
  const animPopupRef = useRef<HTMLDivElement>(null);
  const shadowPopupRef = useRef<HTMLDivElement>(null);

  const calcPos = (ref: React.RefObject<HTMLButtonElement | null>, width: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return { top: 60, left: 8 };
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    return { top: rect.bottom + 6, left: Math.max(8, left) };
  };

  const openFilter = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (showFilters) { setShowFilters(false); return; }
    setPopupPos(calcPos(filterBtnRef, 288));
    setShowFilters(true); setShowAnim(false); setShowShadow(false);
  };
  const openAnim = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (showAnim) { setShowAnim(false); return; }
    setPopupPos(calcPos(animBtnRef, 228));
    setShowAnim(true); setShowFilters(false); setShowShadow(false);
  };
  const openShadow = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (showShadow) { setShowShadow(false); return; }
    setPopupPos(calcPos(shadowBtnRef, 278));
    setShowShadow(true); setShowFilters(false); setShowAnim(false);
  };

  // Close on outside click — must also check popup div refs, not just the toggle buttons.
  // React 17+ attaches events to root container, so e.stopPropagation() inside a React
  // handler does NOT block native document listeners. Checking containment fixes this.
  useEffect(() => {
    if (!showFilters && !showAnim && !showShadow) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideFilter = filterBtnRef.current?.contains(t) || filterPopupRef.current?.contains(t);
      const insideAnim   = animBtnRef.current?.contains(t)   || animPopupRef.current?.contains(t);
      const insideShadow = shadowBtnRef.current?.contains(t) || shadowPopupRef.current?.contains(t);
      if (!insideFilter && !insideAnim && !insideShadow) {
        setShowFilters(false); setShowAnim(false); setShowShadow(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters, showAnim, showShadow]);

  return (
    <div className="bg-white border-b border-slate-200 flex-shrink-0 overflow-x-auto"
      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>

      {/* ROW 1: Text formatting */}
      {(el.type === 'text' || el.type === 'button') && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 flex-wrap">
          <select value={el.fontFamily || 'inherit'} onChange={e => onChange({ ...el, fontFamily: e.target.value })}
            className="text-xs border-0 outline-none bg-transparent text-slate-700 max-w-[76px] cursor-pointer">
            {FONTS.map(f => <option key={f.value} value={f.value} className="bg-white text-slate-800">{f.label}</option>)}
          </select>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <input type="number" value={el.fontSize || 24} min={8} max={120}
            onChange={e => onChange({ ...el, fontSize: Number(e.target.value) })}
            className="w-11 text-xs text-center bg-slate-50 text-slate-800 border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-indigo-400" />
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          {[{ icon: <Bold className="w-3.5 h-3.5" />, k: 'bold' as const }, { icon: <Italic className="w-3.5 h-3.5" />, k: 'italic' as const }, { icon: <Underline className="w-3.5 h-3.5" />, k: 'underline' as const }].map(({ icon, k }) => (
            <button key={k} onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, [k]: !el[k] }); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${el[k] ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-500'}`}>{icon}</button>
          ))}
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          {[{ icon: <AlignLeft className="w-3.5 h-3.5" />, v: 'left' as const }, { icon: <AlignCenter className="w-3.5 h-3.5" />, v: 'center' as const }, { icon: <AlignRight className="w-3.5 h-3.5" />, v: 'right' as const }].map(({ icon, v }) => (
            <button key={v} onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, align: v }); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${(el.align || 'center') === v ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-500'}`}>{icon}</button>
          ))}
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <input type="color" value={el.color || '#ffffff'} onChange={e => onChange({ ...el, color: e.target.value })}
            className="w-6 h-6 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-transparent" title="Text color" />
          <input type="range" min={0} max={1} step={0.05} value={el.colorAlpha ?? 1}
            onChange={e => onChange({ ...el, colorAlpha: Number(e.target.value) })}
            className="w-12 accent-indigo-500" />
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          {/* Letter spacing */}
          <div className="flex items-center gap-1" title="Letter Spacing">
            <span className="text-[10px] text-slate-400">LS</span>
            <input type="range" min={-5} max={20} step={0.5} value={el.letterSpacing ?? 0}
              onChange={e => onChange({ ...el, letterSpacing: Number(e.target.value) })}
              className="w-14 accent-indigo-500" />
            <span className="text-[9px] text-slate-500 w-5">{el.letterSpacing ?? 0}</span>
          </div>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          {/* Text Transform */}
          {(['none','uppercase','lowercase','capitalize'] as const).map(t => (
            <button key={t} onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, textTransform: t }); }}
              className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium transition ${(el.textTransform || 'none') === t ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-400'}`}>
              {t === 'none' ? 'Aa' : t === 'uppercase' ? 'AA' : t === 'lowercase' ? 'aa' : 'Abc'}
            </button>
          ))}
        </div>
      )}

      {/* ROW 1b: Sticker size */}
      {el.type === 'sticker' && (
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-100">
          <span className="text-xl leading-none flex-shrink-0">{el.content}</span>
          <span className="text-[10px] text-slate-500 flex-shrink-0">Size</span>
          <input type="range" min={20} max={200} step={4} value={el.fontSize || 64}
            onMouseDown={ev => ev.stopPropagation()}
            onChange={e => onChange({ ...el, fontSize: Number(e.target.value) })}
            className="flex-1 accent-indigo-500" />
          <span className="text-[10px] text-slate-400 w-7 text-right">{el.fontSize || 64}px</span>
        </div>
      )}

      {/* ROW 2: BG, border, radius, href, stroke */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 flex-wrap border-b border-slate-100">
        {el.type === 'button' && (
          <div className="flex items-center gap-1">
            <Square className="w-3 h-3 text-slate-400" />
            <input type="color" value={el.bgColor || '#fff'} onChange={e => onChange({ ...el, bgColor: e.target.value })}
              className="w-6 h-6 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-transparent" />
            <input type="range" min={0} max={1} step={0.05} value={el.bgAlpha ?? 1}
              onChange={e => onChange({ ...el, bgAlpha: Number(e.target.value) })} className="w-12 accent-indigo-500" />
          </div>
        )}
        {el.type === 'shape' && (
          <div className="flex items-center gap-1">
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
              <button onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, filled: true }); }}
                className={`px-2 py-0.5 text-[10px] transition ${el.filled !== false ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Filled</button>
              <button onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, filled: false }); }}
                className={`px-2 py-0.5 text-[10px] transition ${el.filled === false ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Outline</button>
            </div>
            {el.filled !== false && (
              <>
                <input type="color" value={el.bgColor || '#6366f1'} onChange={e => onChange({ ...el, bgColor: e.target.value })}
                  className="w-6 h-6 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-transparent" />
                <input type="range" min={0} max={1} step={0.05} value={el.bgAlpha ?? 1}
                  onChange={e => onChange({ ...el, bgAlpha: Number(e.target.value) })} className="w-14 accent-indigo-500" />
              </>
            )}
          </div>
        )}
        {/* Border */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400">B</span>
          <input type="number" value={el.borderWidth || 0} min={0} max={20}
            onChange={e => onChange({ ...el, borderWidth: Number(e.target.value) })}
            className="w-8 text-xs text-center bg-slate-50 text-slate-800 border border-slate-200 rounded px-1 py-0.5 outline-none" />
          <input type="color" value={el.borderColor || '#ffffff'} onChange={e => onChange({ ...el, borderColor: e.target.value })}
            className="w-6 h-6 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-transparent" />
        </div>
        {/* Radius */}
        {(!el.shapeType || el.shapeType === 'rect') && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">R</span>
            <input type="range" min={0} max={el.type === 'button' ? 100 : 120}
              value={el.borderRadius ?? (el.type === 'button' ? 50 : 0)}
              onChange={e => onChange({ ...el, borderRadius: Number(e.target.value) })}
              className="w-16 accent-indigo-500" />
            <span className="text-[10px] text-slate-500">{el.borderRadius ?? (el.type === 'button' ? 50 : 0)}</span>
          </div>
        )}
        {/* Text stroke */}
        {(el.type === 'text' || el.type === 'button') && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Stk</span>
            <input type="number" value={el.textStrokeWidth || 0} min={0} max={10}
              onChange={e => onChange({ ...el, textStrokeWidth: Number(e.target.value) })}
              className="w-8 text-xs text-center bg-slate-50 text-slate-800 border border-slate-200 rounded px-1 py-0.5 outline-none" />
            <input type="color" value={el.textStrokeColor || '#000000'} onChange={e => onChange({ ...el, textStrokeColor: e.target.value })}
              className="w-6 h-6 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-transparent" />
          </div>
        )}
        {/* Image tint overlay */}
        {el.type === 'image' && el.src && (
          <div className="flex items-center gap-1.5 w-full border-t border-slate-100 pt-1.5 mt-0.5">
            <span className="text-[10px] text-slate-400 flex-shrink-0">Tint</span>
            <input type="color" value={el.tintColor || '#0044ff'}
              onChange={e => onChange({ ...el, tintColor: e.target.value, tintOpacity: el.tintOpacity ?? 0.3 })}
              className="w-6 h-6 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-transparent flex-shrink-0" title="Tint color" />
            <input type="range" min={0} max={1} step={0.05} value={el.tintOpacity ?? 0}
              onMouseDown={ev => ev.stopPropagation()}
              onChange={e => onChange({ ...el, tintOpacity: Number(e.target.value) })}
              className="flex-1 accent-indigo-500" />
            <span className="text-[9px] text-slate-500 w-7 flex-shrink-0">{Math.round((el.tintOpacity ?? 0) * 100)}%</span>
            {(el.tintOpacity ?? 0) > 0 && (
              <button onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, tintOpacity: 0 }); }}
                className="text-[10px] text-red-500 hover:text-red-700 px-1.5 py-0.5 bg-red-50 hover:bg-red-100 rounded-lg flex-shrink-0 transition">Clear</button>
            )}
          </div>
        )}
        {/* Shape image fill */}
        {el.type === 'shape' && onShapeImageFill && (
          <button onMouseDown={ev => { ev.preventDefault(); onShapeImageFill(); }}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-medium transition border border-indigo-100">
            <ImageIcon className="w-3 h-3" /> {el.bgImage ? 'Change Fill' : 'Fill Image'}
          </button>
        )}
        {el.type === 'shape' && el.bgImage && (
          <button onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, bgImage: undefined }); }}
            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-[10px] transition border border-red-100">
            ✕ Fill
          </button>
        )}
        {/* Button href */}
        {el.type === 'button' && (
          <div className="flex items-center gap-1 flex-1 min-w-[120px]">
            <Link className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input type="url" value={el.href || ''} placeholder="https://..."
              onChange={e => onChange({ ...el, href: e.target.value })}
              className="flex-1 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2 py-0.5 outline-none focus:border-indigo-400 placeholder-slate-300" />
          </div>
        )}
      </div>

      {/* ROW ALIGNMENT: Canvas alignment tools */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 flex-wrap">
        <span className="text-[10px] text-slate-400 mr-1">Align</span>
        {([
          { icon: <AlignHorizontalJustifyStart className="w-3.5 h-3.5" />, title: 'Align Left', fn: () => onChange({ ...el, x: 0 }) },
          { icon: <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />, title: 'Center Horizontal', fn: () => onChange({ ...el, x: Math.round((CANVAS_W - el.w) / 2) }) },
          { icon: <AlignHorizontalJustifyEnd className="w-3.5 h-3.5" />, title: 'Align Right', fn: () => onChange({ ...el, x: Math.round(CANVAS_W - el.w) }) },
          { icon: <AlignVerticalJustifyStart className="w-3.5 h-3.5" />, title: 'Align Top', fn: () => onChange({ ...el, y: 0 }) },
          { icon: <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />, title: 'Center Vertical', fn: () => onChange({ ...el, y: Math.round((CANVAS_H - el.h) / 2) }) },
          { icon: <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />, title: 'Align Bottom', fn: () => onChange({ ...el, y: Math.round(CANVAS_H - el.h) }) },
        ] as { icon: React.ReactNode; title: string; fn: () => void }[]).map(({ icon, title, fn }) => (
          <button key={title} onMouseDown={ev => { ev.preventDefault(); fn(); }} title={title}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition">{icon}</button>
        ))}
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        {(['x','y','w','h'] as const).map(k => (
          <div key={k} className="flex flex-col items-center">
            <span className="text-[8px] text-slate-400 leading-none">{k.toUpperCase()}</span>
            <input type="number" value={Math.round((el as any)[k])}
              onChange={ev => onChange({ ...el, [k]: Number(ev.target.value) })}
              className="w-10 text-[10px] text-center bg-slate-50 text-slate-800 border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-indigo-400" />
          </div>
        ))}
      </div>

      {/* ROW 3: Filters + Animation + Shadow + Rotation */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Filter toggle */}
        <div className="relative">
          <button ref={filterBtnRef} onMouseDown={openFilter}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition ${showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            🎨 Filter
          </button>
          {showFilters && popupPos && (
            <div ref={filterPopupRef} className="fixed bg-white border border-slate-200 rounded-xl p-2 shadow-2xl shadow-slate-300/60 z-[9999]" style={{ width: 288, top: popupPos.top, left: popupPos.left }} onMouseDown={e => e.stopPropagation()}>
              <div className="grid grid-cols-4 gap-1 mb-2">
                {FILTER_PRESETS.map(fp => (
                  <button key={fp.name} onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, filterCss: fp.css, filterIntensity: el.filterIntensity ?? 100 }); }}
                    className={`px-1.5 py-1 rounded-lg text-[10px] font-medium transition ${(el.filterCss || '') === fp.css ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    {fp.name}
                  </button>
                ))}
              </div>
              {el.filterCss && (
                <div className="border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 font-medium">Intensity</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">{el.filterIntensity ?? 100}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={1}
                    value={el.filterIntensity ?? 100}
                    onMouseDown={ev => ev.stopPropagation()}
                    onPointerDown={ev => ev.stopPropagation()}
                    onChange={ev => onChange({ ...el, filterIntensity: Number(ev.target.value) })}
                    className="w-full accent-indigo-500" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Animation toggle */}
        <div className="relative">
          <button ref={animBtnRef} onMouseDown={openAnim}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition ${showAnim ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Sparkles className="w-3 h-3" /> {el.animation || 'Animate'}
          </button>
          {showAnim && popupPos && (
            <div ref={animPopupRef} className="fixed bg-white border border-slate-200 rounded-xl p-2 shadow-2xl shadow-slate-300/60 z-[9999]" style={{ width: 228, top: popupPos.top, left: popupPos.left }} onMouseDown={e => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {ANIMATIONS.map(a => (
                  <button key={a.value} onMouseDown={ev => { ev.preventDefault(); onSnapshot?.(); onChange({ ...el, animation: a.value }); setShowAnim(false); }}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition ${(el.animation || '') === a.value ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    {a.name}
                  </button>
                ))}
              </div>
              {el.animation && (
                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-400">Speed</span>
                      <span className="text-[10px] text-slate-600 font-medium">{(el.animationDuration ?? 0.6).toFixed(1)}s</span>
                    </div>
                    <input type="range" min={0.1} max={3} step={0.1} value={el.animationDuration ?? 0.6}
                      onMouseDown={ev => ev.stopPropagation()}
                      onPointerDown={ev => ev.stopPropagation()}
                      onChange={ev => onChange({ ...el, animationDuration: Number(ev.target.value) })}
                      className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Easing</span>
                    <div className="grid grid-cols-3 gap-1">
                      {EASINGS.map(ez => (
                        <button key={ez.value} onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, animationEasing: ez.value }); }}
                          className={`px-1 py-1 rounded-lg text-[9px] font-medium transition ${(el.animationEasing || 'ease') === ez.value ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
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
          <button ref={shadowBtnRef} onMouseDown={openShadow}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition ${showShadow || el.shadowBlur !== undefined || el.shadowX !== undefined || el.shadowY !== undefined ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            🌑 Shadow
          </button>
          {showShadow && popupPos && (
            <div ref={shadowPopupRef} className="fixed bg-white border border-slate-200 rounded-xl p-3 shadow-2xl shadow-slate-300/60 z-[9999]" style={{ width: 278, top: popupPos.top, left: popupPos.left }} onMouseDown={e => e.stopPropagation()}>
              <div className="grid grid-cols-4 gap-1 mb-3">
                {[
                  { label: '↑ Top', x: 0, y: -8 },
                  { label: '↓ Bot', x: 0, y: 8 },
                  { label: '← Left', x: -8, y: 0 },
                  { label: '→ Right', x: 8, y: 0 },
                ].map(p => (
                  <button key={p.label} onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, shadowX: p.x, shadowY: p.y, shadowBlur: el.shadowBlur ?? 8, shadowColor: el.shadowColor || '#000000' }); }}
                    className="px-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] transition border border-slate-200">{p.label}</button>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'X', key: 'shadowX' as const, min: -50, max: 50, step: 1, val: el.shadowX ?? 0 },
                  { label: 'Y', key: 'shadowY' as const, min: -50, max: 50, step: 1, val: el.shadowY ?? 0 },
                  { label: 'Blur', key: 'shadowBlur' as const, min: 0, max: 50, step: 1, val: el.shadowBlur ?? 0 },
                  { label: 'Opacity', key: 'shadowAlpha' as const, min: 0, max: 1, step: 0.05, val: el.shadowAlpha ?? 0.6 },
                ].map(({ label, key, min, max, step, val }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-10">{label}</span>
                    <input type="range" min={min} max={max} step={step} value={val}
                      onMouseDown={ev => ev.stopPropagation()}
                      onPointerDown={ev => ev.stopPropagation()}
                      onChange={e => onChange({ ...el, [key]: Number(e.target.value) })}
                      className="flex-1 accent-indigo-500" />
                    <span className="text-[10px] text-slate-500 w-8 text-right">
                      {key === 'shadowAlpha' ? Math.round((val as number) * 100) + '%' : val}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-7">Col</span>
                  <input type="color" value={el.shadowColor || '#000000'}
                    onMouseDown={ev => ev.stopPropagation()}
                    onChange={e => onChange({ ...el, shadowColor: e.target.value })}
                    className="w-8 h-7 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-transparent" />
                  <button onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, shadowX: undefined, shadowY: undefined, shadowBlur: undefined, shadowColor: undefined, shadowAlpha: undefined }); setShowShadow(false); }}
                    className="ml-auto text-[10px] text-red-500 hover:text-red-700 px-2 py-0.5 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition">Clear</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rotation display */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] text-slate-400">↺</span>
          <input type="number" value={Math.round(el.rot)} onChange={e => onChange({ ...el, rot: Number(e.target.value) })}
            className="w-12 text-xs text-center bg-slate-50 text-slate-800 border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-indigo-400" />
          <span className="text-[10px] text-slate-400">°</span>
          <button onMouseDown={ev => { ev.preventDefault(); onChange({ ...el, rot: 0 }); }}
            className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">Reset</button>
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
    coverImageSquare: initialData?.coverImageSquare || '', coverImageLandscape: initialData?.coverImageLandscape || '',
    expiresAt: initialData?.expiresAt || '',
    targetServices: initialData?.targetServices || [], targetLocations: initialData?.targetLocations || [],
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('insert');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['text', 'lines', 'basic', 'stickers']));
  const toggleSection = (k: string) => setOpenSections(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panImageId, setPanImageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [autoSaveMsg, setAutoSaveMsg] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stores draft ID created during create-mode auto-save (so subsequent saves use PUT)
  const draftIdRef = useRef<string | null>(null);
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
  const [servicesList, setServicesList] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [locationsList, setLocationsList] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fitScaleRef = useRef(1);
  const isManualZoomRef = useRef(false);
  const scaleRef = useRef(1);
  const multiDragOriginsRef = useRef<{ [id: string]: { x: number; y: number } }>({});
  const imgInputRef = useRef<HTMLInputElement>(null);
  const bgImgInputRef = useRef<HTMLInputElement>(null);
  const shapeImgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverSquareInputRef = useRef<HTMLInputElement>(null);
  const coverLandscapeInputRef = useRef<HTMLInputElement>(null);

  // ─── History / Undo-Redo ─────────────────────────────────────────────────────
  const slidesRef = useRef(slides);
  useEffect(() => { slidesRef.current = slides; }, [slides]);
  const pastRef = useRef<SD[][]>([]);
  const futureRef = useRef<SD[][]>([]);
  const clipboardRef = useRef<CE[] | null>(null);

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
    setSelectedIds([]);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.shift()!;
    pastRef.current.push(JSON.parse(JSON.stringify(slidesRef.current)));
    setSlides(JSON.parse(JSON.stringify(next)));
    setSelectedIds([]);
  }, []);

  const activeSlide = slides[activeIdx] || slides[0];
  const selectedId = selectedIds[selectedIds.length - 1] ?? null;
  const selectedEl = activeSlide?.elements.find(e => e.id === selectedId) || null;

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const newFit = Math.max(0.25, Math.min((clientWidth - 48) / CANVAS_W, (clientHeight - 160) / CANVAS_H, 1.4));
      fitScaleRef.current = newFit;
      if (!isManualZoomRef.current) setScale(newFit);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Keep scaleRef in sync with scale state
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Ctrl+Scroll zoom — zooms toward mouse cursor (Canva-style)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      isManualZoomRef.current = true;

      const oldScale = scaleRef.current;
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newScale = Math.round(Math.max(0.1, Math.min(3, oldScale + delta)) * 100) / 100;

      // Capture mouse position relative to canvas before zoom
      const canvasEl = canvasRef.current;
      if (!canvasEl) { scaleRef.current = newScale; setScale(newScale); return; }
      const canvasRect = canvasEl.getBoundingClientRect();
      const mouseInCanvasX = (e.clientX - canvasRect.left) / oldScale;
      const mouseInCanvasY = (e.clientY - canvasRect.top) / oldScale;
      const mouseClientX = e.clientX;
      const mouseClientY = e.clientY;

      scaleRef.current = newScale;
      setScale(newScale);

      // After React re-renders, scroll so the canvas point stays under cursor
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!containerRef.current || !canvasRef.current) return;
        const newCanvasRect = canvasRef.current.getBoundingClientRect();
        const actualX = newCanvasRect.left + mouseInCanvasX * newScale;
        const actualY = newCanvasRect.top + mouseInCanvasY * newScale;
        containerRef.current.scrollLeft += actualX - mouseClientX;
        containerRef.current.scrollTop += actualY - mouseClientY;
      }));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Load services + locations for targeting (when document tab opens)
  useEffect(() => {
    if (tab === 'document' && servicesList.length === 0) {
      fetch('/api/services?parentsOnly=true').then(r => r.json()).then(d => setServicesList(d?.services || [])).catch(() => {});
      fetch('/api/locations?type=CITY').then(r => r.json()).then(d => setLocationsList(d?.locations || [])).catch(() => {});
    }
  }, [tab]);

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

  const addElement = (el: CE) => { snapshot(); updateSlide(s => ({ ...s, elements: [...s.elements, el] })); setSelectedIds([el.id]); };
  const deleteElement = (id: string) => { snapshot(); updateSlide(s => ({ ...s, elements: s.elements.filter(e => e.id !== id) })); setSelectedIds([]); };
  const deleteElements = useCallback((ids: string[]) => { snapshot(); updateSlide(s => ({ ...s, elements: s.elements.filter(e => !ids.includes(e.id)) })); setSelectedIds([]); }, [snapshot, updateSlide]);
  const clearAll = () => { snapshot(); updateSlide(s => ({ ...s, elements: [] })); setSelectedIds([]); };

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
    setActiveIdx(idx + 1); setSelectedIds([]);
  };

  // ─── Multi-select & Group helpers ────────────────────────────────────────────
  const selectOne = useCallback((id: string) => setSelectedIds([id]), []);
  const toggleSelect = useCallback((id: string) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  ), []);

  const handleMultiDragStart = useCallback(() => {
    const map: { [id: string]: { x: number; y: number } } = {};
    for (const id of selectedIds) {
      const el = activeSlide.elements.find(e => e.id === id);
      if (el) map[id] = { x: el.x, y: el.y };
    }
    multiDragOriginsRef.current = map;
  }, [selectedIds, activeSlide.elements]);

  const handleMultiMove = useCallback((dx: number, dy: number) => {
    const origins = multiDragOriginsRef.current;
    updateSlide(s => ({
      ...s,
      elements: s.elements.map(e => {
        const orig = origins[e.id];
        if (!orig) return e;
        return { ...e, x: Math.round(orig.x + dx), y: Math.round(orig.y + dy) };
      }),
    }));
  }, [updateSlide]);

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    snapshot();
    const gid = uid();
    updateSlide(s => ({
      ...s,
      elements: s.elements.map(e => selectedIds.includes(e.id) ? { ...e, groupId: gid } : e),
    }));
  }, [selectedIds, snapshot, updateSlide]);

  const ungroupSelected = useCallback(() => {
    const gid = selectedEl?.groupId;
    if (!gid) return;
    snapshot();
    updateSlide(s => ({
      ...s,
      elements: s.elements.map(e => e.groupId === gid ? { ...e, groupId: undefined } : e),
    }));
  }, [selectedEl, snapshot, updateSlide]);

  const selectGroup = useCallback((groupId: string) => {
    const gIds = activeSlide.elements.filter(e => e.groupId === groupId).map(e => e.id);
    setSelectedIds(gIds);
  }, [activeSlide.elements]);

  const applyTemplate = useCallback((tpl: typeof TEMPLATES[0]) => {
    snapshot();
    const els: CE[] = tpl.elements.map((e, i) => ({
      rot: 0, z: i + 1, opacity: 1,
      ...e,
      id: uid(),
    } as CE));
    updateSlide(s => ({ ...s, ...tpl.bg, elements: els }));
    setSelectedIds([]);
  }, [snapshot, updateSlide]);

  // When an image element is dragged, highlight shape under it and merge on drop
  const handleElementDrag = useCallback((draggedEl: CE) => {
    if (draggedEl.type !== 'image' || !draggedEl.src) { setDropTargetId(null); return; }
    const cx = draggedEl.x + draggedEl.w / 2;
    const cy = draggedEl.y + draggedEl.h / 2;
    const over = activeSlide.elements.find(e =>
      e.type === 'shape' && e.isFrame && e.id !== draggedEl.id &&
      cx >= e.x && cx <= e.x + e.w && cy >= e.y && cy <= e.y + e.h
    );
    setDropTargetId(over?.id || null);
  }, [activeSlide.elements]);

  const handleDragEnd = useCallback((draggedEl: CE) => {
    if (draggedEl.type !== 'image' || !draggedEl.src) { setDropTargetId(null); return; }
    const cx = draggedEl.x + draggedEl.w / 2;
    const cy = draggedEl.y + draggedEl.h / 2;
    const targetShape = activeSlide.elements.find(e =>
      e.type === 'shape' && e.isFrame && e.id !== draggedEl.id &&
      cx >= e.x && cx <= e.x + e.w && cy >= e.y && cy <= e.y + e.h
    );
    setDropTargetId(null);
    if (!targetShape) return;
    // Merge: fill frame with image, delete image element
    updateSlide(s => ({
      ...s,
      elements: s.elements
        .filter(e => e.id !== draggedEl.id)
        .map(e => e.id === targetShape.id ? { ...e, bgImage: draggedEl.src, filled: true } : e),
    }));
    setSelectedIds([targetShape.id]);
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
  const addFrame = (shapeType: ShapeType) => addElement({ id: uid(), type: 'shape', x: cx - 30, y: cy - 30, w: 200, h: 200, rot: 0, z: maxZ, opacity: 1, bgColor: '#6366f1', bgAlpha: 0.07, shapeType, filled: true, isFrame: true, borderRadius: shapeType === 'rect' ? 8 : 0, borderColor: '#6366f1', borderWidth: 0 });
  const addButton = () => addElement({ id: uid(), type: 'button', x: cx - 30, y: CANVAS_H - 120, w: 260, h: 52, rot: 0, z: maxZ, opacity: 1, content: 'Tap Here', fontSize: 16, bold: true, color: '#1a1a2e', colorAlpha: 1, bgColor: '#ffffff', bgAlpha: 1, borderRadius: 50, href: '' });
  const addLine = (thick: number) => addElement({ id: uid(), type: 'shape', shapeType: 'rect', x: cx - 60, y: cy + 60, w: 260, h: thick, rot: 0, z: maxZ, opacity: 1, bgColor: '#ffffff', bgAlpha: 1, filled: true, borderRadius: 99 });
  const addSticker = (emoji: string) => addElement({ id: uid(), type: 'sticker', x: cx + 20, y: cy, w: 100, h: 100, rot: 0, z: maxZ, opacity: 1, content: emoji, fontSize: 64 });
  const MAGIC_TEXT_PRESETS = [
    { label: 'Neon', el: { color: '#00f5ff', colorAlpha: 1, bold: true, fontSize: 36, shadowX: 0, shadowY: 0, shadowBlur: 12, shadowColor: '#00f5ff', shadowAlpha: 0.9 } },
    { label: 'Gold', el: { color: '#ffd700', colorAlpha: 1, bold: true, fontSize: 36, shadowX: 2, shadowY: 2, shadowBlur: 6, shadowColor: '#8B6914', shadowAlpha: 0.7 } },
    { label: 'Outline', el: { color: '#ffffff', colorAlpha: 0, bold: true, fontSize: 36, textStrokeColor: '#ffffff', textStrokeWidth: 2 } },
    { label: 'Fire', el: { color: '#ff4500', colorAlpha: 1, bold: true, fontSize: 36, shadowX: 0, shadowY: 3, shadowBlur: 10, shadowColor: '#ff8c00', shadowAlpha: 0.8 } },
    { label: 'Ice', el: { color: '#a8d8ea', colorAlpha: 1, bold: true, fontSize: 36, shadowX: 0, shadowY: 2, shadowBlur: 8, shadowColor: '#00bfff', shadowAlpha: 0.6 } },
    { label: 'Shadow', el: { color: '#ffffff', colorAlpha: 1, bold: true, fontSize: 36, shadowX: 3, shadowY: 3, shadowBlur: 0, shadowColor: '#000000', shadowAlpha: 1 } },
  ];
  const addMagicText = (preset: typeof MAGIC_TEXT_PRESETS[0]) => addElement({ id: uid(), type: 'text', x: 20, y: cy, w: CANVAS_W - 40, h: 70, rot: 0, z: maxZ, opacity: 1, content: preset.label + ' Text', fontFamily: 'inherit', align: 'center', lineHeight: 1.2, ...preset.el } as CE);

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
  // These were one control that wrote the same URL into both coverImage and
  // coverImageSquare. amp-story wants poster-portrait-src at 3:4 and
  // poster-square-src at 1:1, so a single file cannot satisfy both — and the
  // copy is why the live Ganesh Chaturthi story serves a 1054x1492 image as
  // its "square" poster. Each ratio now has its own upload.
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadFile(file, url => setMeta(m => ({ ...m, coverImage: url }))); e.target.value = '';
  };
  const handleCoverSquareUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadFile(file, url => setMeta(m => ({ ...m, coverImageSquare: url }))); e.target.value = '';
  };
  const handleCoverLandscapeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    uploadFile(file, url => setMeta(m => ({ ...m, coverImageLandscape: url }))); e.target.value = '';
  };

  const buildPayload = () => ({
    title: meta.title.trim(), slug: meta.slug.trim() || slugify(meta.title),
    description: meta.description.trim() || null, metaDescription: meta.metaDescription.trim() || null,
    coverImage: meta.coverImage || null, coverImageSquare: meta.coverImageSquare || null,
    coverImageLandscape: meta.coverImageLandscape || null,
    publisherName: meta.publisherName.trim() || null, publisherLogo: meta.publisherLogo || null,
    category: meta.category.trim() || null, expiresAt: meta.expiresAt || null,
    targetServices: meta.targetServices, targetLocations: meta.targetLocations,
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

  const handleSave = async (silent = false) => {
    if (!meta.title.trim()) { if (!silent) setMsg({ type: 'err', text: 'Title is required' }); return; }
    setSaving(true); if (!silent) setMsg(null);
    try {
      const payload = buildPayload();
      // Determine effective ID: edit mode uses initialData.id, create mode uses draftIdRef (if already auto-saved once)
      const effectiveId = mode === 'edit' ? initialData?.id : draftIdRef.current;
      const res = effectiveId
        ? await fetch(`/api/admin/web-stories/${effectiveId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/web-stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      if (silent) {
        // Store draft ID on first auto-save in create mode so future saves use PUT
        if (mode === 'create' && !draftIdRef.current) draftIdRef.current = data.story.id;
        const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setAutoSaveMsg(`Auto-saved ${t}`);
        setTimeout(() => setAutoSaveMsg(null), 3000);
      } else {
        setMsg({ type: 'ok', text: 'Saved!' });
        // Manual save in create mode: redirect to edit page (use draftIdRef if already created)
        if (mode === 'create') router.push(`/admin/web-stories/${draftIdRef.current || data.story.id}`);
      }
    } catch (e: any) { if (!silent) setMsg({ type: 'err', text: e.message }); }
    finally { setSaving(false); }
  };

  // Auto-save ref so timer always calls latest handleSave
  const handleSaveRef = useRef(handleSave);
  useEffect(() => { handleSaveRef.current = handleSave; });

  // Auto-save every 30s after last change (both create & edit mode)
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => { handleSaveRef.current(true); }, 30000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [slides, meta]);

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

      // Normalize key — Shift changes letter case, so always compare lowercase
      const k = e.key.toLowerCase();

      // Undo / Redo
      if (k === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((k === 'y' && (e.ctrlKey || e.metaKey)) || (k === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); return; }

      // Group / Ungroup
      if (k === 'g' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); groupSelected(); return; }
      if (k === 'g' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); ungroupSelected(); return; }

      // Select All
      if (k === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedIds(activeSlide.elements.map(el => el.id));
        return;
      }

      // Copy — copies all selected elements (supports group & multi-select)
      if (k === 'c' && (e.ctrlKey || e.metaKey) && selectedIds.length > 0) {
        const els = activeSlide.elements.filter(el => selectedIds.includes(el.id));
        if (els.length > 0) { clipboardRef.current = els; e.preventDefault(); }
        return;
      }
      // Paste — pastes all copied elements with new IDs, preserving group relationship
      if (k === 'v' && (e.ctrlKey || e.metaKey) && clipboardRef.current) {
        e.preventDefault();
        const srcs = clipboardRef.current;
        const newMaxZ = activeSlide.elements.length ? Math.max(...activeSlide.elements.map(el => el.z)) + 1 : 1;
        // If all copied elements share the same groupId, assign a new groupId to the paste
        const sharedGroup = srcs.length > 1 && srcs[0].groupId && srcs.every(e => e.groupId === srcs[0].groupId);
        const newGroupId = sharedGroup ? uid() : undefined;
        const newEls: CE[] = srcs.map((src, i) => ({
          ...src,
          id: uid(),
          x: Math.min(src.x + 20, CANVAS_W - src.w),
          y: Math.min(src.y + 20, CANVAS_H - src.h),
          z: newMaxZ + i,
          groupId: newGroupId,
        }));
        snapshot();
        updateSlide(s => ({ ...s, elements: [...s.elements, ...newEls] }));
        setSelectedIds(newEls.map(e => e.id));
        return;
      }

      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (selectedIds.length > 1) deleteElements(selectedIds);
        else if (selectedId) deleteElement(selectedId);
        return;
      }

      // Escape
      if (e.key === 'Escape') { setSelectedIds([]); return; }

      // Duplicate
      if (k === 'd' && (e.ctrlKey || e.metaKey) && selectedId) { e.preventDefault(); duplicateElement(selectedId); return; }

      // Layer order
      if (e.key === ']' && (e.ctrlKey || e.metaKey) && selectedId) { e.preventDefault(); changeLayer(selectedId, 'up'); return; }
      if (e.key === '[' && (e.ctrlKey || e.metaKey) && selectedId) { e.preventDefault(); changeLayer(selectedId, 'down'); return; }

      // Lock/Unlock
      if (k === 'l' && (e.ctrlKey || e.metaKey) && selectedId) {
        e.preventDefault();
        const el = activeSlide.elements.find(el => el.id === selectedId);
        if (el) updateElement({ ...el, locked: !el.locked });
        return;
      }

      // Save
      if (k === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); return; }

      // Arrow key nudge (moves all selected)
      if (selectedIds.length > 0 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        if (selectedIds.length > 1) {
          updateSlide(s => ({
            ...s,
            elements: s.elements.map(el => {
              if (!selectedIds.includes(el.id) || el.locked) return el;
              return { ...el, x: el.x + dx, y: el.y + dy };
            }),
          }));
        } else if (selectedId) {
          const el = activeSlide.elements.find(el => el.id === selectedId);
          if (!el || el.locked) return;
          updateElement({ ...el, x: el.x + dx, y: el.y + dy });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, selectedId, activeSlide, undo, redo, groupSelected, ungroupSelected, deleteElements, updateSlide]);

  const seo = calcSeo(meta, slides);
  const seoColor = seo >= 80 ? 'text-green-400' : seo >= 50 ? 'text-yellow-400' : 'text-red-400';

  // Frame shapes data
  const FRAME_SHAPES: { type: ShapeType; label: string; clip?: string; svg?: string; gear?: boolean; cylinder?: boolean }[] = [
    { type: 'rect', label: 'Square' },
    { type: 'circle', label: 'Circle' },
    { type: 'triangle', label: 'Triangle', clip: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
    { type: 'diamond', label: 'Diamond', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
    { type: 'hexagon', label: 'Hexagon', clip: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)' },
    { type: 'pentagon', label: 'Pentagon', clip: 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)' },
    { type: 'star', label: 'Star', clip: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' },
    { type: 'heart', label: 'Heart', svg: 'M 50 30 C 50 22,42 10,25 10 C 8 10,0 25,0 40 C 0 65,50 90,50 90 C 50 90,100 65,100 40 C 100 25,92 10,75 10 C 58 10,50 22,50 30 Z' },
    { type: 'blobA', label: 'Blob A', svg: 'M 72 14 C 90 26,102 46,96 65 C 90 84,72 95,52 93 C 32 91,8 84,2 66 C -4 48,8 24,24 14 C 40 4,54 2,72 14 Z' },
    { type: 'blobB', label: 'Blob B', svg: 'M 65 8 C 82 14,96 32,97 52 C 98 72,84 92,64 95 C 44 98,20 88,8 70 C -4 52,0 26,16 14 C 32 2,48 2,65 8 Z' },
    { type: 'speechRound', label: 'Bubble', svg: 'M 10 0 Q 0 0 0 10 L 0 62 Q 0 75 10 75 L 40 75 L 50 95 L 60 75 L 90 75 Q 100 75 100 62 L 100 10 Q 100 0 90 0 Z' },
    { type: 'arrowRight', label: 'Arrow', clip: 'polygon(0% 20%,60% 20%,60% 0%,100% 50%,60% 100%,60% 80%,0% 80%)' },
  ];

  // Shape grid data
  type ShapeGroup = { label: string; key: string; color: string; shapes: { type: ShapeType; label: string; clip?: string; svg?: string; gear?: boolean; cylinder?: boolean }[] };
  const SHAPE_GROUPS: ShapeGroup[] = [
    { label: 'Basic', key: 'basic', color: '#818cf8', shapes: [
      { type: 'rect', label: 'Rect' },
      { type: 'circle', label: 'Circle' },
      { type: 'triangle', label: 'Triangle', clip: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
      { type: 'diamond', label: 'Diamond', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
      { type: 'hexagon', label: 'Hexagon', clip: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)' },
      { type: 'pentagon', label: 'Pentagon', clip: 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)' },
      { type: 'octagon', label: 'Octagon', clip: 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)' },
      { type: 'cross', label: 'Cross', clip: 'polygon(35% 0%,65% 0%,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0% 65%,0% 35%,35% 35%)' },
      { type: 'parallelogram', label: 'Parallelogram', clip: 'polygon(20% 0%,100% 0%,80% 100%,0% 100%)' },
    ]},
    { label: 'Arrows', key: 'arrows', color: '#34d399', shapes: [
      { type: 'arrowRight', label: '→ Arrow', clip: 'polygon(0% 20%,60% 20%,60% 0%,100% 50%,60% 100%,60% 80%,0% 80%)' },
      { type: 'arrowLeft', label: '← Arrow', clip: 'polygon(40% 0%,40% 20%,100% 20%,100% 80%,40% 80%,40% 100%,0% 50%)' },
      { type: 'arrowUp', label: '↑ Arrow', clip: 'polygon(50% 0%,100% 40%,80% 40%,80% 100%,20% 100%,20% 40%,0% 40%)' },
      { type: 'arrowDown', label: '↓ Arrow', clip: 'polygon(20% 0%,80% 0%,80% 60%,100% 60%,50% 100%,0% 60%,20% 60%)' },
      { type: 'arrowDoubleH', label: '↔ Double', clip: 'polygon(0% 50%,20% 0%,20% 35%,80% 35%,80% 0%,100% 50%,80% 100%,80% 65%,20% 65%,20% 100%)' },
      { type: 'chevronRight', label: '> Chevron', clip: 'polygon(0% 0%,75% 0%,100% 50%,75% 100%,0% 100%,25% 50%)' },
      { type: 'chevronLeft', label: '< Chevron', clip: 'polygon(25% 0%,100% 0%,75% 50%,100% 100%,25% 100%,0% 50%)' },
    ]},
    { label: 'Stars', key: 'stars', color: '#fbbf24', shapes: [
      { type: 'star4', label: '4-Point', clip: 'polygon(50% 0%,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0% 50%,40% 40%)' },
      { type: 'star', label: '5-Point', clip: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' },
      { type: 'star6', label: '6-Point', clip: 'polygon(50% 0%,38% 28%,7% 25%,25% 50%,7% 75%,38% 72%,50% 100%,63% 72%,93% 75%,75% 50%,93% 25%,63% 28%)' },
      { type: 'star8', label: '8-Point', clip: 'polygon(50% 0%,61% 24%,85% 15%,76% 39%,100% 50%,76% 61%,85% 85%,61% 76%,50% 100%,39% 76%,15% 85%,24% 61%,0% 50%,24% 39%,15% 15%,39% 24%)' },
      { type: 'starburst', label: 'Burst', clip: 'polygon(50% 0%,55% 31%,75% 7%,64% 36%,93% 25%,69% 45%,100% 50%,69% 55%,93% 75%,64% 64%,75% 93%,55% 69%,50% 100%,45% 69%,25% 93%,36% 64%,7% 75%,31% 55%,0% 50%,31% 45%,7% 25%,36% 36%,25% 7%,45% 31%)' },
    ]},
    { label: 'Hearts & Bubbles', key: 'hearts', color: '#f472b6', shapes: [
      { type: 'heart', label: 'Heart', svg: 'M 50 30 C 50 22,42 10,25 10 C 8 10,0 25,0 40 C 0 65,50 90,50 90 C 50 90,100 65,100 40 C 100 25,92 10,75 10 C 58 10,50 22,50 30 Z' },
      { type: 'speechLeft', label: 'Bubble L', svg: 'M 15 0 Q 0 0 0 15 L 0 65 Q 0 80 15 80 L 20 80 L 8 100 L 38 80 L 85 80 Q 100 80 100 65 L 100 15 Q 100 0 85 0 Z' },
      { type: 'speechRight', label: 'Bubble R', svg: 'M 15 0 Q 0 0 0 15 L 0 65 Q 0 80 15 80 L 62 80 L 92 100 L 80 80 L 85 80 Q 100 80 100 65 L 100 15 Q 100 0 85 0 Z' },
      { type: 'speechRound', label: 'Bubble ↓', svg: 'M 10 0 Q 0 0 0 10 L 0 62 Q 0 75 10 75 L 40 75 L 50 95 L 60 75 L 90 75 Q 100 75 100 62 L 100 10 Q 100 0 90 0 Z' },
    ]},
    { label: 'Banners & Flowchart', key: 'banners', color: '#a78bfa', shapes: [
      { type: 'bannerRibbon', label: 'Banner', svg: 'M 0 20 L 15 35 L 0 50 L 0 85 Q 0 100 15 100 L 85 100 Q 100 100 100 85 L 100 50 L 85 35 L 100 20 Z' },
      { type: 'fcDocument', label: 'Document', svg: 'M 0 0 L 100 0 L 100 75 Q 87 90 75 75 Q 62 60 50 75 Q 37 90 25 75 Q 12 60 0 75 Z' },
      { type: 'fcCylinder', label: 'Cylinder', cylinder: true },
      { type: 'parallelogram', label: 'Data', clip: 'polygon(20% 0%,100% 0%,80% 100%,0% 100%)' },
    ]},
    { label: 'Organic & Special', key: 'organic', color: '#2dd4bf', shapes: [
      { type: 'blobA', label: 'Blob A', svg: 'M 72 14 C 90 26,102 46,96 65 C 90 84,72 95,52 93 C 32 91,8 84,2 66 C -4 48,8 24,24 14 C 40 4,54 2,72 14 Z' },
      { type: 'blobB', label: 'Blob B', svg: 'M 65 8 C 82 14,96 32,97 52 C 98 72,84 92,64 95 C 44 98,20 88,8 70 C -4 52,0 26,16 14 C 32 2,48 2,65 8 Z' },
      { type: 'gear', label: 'Gear', gear: true, svg: 'M 40 0 L 60 0 L 64 16 L 78 8 L 92 22 L 84 36 L 100 44 L 100 56 L 84 64 L 92 78 L 78 92 L 64 84 L 60 100 L 40 100 L 36 84 L 22 92 L 8 78 L 16 64 L 0 56 L 0 44 L 16 36 L 8 22 L 22 8 L 36 16 Z M 35 50 A 15 15 0 1 0 65 50 A 15 15 0 1 0 35 50 Z' },
    ]},
  ];

  const STICKER_EMOJIS = [
    '❤️','🔥','⭐','✨','💫','🎉','🎊','🎯','💎','🚀',
    '🌟','🌈','🦋','🌸','🌺','🌻','🍀','🎵','🎶','💡',
    '👑','🏆','💪','👍','🙌','✌️','🤩','😍','😎','🥳',
    '💯','🔮','⚡','❄️','🌙','☀️','🌊','🍕','🎂','🎁',
    '🦄','🐱','🐶','🦊','🐺','🦁','🐯','🐻','🐼','🦋',
    '💜','💙','💚','💛','🧡','🖤','🤍','🤎','💝','💖',
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      {/* Google Fonts + canvas animation keyframes */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: CANVAS_ANIM_CSS }} />
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
      <input ref={bgImgInputRef} type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={handleBgUpload} />
      <input ref={shapeImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleShapeImgUpload} />
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={coverSquareInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSquareUpload} />
      <input ref={coverLandscapeInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverLandscapeUpload} />

      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-3 sm:px-5 bg-white border-b border-slate-200 flex-shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button onClick={() => router.push('/admin/web-stories')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition mr-1 flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {(['insert', 'style', 'document'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium capitalize transition ${tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
              {t === 'insert' ? 'Insert' : t === 'style' ? 'Style' : 'Document'}
            </button>
          ))}
        </div>
        <input value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value, slug: m.slug || slugify(e.target.value) }))}
          placeholder="Story title..."
          className="hidden sm:block bg-transparent text-slate-800 text-sm font-semibold text-center outline-none placeholder-slate-400 max-w-[200px] lg:max-w-xs w-full border-b-2 border-transparent focus:border-indigo-400 transition py-1 px-2" />
        <div className="flex items-center gap-1.5">
          {autoSaveMsg && <span className="hidden sm:inline text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-50 text-slate-500 border-slate-200">{autoSaveMsg}</span>}
          {msg && <span className={`hidden sm:inline text-xs font-medium px-2.5 py-1 rounded-full border ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{msg.text}</span>}
          <span className={`text-xs font-bold hidden sm:inline ${seo >= 80 ? 'text-green-600' : seo >= 50 ? 'text-amber-500' : 'text-red-500'}`}>SEO {seo}</span>
          <button onClick={() => setShowGrid(v => !v)} title="Toggle Grid"
            className={`px-2 py-1.5 text-xs rounded-xl transition hidden lg:flex items-center gap-1 ${showGrid ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
            ⊞ Grid
          </button>
          <button onClick={() => window.open(`/admin/web-stories/preview/${initialData?.id || ''}`, '_blank')} disabled={mode === 'create'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs rounded-xl hover:bg-slate-100 border border-slate-200 transition disabled:opacity-30">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          {mode === 'edit' && initialData?.slug && (
            <a
              href={`https://validator.ampproject.org/?url=${encodeURIComponent(`https://transrentals.in/stories/${initialData.slug}/amp`)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Validate AMP boilerplate in Google AMP Validator"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-green-700 hover:text-green-900 text-xs font-bold rounded-xl hover:bg-green-50 border border-green-200 transition"
            >
              AMP ✓
            </a>
          )}
          <button onClick={() => handleSave()} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl transition disabled:opacity-50 shadow-sm">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Save</span>
          </button>
          <button onClick={handlePublish} disabled={publishing || saving}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 shadow-sm">
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col overflow-y-auto flex-shrink-0 shadow-sm">

          {tab === 'insert' && (
            <div className="p-3 space-y-1">

              {/* ── TEXT ── */}
              <InsertSection label="Text" sKey="text" open={openSections} toggle={toggleSection}>
                <div className="space-y-1.5">
                  <button onClick={addHeading} className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-slate-800 text-sm transition">
                    <Type className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div className="text-left"><p className="font-semibold text-sm text-slate-800">Heading</p><p className="text-xs text-slate-400">Large bold text</p></div>
                  </button>
                  <button onClick={addParagraph} className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-slate-800 text-sm transition">
                    <Type className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="text-left"><p className="font-medium text-sm text-slate-800">Paragraph</p><p className="text-xs text-slate-400">Body text</p></div>
                  </button>
                </div>
              </InsertSection>

              {/* ── MAGIC TEXT ── */}
              <InsertSection label="✨ Magic Text" sKey="magictext" open={openSections} toggle={toggleSection}>
                <div className="grid grid-cols-3 gap-1.5">
                  {MAGIC_TEXT_PRESETS.map(p => (
                    <button key={p.label} onClick={() => addMagicText(p)}
                      className="flex flex-col items-center gap-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition">
                      <span className="text-sm font-bold" style={{ color: (p.el as any).color || '#1e293b', WebkitTextStroke: (p.el as any).textStrokeWidth ? `1px ${(p.el as any).textStrokeColor}` : undefined } as React.CSSProperties}>Aa</span>
                      <span className="text-[10px] text-slate-500">{p.label}</span>
                    </button>
                  ))}
                </div>
              </InsertSection>

              {/* ── LINES ── */}
              <InsertSection label="Lines" sKey="lines" open={openSections} toggle={toggleSection}>
                <div className="space-y-1.5">
                  {[{ thick: 2, label: 'Thin' }, { thick: 5, label: 'Medium' }, { thick: 10, label: 'Thick' }].map(l => (
                    <button key={l.label} onClick={() => addLine(l.thick)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition">
                      <div className="w-10 flex items-center justify-center flex-shrink-0">
                        <div style={{ height: l.thick, width: 32, backgroundColor: '#64748b', borderRadius: 99 }} />
                      </div>
                      <span className="text-sm text-slate-700">{l.label} Line</span>
                    </button>
                  ))}
                </div>
              </InsertSection>

              {/* ── FRAMES ── */}
              <InsertSection label="🖼️ Frames" sKey="frames" open={openSections} toggle={toggleSection}>
                <p className="text-[10px] text-slate-400 mb-2">Clip images into shapes. Drag an image onto a frame or use "Set Image".</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {FRAME_SHAPES.map(sh => (
                    <button key={sh.type} onClick={() => addFrame(sh.type as ShapeType)}
                      className="flex flex-col items-center gap-1 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl transition group">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {sh.svg ? (
                          <svg viewBox="0 0 100 100" className="w-7 h-7">
                            <path d={sh.svg} fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="7" strokeDasharray="10 5" fillRule={sh.gear ? 'evenodd' : 'nonzero'} />
                          </svg>
                        ) : sh.cylinder ? (
                          <svg viewBox="0 0 100 100" className="w-7 h-7">
                            <path d="M 0 18 Q 0 5 50 5 Q 100 5 100 18 L 100 82 Q 100 95 50 95 Q 0 95 0 82 Z" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="7" strokeDasharray="10 5" />
                          </svg>
                        ) : sh.clip ? (
                          <div className="w-7 h-7" style={{ clipPath: sh.clip, backgroundColor: 'rgba(99,102,241,0.1)', outline: '2px dashed #6366f1', outlineOffset: '-2px' }} />
                        ) : sh.type === 'circle' ? (
                          <div className="w-7 h-7 rounded-full border-2 border-dashed border-indigo-500" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }} />
                        ) : (
                          <div className="w-7 h-5 rounded border-2 border-dashed border-indigo-500" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }} />
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 group-hover:text-indigo-600 leading-tight text-center px-0.5">{sh.label}</span>
                    </button>
                  ))}
                </div>
              </InsertSection>

              {/* ── SHAPE GROUPS ── */}
              {SHAPE_GROUPS.map(grp => (
                <InsertSection key={grp.key} label={grp.label} sKey={grp.key} open={openSections} toggle={toggleSection}>
                  <div className="grid grid-cols-4 gap-1.5">
                    {grp.shapes.map(sh => (
                      <button key={sh.type} onClick={() => addShape(sh.type as ShapeType)}
                        className="flex flex-col items-center gap-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl transition group">
                        <div className="w-8 h-8 flex items-center justify-center">
                          {sh.cylinder ? (
                            <svg viewBox="0 0 100 100" className="w-7 h-7">
                              <path d="M 0 18 Q 0 5 50 5 Q 100 5 100 18 L 100 82 Q 100 95 50 95 Q 0 95 0 82 Z" fill={grp.color} />
                              <path d="M 0 18 Q 0 31 50 31 Q 100 31 100 18" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4" />
                            </svg>
                          ) : sh.svg ? (
                            <svg viewBox="0 0 100 100" className="w-7 h-7">
                              <path d={sh.svg} fill={grp.color} fillRule={sh.gear ? 'evenodd' : 'nonzero'} />
                            </svg>
                          ) : sh.clip ? (
                            <div className="w-7 h-7" style={{ backgroundColor: grp.color, clipPath: sh.clip }} />
                          ) : sh.type === 'circle' ? (
                            <div className="w-7 h-7 rounded-full" style={{ backgroundColor: grp.color }} />
                          ) : (
                            <div className="w-7 h-5 rounded-sm" style={{ backgroundColor: grp.color }} />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 group-hover:text-slate-800 leading-tight text-center px-0.5">{sh.label}</span>
                      </button>
                    ))}
                  </div>
                </InsertSection>
              ))}

              {/* ── STICKERS ── */}
              <InsertSection label="🎭 Stickers" sKey="stickers" open={openSections} toggle={toggleSection}>
                <div className="grid grid-cols-6 gap-1">
                  {STICKER_EMOJIS.map(e => (
                    <button key={e} onClick={() => addSticker(e)}
                      className="flex items-center justify-center h-9 text-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition hover:scale-110 active:scale-95">
                      {e}
                    </button>
                  ))}
                </div>
              </InsertSection>

              {/* ── MEDIA ── */}
              <InsertSection label="Media" sKey="media" open={openSections} toggle={toggleSection}>
                <div className="space-y-1.5">
                  <button onClick={() => imgInputRef.current?.click()} disabled={uploading}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-200 rounded-xl text-slate-800 text-sm transition disabled:opacity-50">
                    <ImageIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="text-left"><p className="font-medium text-sm text-slate-800">Upload Image</p><p className="text-xs text-slate-400">{uploading ? 'Uploading...' : 'Add from device'}</p></div>
                  </button>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Gallery</p>
                      <button onClick={() => setGalleryLoaded(false)} className="text-[10px] text-indigo-600 hover:text-indigo-800">Refresh</button>
                    </div>
                    {!galleryLoaded ? (
                      <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                    ) : gallery.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">No images uploaded yet</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                        {gallery.map(url => (
                          <button key={url} onClick={() => addElement({ id: uid(), type: 'image', x: cx - 30, y: cy - 60, w: 260, h: 200, rot: 0, z: maxZ, opacity: 1, src: url, borderRadius: 0 })}
                            className="aspect-square overflow-hidden rounded-lg bg-slate-100 hover:ring-2 hover:ring-indigo-400 transition border border-slate-200">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </InsertSection>

              {/* ── BUTTON ── */}
              <InsertSection label="Button" sKey="button" open={openSections} toggle={toggleSection}>
                <button onClick={addButton} className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl text-slate-800 text-sm transition">
                  <MousePointer className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="text-left"><p className="font-medium text-sm text-slate-800">CTA Button</p><p className="text-xs text-slate-400">With link URL</p></div>
                </button>
              </InsertSection>

              {/* ── TEMPLATES ── */}
              <InsertSection label="Templates" sKey="templates" open={openSections} toggle={toggleSection}>
                <p className="text-[10px] text-slate-400 mb-2">Replaces current slide elements</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.name} onClick={() => applyTemplate(tpl)}
                      className="flex flex-col items-center gap-1.5 py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition text-center">
                      <span className="text-lg">{tpl.icon}</span>
                      <span className="text-[10px] text-slate-600 font-medium">{tpl.name}</span>
                    </button>
                  ))}
                </div>
              </InsertSection>

              {/* ── DISTRIBUTE ── */}
              {activeSlide.elements.length >= 3 && (
                <InsertSection label="Distribute" sKey="distribute" open={openSections} toggle={toggleSection}>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={distributeH} className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 transition">⟷ Horizontal</button>
                    <button onClick={distributeV} className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 transition">⟸⟹ Vertical</button>
                  </div>
                </InsertSection>
              )}

              {/* ── COLOR PALETTE ── */}
              <InsertSection label="Color Palette" sKey="palette" open={openSections} toggle={toggleSection}>
                {selectedEl?.color && (
                  <button onClick={() => saveColor(selectedEl.color!)} className="text-[10px] text-indigo-600 hover:text-indigo-800 mb-2 block font-medium">+ Save current color</button>
                )}
                {savedColors.length === 0
                  ? <p className="text-[11px] text-slate-400 text-center py-2">Select element → save its color</p>
                  : (
                    <div className="flex flex-wrap gap-1.5">
                      {savedColors.map(c => (
                        <div key={c} className="relative group">
                          <button onClick={() => selectedEl && updateElement({ ...selectedEl, color: c })}
                            className="w-7 h-7 rounded-lg border border-slate-300 hover:ring-2 hover:ring-indigo-400 transition shadow-sm"
                            style={{ backgroundColor: c }} title={c} />
                          <button onClick={() => removeColor(c)} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] hidden group-hover:flex items-center justify-center shadow-sm">×</button>
                        </div>
                      ))}
                    </div>
                  )}
              </InsertSection>

              {/* ── LAYERS ── */}
              {activeSlide.elements.length > 0 && (
                <InsertSection label={`Layers (${activeSlide.elements.length})`} sKey="layers" open={openSections} toggle={toggleSection}>
                  <div className="flex justify-end mb-1">
                    <button onClick={clearAll} className="text-[10px] text-red-500 hover:text-red-700 font-medium">Clear all</button>
                  </div>
                  <div className="space-y-1">
                    {[...activeSlide.elements].sort((a, b) => b.z - a.z).map(el => (
                      <div key={el.id}
                        onClick={ev => { if (ev.shiftKey) toggleSelect(el.id); else if (el.groupId) selectGroup(el.groupId); else selectOne(el.id); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition ${selectedId === el.id ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : selectedIds.includes(el.id) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}`}>
                        {(el.type === 'text' || el.type === 'button') ? <Type className="w-3 h-3 text-indigo-500" /> : el.type === 'image' ? <ImageIcon className="w-3 h-3 text-green-500" /> : el.type === 'sticker' ? <span className="text-xs">🎭</span> : <Square className="w-3 h-3 text-slate-400" />}
                        <span className="truncate flex-1 font-medium">{el.type === 'sticker' ? el.content : (el.type === 'text' || el.type === 'button') ? (el.content?.slice(0, 16) || el.type) : (el.shapeType || el.type)}</span>
                        {el.groupId && <span className="text-[8px] text-amber-700 bg-amber-100 border border-amber-200 rounded px-0.5 flex-shrink-0">G</span>}
                        {el.animation && <Sparkles className="w-2.5 h-2.5 text-indigo-500" />}
                        <button onClick={e => { e.stopPropagation(); deleteElement(el.id); }} className="hover:text-red-500 text-slate-400">×</button>
                      </div>
                    ))}
                  </div>
                </InsertSection>
              )}

            </div>
          )}

          {tab === 'style' && (
            <div className="p-4 space-y-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Slide Background</p>
              <div className="grid grid-cols-2 gap-2">
                {(['COLOR', 'GRADIENT', 'IMAGE', 'VIDEO'] as const).map(t => (
                  <button key={t} onClick={() => updateSlide(s => ({ ...s, bgType: t }))}
                    className={`py-2 rounded-xl text-xs font-medium transition ${activeSlide.bgType === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>{t}</button>
                ))}
              </div>
              {activeSlide.bgType === 'COLOR' && (
                <div className="flex items-center gap-3">
                  <input type="color" value={activeSlide.bgColor || '#1a1a2e'} onChange={e => updateSlide(s => ({ ...s, bgColor: e.target.value }))} className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-transparent shadow-sm" />
                  <input type="text" value={activeSlide.bgColor || '#1a1a2e'} onChange={e => updateSlide(s => ({ ...s, bgColor: e.target.value }))} className="flex-1 bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none border border-slate-200 focus:border-indigo-400 font-mono" />
                </div>
              )}
              {activeSlide.bgType === 'GRADIENT' && (
                <div className="space-y-2">
                  <input type="text" placeholder="linear-gradient(...)" value={activeSlide.bgGradient || ''} onChange={e => updateSlide(s => ({ ...s, bgGradient: e.target.value }))} className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none border border-slate-200 focus:border-indigo-400" />
                  <div className="grid grid-cols-3 gap-1.5">
                    {['linear-gradient(135deg,#1a1a2e,#0f3460)', 'linear-gradient(180deg,#0f0c29,#302b63,#24243e)', 'linear-gradient(135deg,#f093fb,#f5576c)', 'linear-gradient(135deg,#4facfe,#00f2fe)', 'linear-gradient(135deg,#43e97b,#38f9d7)', 'linear-gradient(180deg,#fa709a,#fee140)', 'linear-gradient(135deg,#a18cd1,#fbc2eb)', 'linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#ffecd2,#fcb69f)'].map(g => (
                      <button key={g} onClick={() => updateSlide(s => ({ ...s, bgGradient: g }))} className="h-10 rounded-lg border border-slate-200 hover:border-slate-400 transition shadow-sm" style={{ background: g }} />
                    ))}
                  </div>
                </div>
              )}
              {(activeSlide.bgType === 'IMAGE' || activeSlide.bgType === 'VIDEO') && (
                <div className="space-y-3">
                  {activeSlide.bgImage && <img src={activeSlide.bgImage} alt="" className="w-full h-24 object-cover rounded-xl" />}
                  {activeSlide.bgVideo && <video src={activeSlide.bgVideo} className="w-full h-24 object-cover rounded-xl" muted />}
                  <button onClick={() => bgImgInputRef.current?.click()} disabled={uploading} className="w-full py-2.5 border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50">
                    <Upload className="w-4 h-4" /> Upload {activeSlide.bgType === 'VIDEO' ? 'Video (MP4/WebM)' : 'Image'}
                  </button>
                  {(activeSlide.bgImage || activeSlide.bgVideo) && (
                    <button onClick={() => updateSlide(s => ({ ...s, bgImage: null, bgVideo: null }))} className="w-full py-1 text-xs text-red-400 hover:text-red-300">Remove</button>
                  )}
                  {activeSlide.bgType === 'IMAGE' && activeSlide.bgImage && (<>
                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Opacity</span><span>{Math.round((activeSlide.bgImageOpacity ?? 1) * 100)}%</span>
                      </div>
                      <input type="range" min={0} max={1} step={0.05} value={activeSlide.bgImageOpacity ?? 1}
                        onChange={e => updateSlide(s => ({ ...s, bgImageOpacity: Number(e.target.value) }))}
                        className="w-full accent-indigo-500" />
                    </div>
                    {/* Blur */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Blur</span><span>{activeSlide.bgBlur ?? 0}px</span>
                      </div>
                      <input type="range" min={0} max={20} step={1} value={activeSlide.bgBlur ?? 0}
                        onChange={e => updateSlide(s => ({ ...s, bgBlur: Number(e.target.value) }))}
                        className="w-full accent-indigo-500" />
                    </div>
                    {/* Fit */}
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1.5">Fit</p>
                      <div className="grid grid-cols-3 gap-1">
                        {(['cover','contain','fill'] as const).map(f => (
                          <button key={f} onClick={() => updateSlide(s => ({ ...s, bgImageFit: f }))}
                            className={`py-1 rounded-lg text-[10px] capitalize transition ${(activeSlide.bgImageFit||'cover')===f ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    {/* Position */}
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1.5">Position</p>
                      <div className="grid grid-cols-3 gap-1">
                        {([
                          {l:'↖',v:'top left'},{l:'↑',v:'top center'},{l:'↗',v:'top right'},
                          {l:'←',v:'center left'},{l:'·',v:'center'},{l:'→',v:'center right'},
                          {l:'↙',v:'bottom left'},{l:'↓',v:'bottom center'},{l:'↘',v:'bottom right'},
                        ]).map(p => (
                          <button key={p.v} onClick={() => updateSlide(s => ({ ...s, bgImagePosition: p.v }))}
                            className={`py-1.5 rounded-lg text-sm transition ${(activeSlide.bgImagePosition||'center')===p.v ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>{p.l}</button>
                        ))}
                      </div>
                    </div>
                  </>)}
                </div>
              )}
              {selectedEl?.type === 'shape' && (
                <div className={`border-t pt-4 space-y-2 ${selectedEl.isFrame ? 'border-indigo-200' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: selectedEl.isFrame ? '#6366f1' : undefined }}>
                      {selectedEl.isFrame ? '🖼️ Frame Image' : 'Shape Image Fill'}
                    </p>
                    {selectedEl.isFrame && !selectedEl.bgImage && (
                      <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">Empty</span>
                    )}
                  </div>
                  {selectedEl.bgImage && (
                    <div className="relative">
                      <img src={selectedEl.bgImage} alt="" className="w-full h-20 object-cover rounded-xl border border-slate-200" />
                      <button onClick={() => updateElement({ ...selectedEl, bgImage: undefined })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center shadow-sm">×</button>
                    </div>
                  )}
                  <button onClick={() => shapeImgInputRef.current?.click()} disabled={uploading}
                    className={`w-full py-2.5 border border-dashed rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 ${selectedEl.isFrame ? 'border-indigo-400 text-indigo-600 hover:bg-indigo-50 font-semibold' : 'border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400'}`}>
                    <Upload className="w-3.5 h-3.5" /> {selectedEl.bgImage ? 'Change Image' : (selectedEl.isFrame ? 'Set Frame Image' : 'Fill with Image')}
                  </button>
                  {selectedEl.isFrame && (
                    <p className="text-[10px] text-slate-400">Or drag an image from the canvas onto this frame</p>
                  )}
                </div>
              )}
              {/* Color Overlay */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Color Overlay</p>
                <div className="flex items-center gap-3">
                  <input type="color" value={activeSlide.bgOverlayColor || '#000000'}
                    onChange={e => updateSlide(s => ({ ...s, bgOverlayColor: e.target.value, bgOverlayOpacity: s.bgOverlayOpacity ?? 0.3 }))}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-transparent" />
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Opacity</span><span className="font-medium">{Math.round((activeSlide.bgOverlayOpacity ?? 0) * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.05} value={activeSlide.bgOverlayOpacity ?? 0}
                      onChange={e => updateSlide(s => ({ ...s, bgOverlayOpacity: Number(e.target.value) }))}
                      className="w-full accent-indigo-500" />
                  </div>
                  {(activeSlide.bgOverlayOpacity ?? 0) > 0 && (
                    <button onClick={() => updateSlide(s => ({ ...s, bgOverlayOpacity: 0 }))} className="text-[10px] text-red-500 hover:text-red-700 font-medium">Clear</button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-slate-500">Slide Duration</span><span className="text-slate-800 font-semibold">{activeSlide.duration}s</span></div>
                <input type="range" min={3} max={30} value={activeSlide.duration} onChange={e => updateSlide(s => ({ ...s, duration: Number(e.target.value) }))} className="w-full accent-indigo-500" />
              </div>
            </div>
          )}

          {tab === 'document' && (
            <div className="p-4 space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Story Info</p>
              {[{ label: 'Slug', key: 'slug' as const, placeholder: 'url-slug' }, { label: 'Category', key: 'category' as const, placeholder: 'Travel, Deals...' }, { label: 'Publisher Name', key: 'publisherName' as const, placeholder: 'TransRentals' }, { label: 'Description', key: 'description' as const, placeholder: 'Story description...' }, { label: 'Meta Description', key: 'metaDescription' as const, placeholder: 'SEO description...' }, { label: 'Expires At', key: 'expiresAt' as const, placeholder: '', type: 'datetime-local' }].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder} value={(meta as any)[f.key]} onChange={e => setMeta(m => ({ ...m, [f.key]: e.target.value }))} className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl outline-none border border-slate-200 focus:border-indigo-400 placeholder-slate-300" />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">Publisher Logo</label>
                {meta.publisherLogo && <img src={meta.publisherLogo} alt="" className="w-12 h-12 rounded-full object-cover mb-2 border border-slate-200 shadow-sm" />}
                <button onClick={() => logoInputRef.current?.click()} className="w-full py-2 border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"><Upload className="w-3 h-3" /> Upload Logo</button>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">
                  Cover Image <span className="text-[10px] text-slate-400">— portrait 3:4, min 640×853</span>
                </label>
                {meta.coverImage && <img src={meta.coverImage} alt="" className="w-20 h-[107px] object-cover rounded-xl mb-2 border border-slate-200" />}
                <button onClick={() => coverInputRef.current?.click()} className="w-full py-2 border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"><Upload className="w-3 h-3" /> Upload Cover</button>
                <p className="mt-1 text-[10px] text-slate-400">This is the poster Google shows in Search and Discover.</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">
                  Square Cover <span className="text-[10px] text-slate-400">— 1:1</span>
                </label>
                {meta.coverImageSquare && <img src={meta.coverImageSquare} alt="" className="w-16 h-16 object-cover rounded-xl mb-2 border border-slate-200" />}
                <button onClick={() => coverSquareInputRef.current?.click()} className="w-full py-2 border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"><Upload className="w-3 h-3" /> Upload Square Cover</button>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">
                  Landscape Cover <span className="text-[10px] text-slate-400">— 4:3, optional</span>
                </label>
                {meta.coverImageLandscape && <img src={meta.coverImageLandscape} alt="" className="w-20 h-[60px] object-cover rounded-xl mb-2 border border-slate-200" />}
                <button onClick={() => coverLandscapeInputRef.current?.click()} className="w-full py-2 border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"><Upload className="w-3 h-3" /> Upload Landscape Cover</button>
                <p className="mt-1 text-[10px] text-slate-400">Left empty, the attribute is simply omitted.</p>
              </div>

              {/* Targeting */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Targeting <span className="text-[10px] font-normal text-slate-400 normal-case">(optional)</span></p>

                {/* Services */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-600 font-medium">Services</label>
                    <div className="flex items-center gap-2">
                      {servicesList.length > 0 && (
                        <button
                          onClick={() => setMeta(m => ({
                            ...m,
                            targetServices: m.targetServices.length === servicesList.length ? [] : servicesList.map((s: any) => s.slug)
                          }))}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium transition">
                          {meta.targetServices.length === servicesList.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                      {meta.targetServices.length > 0 && meta.targetServices.length < servicesList.length && (
                        <button onClick={() => setMeta(m => ({ ...m, targetServices: [] }))} className="text-[10px] text-red-500 hover:text-red-700 transition">Clear</button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">{meta.targetServices.length === 0 ? 'All services (default)' : `${meta.targetServices.length} of ${servicesList.length} selected`}</p>
                  {servicesList.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">Loading...</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={serviceSearch}
                        onChange={e => setServiceSearch(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-[11px] px-2.5 py-1.5 rounded-lg outline-none border border-slate-200 focus:border-indigo-400 placeholder-slate-300 mb-1.5"
                      />
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {servicesList.filter((s: any) => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).map((svc: any) => (
                        <label key={svc.id} className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox"
                            checked={meta.targetServices.includes(svc.slug)}
                            onChange={e => setMeta(m => ({
                              ...m,
                              targetServices: e.target.checked
                                ? [...m.targetServices, svc.slug]
                                : m.targetServices.filter(s => s !== svc.slug)
                            }))}
                            className="accent-indigo-500 w-3 h-3 flex-shrink-0" />
                          <span className="text-[11px] text-slate-600 group-hover:text-slate-900 transition truncate">{svc.name}</span>
                        </label>
                      ))}
                    </div>
                    </>
                  )}
                </div>

                {/* Locations */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-500 font-medium">Locations</label>
                    <div className="flex items-center gap-2">
                      {locationsList.length > 0 && (
                        <button
                          onClick={() => setMeta(m => ({
                            ...m,
                            targetLocations: m.targetLocations.length === locationsList.length ? [] : locationsList.map((l: any) => l.slug)
                          }))}
                          className="text-[10px] text-indigo-500 hover:text-indigo-700 transition font-medium">
                          {meta.targetLocations.length === locationsList.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                      {meta.targetLocations.length > 0 && meta.targetLocations.length < locationsList.length && (
                        <button onClick={() => setMeta(m => ({ ...m, targetLocations: [] }))} className="text-[10px] text-slate-400 hover:text-red-500 transition">Clear</button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">{meta.targetLocations.length === 0 ? 'All locations (default)' : `${meta.targetLocations.length} of ${locationsList.length} selected`}</p>
                  {locationsList.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">Loading...</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search locations..."
                        value={locationSearch}
                        onChange={e => setLocationSearch(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-[11px] px-2.5 py-1.5 rounded-lg outline-none border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 placeholder-slate-400 mb-1.5"
                      />
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {locationsList.filter((l: any) => l.name.toLowerCase().includes(locationSearch.toLowerCase())).map((loc: any) => (
                        <label key={loc.id} className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox"
                            checked={meta.targetLocations.includes(loc.slug)}
                            onChange={e => setMeta(m => ({
                              ...m,
                              targetLocations: e.target.checked
                                ? [...m.targetLocations, loc.slug]
                                : m.targetLocations.filter(l => l !== loc.slug)
                            }))}
                            className="accent-indigo-500 w-3 h-3 flex-shrink-0" />
                          <span className="text-[11px] text-slate-600 group-hover:text-slate-900 transition truncate">{loc.name}</span>
                        </label>
                      ))}
                    </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
          {/* Static context toolbar — Canva-style, always at top */}
          {selectedEl && selectedIds.length === 1 ? (
            <StaticToolbar el={selectedEl} onChange={updateElement} onShapeImageFill={() => shapeImgInputRef.current?.click()} onSnapshot={snapshot} />
          ) : (
            <div className="bg-white border-b border-slate-200 flex-shrink-0 h-9 flex items-center px-4">
              <span className="text-xs text-slate-400">{selectedIds.length > 1 ? `${selectedIds.length} elements selected` : 'Click an element to edit'}</span>
            </div>
          )}
          <div ref={containerRef} className="flex-1 overflow-auto" onClick={() => setSelectedIds([])}>
            <div style={{ minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }}>
            <div style={{ position: 'relative', width: CANVAS_W * scale, height: CANVAS_H * scale, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <div ref={canvasRef} className="overflow-visible shadow-2xl rounded-sm"
                style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                onClick={e => e.stopPropagation()}>
                {/* Clip the background only */}
                <div className="absolute inset-0 overflow-hidden rounded-sm">
                  <SlideBg s={activeSlide} />
                </div>
                {activeSlide.elements.sort((a, b) => a.z - b.z).map(el => (
                  <CanvasEl key={el.id} el={el}
                    selected={selectedIds.length === 1 && selectedId === el.id}
                    multiSelected={selectedIds.length > 1 && selectedIds.includes(el.id)}
                    scale={scale}
                    canvasRef={canvasRef}
                    onSelect={() => { if (el.groupId) selectGroup(el.groupId); else selectOne(el.id); }}
                    onShiftSelect={() => toggleSelect(el.id)}
                    onChange={updateElement}
                    onDblClick={() => {
                      if (el.type === 'text' || el.type === 'button') setEditingId(el.id);
                      else if (el.type === 'image' && el.src) setPanImageId(el.id);
                    }}
                    onDragMove={handleElementDrag} onDragEnd={handleDragEnd}
                    dropHighlight={dropTargetId === el.id} onSnapshot={snapshot}
                    onMultiDragStart={selectedIds.length > 1 ? handleMultiDragStart : undefined}
                    onMultiMove={selectedIds.length > 1 ? handleMultiMove : undefined} />
                ))}
                {/* Multi-select bounding box */}
                {selectedIds.length > 1 && (() => {
                  const els = activeSlide.elements.filter(e => selectedIds.includes(e.id));
                  if (!els.length) return null;
                  const pad = 8;
                  const minX = Math.min(...els.map(e => e.x)) - pad;
                  const minY = Math.min(...els.map(e => e.y)) - pad;
                  const maxX = Math.max(...els.map(e => e.x + e.w)) + pad;
                  const maxY = Math.max(...els.map(e => e.y + e.h)) + pad;
                  return (
                    <div style={{ position: 'absolute', left: minX, top: minY, width: maxX - minX, height: maxY - minY, border: '1.5px dashed #818cf8', borderRadius: 6, pointerEvents: 'none', zIndex: 9990 }} />
                  );
                })()}
                {/* Grid overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9000, backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                    {/* Center guides */}
                    <div className="absolute" style={{ left: CANVAS_W/2 - 0.5, top: 0, width: 1, height: '100%', background: 'rgba(99,102,241,0.4)' }} />
                    <div className="absolute" style={{ top: CANVAS_H/2 - 0.5, left: 0, height: 1, width: '100%', background: 'rgba(99,102,241,0.4)' }} />
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Slide Strip */}
          <div className="h-36 bg-white border-t border-slate-200 flex items-center px-4 gap-3 overflow-x-auto flex-shrink-0 shadow-sm">
            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 flex-shrink-0 bg-slate-100 rounded-lg px-1 py-0.5 border border-slate-200">
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { isManualZoomRef.current = true; setScale(s => Math.round(Math.max(0.1, s - 0.1) * 100) / 100); }}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-slate-600 font-bold text-base transition select-none"
                title="Zoom Out (Ctrl+Scroll)">−</button>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { isManualZoomRef.current = false; setScale(fitScaleRef.current); }}
                className="w-12 h-6 text-[11px] font-semibold text-slate-700 hover:bg-white rounded transition text-center select-none"
                title="Click to fit screen">
                {Math.round(scale * 100)}%
              </button>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { isManualZoomRef.current = true; setScale(s => Math.round(Math.min(3, s + 0.1) * 100) / 100); }}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-slate-600 font-bold text-base transition select-none"
                title="Zoom In (Ctrl+Scroll)">+</button>
            </div>
            <span className="text-slate-400 text-xs font-medium whitespace-nowrap flex-shrink-0">{activeIdx + 1} / {slides.length}</span>
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
                    onClick={() => { setActiveIdx(i); setSelectedIds([]); }}
                    onDelete={() => { if (slides.length <= 1) return; snapshot(); setSlides(prev => prev.filter((_, idx) => idx !== i)); setActiveIdx(Math.max(0, i - 1)); setSelectedIds([]); }}
                    onDuplicate={() => duplicateSlide(i)} />
                </div>
              ))}
              <button onClick={() => { setSlides(prev => [...prev, blankSlide(prev.length)]); setActiveIdx(slides.length); setSelectedIds([]); }}
                className="flex-shrink-0 w-[72px] h-[128px] border-2 border-dashed border-slate-300 hover:border-indigo-400 text-slate-300 hover:text-indigo-400 rounded-lg flex items-center justify-center transition bg-slate-50 hover:bg-indigo-50">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Strip */}
        <div className="w-12 bg-white border-l border-slate-200 flex flex-col items-center py-3 gap-1 flex-shrink-0 shadow-sm">
          {selectedEl ? (
            <>
              <button onClick={() => duplicateElement(selectedEl.id)} title="Duplicate (Ctrl+D)"
                className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition"><Copy className="w-4 h-4" /></button>
              {selectedIds.length >= 2 && (
                <button onClick={groupSelected} title="Group selection (Ctrl+G)"
                  className="w-9 h-9 hover:bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 hover:text-indigo-700 transition text-[10px] font-bold border border-indigo-200">G</button>
              )}
              {selectedEl?.groupId && (
                <button onClick={ungroupSelected} title="Ungroup (Ctrl+Shift+G)"
                  className="w-9 h-9 hover:bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 hover:text-amber-700 transition text-[10px] font-bold border border-amber-200">UG</button>
              )}
              <button onClick={() => changeLayer(selectedEl.id, 'up')} title="Forward (Ctrl+])"
                className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => changeLayer(selectedEl.id, 'down')} title="Back (Ctrl+[)"
                className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition"><ArrowDown className="w-4 h-4" /></button>
              <div className="w-6 h-px bg-slate-200 my-0.5" />
              {/* Lock/Unlock */}
              <button onClick={() => updateElement({ ...selectedEl, locked: !selectedEl.locked })} title={selectedEl.locked ? 'Unlock' : 'Lock element'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${selectedEl.locked ? 'bg-amber-100 text-amber-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
                {selectedEl.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              <div className="w-6 h-px bg-slate-200 my-0.5" />
              {/* Flip H */}
              <button onClick={() => updateElement({ ...selectedEl, flipX: !selectedEl.flipX })} title="Flip Horizontal"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${selectedEl.flipX ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
                <FlipHorizontal className="w-4 h-4" />
              </button>
              {/* Flip V */}
              <button onClick={() => updateElement({ ...selectedEl, flipY: !selectedEl.flipY })} title="Flip Vertical"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${selectedEl.flipY ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
                <FlipVertical className="w-4 h-4" />
              </button>
              <div className="w-6 h-px bg-slate-200 my-0.5" />
              <button onClick={() => selectedIds.length > 1 ? deleteElements(selectedIds) : deleteElement(selectedEl.id)} title="Delete (Del)"
                className="w-9 h-9 hover:bg-red-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
              <div className="mt-auto px-1 w-full flex flex-col items-center gap-1 pb-2">
                <span className="text-[9px] text-slate-400 uppercase tracking-wide">Opacity</span>
                <input type="range" min={0.1} max={1} step={0.05} value={selectedEl.opacity}
                  onChange={e => updateElement({ ...selectedEl, opacity: parseFloat(e.target.value) })}
                  className="accent-indigo-500" style={{ writingMode: 'vertical-lr', width: 32, height: 80 }} />
                <span className="text-[9px] text-slate-400">{Math.round(selectedEl.opacity * 100)}%</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 mt-2 opacity-40">
              <MousePointer className="w-4 h-4 text-slate-400" />
              <span className="text-[8px] text-slate-400 text-center leading-tight px-1">Select element</span>
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

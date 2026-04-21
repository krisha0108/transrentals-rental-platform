'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, ExternalLink, ChevronDown, ChevronUp,
  MapPin, Check, RotateCcw, Filter,
  Eye, EyeOff, ArrowUp, ArrowDown, GripVertical,
  LayoutList, Pencil, X, Info,
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Quote, Undo, Redo, Link2, AlignLeft, AlignCenter, AlignRight,
  UnderlineIcon, Strikethrough, Code2, Highlighter, Minus, ImageIcon,
  Trash2, Plus, Video, Loader2,
} from 'lucide-react';
import { ALL_CITIES, INDIAN_STATES } from '@/data/indian-cities';
import { ALL_SERVICES } from '@/data/service-config';
import { CITY_SEO } from '@/data/city-seo-content';
import { DEFAULT_SECTIONS, parseSectionsConfig, SectionConfig, SECTION_CONTENT_HINTS } from '@/lib/city-sections';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TiptapImage from '@tiptap/extension-image';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SeoOverride {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  pageHeading: string | null;
  pageDescription: string | null;
  sectionsConfig: string | null;
}

interface CityRow {
  cityName: string;
  cityState: string;
  citySlug: string;
  cityTier: number;
  pageId: string;
  url: string;
  templateTitle: string;
  templateDescription: string;
  templateKeywords: string;
  templateHeading: string;
  templatePageDescription: string;
  override: SeoOverride | null;
}

interface EditState {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  pageHeading: string;
  pageDescription: string;
  sections: SectionConfig[];
}

// ── Default content per section (pre-loads editor with existing page data) ────
function getDefaultContent(
  sectionId: string,
  cityName: string,
  cityState: string,
  seoData: any,
): string {
  switch (sectionId) {
    case 'hero':
      return seoData?.intro
        ? `<p>${seoData.intro}</p>`
        : `<p>Book car, bike, bus rentals and more in ${cityName}. Compare quotes from 500+ verified vendors across ${cityName}. Best prices guaranteed.</p>`;

    case 'services':
      return JSON.stringify(
        ALL_SERVICES.map(s => ({ slug: s.slug, visible: true }))
      );

    case 'routes': {
      if (seoData?.routes?.length) {
        const items = seoData.routes
          .map((r: any) => `<li><strong>${cityName} → ${r.to}</strong> — ${r.distance} · ${r.duration}${r.via ? ` via ${r.via}` : ''}</li>`)
          .join('');
        return `<p>Planning an outstation trip from ${cityName}? Here are the most popular routes:</p><ul>${items}</ul>`;
      }
      return `<p>Plan your outstation trips from ${cityName} with ease. TransRentals offers outstation cabs, self-drive cars, and tempo travellers for all major routes.</p>`;
    }

    case 'locations':
      return `<p>TransRentals operates across all major cities and towns in ${cityState}. Whether you're in ${cityName} or travelling to a nearby city, our network of verified vendors ensures the best vehicle rental service across ${cityState}.</p>`;

    case 'seo_content':
      return seoData?.intro
        ? `<p>${seoData.intro}</p>${seoData.tips?.length ? `<ul>${seoData.tips.map((t: string) => `<li>${t}</li>`).join('')}</ul>` : ''}`
        : `<p>${cityName} is a key city in ${cityState} with growing demand for vehicle rentals. TransRentals connects you with 500+ verified vendors offering cars, bikes, buses, and commercial vehicles at competitive prices.</p>`;

    case 'faq':
      return JSON.stringify([
        { q: `Which vehicle rental services are available in ${cityName}?`, a: `TransRentals offers car rentals, self-drive cars, bike rentals, bus & tempo traveller rentals, luxury cars, airport transfers, outstation cabs, packers & movers, and more in ${cityName}.` },
        { q: `How do I book a rental vehicle in ${cityName}?`, a: `Select the service above, choose your pickup location in ${cityName}, compare quotes from verified vendors, and book instantly.` },
        { q: `Are the rental vendors in ${cityName} verified?`, a: `Yes. All vendors on TransRentals are verified for documents, vehicle condition, and service quality before being listed.` },
        { q: `What is the cheapest rental available in ${cityName}?`, a: `Bike rentals start from ₹299/day and car rentals from ₹999/day in ${cityName}. Compare quotes for the best deal.` },
        ...(seoData?.routes?.[0] ? [{ q: `Can I get an outstation cab from ${cityName}?`, a: `Yes. Book one-way or round-trip cabs from ${cityName} to ${seoData.routes[0].to} (${seoData.routes[0].distance}) and many more destinations.` }] : []),
      ]);

    default:
      return '';
  }
}

// ── Tiptap toolbar button ─────────────────────────────────────────────────────
function TB({ onClick, active, title, children, disabled }: {
  onClick: () => void; active?: boolean; title: string;
  children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'} disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function TBDivider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 self-center" />;
}

// ── Tiptap section editor ─────────────────────────────────────────────────────
function SectionEditor({ value, onChange, placeholder }: {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
}) {
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || '');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TiptapImage.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setRawHtml(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] max-w-none p-4 prose prose-sm prose-gray',
      },
    },
  });

  if (!editor) return null;

  const enterHtmlMode = () => {
    setRawHtml(editor.getHTML());
    setHtmlMode(true);
  };

  const exitHtmlMode = () => {
    editor.commands.setContent(rawHtml, false);
    onChange(rawHtml);
    setHtmlMode(false);
  };

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawHtml(e.target.value);
    onChange(e.target.value);
  };

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: 'image' | 'video' } | null> => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      setUploading(true);
      const res = await fetch('/api/admin/seo/media-upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Upload failed'); return null; }
      return { url: data.url, type: data.type };
    } catch {
      alert('Upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const file of files) {
      const result = await uploadFile(file);
      if (result) editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
    }
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await uploadFile(file);
    if (result) {
      editor.chain().focus().insertContent(
        `<p><video src="${result.url}" controls style="max-width:100%;border-radius:8px"></video></p>`
      ).run();
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" multiple className="hidden" onChange={handleImageFiles} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/mov,video/quicktime" className="hidden" onChange={handleVideoFile} />

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
        {htmlMode ? (
          /* HTML mode — only show "Back to Editor" button */
          <>
            <span className="text-xs text-amber-700 font-semibold bg-amber-100 px-2 py-1 rounded flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" /> HTML Source
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exitHtmlMode(); }}
              className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 transition"
            >
              Apply & Back to Editor
            </button>
          </>
        ) : (
          /* Rich text mode — full toolbar */
          <>
            <TB title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold className="w-3.5 h-3.5" /></TB>
            <TB title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic className="w-3.5 h-3.5" /></TB>
            <TB title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><UnderlineIcon className="w-3.5 h-3.5" /></TB>
            <TB title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}><Strikethrough className="w-3.5 h-3.5" /></TB>
            <TB title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}><Code2 className="w-3.5 h-3.5" /></TB>
            <TB title="Highlight" onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')}><Highlighter className="w-3.5 h-3.5" /></TB>
            <TBDivider />
            <TB title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 className="w-3.5 h-3.5" /></TB>
            <TB title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}><Heading3 className="w-3.5 h-3.5" /></TB>
            <TBDivider />
            <TB title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List className="w-3.5 h-3.5" /></TB>
            <TB title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered className="w-3.5 h-3.5" /></TB>
            <TB title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}><Quote className="w-3.5 h-3.5" /></TB>
            <TB title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>
              <span className="text-[10px] font-mono font-bold leading-none">{'{}'}</span>
            </TB>
            <TBDivider />
            <TB title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-3.5 h-3.5" /></TB>
            <TB title="Insert / edit link" onClick={setLink} active={editor.isActive('link')}><Link2 className="w-3.5 h-3.5" /></TB>
            <TB title="Upload image" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            </TB>
            <TB title="Upload video" onClick={() => videoInputRef.current?.click()} disabled={uploading}>
              <Video className="w-3.5 h-3.5" />
            </TB>
            <TBDivider />
            <TB title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}><AlignLeft className="w-3.5 h-3.5" /></TB>
            <TB title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}><AlignCenter className="w-3.5 h-3.5" /></TB>
            <TB title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}><AlignRight className="w-3.5 h-3.5" /></TB>
            <TBDivider />
            <TB title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="w-3.5 h-3.5" /></TB>
            <TB title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="w-3.5 h-3.5" /></TB>
            <TBDivider />
            <TB title="Edit raw HTML source" onClick={enterHtmlMode}>
              <span className="text-[10px] font-mono font-bold leading-none text-amber-600">&lt;/&gt;</span>
            </TB>
            <TBDivider />
            <TB title="Clear content" onClick={() => { editor.chain().focus().clearContent().run(); setRawHtml(''); onChange(''); }}>
              <X className="w-3.5 h-3.5 text-red-400" />
            </TB>
          </>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Uploading file...
        </div>
      )}

      {/* HTML source textarea */}
      {htmlMode && (
        <textarea
          value={rawHtml}
          onChange={handleRawHtmlChange}
          spellCheck={false}
          className="w-full min-h-[300px] p-4 font-mono text-xs text-gray-800 bg-amber-50 focus:outline-none resize-y"
          placeholder="Paste or write raw HTML here..."
        />
      )}

      {/* Rich text editor (always mounted, hidden in HTML mode so editor state is preserved) */}
      <div className={htmlMode ? 'hidden' : ''}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ── FAQ dedicated editor ──────────────────────────────────────────────────────
interface FaqItem { q: string; a: string; }

function parseFaqValue(value: string): FaqItem[] | null {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.q !== undefined) return parsed;
  } catch {}
  return null;
}

function FaqEditor({ value, defaultValue, onChange }: { value: string; defaultValue: string; onChange: (json: string) => void }) {
  const [items, setItems] = useState<FaqItem[]>(() => parseFaqValue(value) ?? parseFaqValue(defaultValue) ?? [{ q: '', a: '' }]);

  const update = (next: FaqItem[]) => {
    setItems(next);
    onChange(JSON.stringify(next));
  };

  const setField = (idx: number, field: 'q' | 'a', val: string) => {
    const next = items.map((item, i) => i === idx ? { ...item, [field]: val } : item);
    update(next);
  };

  const addItem = () => update([...items, { q: '', a: '' }]);

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    update(items.filter((_, i) => i !== idx));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const swap = idx + dir;
    if (swap < 0 || swap >= items.length) return;
    const next = [...items];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    update(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 relative">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">FAQ #{idx + 1}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition" title="Move up">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition" title="Move down">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => removeItem(idx)} disabled={items.length === 1} className="p-1 text-red-400 hover:text-red-600 disabled:opacity-20 transition ml-1" title="Remove">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Question</label>
            <input
              value={item.q}
              onChange={(e) => setField(idx, 'q', e.target.value)}
              placeholder="e.g. Which vehicle rental services are available in Ahmedabad?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Answer */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Answer</label>
            <textarea
              value={item.a}
              onChange={(e) => setField(idx, 'a', e.target.value)}
              rows={3}
              placeholder="Write the answer here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      ))}

      {/* Add FAQ button */}
      <button
        onClick={addItem}
        className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition"
      >
        + Add FAQ
      </button>
    </div>
  );
}

// ── Services visibility + edit editor ────────────────────────────────────────
interface ServiceVisibility {
  slug: string;
  visible: boolean;
  customName?: string;
  customPrice?: string;
  customPriceUnit?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  car: 'Cars', bike: 'Bikes', bus: 'Buses & Vans',
  cab: 'Cab & Transfers', commercial: 'Commercial', moving: 'Moving',
};
const CATEGORY_ORDER_SVC = ['car', 'bike', 'bus', 'cab', 'commercial', 'moving'];

function parseServicesValue(value: string): ServiceVisibility[] | null {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed[0]?.slug !== undefined) return parsed;
  } catch {}
  return null;
}

function ServicesEditor({ value, defaultValue, onChange }: {
  value: string; defaultValue: string; onChange: (json: string) => void;
}) {
  const [items, setItems] = useState<ServiceVisibility[]>(() =>
    parseServicesValue(value) ?? parseServicesValue(defaultValue) ?? ALL_SERVICES.map(s => ({ slug: s.slug, visible: true }))
  );
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const update = (next: ServiceVisibility[]) => { setItems(next); onChange(JSON.stringify(next)); };

  const toggle = (slug: string) =>
    update(items.map(s => s.slug === slug ? { ...s, visible: !s.visible } : s));

  const setField = (slug: string, field: keyof ServiceVisibility, val: string | boolean) =>
    update(items.map(s => s.slug === slug ? { ...s, [field]: val } : s));

  const toggleAll = (category: string, visible: boolean) => {
    const catSlugs = new Set(ALL_SERVICES.filter(s => s.category === category).map(s => s.slug));
    update(items.map(s => catSlugs.has(s.slug) ? { ...s, visible } : s));
  };

  const visibleCount = items.filter(s => s.visible).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{visibleCount} of {items.length} services shown</span>
        <div className="flex gap-2">
          <button onClick={() => update(items.map(s => ({ ...s, visible: true })))} className="text-blue-600 hover:underline font-medium">Show all</button>
          <span>·</span>
          <button onClick={() => update(items.map(s => ({ ...s, visible: false })))} className="text-gray-400 hover:underline">Hide all</button>
        </div>
      </div>

      {CATEGORY_ORDER_SVC.map(cat => {
        const catServices = ALL_SERVICES.filter(s => s.category === cat);
        if (!catServices.length) return null;
        const catItems = catServices.map(s => items.find(i => i.slug === s.slug) ?? { slug: s.slug, visible: true });
        const allVisible = catItems.every(i => i.visible);
        const noneVisible = catItems.every(i => !i.visible);

        return (
          <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{CATEGORY_LABELS[cat]}</span>
              <div className="flex gap-2 text-xs">
                <button onClick={() => toggleAll(cat, true)} disabled={allVisible} className="text-blue-600 hover:underline disabled:opacity-30 font-medium">All on</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => toggleAll(cat, false)} disabled={noneVisible} className="text-gray-400 hover:underline disabled:opacity-30">All off</button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {catServices.map(svc => {
                const item = items.find(i => i.slug === svc.slug) ?? { slug: svc.slug, visible: true };
                const isEditing = expandedSlug === svc.slug;
                const isCustomised = !!(item.customName || item.customPrice || item.customPriceUnit);

                return (
                  <div key={svc.slug} className={`transition-colors ${item.visible ? 'bg-white' : 'bg-gray-50/60'}`}>
                    {/* Main row */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      {/* Toggle */}
                      <button
                        onClick={() => toggle(svc.slug)}
                        className={`shrink-0 transition-colors ${item.visible ? 'text-emerald-500 hover:text-emerald-600' : 'text-gray-300 hover:text-gray-400'}`}
                      >
                        {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Name */}
                      <span className={`flex-1 text-sm min-w-0 ${item.visible ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}`}>
                        {item.customName || svc.name}
                        {isCustomised && <span className="ml-1.5 text-xs text-violet-500 font-normal not-italic">(edited)</span>}
                      </span>

                      {/* Price display */}
                      <span className="text-xs text-gray-400 shrink-0">
                        ₹{item.customPrice || svc.startingPrice}{item.customPriceUnit ?? svc.priceUnit}
                      </span>

                      {/* Edit button */}
                      <button
                        onClick={() => setExpandedSlug(isEditing ? null : svc.slug)}
                        className={`shrink-0 p-1 rounded transition-colors ${isEditing ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'}`}
                        title="Edit service details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inline edit panel */}
                    {isEditing && (
                      <div className="px-3 pb-3 pt-0 bg-violet-50/40 border-t border-violet-100 space-y-2">
                        <p className="text-xs text-violet-600 font-medium pt-2">
                          Override for this city only · leave blank to use default
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                            <input
                              value={item.customName || ''}
                              onChange={e => setField(svc.slug, 'customName', e.target.value)}
                              placeholder={svc.name}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Starting Price (₹)</label>
                            <input
                              value={item.customPrice || ''}
                              onChange={e => setField(svc.slug, 'customPrice', e.target.value)}
                              placeholder={svc.startingPrice || ''}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Price Unit</label>
                            <input
                              value={item.customPriceUnit !== undefined ? item.customPriceUnit : (svc.priceUnit || '')}
                              onChange={e => setField(svc.slug, 'customPriceUnit', e.target.value)}
                              placeholder={svc.priceUnit || 'e.g. /day'}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            />
                          </div>
                        </div>
                        {isCustomised && (
                          <button
                            onClick={() => update(items.map(s => s.slug === svc.slug ? { slug: s.slug, visible: s.visible } : s))}
                            className="text-xs text-red-400 hover:text-red-600 hover:underline"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sections editor panel ─────────────────────────────────────────────────────
function SectionsPanel({ sections, onChange, cityName, cityState, seoData }: {
  sections: SectionConfig[];
  onChange: (s: SectionConfig[]) => void;
  cityName: string;
  cityState: string;
  seoData: any;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next.map((s, i) => ({ ...s, order: i })));
  };

  const toggle = (id: string) => {
    onChange(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const setContent = (id: string, html: string) => {
    onChange(sections.map(s => s.id === id ? { ...s, content: html } : s));
  };

  const deleteSection = (id: string) => {
    const next = sections.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i }));
    onChange(next);
    if (expandedId === id) setExpandedId(null);
  };

  const addCustomSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    const id = `custom_${Date.now()}`;
    const newSection: SectionConfig = {
      id,
      label: name,
      visible: true,
      order: sections.length,
      canHide: true,
      isCustom: true,
    };
    onChange([...sections, newSection]);
    setNewSectionName('');
    setAddingSection(false);
    setExpandedId(id);
  };

  return (
    <div className="space-y-2">
      {sections.map((section, idx) => {
        const isExpanded = expandedId === section.id;
        const hasContent = !!(section.content && section.content.trim() && section.content !== '<p></p>');
        const hint = SECTION_CONTENT_HINTS[section.id as keyof typeof SECTION_CONTENT_HINTS]
          ?? `Write custom HTML content for the "${section.label}" section. This will appear on the city page.`;

        return (
          <div
            key={section.id}
            className={`border rounded-xl transition-colors ${section.visible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}
          >
            {/* Row */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />

              {/* Visibility */}
              <button
                onClick={() => section.canHide && toggle(section.id)}
                disabled={!section.canHide}
                title={section.canHide ? (section.visible ? 'Hide' : 'Show') : 'Always visible'}
                className={`shrink-0 transition-colors ${!section.canHide ? 'text-gray-300 cursor-not-allowed' : section.visible ? 'text-emerald-500 hover:text-emerald-600' : 'text-gray-300 hover:text-gray-400'}`}
              >
                {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Label */}
              <span className={`flex-1 text-sm font-semibold ${section.visible ? 'text-gray-800' : 'text-gray-400'}`}>
                {section.label}
                {section.isCustom && (
                  <span className="ml-1.5 text-xs font-normal text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">custom</span>
                )}
              </span>

              {/* Badges */}
              {!section.canHide && <span className="text-xs text-gray-400 italic shrink-0">required</span>}
              {hasContent && (
                <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded shrink-0">
                  Content set
                </span>
              )}

              {/* Edit content button */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : section.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  isExpanded
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700'
                }`}
              >
                <Pencil className="w-3 h-3" />
                {isExpanded ? 'Close' : 'Edit Content'}
              </button>

              {/* Move arrows */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === sections.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Delete (custom sections only) */}
              {section.isCustom && (
                <button
                  onClick={() => { if (confirm(`Delete "${section.label}" section?`)) deleteSection(section.id); }}
                  className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition"
                  title="Delete section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Inline editor */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                {/* Hint */}
                <div className="flex items-start gap-2 text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{hint}</span>
                </div>
                {section.id === 'faq' ? (
                  <FaqEditor
                    value={section.content || ''}
                    defaultValue={getDefaultContent(section.id, cityName, cityState, seoData)}
                    onChange={(json) => setContent(section.id, json)}
                  />
                ) : section.id === 'services' ? (
                  <ServicesEditor
                    value={section.content || ''}
                    defaultValue={getDefaultContent(section.id, cityName, cityState, seoData)}
                    onChange={(json) => setContent(section.id, json)}
                  />
                ) : (
                  <SectionEditor
                    key={section.id}
                    value={section.content || getDefaultContent(section.id, cityName, cityState, seoData)}
                    onChange={(html) => setContent(section.id, html)}
                    placeholder={`Write custom content for the ${section.label} section...`}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add new section */}
      {addingSection ? (
        <div className="border-2 border-dashed border-violet-300 rounded-xl p-4 bg-violet-50/40 space-y-3">
          <p className="text-xs font-semibold text-violet-700">New Custom Section</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCustomSection(); if (e.key === 'Escape') { setAddingSection(false); setNewSectionName(''); } }}
              placeholder="Section name, e.g. Why Choose Us"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <button
              onClick={addCustomSection}
              disabled={!newSectionName.trim()}
              className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-40 transition"
            >
              Add
            </button>
            <button
              onClick={() => { setAddingSection(false); setNewSectionName(''); }}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingSection(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/40 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Section
        </button>
      )}

      <p className="text-xs text-gray-400 pt-1">↑↓ to reorder · eye to show/hide · "Edit Content" to add rich text · custom sections can be deleted</p>
    </div>
  );
}

// ── Single city row ────────────────────────────────────────────────────────────
function CityRowItem({ row, onSave, onReset }: {
  row: CityRow;
  onSave: (pageId: string, data: EditState) => Promise<void>;
  onReset: (pageId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'sections'>('content');
  const [edit, setEdit] = useState<EditState>({
    metaTitle: row.override?.metaTitle || row.templateTitle,
    metaDescription: row.override?.metaDescription || row.templateDescription,
    metaKeywords: row.override?.metaKeywords || row.templateKeywords,
    pageHeading: row.override?.pageHeading || row.templateHeading,
    pageDescription: row.override?.pageDescription || row.templatePageDescription,
    sections: parseSectionsConfig(row.override?.sectionsConfig),
  });

  // Sync edit state whenever the DB data changes (e.g. after save + fetchOverrides)
  useEffect(() => {
    if (!open) {
      setEdit({
        metaTitle: row.override?.metaTitle || row.templateTitle,
        metaDescription: row.override?.metaDescription || row.templateDescription,
        metaKeywords: row.override?.metaKeywords || row.templateKeywords,
        pageHeading: row.override?.pageHeading || row.templateHeading,
        pageDescription: row.override?.pageDescription || row.templatePageDescription,
        sections: parseSectionsConfig(row.override?.sectionsConfig),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.override]);

  const hasOverride = !!row.override;
  const hasCustomSections = row.override?.sectionsConfig != null;
  const displayTitle = row.override?.metaTitle || row.templateTitle;

  const handleOpen = () => {
    setEdit({
      metaTitle: row.override?.metaTitle || row.templateTitle,
      metaDescription: row.override?.metaDescription || row.templateDescription,
      metaKeywords: row.override?.metaKeywords || row.templateKeywords,
      pageHeading: row.override?.pageHeading || row.templateHeading,
      pageDescription: row.override?.pageDescription || row.templatePageDescription,
      sections: parseSectionsConfig(row.override?.sectionsConfig),
    });
    setOpen(!open);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(row.pageId, edit);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setOpen(false);
  };

  const handleReset = async () => {
    if (!confirm('Remove all custom content and revert to defaults?')) return;
    setSaving(true);
    await onReset(row.pageId);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className={`border rounded-lg mb-2 transition-colors ${hasOverride ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/80 transition" onClick={handleOpen}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {hasOverride && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded shrink-0">Custom</span>}
            {hasCustomSections && <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded shrink-0">Sections</span>}
            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
              row.cityTier === 1 ? 'bg-amber-100 text-amber-700' :
              row.cityTier === 2 ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-500'
            }`}>T{row.cityTier}</span>
            <span className="font-semibold text-gray-900 text-sm truncate">{row.cityName}</span>
            <span className="text-xs text-gray-400 shrink-0">• {row.cityState}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{displayTitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <Check className="w-4 h-4 text-green-500" />}
          <a href={row.url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-blue-600 transition" title="Open page">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Edit panel */}
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
            {([
              { id: 'content', label: '✏️ Content' },
              { id: 'seo',     label: '🔍 SEO' },
              { id: 'sections',label: '⚡ Sections' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Content tab ── */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {hasOverride && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="font-semibold text-gray-600 mb-1">Auto-generated defaults:</p>
                  <p><span className="text-gray-400">Heading:</span> {row.templateHeading}</p>
                  <p><span className="text-gray-400">Desc:</span> {row.templatePageDescription.slice(0, 100)}...</p>
                </div>
              )}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Hero Section Content</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Page Heading (H1)</label>
                  <input
                    value={edit.pageHeading}
                    onChange={(e) => setEdit({ ...edit, pageHeading: e.target.value })}
                    placeholder={`e.g. Vehicle Rentals in ${row.cityName}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hero Description</label>
                  <textarea
                    value={edit.pageDescription}
                    onChange={(e) => setEdit({ ...edit, pageDescription: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── SEO tab ── */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Meta Title <span className={`font-normal ${edit.metaTitle.length > 70 ? 'text-red-500' : 'text-gray-400'}`}>({edit.metaTitle.length}/70)</span>
                </label>
                <input
                  value={edit.metaTitle}
                  onChange={(e) => setEdit({ ...edit, metaTitle: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${edit.metaTitle.length > 70 ? 'border-red-300' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Meta Description <span className={`font-normal ${edit.metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>({edit.metaDescription.length}/160)</span>
                </label>
                <textarea
                  value={edit.metaDescription}
                  onChange={(e) => setEdit({ ...edit, metaDescription: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${edit.metaDescription.length > 160 ? 'border-red-300' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Keywords <span className="font-normal text-gray-400">(comma separated)</span></label>
                <input
                  value={edit.metaKeywords}
                  onChange={(e) => setEdit({ ...edit, metaKeywords: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">Google Preview</p>
                <p className="text-[#1a0dab] text-base font-medium leading-tight truncate">{edit.metaTitle}</p>
                <p className="text-[#006621] text-xs mt-0.5">transrentals.in{row.url}</p>
                <p className="text-[#545454] text-sm mt-1 line-clamp-2">{edit.metaDescription}</p>
              </div>
            </div>
          )}

          {/* ── Sections tab ── */}
          {activeTab === 'sections' && (
            <SectionsPanel
              sections={edit.sections}
              onChange={(s) => setEdit({ ...edit, sections: s })}
              cityName={row.cityName}
              cityState={row.cityState}
              seoData={CITY_SEO[row.citySlug]}
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : saved ? <><Check className="w-4 h-4" />Saved</> : 'Save Changes'}
            </button>
            {hasOverride && (
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Default
              </button>
            )}
            <button onClick={() => setOpen(false)} className="ml-auto text-sm text-gray-400 hover:text-gray-600 transition">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main admin page ────────────────────────────────────────────────────────────
export default function CityPagesAdmin() {
  const [rows, setRows] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterOverride, setFilterOverride] = useState(false);

  const buildRows = useCallback((overrides: Record<string, SeoOverride>) => {
    return ALL_CITIES.map((city): CityRow => {
      const pageId = `city:${city.slug}`;
      const seo = CITY_SEO[city.slug];
      return {
        cityName: city.name,
        cityState: city.state,
        citySlug: city.slug,
        cityTier: city.tier,
        pageId,
        url: `/${city.slug}`,
        templateTitle: `Vehicle Rentals in ${city.name} | Car, Bike, Bus, Cab & More — TransRentals`,
        templateDescription: `Rent cars, bikes, buses, luxury vehicles & more in ${city.name}, ${city.state}. Self-drive & chauffeur-driven options. Compare quotes from 500+ verified vendors. Best prices guaranteed!`,
        templateKeywords: [`vehicle rental ${city.name}`, `car rental ${city.name}`, `bike rental ${city.name}`, `bus rental ${city.name}`, `self drive car ${city.name}`, `outstation cab ${city.name}`].join(', '),
        templateHeading: `Vehicle Rentals in ${city.name}`,
        templatePageDescription: seo?.intro ? seo.intro.slice(0, 220) + '...' : `Book cars, bikes, buses & more in ${city.name}. Compare quotes from verified vendors. Best prices guaranteed.`,
        override: overrides[pageId] ?? null,
      };
    });
  }, []);

  const fetchOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/city-page-overrides');
      const data = res.ok ? await res.json() : { overrides: {} };
      setRows(buildRows(data.overrides || {}));
    } catch {
      setRows(buildRows({}));
    } finally {
      setLoading(false);
    }
  }, [buildRows]);

  useEffect(() => { fetchOverrides(); }, [fetchOverrides]);

  const handleSave = async (pageId: string, edit: EditState) => {
    await fetch('/api/admin/seo/page-meta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId,
        metaTitle: edit.metaTitle,
        metaDescription: edit.metaDescription,
        metaKeywords: edit.metaKeywords,
        pageHeading: edit.pageHeading,
        pageDescription: edit.pageDescription,
        sectionsConfig: JSON.stringify(edit.sections),
      }),
    });
    await fetchOverrides();
  };

  const handleReset = async (pageId: string) => {
    await fetch(`/api/admin/seo/page-meta?pageId=${encodeURIComponent(pageId)}`, { method: 'DELETE' });
    await fetchOverrides();
  };

  const filtered = rows.filter((row) => {
    if (filterOverride && !row.override) return false;
    if (filterTier && String(row.cityTier) !== filterTier) return false;
    if (filterState) {
      const city = ALL_CITIES.find(c => c.slug === row.citySlug);
      if (city?.stateCode !== filterState) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return row.cityName.toLowerCase().includes(q) || row.cityState.toLowerCase().includes(q) || row.citySlug.includes(q);
    }
    return true;
  });

  const customCount = rows.filter(r => r.override).length;
  const uniqueStateCodes = [...new Set(ALL_CITIES.map(c => c.stateCode))].sort();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">City Pages</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Manage heading, description, SEO and section content for city landing pages (e.g. /ahmedabad, /mumbai)
        </p>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span>{rows.length} cities total</span>
          {customCount > 0 && <span className="text-blue-600 font-semibold">{customCount} customised</span>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city or state..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All States</option>
          {uniqueStateCodes.map(code => {
            const state = INDIAN_STATES.find(s => s.code === code);
            return <option key={code} value={code}>{state?.name || code}</option>;
          })}
        </select>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Tiers</option>
          <option value="1">Tier 1 (Metro)</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
          <option value="4">Tier 4</option>
          <option value="5">Tier 5</option>
        </select>
        <button
          onClick={() => setFilterOverride(!filterOverride)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${filterOverride ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
        >
          <Filter className="w-3.5 h-3.5" />
          Customised only
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3">Showing {filtered.length} of {rows.length} cities</p>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading city pages...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No cities match your filters.</div>
      ) : (
        <div>
          {filtered.map(row => (
            <CityRowItem key={row.pageId} row={row} onSave={handleSave} onReset={handleReset} />
          ))}
        </div>
      )}
    </div>
  );
}

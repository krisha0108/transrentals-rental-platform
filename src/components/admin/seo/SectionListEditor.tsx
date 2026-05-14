'use client';

/**
 * Block-based section list manager — renders a list of SectionConfig items
 * with show/hide, reorder, edit-content, delete-custom, and add-custom.
 * Reusable across city-pages and service-city pages.
 *
 * Each section's content is edited inline:
 *   - id === 'faqs' (or 'faq')  → FAQ q/a editor (JSON content)
 *   - everything else           → TipTap rich-text editor (HTML content)
 *
 * Callers pass:
 *   - sections / onChange         current section list and setter
 *   - sectionHints                map of section.id → help text
 *   - getDefaultContent           per-section default content for placeholder
 */

import React, { useState } from 'react';
import {
  ArrowUp, ArrowDown, Eye, EyeOff, Pencil, Trash2, Plus, Info, GripVertical,
  Check, X as XIcon, Type,
} from 'lucide-react';
import type { SectionConfig } from '@/lib/city-sections';
import { RichTextSectionEditor } from './RichTextSectionEditor';
import { FaqSectionEditor } from './FaqSectionEditor';

const FAQ_IDS = new Set(['faqs', 'faq']);

export function SectionListEditor({
  sections,
  onChange,
  sectionHints,
  getDefaultContent,
}: {
  sections: SectionConfig[];
  onChange: (next: SectionConfig[]) => void;
  sectionHints?: Record<string, string>;
  getDefaultContent?: (sectionId: string) => string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next.map((s, i) => ({ ...s, order: i })));
  };

  const toggle = (id: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  const setContent = (id: string, content: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, content } : s)));
  };

  const deleteSection = (id: string) => {
    const next = sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }));
    onChange(next);
    if (expandedId === id) setExpandedId(null);
  };

  const startRename = (id: string, currentLabel: string) => {
    setRenamingId(id);
    setRenameDraft(currentLabel);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const trimmed = renameDraft.trim();
    if (trimmed.length === 0) {
      // empty rename — cancel instead of clearing the label
      setRenamingId(null);
      setRenameDraft('');
      return;
    }
    onChange(
      sections.map((s) => (s.id === renamingId ? { ...s, label: trimmed } : s)),
    );
    setRenamingId(null);
    setRenameDraft('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
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
        const hasContent = !!(
          section.content &&
          section.content.trim() &&
          section.content !== '<p></p>'
        );
        const hint =
          sectionHints?.[section.id] ??
          `Write custom HTML content for the "${section.label}" section.`;

        return (
          <div
            key={section.id}
            className={`border rounded-xl transition-colors ${
              section.visible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />

              <button
                onClick={() => section.canHide && toggle(section.id)}
                disabled={!section.canHide}
                title={section.canHide ? (section.visible ? 'Hide' : 'Show') : 'Always visible'}
                className={`shrink-0 transition-colors ${
                  !section.canHide
                    ? 'text-gray-300 cursor-not-allowed'
                    : section.visible
                    ? 'text-emerald-500 hover:text-emerald-600'
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {renamingId === section.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onBlur={commitRename}
                    className="flex-1 px-2 py-1 border border-violet-400 rounded text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    onMouseDown={(e) => { e.preventDefault(); commitRename(); }}
                    className="p-1 text-emerald-500 hover:text-emerald-700"
                    title="Save (Enter)"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); cancelRename(); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Cancel (Esc)"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span
                  className={`flex-1 text-sm font-semibold flex items-center gap-1.5 ${section.visible ? 'text-gray-800' : 'text-gray-400'}`}
                >
                  <button
                    onClick={() => startRename(section.id, section.label)}
                    className="text-left hover:text-violet-700 transition group flex items-center gap-1"
                    title="Click to rename heading"
                  >
                    {section.label}
                    <Type className="w-3 h-3 text-gray-300 group-hover:text-violet-500 transition" />
                  </button>
                  {section.isCustom && (
                    <span className="text-xs font-normal text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">custom</span>
                  )}
                </span>
              )}

              {!section.canHide && <span className="text-xs text-gray-400 italic shrink-0">required</span>}
              {hasContent && (
                <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded shrink-0">
                  Content set
                </span>
              )}

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

              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === sections.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 transition">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {section.isCustom && (
                <button
                  onClick={() => {
                    if (confirm(`Delete "${section.label}" section?`)) deleteSection(section.id);
                  }}
                  className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition"
                  title="Delete section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                <div className="flex items-start gap-2 text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{hint}</span>
                </div>
                {FAQ_IDS.has(section.id) ? (
                  <FaqSectionEditor
                    value={section.content || ''}
                    defaultValue={getDefaultContent?.(section.id)}
                    onChange={(json) => setContent(section.id, json)}
                  />
                ) : (
                  <RichTextSectionEditor
                    key={section.id}
                    value={section.content || getDefaultContent?.(section.id) || ''}
                    onChange={(html) => setContent(section.id, html)}
                    placeholder={`Write content for the ${section.label} section...`}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {addingSection ? (
        <div className="border-2 border-dashed border-violet-300 rounded-xl p-4 bg-violet-50/40 space-y-3">
          <p className="text-xs font-semibold text-violet-700">New Custom Section</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomSection();
                if (e.key === 'Escape') { setAddingSection(false); setNewSectionName(''); }
              }}
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

      <p className="text-xs text-gray-400 pt-1">↑↓ to reorder · eye to show/hide · click heading to rename · "Edit Content" for rich text · custom sections can be deleted</p>
    </div>
  );
}

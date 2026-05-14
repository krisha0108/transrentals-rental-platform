'use client';

/**
 * FAQ list editor. Stores items as JSON string [{q, a}, ...] so it can be
 * persisted in the same `content` slot as a rich-text section.
 */

import React, { useState } from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';

export type FaqItem = { q: string; a: string };

function parseFaqValue(value: string): FaqItem[] | null {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.q !== undefined) return parsed;
  } catch {}
  return null;
}

export function FaqSectionEditor({
  value, defaultValue, onChange,
}: { value: string; defaultValue?: string; onChange: (json: string) => void }) {
  const [items, setItems] = useState<FaqItem[]>(() =>
    parseFaqValue(value) ?? parseFaqValue(defaultValue ?? '') ?? [{ q: '', a: '' }],
  );

  const update = (next: FaqItem[]) => {
    setItems(next);
    onChange(JSON.stringify(next));
  };

  const setField = (idx: number, field: 'q' | 'a', val: string) => {
    update(items.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));
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

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Question</label>
            <input
              value={item.q}
              onChange={(e) => setField(idx, 'q', e.target.value)}
              placeholder="e.g. What is the cost of a Delhi to Agra cab?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

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

      <button
        onClick={addItem}
        className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition"
      >
        + Add FAQ
      </button>
    </div>
  );
}

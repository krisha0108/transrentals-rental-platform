'use client';

import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Link2,
  Undo, Redo, Check, X, Type, ChevronDown,
  Underline as UnderlineIcon, Code, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Eraser,
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

const HEADING_OPTIONS = [
  { label: 'Normal text', level: 0, className: 'text-sm' },
  { label: 'Heading 1', level: 1, className: 'text-xl font-bold' },
  { label: 'Heading 2', level: 2, className: 'text-lg font-bold' },
  { label: 'Heading 3', level: 3, className: 'text-base font-bold' },
];

function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition ${
        active ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />;
}

export default function TourDescriptionEditor({
  content,
  onChange,
  placeholder = 'Describe the tour, what makes it special, what travelers will experience…',
  minHeight = 180,
  maxHeight = 320,
}: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [headingOpen, setHeadingOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-emerald-700 underline hover:text-emerald-800',
            rel: 'noopener noreferrer',
          },
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({
        HTMLAttributes: { class: 'bg-yellow-200 px-0.5 rounded' },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3 text-gray-800',
      },
    },
  });

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      const finalUrl = /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}`;
      editor.chain().focus().setLink({ href: finalUrl }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-400">
        Loading editor…
      </div>
    );
  }

  const currentHeadingLabel =
    HEADING_OPTIONS.find((h) =>
      h.level === 0 ? !editor.isActive('heading') : editor.isActive('heading', { level: h.level })
    )?.label || 'Normal text';

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
        {/* Heading dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setHeadingOpen((o) => !o)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 min-w-[110px]"
            title="Text style"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">{currentHeadingLabel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {headingOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setHeadingOpen(false)} />
              <div className="absolute z-20 mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-1">
                {HEADING_OPTIONS.map((h) => (
                  <button
                    key={h.level}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (h.level === 0) editor.chain().focus().setParagraph().run();
                      else editor.chain().focus().toggleHeading({ level: h.level as any }).run();
                      setHeadingOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 hover:bg-emerald-50 ${h.className}`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <Sep />

        {/* Inline marks */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <Code className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <Highlighter className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Lists & blocks */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Insert divider">
          <Minus className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Alignment */}
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Link */}
        <div className="relative">
          <ToolbarBtn
            onClick={() => {
              const existing = editor.getAttributes('link').href || '';
              setLinkUrl(existing);
              setLinkOpen(true);
            }}
            active={editor.isActive('link')}
            title="Insert link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          {linkOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setLinkOpen(false); setLinkUrl(''); }} />
              <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-72">
                <p className="text-xs font-medium text-gray-700 mb-2">Insert link</p>
                <input
                  autoFocus
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                    if (e.key === 'Escape') { setLinkOpen(false); setLinkUrl(''); }
                  }}
                  placeholder="https://example.com or /tours/goa"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none mb-2"
                />
                <p className="text-[10px] text-gray-400 mb-2">External URLs or internal paths starting with /</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyLink}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700"
                  >
                    <Check className="w-3 h-3" /> Apply
                  </button>
                  {editor.isActive('link') && (
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false); setLinkUrl(''); }}
                      className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setLinkOpen(false); setLinkUrl(''); }}
                    className="flex items-center justify-center px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Clear formatting */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
        >
          <Eraser className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Undo/Redo */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
          <Undo className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Shift+Z)">
          <Redo className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      <div
        className="relative overflow-y-auto"
        style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
      >
        {!editor.getText() && (
          <div className="absolute top-3 left-4 text-sm text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

'use client';

/**
 * Rich-text editor for a single page section. TipTap-based with full
 * toolbar (bold/italic/headings/lists/links/images/video/alignment/HTML
 * source). Extracted from the city-pages admin so it can be shared by
 * service-city pages and any future block-based editor.
 *
 * Storage: emits HTML strings via onChange.
 */

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TiptapImage from '@tiptap/extension-image';
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Quote, Undo, Redo, Link2, AlignLeft, AlignCenter, AlignRight,
  UnderlineIcon, Strikethrough, Code2, Highlighter, Minus, ImageIcon,
  X, Video, Loader2,
} from 'lucide-react';

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

export function RichTextSectionEditor({ value, onChange, placeholder }: {
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
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" multiple className="hidden" onChange={handleImageFiles} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/mov,video/quicktime" className="hidden" onChange={handleVideoFile} />

      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
        {htmlMode ? (
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
              Apply &amp; Back to Editor
            </button>
          </>
        ) : (
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

      {uploading && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Uploading file...
        </div>
      )}

      {htmlMode && (
        <textarea
          value={rawHtml}
          onChange={handleRawHtmlChange}
          spellCheck={false}
          className="w-full min-h-[300px] p-4 font-mono text-xs text-gray-800 bg-amber-50 focus:outline-none resize-y"
          placeholder="Paste or write raw HTML here..."
        />
      )}

      {!htmlMode && <EditorContent editor={editor} />}
    </div>
  );
}

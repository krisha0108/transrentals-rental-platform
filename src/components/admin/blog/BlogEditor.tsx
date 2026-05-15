'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import { useCallback, useEffect, useState } from 'react';
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link2, ImageIcon, AlignLeft, AlignCenter,
  AlignRight, Undo, Redo, Highlighter, X, Check, Type,
} from 'lucide-react';

interface BlogEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 self-center" />;
}

export default function BlogEditor({ content, onChange, placeholder }: BlogEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: {},
        orderedList: {},
        blockquote: {},
        code: {},
        codeBlock: { languageClassPrefix: 'language-' },
        horizontalRule: {},
        bold: {},
        italic: {},
        strike: {},
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full my-4' },
        inline: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your blog post...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Highlight.configure({ multicolor: false }),
      CharacterCount,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-6 py-5 text-gray-800 prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-blue-600 prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-lg',
      },
    },
  });

  // Sync external content changes into Tiptap (e.g. AI apply)
  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
    setImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');
  }, [editor, imageUrl, imageAlt]);

  const uploadImageFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'blog');
      const res = await fetch('/api/admin/media', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.media?.[0]?.url || data.media?.url;
        if (url) {
          editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, '') }).run();
        }
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [editor]);

  if (!editor) return null;

  const wordCount = editor.storage.characterCount?.words() || 0;
  const charCount = editor.storage.characterCount?.characters() || 0;

  return (
    <div className="border border-gray-300 rounded-xl bg-white shadow-sm">
      {/* Toolbar — sticky below the page save-bar (~56px) */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50 sticky top-14 z-20 rounded-t-xl shadow-sm">
        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          title="Paragraph"
        >
          <Type className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              const prev = editor.getAttributes('link').href || '';
              setLinkUrl(prev);
              setLinkDialogOpen(true);
            }}
            active={editor.isActive('link')}
            title="Insert Link"
          >
            <Link2 className="w-4 h-4" />
          </ToolbarButton>
          {linkDialogOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 w-72">
              <p className="text-xs font-medium text-gray-700 mb-2">Insert Link</p>
              <input
                autoFocus
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setLink()}
                placeholder="https://example.com"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-2"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={setLink}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                >
                  <Check className="w-3 h-3" /> Apply
                </button>
                <button
                  type="button"
                  onClick={() => { setLinkDialogOpen(false); setLinkUrl(''); }}
                  className="flex items-center justify-center px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative">
          <ToolbarButton onClick={() => setImageDialogOpen(!imageDialogOpen)} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          {imageDialogOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 w-80">
              <p className="text-xs font-medium text-gray-700 mb-2">Insert Image</p>

              {/* Upload */}
              <label className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 cursor-pointer mb-2 transition-colors">
                {uploading ? 'Uploading...' : '📁 Upload from device'}
                <input type="file" accept="image/*" onChange={uploadImageFile} className="hidden" />
              </label>

              <p className="text-xs text-gray-400 text-center mb-2">or paste URL</p>

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 mb-1.5"
              />
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Alt text (for SEO)"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 mb-2"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={insertImage}
                  className="flex-1 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => { setImageDialogOpen(false); setImageUrl(''); setImageAlt(''); }}
                  className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="min-h-[500px]" />

      {/* Footer - word count */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 rounded-b-xl">
        <span>{wordCount} words · {charCount} characters</span>
        <span>~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
      </div>

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none;
        }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; line-height: 1.3; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.5rem; line-height: 1.35; }
        .ProseMirror h4 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .ProseMirror p { margin: 0.75rem 0; line-height: 1.75; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
        .ProseMirror li { margin: 0.25rem 0; line-height: 1.7; }
        .ProseMirror blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; color: #4b5563; font-style: italic; background: #eff6ff; padding: 0.75rem 1rem; border-radius: 0 0.5rem 0.5rem 0; }
        .ProseMirror code { background: #f1f5f9; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; font-family: monospace; color: #e11d48; }
        .ProseMirror pre { background: #1e293b; color: #e2e8f0; padding: 1rem 1.25rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
        .ProseMirror pre code { background: none; color: inherit; padding: 0; }
        .ProseMirror hr { border: none; border-top: 2px solid #e5e7eb; margin: 1.5rem 0; }
        .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 1rem 0; }
        .ProseMirror mark { background: #fef08a; padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .ProseMirror a:hover { color: #1d4ed8; }
      `}</style>
    </div>
  );
}

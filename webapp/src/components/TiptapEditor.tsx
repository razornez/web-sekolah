"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useCallback } from "react";

const btnCls = (active: boolean) =>
  `rounded px-2 py-1 text-xs font-medium transition-colors ${
    active
      ? "bg-gray-900 text-white"
      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
  }`;

const sep = <div className="h-5 w-px bg-gray-200" />;

export function TiptapEditor({
  name = "isi",
  defaultValue = "",
  placeholder = "Tulis isi pengumuman…",
  minHeight = "200px",
  onChange,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  minHeight?: string;
  onChange?: (html: string) => void;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { languageClassPrefix: "language-" } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue,
    onUpdate: ({ editor }) => { const h = editor.getHTML(); setHtml(h); onChange?.(h); },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-[200px]",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  const setLink = useCallback(() => {
    const url = window.prompt("URL:", editor?.getAttributes("link").href);
    if (url === null) return;
    if (url === "") { editor?.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-gray-300 focus-within:border-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        {/* Undo / Redo */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnCls(false)} title="Undo">↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnCls(false)} title="Redo">↪</button>
        {sep}

        {/* Heading */}
        {([1, 2, 3] as const).map((level) => (
          <button key={level} type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={btnCls(editor.isActive("heading", { level }))}
            title={`Heading ${level}`}
          >H{level}</button>
        ))}
        {sep}

        {/* Formatting */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive("bold"))} title="Bold"><b>B</b></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive("italic"))} title="Italic"><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnCls(editor.isActive("underline"))} title="Underline"><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnCls(editor.isActive("strike"))} title="Strikethrough"><s>S</s></button>
        {sep}

        {/* Alignment */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btnCls(editor.isActive({ textAlign: "left" }))} title="Rata kiri">⬅</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btnCls(editor.isActive({ textAlign: "center" }))} title="Rata tengah">↔</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btnCls(editor.isActive({ textAlign: "right" }))} title="Rata kanan">➡</button>
        {sep}

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive("bulletList"))} title="Bullet list">• —</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive("orderedList"))} title="Numbered list">1.</button>
        {sep}

        {/* Blocks */}
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnCls(editor.isActive("blockquote"))} title="Blockquote">❝</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btnCls(editor.isActive("code"))} title="Code">`</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnCls(editor.isActive("codeBlock"))} title="Code block">{ }</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnCls(false)} title="Garis horizontal">—</button>
        {sep}

        {/* Link */}
        <button type="button" onClick={setLink} className={btnCls(editor.isActive("link"))} title="Tambah tautan">🔗</button>

        {/* Clear */}
        <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={btnCls(false)} title="Hapus semua format">✕</button>
      </div>

      {/* Editor area */}
      <div className="bg-white">
        <style>{`
          .tiptap p { margin: 0 0 0.75rem 0; }
          .tiptap h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
          .tiptap h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.4rem; }
          .tiptap h3 { font-size: 1.1rem; font-weight: 600; margin: 0.6rem 0 0.3rem; }
          .tiptap ul, .tiptap ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
          .tiptap li { margin-bottom: 0.2rem; }
          .tiptap blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 0.75rem 0; }
          .tiptap code { background: #f3f4f6; border-radius: 3px; padding: 0 4px; font-size: 0.85em; }
          .tiptap pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 6px; overflow-x: auto; margin: 0.75rem 0; }
          .tiptap a { color: #2563eb; text-decoration: underline; }
          .tiptap hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
          .tiptap p.is-editor-empty:first-child::before { color: #9ca3af; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      {/* Hidden input untuk FormData */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

"use client";
import React, { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, Link2, ImageIcon,
  Highlighter, List, ListOrdered, Heading2, Heading3, Quote,
  Undo, Redo,
} from "lucide-react";

const LOCALES = [
  { id: "en", label: "English" },
  { id: "ka", label: "Georgian" },
  { id: "pl", label: "Polish" },
] as const;

type Locale = "en" | "ka" | "pl";

interface TranslationData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
}

export interface PostFormData {
  cover_image: string;
  author_name: string;
  tags: string;
  status: "draft" | "published";
  published_at: string;
  translations: Record<Locale, TranslationData>;
}

interface Props {
  initialData?: {
    id?: string;
    cover_image?: string | null;
    author_name?: string;
    tags?: string[];
    status?: "draft" | "published";
    published_at?: string | null;
    blog_post_translations?: Array<{
      locale: string;
      slug: string;
      title: string;
      excerpt: string;
      content: string;
    }>;
  };
  mode: "new" | "edit";
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function TiptapEditor({
  content,
  onChange,
  onImageUpload,
}: {
  content: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Write your post content here…" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const handleImageInsert = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    };
    input.click();
  }, [editor, onImageUpload]);

  const handleLinkInsert = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const btnStyle = (active = false): React.CSSProperties => ({
    background: active ? "#f59e0b22" : "transparent",
    border: "none",
    borderRadius: 4,
    padding: "4px 6px",
    cursor: "pointer",
    color: active ? "#f59e0b" : "#94a3b8",
    display: "inline-flex",
    alignItems: "center",
  });

  const Divider = () => (
    <span style={{ width: 1, height: 18, background: "#2a2d3a", display: "inline-block", margin: "0 4px" }} />
  );

  return (
    <div style={{ border: "1px solid #2a2d3a", borderRadius: 8, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ background: "#13151f", borderBottom: "1px solid #2a2d3a", padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <button style={btnStyle()} onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={14} /></button>
        <button style={btnStyle()} onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={14} /></button>
        <Divider />
        <button style={btnStyle(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></button>
        <button style={btnStyle(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></button>
        <button style={btnStyle(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></button>
        <button style={btnStyle(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></button>
        <button style={btnStyle(editor.isActive("highlight"))} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter size={14} /></button>
        <Divider />
        <button style={btnStyle(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></button>
        <button style={btnStyle(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></button>
        <button style={btnStyle(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></button>
        <Divider />
        <button style={btnStyle(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></button>
        <button style={btnStyle(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></button>
        <Divider />
        <button style={btnStyle(editor.isActive({ textAlign: "left" }))} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={14} /></button>
        <button style={btnStyle(editor.isActive({ textAlign: "center" }))} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={14} /></button>
        <button style={btnStyle(editor.isActive({ textAlign: "right" }))} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={14} /></button>
        <Divider />
        <button style={btnStyle(editor.isActive("link"))} onClick={handleLinkInsert}><Link2 size={14} /></button>
        <button style={btnStyle()} onClick={handleImageInsert}><ImageIcon size={14} /></button>
      </div>

      {/* Editor area */}
      <div style={{ background: "#0d0f18", minHeight: 320, padding: "12px 16px" }}>
        <style>{`
          .tiptap-editor .ProseMirror { outline: none; color: #e2e8f0; font-size: 14px; line-height: 1.7; }
          .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #475569; pointer-events: none; float: left; height: 0; }
          .tiptap-editor .ProseMirror h2 { font-size: 20px; font-weight: 700; margin: 16px 0 8px; color: #f1f5f9; }
          .tiptap-editor .ProseMirror h3 { font-size: 16px; font-weight: 700; margin: 12px 0 6px; color: #f1f5f9; }
          .tiptap-editor .ProseMirror blockquote { border-left: 3px solid #f59e0b; padding-left: 12px; color: #94a3b8; margin: 12px 0; }
          .tiptap-editor .ProseMirror ul { padding-left: 20px; list-style: disc; }
          .tiptap-editor .ProseMirror ol { padding-left: 20px; list-style: decimal; }
          .tiptap-editor .ProseMirror img { max-width: 100%; border-radius: 6px; margin: 8px 0; }
          .tiptap-editor .ProseMirror a { color: #f59e0b; text-decoration: underline; }
          .tiptap-editor .ProseMirror mark { background: #f59e0b33; color: #fbbf24; border-radius: 2px; padding: 0 2px; }
        `}</style>
        <div className="tiptap-editor">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0d0f18",
  border: "1px solid #2a2d3a",
  borderRadius: 8,
  padding: "9px 12px",
  color: "#f1f5f9",
  fontSize: 13,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 6,
};

export default function BlogPostForm({ initialData, mode }: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const getTranslation = (loc: Locale): TranslationData => {
    const t = initialData?.blog_post_translations?.find((x) => x.locale === loc);
    return {
      slug: t?.slug ?? "",
      title: t?.title ?? "",
      excerpt: t?.excerpt ?? "",
      content: t?.content ?? "",
    };
  };

  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? "");
  const [authorName, setAuthorName] = useState(initialData?.author_name ?? "");
  const [tags, setTags] = useState((initialData?.tags ?? []).join(", "));
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(
    initialData?.published_at ? initialData.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [translations, setTranslations] = useState<Record<Locale, TranslationData>>({
    en: getTranslation("en"),
    ka: getTranslation("ka"),
    pl: getTranslation("pl"),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  const updateTranslation = (loc: Locale, field: keyof TranslationData, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [loc]: { ...prev[loc], [field]: value },
    }));
  };

  const handleTitleChange = (loc: Locale, value: string) => {
    updateTranslation(loc, "title", value);
    if (!translations[loc].slug || translations[loc].slug === slugify(translations[loc].title)) {
      updateTranslation(loc, "slug", slugify(value));
    }
  };

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/blog/upload", { method: "POST", body: fd });
    const json = await res.json();
    return json.url ?? "";
  }, []);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const url = await uploadImage(file);
    setCoverImage(url);
    setCoverUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const payload = {
      cover_image: coverImage || null,
      author_name: authorName,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      published_at: status === "published" ? new Date(publishedAt).toISOString() : null,
      translations: LOCALES.map(({ id }) => ({
        locale: id,
        slug: translations[id].slug || slugify(translations["en"].title) + (id !== "en" ? `-${id}` : ""),
        title: translations[id].title,
        excerpt: translations[id].excerpt,
        content: translations[id].content,
      })).filter((t) => t.title || t.content),
    };

    const url = mode === "edit" && initialData?.id ? `/api/blog/${initialData.id}` : "/api/blog";
    const method = mode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save post");
      setSaving(false);
      return;
    }

    router.push(`/${locale}/admin?tab=blog`);
  };

  const t = translations[activeLocale];

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: "#f8fafc", margin: 0 }}>
          {mode === "new" ? "New Post" : "Edit Post"}
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push(`/${locale}/admin?tab=blog`)}
            style={{ ...inputStyle, width: "auto", padding: "8px 16px", cursor: "pointer", fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: saving ? "#92400e" : "#f59e0b",
              color: "#0f1117",
              border: "none",
              borderRadius: 8,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving…" : status === "published" ? "Save & Publish" : "Save Draft"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        {/* Left: per-locale content */}
        <div>
          {/* Locale tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2a2d3a", marginBottom: 20 }}>
            {LOCALES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveLocale(id)}
                style={{
                  padding: "8px 18px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeLocale === id ? "2px solid #f59e0b" : "2px solid transparent",
                  color: activeLocale === id ? "#fbbf24" : "#64748b",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: activeLocale === id ? 700 : 500,
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                style={inputStyle}
                value={t.title}
                onChange={(e) => handleTitleChange(activeLocale, e.target.value)}
                placeholder="Post title"
              />
            </div>

            <div>
              <label style={labelStyle}>Slug</label>
              <input
                style={{ ...inputStyle, fontFamily: "monospace", color: "#94a3b8" }}
                value={t.slug}
                onChange={(e) => updateTranslation(activeLocale, "slug", slugify(e.target.value))}
                placeholder="url-slug"
              />
            </div>

            <div>
              <label style={labelStyle}>Excerpt</label>
              <textarea
                style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
                value={t.excerpt}
                onChange={(e) => updateTranslation(activeLocale, "excerpt", e.target.value)}
                placeholder="Short description shown in listings"
              />
            </div>

            <div>
              <label style={labelStyle}>Content</label>
              <TiptapEditor
                content={t.content}
                onChange={(html) => updateTranslation(activeLocale, "content", html)}
                onImageUpload={uploadImage}
              />
            </div>
          </div>
        </div>

        {/* Right: shared metadata */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {status === "published" && (
            <div>
              <label style={labelStyle}>Publish Date</label>
              <input
                type="date"
                style={inputStyle}
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Author</label>
            <input
              style={inputStyle}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Author name"
            />
          </div>

          <div>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input
              style={inputStyle}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="AI, Translation, Guide"
            />
          </div>

          <div>
            <label style={labelStyle}>Cover Image</label>
            {coverImage && (
              <div style={{ marginBottom: 8, borderRadius: 6, overflow: "hidden", border: "1px solid #2a2d3a" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="Cover" style={{ width: "100%", display: "block", maxHeight: 160, objectFit: "cover" }} />
              </div>
            )}
            <label
              style={{
                display: "block",
                padding: "8px 12px",
                background: "#13151f",
                border: "1px dashed #2a2d3a",
                borderRadius: 8,
                color: "#64748b",
                fontSize: 12,
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              {coverUploading ? "Uploading…" : "Click to upload image"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
            </label>
            {coverImage && (
              <button
                onClick={() => setCoverImage("")}
                style={{ ...inputStyle, marginTop: 6, color: "#f87171", cursor: "pointer", textAlign: "center", width: "auto", padding: "5px 10px", fontSize: 11 }}
              >
                Remove cover
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

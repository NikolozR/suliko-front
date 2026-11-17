"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { deleteBlogPost } from "@/lib/site-content-client";

interface Translation {
  locale: string;
  title: string;
  slug: string;
}

export interface PostRow {
  id: string;
  author_name: string;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  blog_post_translations: Translation[];
}

interface Props {
  initialPosts: PostRow[];
}

export default function BlogPostsTable({ initialPosts }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(id);
    try {
      await deleteBlogPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete post");
    }
    setDeleting(null);
  }

  function getTitle(post: PostRow) {
    return (
      post.blog_post_translations.find((t) => t.locale === "en")?.title ||
      post.blog_post_translations[0]?.title ||
      "–"
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 18, color: "var(--foreground)", margin: 0 }}>
          Blog Posts
        </h2>
        <Link
          href={`/${locale}/admin/blog/new`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--accent-text)",
            color: "var(--background)",
            padding: "8px 16px",
            borderRadius: 8,
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          <Plus size={14} />
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div style={{ color: "var(--muted-foreground)", padding: "32px 0", textAlign: "center", fontSize: 14 }}>
          No posts yet. Create your first one.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Title (EN)", "Author", "Tags", "Status", "Published", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "var(--muted-foreground)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      fontSize: 11,
                      letterSpacing: "0.07em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  style={{ borderBottom: "1px solid var(--muted)" }}
                >
                  <td style={{ padding: "12px", color: "var(--foreground)", maxWidth: 260 }}>
                    <span style={{ fontWeight: 600 }}>{getTitle(post)}</span>
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                    {post.author_name || "–"}
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted-foreground)" }}>
                    {post.tags?.length
                      ? post.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              display: "inline-block",
                              background: "var(--muted)",
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              padding: "2px 7px",
                              fontSize: 11,
                              marginRight: 4,
                              color: "var(--muted-foreground)",
                            }}
                          >
                            {tag}
                          </span>
                        ))
                      : "–"}
                  </td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: post.status === "published" ? "color-mix(in srgb, var(--status-success) 12%, transparent)" : "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
                        color: post.status === "published" ? "var(--status-success)" : "var(--muted-foreground)",
                        border: `1px solid ${post.status === "published" ? "color-mix(in srgb, var(--status-success) 25%, transparent)" : "color-mix(in srgb, var(--muted-foreground) 30%, transparent)"}`,
                      }}
                    >
                      {post.status === "published" ? <Eye size={10} /> : <EyeOff size={10} />}
                      {post.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("en-GB")
                      : "–"}
                  </td>
                  <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href={`/${locale}/admin/blog/${post.id}/edit`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 10px",
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          color: "var(--muted-foreground)",
                          fontSize: 12,
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={12} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 10px",
                          background: "transparent",
                          border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
                          borderRadius: 6,
                          color: "var(--destructive)",
                          fontSize: 12,
                          cursor: "pointer",
                          opacity: deleting === post.id ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={12} />
                        {deleting === post.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { API_BASE_URL } from '@/shared/constants/api';
import { format } from 'date-fns';
import type { BlogPost, BlogPostRow } from './blog-types';

export type { BlogPost } from './blog-types';

function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function rowToPost(row: BlogPostRow, locale: string): BlogPost {
  const translation = row.blog_post_translations.find((t) => t.locale === locale)
    ?? row.blog_post_translations.find((t) => t.locale === 'en')
    ?? row.blog_post_translations[0];

  return {
    id: row.id,
    slug: translation?.slug ?? row.id,
    title: translation?.title ?? '',
    date: row.published_at ?? row.created_at,
    excerpt: translation?.excerpt ?? '',
    coverImage: row.cover_image ?? undefined,
    author: row.author_name,
    tags: row.tags ?? [],
    content: translation?.content ?? '',
    readingTime: estimateReadingTime(translation?.content ?? ''),
    status: row.status,
    locale,
  };
}

/**
 * A published-content read from the API, which keeps the blog (it used to be in Supabase).
 * Failures read as nothing, so the blog shows "no posts" rather than an error page.
 * Answers are kept for five minutes, so a post an admin publishes shows up soon.
 */
async function read<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) {
      if (res.status !== 404) console.error(`Blog: ${path} answered ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`Blog: could not read ${path}:`, error);
    return null;
  }
}

/** Published posts, newest first. */
export async function getAllPosts(locale = 'en'): Promise<BlogPost[]> {
  const rows = await read<BlogPostRow[]>('/Blog/posts');
  return (rows ?? []).map((row) => rowToPost(row, locale));
}

export async function getPostBySlug(slug: string, locale = 'en'): Promise<BlogPost | null> {
  // A slug in any locale opens the post, so posts with only one locale still resolve;
  // rowToPost then falls back to 'en' if the requested locale has no translation.
  const row = await read<BlogPostRow>(`/Blog/posts/by-slug/${encodeURIComponent(slug)}`);
  return row ? rowToPost(row, locale) : null;
}

export async function getAllPostSlugs(): Promise<{ slug: string; locale: string }[]> {
  return (await read<{ slug: string; locale: string }[]>('/Blog/slugs')) ?? [];
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMMM dd, yyyy');
}

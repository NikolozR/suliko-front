import { supabase } from './supabase';
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

export async function getAllPosts(locale = 'en'): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, blog_post_translations(*)')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  return (data as BlogPostRow[]).map((row) => rowToPost(row, locale));
}

export async function getPostBySlug(slug: string, locale = 'en'): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_post_translations')
    .select('post_id, blog_posts(*, blog_post_translations(*))')
    .eq('slug', slug)
    .eq('locale', locale)
    .single();

  if (error || !data) {
    console.error(`Error fetching post by slug "${slug}":`, error);
    return null;
  }

  const post = (data as unknown as { blog_posts: BlogPostRow }).blog_posts;
  if (!post || post.status !== 'published') return null;

  return rowToPost(post, locale);
}

export async function getAllPostSlugs(): Promise<{ slug: string; locale: string }[]> {
  const { data, error } = await supabase
    .from('blog_post_translations')
    .select('slug, locale, blog_posts!inner(status)')
    .eq('blog_posts.status', 'published');

  if (error) {
    console.error('Error fetching post slugs:', error);
    return [];
  }

  return (data ?? []).map((row: { slug: string; locale: string }) => ({
    slug: row.slug,
    locale: row.locale,
  }));
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMMM dd, yyyy');
}

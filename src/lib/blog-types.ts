export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  tags: string[];
  content: string;
  readingTime: string;
  status: 'draft' | 'published';
  locale: string;
}

export interface BlogPostTranslation {
  id: string;
  post_id: string;
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
}

export interface BlogPostRow {
  id: string;
  cover_image: string | null;
  author_name: string;
  tags: string[];
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  blog_post_translations: BlogPostTranslation[];
}

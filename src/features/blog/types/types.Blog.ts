export interface BlogPost {
  id: string;
  title: Record<string, string>; // { en: "...", ka: "...", pl: "..." }
  excerpt: Record<string, string>;
  content: Record<string, string>;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  featuredImage?: string;
  readTime: number;
  published: boolean;
  featured: boolean;
}

export interface BlogCategory {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
}

export interface BlogData {
  posts: BlogPost[];
  categories: BlogCategory[];
  meta: {
    totalPosts: number;
    lastUpdated: string;
  };
}

export interface BlogFilters {
  category?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
}

export interface BlogPostMetadata {
  title: string;
  description: string;
  publishedTime: string;
  modifiedTime: string;
  authors: Array<{
    name: string;
    url?: string;
  }>;
  tags: string[];
  category: string;
}

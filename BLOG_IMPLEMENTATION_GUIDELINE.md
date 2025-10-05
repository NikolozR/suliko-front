# Blog Page Implementation Guideline

## Overview
This guideline provides step-by-step instructions for adding a blog page to the Suliko application that follows the existing project architecture and patterns.

## Project Architecture Analysis
Based on the codebase analysis, the project follows these patterns:
- **Next.js 14+ with App Router** using `[locale]` dynamic routing
- **Internationalization** with next-intl (English, Georgian, Polish)
- **Feature-based architecture** under `src/features/`
- **Zustand for state management**
- **TypeScript throughout**
- **Tailwind CSS for styling**
- **Component composition** with shared UI components

## 1. Data Structure & JSON File Format

### Blog Data Structure
Create the following JSON structure for blog posts:

```json
{
  "posts": [
    {
      "id": "unique-slug",
      "title": {
        "en": "Blog Post Title",
        "ka": "ბლოგის პოსტის სათაური",
        "pl": "Tytuł posta na blogu"
      },
      "excerpt": {
        "en": "Brief description of the blog post...",
        "ka": "მოკლე აღწერა...",
        "pl": "Krótki opis posta..."
      },
      "content": {
        "en": "Full blog post content in markdown format...",
        "ka": "სრული კონტენტი...",
        "pl": "Pełna treść posta..."
      },
      "author": {
        "name": "Author Name",
        "email": "author@example.com",
        "avatar": "/path/to/avatar.jpg"
      },
      "publishedAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "tags": ["translation", "ai", "technology"],
      "category": "technology",
      "featuredImage": "/path/to/featured-image.jpg",
      "readTime": 5,
      "published": true,
      "featured": false
    }
  ],
  "categories": [
    {
      "id": "technology",
      "name": {
        "en": "Technology",
        "ka": "ტექნოლოგია",
        "pl": "Technologia"
      },
      "description": {
        "en": "Posts about technology and innovation",
        "ka": "პოსტები ტექნოლოგიისა და ინოვაციის შესახებ",
        "pl": "Posty o technologii i innowacjach"
      }
    }
  ],
  "meta": {
    "totalPosts": 1,
    "lastUpdated": "2024-01-15T10:00:00Z"
  }
}
```

### File Location
Place the blog data file at: `src/data/blog.json`

## 2. Feature Architecture

### Directory Structure
Create the following structure under `src/features/blog/`:

```
src/features/blog/
├── components/
│   ├── index.ts
│   ├── BlogCard.tsx
│   ├── BlogGrid.tsx
│   ├── BlogPost.tsx
│   ├── BlogSidebar.tsx
│   ├── BlogPagination.tsx
│   ├── BlogSearch.tsx
│   ├── BlogCategories.tsx
│   └── BlogHero.tsx
├── hooks/
│   ├── useBlogPosts.ts
│   ├── useBlogCategories.ts
│   └── useBlogSearch.ts
├── services/
│   ├── blogService.ts
│   └── blogApi.ts
├── store/
│   ├── blogStore.ts
│   └── blogFiltersStore.ts
├── types/
│   ├── types.Blog.ts
│   └── types.BlogPost.ts
├── utils/
│   ├── blogHelpers.ts
│   ├── blogFilters.ts
│   └── markdownRenderer.ts
└── index.ts
```

## 3. Type Definitions

### Core Types (`src/features/blog/types/types.Blog.ts`)
```typescript
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
```

## 4. State Management

### Blog Store (`src/features/blog/store/blogStore.ts`)
```typescript
import { create } from 'zustand';
import { BlogPost, BlogCategory, BlogFilters } from '../types/types.Blog';

interface BlogState {
  posts: BlogPost[];
  categories: BlogCategory[];
  filteredPosts: BlogPost[];
  currentPost: BlogPost | null;
  filters: BlogFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPosts: (posts: BlogPost[]) => void;
  setCategories: (categories: BlogCategory[]) => void;
  setCurrentPost: (post: BlogPost | null) => void;
  setFilters: (filters: BlogFilters) => void;
  applyFilters: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useBlogStore = create<BlogState>((set, get) => ({
  posts: [],
  categories: [],
  filteredPosts: [],
  currentPost: null,
  filters: {},
  isLoading: false,
  error: null,
  
  setPosts: (posts) => set({ posts, filteredPosts: posts }),
  setCategories: (categories) => set({ categories }),
  setCurrentPost: (currentPost) => set({ currentPost }),
  setFilters: (filters) => {
    set({ filters });
    get().applyFilters();
  },
  applyFilters: () => {
    const { posts, filters } = get();
    let filtered = [...posts];
    
    if (filters.category) {
      filtered = filtered.filter(post => post.category === filters.category);
    }
    
    if (filters.tag) {
      filtered = filtered.filter(post => post.tags.includes(filters.tag));
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post => 
        Object.values(post.title).some(title => 
          title.toLowerCase().includes(searchLower)
        ) ||
        Object.values(post.excerpt).some(excerpt => 
          excerpt.toLowerCase().includes(searchLower)
        )
      );
    }
    
    if (filters.featured) {
      filtered = filtered.filter(post => post.featured);
    }
    
    set({ filteredPosts: filtered });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({
    posts: [],
    categories: [],
    filteredPosts: [],
    currentPost: null,
    filters: {},
    isLoading: false,
    error: null
  })
}));
```

## 5. Services

### Blog Service (`src/features/blog/services/blogService.ts`)
```typescript
import { BlogData, BlogPost, BlogCategory } from '../types/types.Blog';
import blogData from '../../../data/blog.json';

export class BlogService {
  private static instance: BlogService;
  private blogData: BlogData;

  private constructor() {
    this.blogData = blogData as BlogData;
  }

  public static getInstance(): BlogService {
    if (!BlogService.instance) {
      BlogService.instance = new BlogService();
    }
    return BlogService.instance;
  }

  public async getPosts(): Promise<BlogPost[]> {
    return this.blogData.posts.filter(post => post.published);
  }

  public async getPostById(id: string): Promise<BlogPost | null> {
    const post = this.blogData.posts.find(post => post.id === id);
    return post && post.published ? post : null;
  }

  public async getCategories(): Promise<BlogCategory[]> {
    return this.blogData.categories;
  }

  public async getFeaturedPosts(): Promise<BlogPost[]> {
    return this.blogData.posts.filter(post => post.published && post.featured);
  }

  public async getPostsByCategory(categoryId: string): Promise<BlogPost[]> {
    return this.blogData.posts.filter(post => 
      post.published && post.category === categoryId
    );
  }

  public async getRecentPosts(limit: number = 5): Promise<BlogPost[]> {
    return this.blogData.posts
      .filter(post => post.published)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  }
}
```

## 6. Page Structure

### Main Blog Page (`src/app/[locale]/(main)/blog/page.tsx`)
```typescript
import { Suspense } from 'react';
import BlogPage from '@/features/blog/components/BlogPage';
import BlogSkeleton from '@/features/blog/components/BlogSkeleton';

export default function Blog() {
  return (
    <Suspense fallback={<BlogSkeleton />}>
      <BlogPage />
    </Suspense>
  );
}
```

### Individual Blog Post (`src/app/[locale]/(main)/blog/[slug]/page.tsx`)
```typescript
import { notFound } from 'next/navigation';
import BlogPost from '@/features/blog/components/BlogPost';
import { BlogService } from '@/features/blog/services/blogService';

interface BlogPostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const blogService = BlogService.getInstance();
  const post = await blogService.getPostById(slug);

  if (!post) {
    notFound();
  }

  return <BlogPost post={post} />;
}

export async function generateStaticParams() {
  const blogService = BlogService.getInstance();
  const posts = await blogService.getPosts();
  
  return posts.map((post) => ({
    slug: post.id,
  }));
}
```

## 7. Component Examples

### Blog Card Component (`src/features/blog/components/BlogCard.tsx`)
```typescript
"use client";

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { BlogPost } from '../types/types.Blog';
import { Card, CardContent, CardFooter, CardHeader } from '@/features/ui/components/ui/card';
import { Badge } from '@/features/ui/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const locale = useLocale();

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        {post.featuredImage && (
          <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden">
            <img 
              src={post.featuredImage} 
              alt={post.title[locale]}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-2">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <h3 className="text-xl font-semibold line-clamp-2">
          {post.title[locale]}
        </h3>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">
          {post.excerpt[locale]}
        </p>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{post.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{post.readTime} min read</span>
          </div>
        </div>
        <Link 
          href={`/blog/${post.id}`}
          className="text-primary hover:underline font-medium"
        >
          Read More
        </Link>
      </CardFooter>
    </Card>
  );
}
```

## 8. Internationalization Setup

### Add Blog Translations to Message Files

#### English (`messages/en.json`)
Add to existing structure:
```json
{
  "Blog": {
    "title": "Blog",
    "description": "Latest insights and updates from Suliko",
    "readMore": "Read More",
    "readTime": "{minutes} min read",
    "publishedOn": "Published on {date}",
    "byAuthor": "By {author}",
    "categories": "Categories",
    "tags": "Tags",
    "search": "Search posts...",
    "noPosts": "No blog posts found",
    "featured": "Featured",
    "recent": "Recent Posts",
    "allPosts": "All Posts"
  }
}
```

#### Georgian (`messages/ka.json`)
```json
{
  "Blog": {
    "title": "ბლოგი",
    "description": "უახლესი ინფორმაცია და განახლებები Suliko-დან",
    "readMore": "წაიკითხე მეტი",
    "readTime": "{minutes} წუთი",
    "publishedOn": "გამოქვეყნდა {date}",
    "byAuthor": "{author}-ის მიერ",
    "categories": "კატეგორიები",
    "tags": "ტაგები",
    "search": "ძებნა პოსტების...",
    "noPosts": "ბლოგის პოსტები არ მოიძებნა",
    "featured": "რეკომენდებული",
    "recent": "ბოლო პოსტები",
    "allPosts": "ყველა პოსტი"
  }
}
```

#### Polish (`messages/pl.json`)
```json
{
  "Blog": {
    "title": "Blog",
    "description": "Najnowsze informacje i aktualizacje z Suliko",
    "readMore": "Czytaj więcej",
    "readTime": "{minutes} min czytania",
    "publishedOn": "Opublikowano {date}",
    "byAuthor": "Autor: {author}",
    "categories": "Kategorie",
    "tags": "Tagi",
    "search": "Szukaj postów...",
    "noPosts": "Nie znaleziono postów na blogu",
    "featured": "Polecane",
    "recent": "Najnowsze posty",
    "allPosts": "Wszystkie posty"
  }
}
```

## 9. Navigation Integration

### Update Sidebar (`src/shared/components/Sidebar.tsx`)
Add blog to NAV_ITEMS:
```typescript
const NAV_ITEMS = [
  {
    label: "newProject",
    href: "/text",
    icon: Plus,
  },
  {
    label: "blog", // Add this
    href: "/blog",
    icon: BookOpen, // Import BookOpen from lucide-react
  },
  {
    label: "profile",
    href: "/profile",
    icon: User,
    requiresAuth: true,
  },
  // ... rest of items
];
```

## 10. Implementation Checklist

### Phase 1: Setup
- [ ] Create `src/data/blog.json` with sample blog data
- [ ] Create blog feature directory structure
- [ ] Set up TypeScript types
- [ ] Create blog service
- [ ] Set up Zustand store

### Phase 2: Core Components
- [ ] Create BlogCard component
- [ ] Create BlogGrid component
- [ ] Create BlogPost component
- [ ] Create BlogPage component
- [ ] Create loading skeletons

### Phase 3: Features
- [ ] Implement search functionality
- [ ] Add category filtering
- [ ] Add tag filtering
- [ ] Implement pagination
- [ ] Add featured posts section

### Phase 4: Pages & Routing
- [ ] Create main blog page (`/blog`)
- [ ] Create individual post pages (`/blog/[slug]`)
- [ ] Add generateStaticParams for SSG
- [ ] Set up proper metadata

### Phase 5: Internationalization
- [ ] Add blog translations to all locale files
- [ ] Implement locale-aware content rendering
- [ ] Add locale-specific date formatting

### Phase 6: Integration
- [ ] Update sidebar navigation
- [ ] Add blog to main layout if needed
- [ ] Test responsive design
- [ ] Add SEO metadata

### Phase 7: Enhancement
- [ ] Add reading progress indicator
- [ ] Implement social sharing
- [ ] Add related posts
- [ ] Add comment system (optional)
- [ ] Add RSS feed (optional)

## 11. Best Practices

### Performance
- Use `generateStaticParams` for static generation
- Implement proper image optimization
- Use Suspense boundaries for loading states
- Implement proper caching strategies

### SEO
- Add proper meta tags for each blog post
- Implement structured data (JSON-LD)
- Use semantic HTML elements
- Optimize for Core Web Vitals

### Accessibility
- Ensure proper heading hierarchy
- Add alt text for images
- Implement keyboard navigation
- Use proper ARIA labels

### Code Quality
- Follow existing TypeScript patterns
- Use proper error boundaries
- Implement proper loading states
- Follow the project's naming conventions

## 12. Testing Strategy

### Unit Tests
- Test blog service methods
- Test utility functions
- Test store actions and reducers

### Integration Tests
- Test blog page rendering
- Test navigation between posts
- Test filtering and search functionality

### E2E Tests
- Test complete user journey
- Test responsive behavior
- Test internationalization

## 13. Deployment Considerations

### Static Generation
- Pre-generate all blog pages at build time
- Implement incremental static regeneration if needed
- Handle dynamic content appropriately

### Content Management
- Consider implementing a CMS integration
- Set up automated deployment for content updates
- Implement content validation

This guideline provides a comprehensive approach to implementing a blog page that follows your project's existing patterns and conventions. The modular architecture ensures maintainability and scalability while the internationalization support maintains consistency with your multi-language approach.

import { create } from 'zustand';
import { BlogPost, BlogCategory, BlogFilters } from '../types/types.Blog';

interface BlogState {
  posts: BlogPost[];
  categories: BlogCategory[];
  filteredPosts: BlogPost[];
  currentPost: BlogPost | null;
  featuredPosts: BlogPost[];
  recentPosts: BlogPost[];
  allTags: string[];
  filters: BlogFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPosts: (posts: BlogPost[]) => void;
  setCategories: (categories: BlogCategory[]) => void;
  setCurrentPost: (post: BlogPost | null) => void;
  setFeaturedPosts: (posts: BlogPost[]) => void;
  setRecentPosts: (posts: BlogPost[]) => void;
  setAllTags: (tags: string[]) => void;
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
  featuredPosts: [],
  recentPosts: [],
  allTags: [],
  filters: {},
  isLoading: false,
  error: null,
  
  setPosts: (posts) => set({ posts, filteredPosts: posts }),
  setCategories: (categories) => set({ categories }),
  setCurrentPost: (currentPost) => set({ currentPost }),
  setFeaturedPosts: (featuredPosts) => set({ featuredPosts }),
  setRecentPosts: (recentPosts) => set({ recentPosts }),
  setAllTags: (allTags) => set({ allTags }),
  
  setFilters: (filters) => {
    set({ filters });
    get().applyFilters();
  },
  
  applyFilters: () => {
    const { posts, filters } = get();
    let filtered = [...posts];
    
    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(post => post.category === filters.category);
    }
    
    // Apply tag filter
    if (filters.tag) {
      filtered = filtered.filter(post => post.tags.includes(filters.tag));
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post => {
        // Search in title, excerpt, tags, and author name
        return (
          Object.values(post.title).some(title => 
            title.toLowerCase().includes(searchLower)
          ) ||
          Object.values(post.excerpt).some(excerpt => 
            excerpt.toLowerCase().includes(searchLower)
          ) ||
          post.tags.some(tag => 
            tag.toLowerCase().includes(searchLower)
          ) ||
          post.author.name.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply featured filter
    if (filters.featured) {
      filtered = filtered.filter(post => post.featured);
    }
    
    // Sort by published date (newest first)
    filtered.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    set({ filteredPosts: filtered });
  },
  
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  reset: () => set({
    posts: [],
    categories: [],
    filteredPosts: [],
    currentPost: null,
    featuredPosts: [],
    recentPosts: [],
    allTags: [],
    filters: {},
    isLoading: false,
    error: null
  })
}));

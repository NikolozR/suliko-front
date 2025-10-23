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
    try {
      if (!this.blogData?.posts) {
        console.error('Blog data is not available');
        return [];
      }
      return this.blogData.posts.filter(post => post.published);
    } catch (error) {
      console.error('Error getting blog posts:', error);
      return [];
    }
  }

  public async getPostById(id: string): Promise<BlogPost | null> {
    try {
      if (!this.blogData?.posts || !id) {
        console.error('Blog data or post ID is not available');
        return null;
      }
      const post = this.blogData.posts.find(post => post.id === id);
      return post && post.published ? post : null;
    } catch (error) {
      console.error('Error getting blog post by ID:', error);
      return null;
    }
  }

  public async getCategories(): Promise<BlogCategory[]> {
    try {
      if (!this.blogData?.categories) {
        console.error('Blog categories are not available');
        return [];
      }
      return this.blogData.categories;
    } catch (error) {
      console.error('Error getting blog categories:', error);
      return [];
    }
  }

  public async getFeaturedPosts(): Promise<BlogPost[]> {
    try {
      if (!this.blogData?.posts) {
        console.error('Blog data is not available');
        return [];
      }
      return this.blogData.posts.filter(post => post.published && post.featured);
    } catch (error) {
      console.error('Error getting featured posts:', error);
      return [];
    }
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

  public async searchPosts(query: string, locale: string): Promise<BlogPost[]> {
    const searchLower = query.toLowerCase();
    return this.blogData.posts.filter(post => 
      post.published && (
        post.title[locale]?.toLowerCase().includes(searchLower) ||
        post.excerpt[locale]?.toLowerCase().includes(searchLower) ||
        post.content[locale]?.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        post.author.name.toLowerCase().includes(searchLower)
      )
    );
  }

  public async getPostsByTag(tag: string): Promise<BlogPost[]> {
    return this.blogData.posts.filter(post => 
      post.published && post.tags.includes(tag)
    );
  }

  public async getAllTags(): Promise<string[]> {
    const allTags = this.blogData.posts
      .filter(post => post.published)
      .flatMap(post => post.tags);
    
    return Array.from(new Set(allTags)).sort();
  }

  public async getRelatedPosts(currentPostId: string, limit: number = 3): Promise<BlogPost[]> {
    const currentPost = await this.getPostById(currentPostId);
    if (!currentPost) return [];

    const relatedPosts = this.blogData.posts.filter(post => 
      post.published && 
      post.id !== currentPostId &&
      (post.category === currentPost.category || 
       post.tags.some(tag => currentPost.tags.includes(tag)))
    );

    // Sort by relevance (same category first, then by shared tags, then by date)
    return relatedPosts
      .sort((a, b) => {
        const aCategoryMatch = a.category === currentPost.category ? 1 : 0;
        const bCategoryMatch = b.category === currentPost.category ? 1 : 0;
        
        if (aCategoryMatch !== bCategoryMatch) {
          return bCategoryMatch - aCategoryMatch;
        }

        const aTagMatches = a.tags.filter(tag => currentPost.tags.includes(tag)).length;
        const bTagMatches = b.tags.filter(tag => currentPost.tags.includes(tag)).length;
        
        if (aTagMatches !== bTagMatches) {
          return bTagMatches - aTagMatches;
        }

        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, limit);
  }
}

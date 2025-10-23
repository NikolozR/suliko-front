import { BlogData } from '../types/types.Blog';
import { staticBlogData } from './staticBlogData';

// Fallback blog data in case JSON import fails
const fallbackBlogData: BlogData = staticBlogData;

export async function loadBlogData(): Promise<BlogData> {
  try {
    // Try to load the JSON data
    const blogDataModule = await import('../../../data/blog.json');
    const blogData = blogDataModule.default as BlogData;
    
    // Validate the loaded data
    if (!blogData || !blogData.posts || !Array.isArray(blogData.posts)) {
      throw new Error('Invalid blog data structure');
    }
    
    console.log('Successfully loaded blog data with', blogData.posts.length, 'posts');
    return blogData;
  } catch (error) {
    console.error('Failed to load blog data from JSON, using fallback:', error);
    return fallbackBlogData;
  }
}
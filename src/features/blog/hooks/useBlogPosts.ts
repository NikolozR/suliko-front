import { useEffect } from 'react';
import { useBlogStore } from '../store/blogStore';
import { BlogService } from '../services/blogService';

export const useBlogPosts = () => {
  const {
    posts,
    featuredPosts,
    recentPosts,
    isLoading,
    error,
    setPosts,
    setFeaturedPosts,
    setRecentPosts,
    setIsLoading,
    setError
  } = useBlogStore();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const blogService = BlogService.getInstance();
        const [allPosts, featured, recent] = await Promise.all([
          blogService.getPosts(),
          blogService.getFeaturedPosts(),
          blogService.getRecentPosts(5)
        ]);

        setPosts(allPosts);
        setFeaturedPosts(featured);
        setRecentPosts(recent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog posts');
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [setPosts, setFeaturedPosts, setRecentPosts, setIsLoading, setError]);

  return {
    posts,
    featuredPosts,
    recentPosts,
    isLoading,
    error
  };
};

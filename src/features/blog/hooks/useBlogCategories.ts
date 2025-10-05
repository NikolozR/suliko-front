import { useEffect } from 'react';
import { useBlogStore } from '../store/blogStore';
import { BlogService } from '../services/blogService';

export const useBlogCategories = () => {
  const {
    categories,
    isLoading,
    error,
    setCategories,
    setIsLoading,
    setError
  } = useBlogStore();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const blogService = BlogService.getInstance();
        const categoriesData = await blogService.getCategories();
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [setCategories, setIsLoading, setError]);

  return {
    categories,
    isLoading,
    error
  };
};

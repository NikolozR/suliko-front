import { useState, useCallback } from 'react';
import { BlogPost } from '../types/types.Blog';
import { BlogService } from '../services/blogService';
import { useLocale } from 'next-intl';

export const useBlogSearch = () => {
  const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const locale = useLocale();

  const searchPosts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const blogService = BlogService.getInstance();
      const results = await blogService.searchPosts(query, locale);
      setSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [locale]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    searchPosts,
    clearSearch
  };
};

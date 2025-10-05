"use client";

import { useBlogPosts, useBlogCategories } from '../hooks/index';
import BlogGrid from './BlogGrid';
import BlogHero from './BlogHero';
import BlogSearch from './BlogSearch';
import BlogCategories from './BlogCategories';
import { useBlogStore } from '../store/blogStore';
import { useTranslations } from 'next-intl';

export default function BlogPage() {
  const { posts, featuredPosts, isLoading, error } = useBlogPosts();
  const { categories } = useBlogCategories();
  const { filteredPosts, filters, setFilters } = useBlogStore();
  const t = useTranslations('Blog');

  const handleSearch = (query: string) => {
    setFilters({ ...filters, search: query });
  };

  const handleCategoryFilter = (categoryId: string) => {
    setFilters({ 
      ...filters, 
      category: categoryId === filters.category ? undefined : categoryId 
    });
  };


  const handleFeaturedFilter = () => {
    setFilters({ 
      ...filters, 
      featured: !filters.featured 
    });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">{t('errorLoading')}</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <BlogHero 
        featuredPosts={featuredPosts}
        isLoading={isLoading}
      />

      {/* Search and Filters */}
      <div className="mb-12">
        <div className="max-w-2xl mx-auto mb-8">
          <BlogSearch 
            onSearch={handleSearch}
            searchQuery={filters.search || ''}
          />
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          <BlogCategories 
            categories={categories}
            selectedCategory={filters.category}
            onCategorySelect={handleCategoryFilter}
          />
          
          <button
            onClick={handleFeaturedFilter}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
              filters.featured 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/80 border border-secondary/30'
            }`}
          >
            ⭐ {t('featuredPosts')}
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {(filters.category || filters.tag || filters.featured) && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Category: {categories.find((c) => c.id === filters.category)?.name.en}
                <button 
                  onClick={() => setFilters({ ...filters, category: undefined })}
                  className="ml-2 hover:text-primary/70"
                >
                  ×
                </button>
              </span>
            )}
            {filters.tag && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Tag: {filters.tag}
                <button 
                  onClick={() => setFilters({ ...filters, tag: undefined })}
                  className="ml-2 hover:text-primary/70"
                >
                  ×
                </button>
              </span>
            )}
            {filters.featured && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Featured Only
                <button 
                  onClick={() => setFilters({ ...filters, featured: false })}
                  className="ml-2 hover:text-primary/70"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Blog Grid */}
      <BlogGrid 
        posts={filteredPosts.length > 0 ? filteredPosts : posts}
        isLoading={isLoading}
      />

      {/* No Results */}
      {!isLoading && filteredPosts.length === 0 && posts.length > 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">{t('noPostsFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('tryAdjustingFilters')}
          </p>
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { BlogPost, BlogCategory } from '../types/types.Blog';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/ui/components/ui/card';
import { Badge } from '@/features/ui/components/ui/badge';
import { Separator } from '@/features/ui/components/ui/separator';
import Link from 'next/link';
import { Calendar, Tag } from 'lucide-react';

interface BlogSidebarProps {
  recentPosts: BlogPost[];
  categories: BlogCategory[];
  allTags: string[];
  selectedCategory?: string;
  selectedTag?: string;
  onCategorySelect: (categoryId: string) => void;
  onTagSelect: (tag: string) => void;
}

export default function BlogSidebar({
  recentPosts,
  categories,
  allTags,
  selectedCategory,
  selectedTag,
  onCategorySelect,
  onTagSelect
}: BlogSidebarProps) {
  const locale = useLocale();

  return (
    <aside className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {category.name[locale] || category.name.en}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 20).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => onTagSelect(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((post, index) => (
              <div key={post.id}>
                <Link 
                  href={`/blog/${post.id}`}
                  className="block hover:text-primary transition-colors"
                >
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">
                    {post.title[locale] || post.title.en}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.publishedAt).toLocaleDateString(locale)}
                  </p>
                </Link>
                {index < recentPosts.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

"use client";

import { BlogCategory } from '../types/types.Blog';
import { useLocale } from 'next-intl';
import { Button } from '@/features/ui/components/ui/button';

interface BlogCategoriesProps {
  categories: BlogCategory[];
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
}

export default function BlogCategories({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}: BlogCategoriesProps) {
  const locale = useLocale();

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategorySelect(category.id)}
          className="text-sm"
        >
          {category.name[locale] || category.name.en}
        </Button>
      ))}
    </div>
  );
}

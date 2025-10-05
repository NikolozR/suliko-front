"use client";

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/features/ui/components/ui/input';
import { Button } from '@/features/ui/components/ui/button';
import { useTranslations } from 'next-intl';

interface BlogSearchProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

export default function BlogSearch({ onSearch, searchQuery }: BlogSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const t = useTranslations('Blog');

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
  };

  const handleClear = () => {
    setLocalQuery('');
    onSearch('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    
    // Debounced search - search after user stops typing for 300ms
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={localQuery}
          onChange={handleInputChange}
          className="pl-12 pr-12 h-12 text-lg bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-all duration-200 rounded-xl"
        />
        {localQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { BlogPost } from '../types/types.Blog';
import { Card, CardContent, CardFooter, CardHeader } from '@/features/ui/components/ui/card';
import { Badge } from '@/features/ui/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const locale = useLocale();
  const t = useTranslations('Blog');

  return (
    <Card className="h-full hover:shadow-2xl transition-all duration-300 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm group">
      <CardHeader className="p-6">
        {post.featuredImage && (
          <div className="aspect-video bg-muted rounded-xl mb-6 overflow-hidden relative">
            <Image 
              src={post.featuredImage} 
              alt={post.title[locale] || post.title.en}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              {tag}
            </Badge>
          ))}
        </div>
        <h3 className="text-2xl font-bold line-clamp-2 text-card-foreground group-hover:text-primary transition-colors leading-tight">
          {post.title[locale] || post.title.en}
        </h3>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <p className="text-muted-foreground line-clamp-3 leading-relaxed">
          {post.excerpt[locale] || post.excerpt.en}
        </p>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground p-6 pt-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-primary" />
            </div>
            <span className="font-medium">{post.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Calendar className="h-3 w-3 text-primary" />
            </div>
            <span>{new Date(post.publishedAt).toLocaleDateString(locale)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Clock className="h-3 w-3 text-primary" />
            </div>
            <span>{post.readTime} min</span>
          </div>
        </div>
        <Link 
          href={`/blog/${post.id}`}
          className="text-primary hover:text-primary/80 font-semibold transition-colors group-hover:translate-x-1 transform duration-200"
        >
          {t('readMore')} →
        </Link>
      </CardFooter>
    </Card>
  );
}
